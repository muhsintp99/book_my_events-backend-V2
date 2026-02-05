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

    if (vehicleId || title === "Transport") {
      conflictQuery.vehicleId = toId(vehicleId || packageId);
    } else if (boutiqueId || title === "Boutique" || title === "Boutiques") {
      conflictQuery.boutiqueId = toId(boutiqueId || packageId);
    } else if (ornamentId || title === "Ornaments" || title === "Ornament") {
      conflictQuery.ornamentId = toId(ornamentId || packageId);
    } else if (cakeId || title === "Cake") {
      conflictQuery.cakeId = toId(cakeId || packageId);
    } else if (venueId || title === "Venues") {
      conflictQuery.venueId = toId(venueId || packageId);
    } else if (makeupId || title === "Makeup" || title === "Makeup Artist") {
      conflictQuery.makeupId = toId(makeupId || packageId);
    } else if (photographyId || title === "Photography") {
      conflictQuery.photographyId = toId(photographyId || packageId);
    } else if (cateringId || title === "Catering") {
      conflictQuery.cateringId = toId(cateringId || packageId);
    } else {
      conflictQuery.packageId = toId(packageId);
    }

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
