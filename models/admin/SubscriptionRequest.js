const mongoose = require("mongoose");

const subscriptionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    vendorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProfile",
      default: null
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'moduleModel'
    },
    moduleModel: {
      type: String,
      required: true,
      enum: ['Module', 'SecondaryModule'],
      default: 'Module'
    },

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
