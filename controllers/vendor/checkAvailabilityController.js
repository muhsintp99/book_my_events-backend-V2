const Booking = require("../../models/vendor/Booking");
const Module = require("../../models/admin/module");
const mongoose = require("mongoose");

/**
 * CHECK AVAILABILITY (PACKAGE BASED - ALL MODULES)
 */
exports.checkAvailability = async (req, res) => {
  try {
    const {
      bookingId,     // ⭐ OPTIONAL (for edit / reschedule)
      moduleId,
      packageId,     // ⭐ COMMON FOR ALL MODULES
      bookingDate,
      timeSlot
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!moduleId || !packageId || !bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "moduleId, packageId, bookingDate, and timeSlot are required"
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
    const module = await Module.findById(moduleId).lean();
    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    /* =========================
       BUILD AVAILABILITY QUERY
    ========================= */
    const query = {
      moduleId,
      packageId,
      bookingDate: new Date(bookingDate),
      timeSlot,
      status: { $in: ["Pending", "Accepted"] }
    };

    // ⭐ EXCLUDE CURRENT BOOKING (EDIT CASE)
    if (bookingId) {
      query._id = { $ne: bookingId };
    }

    /* =========================
       CHECK EXISTING BOOKINGS
    ========================= */
    const conflict = await Booking.findOne(query).lean();

    if (conflict) {
      return res.json({
        success: true,
        available: false,
        message: "Not available for the selected date and time",
        conflict: {
          bookingId: conflict._id,
          status: conflict.status,
          bookingDate: conflict.bookingDate,
          timeSlot: conflict.timeSlot
        }
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
