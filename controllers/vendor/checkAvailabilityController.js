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
      bookingDate
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
      status: { $in: ["Pending", "Accepted"] }
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

    console.log("🔍 Availability Check Query:", JSON.stringify(conflictQuery, null, 2));

    // Exclude current booking (edit case)
    if (bookingId) {
      conflictQuery._id = { $ne: bookingId };
    }

    /* =========================
       CHECK EXISTING BOOKINGS (Soft-Available)
    ========================= */
    // 1. Check for Accepted bookings
    const acceptedConflict = await Booking.findOne({
      ...conflictQuery,
      status: "Accepted"
    }).select("_id bookingDate status").lean();

    console.log("📊 Accepted Conflict:", acceptedConflict ? "FOUND" : "NONE");

    if (acceptedConflict) {
      return res.json({
        success: true,
        available: true, // Still allow booking (Request List model)
        availabilityStatus: "Pending",
        message: "This date is already booked by another customer. You can still submit a waitlist request, and you will be informed if it becomes available due to a cancellation or vendor confirmation.",
        conflict: acceptedConflict
      });
    }

    // 2. Check for Pending bookings
    const pendingConflict = await Booking.findOne({
      ...conflictQuery,
      status: "Pending"
    }).select("_id bookingDate status createdAt").sort({ createdAt: -1 }).lean();

    console.log("📊 Pending Conflict:", pendingConflict ? "FOUND" : "NONE");

    if (pendingConflict) {
      return res.json({
        success: true,
        available: true, // Still allow booking
        availabilityStatus: "Pending",
        message: "This date has a pending request. You can still submit your request, and the vendor will review all interests.",
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
