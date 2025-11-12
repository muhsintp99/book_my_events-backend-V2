const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },

    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    emailAddress: { type: String },
    address: { type: String, required: true },

    numberOfGuests: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    endDate: { type: Date },
    timeSlot: { type: [String], enum: ["Morning", "Evening"], required: true },

    bookingType: { type: String, enum: ["Direct", "Indirect"], default: "Direct" },
    status: { type: String, enum: ["Pending", "Confirmed", "Cancelled"], default: "Pending" },

    perDayPrice: { type: Number, default: 0 },
    perPersonCharge: { type: Number, default: 0 },
    perHourCharge: { type: Number, default: 0 },
    packagePrice: { type: Number, default: 0 },

    totalBeforeDiscount: { type: Number, default: 0 },
    discountValue: { type: Number, default: 0 },
    discountType: { type: String, enum: ["flat", "percentage", "none"], default: "none" },

    couponDiscountValue: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
