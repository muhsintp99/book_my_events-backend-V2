const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: false, // Automatically attached from venue
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ✅ Not required in indirect booking
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    emailAddress: { type: String, required: false },
    address: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    timeSlot: { type: String, enum: ["Morning", "Evening"], required: true },
    bookingType: {
      type: String,
      enum: ["Direct", "Indirect"],
      default: "Direct", // ✅ Default is Direct
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
