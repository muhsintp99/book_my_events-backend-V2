const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    // ✅ OPTIONAL for guest enquiries
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
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
