const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // 👈 generic package id
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bookingDate: Date,
    fullName: String,
    email: String,
    contact: String,
    description: String,

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
