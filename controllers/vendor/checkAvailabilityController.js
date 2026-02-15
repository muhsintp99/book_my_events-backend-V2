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
      timeSlot
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!moduleId || !packageId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "moduleId, packageId, and bookingDate are required"
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
    const startOfDay = new Date(bookingDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    /* =========================
       BUILD CONFLICT QUERY
    ========================= */
    const { vehicleId, boutiqueId, ornamentId, cakeId, venueId, makeupId, photographyId, cateringId } = req.body;

    const conflictQuery = {
      moduleId: new mongoose.Types.ObjectId(moduleId),
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Pending", "Accepted"] },
      // Exclude bookings where payment failed/cancelled/was never completed
      paymentStatus: { $nin: ["failed", "cancelled", "initiated"] }
    };

    const title = (moduleExists.title || "").trim();

    /* =========================
       ID MAPPING (UNIVERSAL)
       Maps provided IDs to correct Booking fields
    ========================= */
    const toId = (val) => (mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val);

    // 🔥 ROBUST QUERY: Check BOTH module-specific field AND packageId
    // This handles cases where bookings might have either field populated
    const pkgId = toId(packageId);

    if (vehicleId || title === "Transport") {
      const vId = toId(vehicleId || packageId);
      conflictQuery.$or = [
        { vehicleId: vId },
        { packageId: vId }
      ];
    } else if (boutiqueId || title === "Boutique" || title === "Boutiques") {
      const bId = toId(boutiqueId || packageId);
      conflictQuery.$or = [
        { boutiqueId: bId },
        { packageId: bId }
      ];
    } else if (ornamentId || title === "Ornaments" || title === "Ornament") {
      const oId = toId(ornamentId || packageId);
      conflictQuery.$or = [
        { ornamentId: oId },
        { packageId: oId }
      ];
    } else if (cakeId || title === "Cake") {
      const cId = toId(cakeId || packageId);
      conflictQuery.$or = [
        { cakeId: cId },
        { packageId: cId }
      ];
    } else if (venueId || title === "Venues") {
      const vId = toId(venueId || packageId);
      conflictQuery.$or = [
        { venueId: vId },
        { packageId: vId }
      ];
    } else if (makeupId || title === "Makeup" || title === "Makeup Artist") {
      const mId = toId(makeupId || packageId);
      conflictQuery.$or = [
        { makeupId: mId },
        { packageId: mId }
      ];
    } else if (photographyId || title === "Photography") {
      const pId = toId(photographyId || packageId);
      conflictQuery.$or = [
        { photographyId: pId },
        { packageId: pId }
      ];
    } else if (cateringId || title === "Catering") {
      const cId = toId(cateringId || packageId);
      conflictQuery.$or = [
        { cateringId: cId },
        { packageId: cId }
      ];
    } else {
      conflictQuery.packageId = pkgId;
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

    // 1. Check for Accepted bookings (FULLY BOOKED)
    let acceptedConflict = null;
    try {
      acceptedConflict = await Booking.findOne({
        ...finalConflictQuery,
        status: "Accepted"
      }).select("_id bookingDate status rentalPeriod timeSlot").lean();
    } catch (queryError) {
      // Handle Mongoose validation errors gracefully
      console.warn("⚠️ Query error (likely schema mismatch):", queryError.message);
      // Fall back to simpler query without timeSlot if error occurs
      if (timeSlot) {
        const fallbackQuery = { ...finalConflictQuery };
        delete fallbackQuery.$or;
        delete fallbackQuery.$and;
        acceptedConflict = await Booking.findOne({
          ...fallbackQuery,
          status: "Accepted"
        }).select("_id bookingDate status rentalPeriod timeSlot").lean();

        // Manually check timeSlot match
        if (acceptedConflict) {
          const bookingTimeSlot = Array.isArray(acceptedConflict.timeSlot)
            ? acceptedConflict.timeSlot[0]?.label
            : acceptedConflict.timeSlot;

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
