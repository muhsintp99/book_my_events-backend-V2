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
       Ensures date-only comparison
    ========================= */
    const normalizedDate = new Date(bookingDate);
    normalizedDate.setHours(0, 0, 0, 0);

    /* =========================
       BUILD CONFLICT QUERY
    ========================= */
    const conflictQuery = {
      moduleId,
      packageId,
      bookingDate: normalizedDate,
      status: { $in: ["Pending", "Accepted"] }
    };

    // Exclude current booking (edit case)
    if (bookingId) {
      conflictQuery._id = { $ne: bookingId };
    }

    /* =========================
       CHECK EXISTING BOOKINGS
    ========================= */
    const conflict = await Booking.findOne(conflictQuery)
      .select("_id bookingDate status")
      .lean();

    if (conflict) {
      return res.json({
        success: true,
        available: false,
        message: "Not available for the selected date",
        conflict
      });
    }

    /* =========================
       AVAILABLE
    ========================= */
    return res.json({
      success: true,
      available: true,
      message: "Available for booking"
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
