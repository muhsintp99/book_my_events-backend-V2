const mongoose = require("mongoose");

const subscriptionRequestSchema = new mongoose.Schema(
  {
    // Vendor (User with role = vendor)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Optional – useful for admin UI
    vendorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProfile"
    },

    // Module (Makeup / Photography / Venue)
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },

    // Requested Plan
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    adminNote: String,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionRequest", subscriptionRequestSchema);
