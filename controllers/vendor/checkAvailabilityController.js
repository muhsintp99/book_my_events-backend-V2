const Booking = require("../../models/vendor/Booking");
const Module = require("../../models/admin/module");
const mongoose = require("mongoose");

/**
 * UNIVERSAL AVAILABILITY CHECK
 * DATE-BASED (NO TIME SLOT)
 * WORKS FOR ALL MODULES
 */
exports.checkAvailability = async (req, res) => {
  try {
    const {
      bookingId,     // optional (edit / reschedule)
      moduleId,
      packageId,
      bookingDate,
      startDate,
      endDate,
      timeSlot
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!moduleId || !packageId || (!bookingDate && !startDate)) {
      return res.status(400).json({
        success: false,
        message: "moduleId, packageId, and bookingDate (or startDate) are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleId"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid packageId"
      });
    }

    if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId"
      });
    }

    /* =========================
       CHECK MODULE EXISTS
    ========================= */
    const moduleExists = await Module.findById(moduleId)
      .select("_id title isActive")
      .lean();

    if (!moduleExists) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    if (!moduleExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "Module is inactive"
      });
    }

    /* =========================
       NORMALIZE DATE (IMPORTANT)
       Ensures date-only comparison via UTC range
    ========================= */
    const reqStart = startDate || bookingDate;
    const reqEnd = endDate || reqStart;

    const startOfDay = new Date(reqStart);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(reqEnd);
    endOfDay.setUTCHours(23, 59, 59, 999);

    /* =========================
       BUILD CONFLICT QUERY
    ========================= */
    const { vehicleId, boutiqueId, ornamentId, cakeId, venueId, makeupId, photographyId, cateringId, invitationId } = req.body;

    // 🔥 AUTO-CANCEL STALE INITIATED BOOKINGS (older than 30 min)
    // This cleans up abandoned payment sessions that would otherwise block availability
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const staleQuery = {
        paymentStatus: "initiated",
        status: "Pending",
        updatedAt: { $lt: thirtyMinutesAgo }
      };
      // Add package-specific ID to narrow the cleanup
      if (venueId && mongoose.Types.ObjectId.isValid(venueId)) {
        staleQuery.venueId = new mongoose.Types.ObjectId(venueId);
      } else if (packageId && mongoose.Types.ObjectId.isValid(packageId)) {
        staleQuery.$or = [{ venueId: new mongoose.Types.ObjectId(packageId) }, { packageId: new mongoose.Types.ObjectId(packageId) }];
      }
      const cancelledCount = await Booking.updateMany(staleQuery, {
        $set: { paymentStatus: "cancelled", status: "Cancelled" }
      });
      if (cancelledCount.modifiedCount > 0) {
        console.log(`🧹 Auto-cancelled ${cancelledCount.modifiedCount} stale initiated booking(s) for cleanup`);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Stale booking cleanup failed (non-fatal):", cleanupErr.message);
    }

    const conflictQuery = {
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Pending", "Accepted", "Confirmed"] },
      // Exclude bookings where payment failed, cancelled, OR was merely initiated (abandoned payment)
      paymentStatus: { $nin: ["failed", "cancelled", "initiated"] }
    };

    // 🔥 RELAXED MODULE ID: 
    // Only strictly require it if we don't have a more specific ID (like cateringId etc)
    // This prevents missing bookings due to moduleId mismatch across environments
    const hasSpecificId = !!(vehicleId || boutiqueId || ornamentId || cakeId || venueId || makeupId || photographyId || cateringId || packageId);
    if (moduleId && !hasSpecificId) {
      conflictQuery.moduleId = new mongoose.Types.ObjectId(moduleId);
    }

    const title = (moduleExists.title || "").trim();

    /* =========================
       ID MAPPING (UNIVERSAL)
       Maps provided IDs to correct Booking fields
    ========================= */
    const toId = (val) => (mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val);

    // 🔥 ROBUST ID MAPPING: Check BOTH module-specific field AND packageId
    // We prioritize the provided IDs but also check packageId as a fallback.
    const vId = toId(venueId || packageId);
    const bId = toId(req.body.boutiqueId || boutiqueId || packageId);
    const oId = toId(ornamentId || packageId);
    const cId = toId(cakeId || packageId);
    const mId = toId(makeupId || packageId);
    const pId = toId(photographyId || packageId);
    const catId = toId(cateringId || packageId);
    const transId = toId(vehicleId || packageId);
    const invId = toId(invitationId || packageId);

    if (transId && (title === "Transport" || vehicleId)) {
      conflictQuery.$or = [{ vehicleId: transId }, { packageId: transId }];
    } else if (bId && (title === "Boutique" || title === "Boutiques" || boutiqueId)) {
      conflictQuery.$or = [{ boutiqueId: bId }, { packageId: bId }];
    } else if (oId && (title === "Ornaments" || title === "Ornament" || ornamentId)) {
      conflictQuery.$or = [{ ornamentId: oId }, { packageId: oId }];
    } else if (cId && (title === "Cake" || cakeId)) {
      conflictQuery.$or = [{ cakeId: cId }, { packageId: cId }];
    } else if (vId && (title === "Venues" || venueId)) {
      conflictQuery.$or = [{ venueId: vId }, { packageId: vId }];
      if (req.body.providerId) conflictQuery.$or.push({ providerId: toId(req.body.providerId) });
    } else if (mId && (title === "Makeup" || title === "Makeup Artist" || makeupId)) {
      conflictQuery.$or = [{ makeupId: mId }, { packageId: mId }];
      if (req.body.providerId) conflictQuery.$or.push({ providerId: toId(req.body.providerId) });
    } else if (pId && (title === "Photography" || photographyId)) {
      conflictQuery.$or = [{ photographyId: pId }, { packageId: pId }];
    } else if (catId && (title === "Catering" || cateringId)) {
      conflictQuery.$or = [{ cateringId: catId }, { packageId: catId }];
    } else if (invId && (title === "Invitation & Printing" || title === "Invitation" || title === "Printing" || invitationId)) {
      conflictQuery.$or = [{ invitationId: invId }, { packageId: invId }];
    } else {
      conflictQuery.packageId = toId(packageId);
    }

    /* =========================
       TIME SLOT CHECK (If Provided)
    ========================= */
    if (timeSlot) {
      // 🔥 ROBUST TIME SLOT QUERY
      // Handles both legacy string format ("Morning") and new array format ([{label: "Morning"}])
      // Uses $or to check both possibilities without causing schema validation errors

      const timeQuery = {
        $or: [
          // Legacy format: timeSlot is a plain string
          { timeSlot: { $regex: `^${timeSlot}$`, $options: "i" } },
          // New format: timeSlot is an array of objects with label field
          { "timeSlot.label": { $regex: `^${timeSlot}$`, $options: "i" } }
        ]
      };

      // Merge into conflictQuery
      if (conflictQuery.$or) {
        // If conflictQuery already has $or (from module-specific ID matching),
        // wrap both in $and to combine them properly
        conflictQuery.$and = [{ $or: conflictQuery.$or }, timeQuery];
        delete conflictQuery.$or;
      } else {
        // Otherwise, just add the time query directly
        Object.assign(conflictQuery, timeQuery);
      }
    }

    console.log("🔍 Availability Check Query:", JSON.stringify(conflictQuery, null, 2));

    // Exclude current booking (edit case)
    if (bookingId) {
      conflictQuery._id = { $ne: bookingId };
    }

    /* =========================
       CHECK EXISTING BOOKINGS
    ========================= */
    // BUILD RENTAL OVERLAP QUERY (If it's a rental item)
    const isRentalModule = ["Boutique", "Boutiques", "Ornaments", "Ornament"].includes(title);

    // We check for overlap: (RequestedDate BETWEEN ExistingFrom AND ExistingTo)
    // OR (ExistingFrom BETWEEN RequestedStartOfDay AND RequestedEndOfDay)
    const rentalOverlapQuery = {
      $or: [
        {
          "rentalPeriod.from": { $lte: endOfDay },
          "rentalPeriod.to": { $gte: startOfDay }
        },
        {
          bookingDate: { $gte: startOfDay, $lte: endOfDay }
        }
      ]
    };

    const baseConflictQuery = { ...conflictQuery };

    // Only delete bookingDate for rental modules
    if (isRentalModule) {
      delete baseConflictQuery.bookingDate;
    }

    const finalConflictQuery = isRentalModule
      ? { ...baseConflictQuery, ...rentalOverlapQuery }
      : conflictQuery;

    // 1. Check for Accepted/Confirmed bookings (FULLY BOOKED)
    let acceptedConflict = null;
    try {
      // For non-Venue modules, only HARD BLOCK if Accepted/Confirmed.
      // For Venues, we preserve the existing logic (which might include Pending if paid).
      const blockStatus = (title === "Venues")
        ? ["Pending", "Accepted", "Confirmed"]
        : ["Accepted", "Confirmed"];

      acceptedConflict = await Booking.findOne({
        ...finalConflictQuery,
        status: { $in: blockStatus }
      }).select("_id bookingDate status rentalPeriod timeSlot").lean();
    } catch (queryError) {
      // Handle Mongoose validation errors gracefully (timeSlot array issue)
      console.warn("⚠️ Query error (likely timeSlot array schema mismatch):", queryError.message);

      // Fall back to query without timeSlot filter, then manually check timeSlot
      if (timeSlot) {
        // Build fallback query preserving venue/package ID matching
        const fallbackQuery = { ...finalConflictQuery };

        // Remove only the timeSlot part of the query
        if (fallbackQuery.$and) {
          // Keep the first part (venue/package ID matching), remove timeSlot part
          fallbackQuery.$or = fallbackQuery.$and[0].$or;
          delete fallbackQuery.$and;
        }

        console.log("🔄 Using fallback query:", JSON.stringify(fallbackQuery, null, 2));

        acceptedConflict = await Booking.findOne({
          ...fallbackQuery,
          status: { $in: blockStatus }
        }).select("_id bookingDate status rentalPeriod timeSlot").lean();

        // Manually check timeSlot match
        if (acceptedConflict) {
          const bookingTimeSlot = Array.isArray(acceptedConflict.timeSlot)
            ? acceptedConflict.timeSlot[0]?.label
            : acceptedConflict.timeSlot;

          console.log("🔍 Manual timeSlot check:", {
            requested: timeSlot,
            booking: bookingTimeSlot,
            match: bookingTimeSlot?.toLowerCase() === timeSlot.toLowerCase()
          });

          if (bookingTimeSlot?.toLowerCase() !== timeSlot.toLowerCase()) {
            acceptedConflict = null; // Not a match
          }
        }
      }
    }

    console.log("📊 Accepted Conflict:", acceptedConflict ? "FOUND" : "NONE");

    if (acceptedConflict) {
      return res.json({
        success: true,
        available: false, // ❌ BLOCK BOOKING
        availabilityStatus: "Booked",
        message: "This date is already booked and unavailable. Please try another date.",
        conflict: acceptedConflict
      });
    }

    // 2. Check for Pending bookings (SOFT-AVAILABLE / WISHLIST)
    // At this point paymentStatus is NOT completed (and not initiated — excluded by conflictQuery)
    let pendingConflict = null;
    try {
      pendingConflict = await Booking.findOne({
        ...finalConflictQuery,
        status: "Pending"
      }).select("_id bookingDate status createdAt timeSlot").sort({ createdAt: -1 }).lean();
    } catch (queryError) {
      console.warn("⚠️ Query error for pending bookings:", queryError.message);
      // Fall back to simpler query
      if (timeSlot) {
        const fallbackQuery = { ...finalConflictQuery };
        delete fallbackQuery.$or;
        delete fallbackQuery.$and;
        pendingConflict = await Booking.findOne({
          ...fallbackQuery,
          status: "Pending"
        }).select("_id bookingDate status createdAt timeSlot").sort({ createdAt: -1 }).lean();

        // Manually check timeSlot match
        if (pendingConflict) {
          const bookingTimeSlot = Array.isArray(pendingConflict.timeSlot)
            ? pendingConflict.timeSlot[0]?.label
            : pendingConflict.timeSlot;

          if (bookingTimeSlot?.toLowerCase() !== timeSlot.toLowerCase()) {
            pendingConflict = null;
          }
        }
      }
    }

    console.log("📊 Pending Conflict:", pendingConflict ? "FOUND" : "NONE");

    if (pendingConflict) {
      return res.json({
        success: true,
        available: true, // ✅ ALLOW WISHLIST
        availabilityStatus: "Pending",
        message: "This date has a pending request. You can still submit your interest/enquiry, and the vendor will review all requests.",
        conflict: pendingConflict
      });
    }

    /* =========================
       COMPLETELY AVAILABLE
    ========================= */
    return res.json({
      success: true,
      available: true,
      availabilityStatus: "Available",
      message: "This date is fully available for booking."
    });

  } catch (error) {
    console.error("Check availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
