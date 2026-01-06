const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },

    name: { type: String, required: true },
    description: { type: String },

    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    durationInDays: { type: Number, required: true },

    // -------------------------------
    // DEFAULT BENEFITS
    // -------------------------------
    planBenefits: {
      type: [String],
      default: [
        "Unlimited service listings",
        "4× visibility compared to Free Plan",
        "Dedicated profile management support",
        "Call support + priority response",
        "Guaranteed visibility on the first page",
        "Pin two reviews at the top of your profile",
        "Full analytics access",
        "Multi-city listing option",
        "Visible customer contact details for incoming leads",
        "Maximum photo and video uploads",
        "Business growth support",
      ],
    },

    features: { type: [String], default: [] },

    // -------------------------------
    // LIMITS
    // -------------------------------
    maxUploads: { type: Number },
    maxStorage: { type: Number },
    storageUnit: { type: String, default: "MB" },

    allowedProducts: { type: Number },
    allowedMembers: { type: Number },

    discount: {
      percent: { type: Number, default: 0 },
      validTill: { type: Date },
    },

    tags: [{ type: String }],

    // ✅ RAZORPAY (ENV SAFE)
    razorpayPlanIdTest: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPlanIdLive: {
      type: String,
      default: null,
      index: true,
    },

    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    trialAvailable: { type: Boolean, default: false },

    planType: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "yearly",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
