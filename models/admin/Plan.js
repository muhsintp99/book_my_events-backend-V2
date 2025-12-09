const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: false,
    },

    name: { type: String, required: true },
    description: { type: String },

    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    durationInDays: { type: Number, required: true },

    // -------------------------------
    // DEFAULT BENEFITS FIELD (SEPARATE)
    // -------------------------------
    planBenefits: {
      type: [String],
      default: [
        "Included Benefits:",
        "2× visibility compared to Free Plan",
        "Dedicated profile management support",
        "Call support + priority response",
        "Guaranteed visibility on the first page",
        "5 relationship calls per year",
        "Pin two reviews at the top of your profile",
        "Full analytics access",
        "Multi-city listing option",
        "Visible customer contact details for incoming leads",
        "Maximum photo and video uploads"
      ]
    },

    // -------------------------------
    // FEATURES (ADMIN CUSTOM FEATURES)
    // -------------------------------
    features: { type: [String], default: [] },

    // -------------------------------
    // USAGE LIMITS (OPTIONAL)
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

    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    trialAvailable: { type: Boolean, default: false },

    planType: { type: String, default: "yearly" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
