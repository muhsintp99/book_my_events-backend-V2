const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {

    moduleId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Module",
  required: true
},
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },

    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    fullName: { type: String },
    contactNumber: { type: String },
    emailAddress: { type: String },
    address: { type: String },

    numberOfGuests: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // Morning / Evening / Full Day

    location: { type: String },

    bookingType: { type: String, enum: ["Direct", "Indirect"], default: "Direct" },

    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },

    paymentStatus: {
      type: String,
      enum: ["Advance", "Pending", "Paid"],
      default: "Pending"
    },

    conversationId: { type: String }, // Chat system

    // pricing fields
    perDayPrice: { type: Number, default: 0 },
    perPersonCharge: { type: Number, default: 0 },
    perHourCharge: { type: Number, default: 0 },
    packagePrice: { type: Number, default: 0 },

    totalBeforeDiscount: { type: Number, default: 0 },
    discountValue: { type: Number, default: 0 },
    discountType: { type: String, enum: ["flat", "percentage", "none"], default: "none" },

    couponDiscountValue: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
