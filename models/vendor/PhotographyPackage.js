const mongoose = require("mongoose");

const includedServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    items: [{ type: String }]
  },
  { _id: true }
);

const PhotographySchema = new mongoose.Schema(
  {
    photographyId: { type: String, unique: true, required: true },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
      }
    ],

    packageTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    photographyType: {
      type: String,
      enum: ["Candid", "Traditional", "Cinematic", "Drone", "Pre-Wedding"],
      required: true
    },

    includedServices: [includedServiceSchema],

    price: { type: Number, required: true },

    travelToVenue: { type: Boolean, default: false },
    advanceBookingAmount: { type: String, default: "" },
    cancellationPolicy: { type: String, default: "" },

    gallery: [{ type: String }],

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isTopPick: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

PhotographySchema.index({
  packageTitle: "text",
  description: "text"
});

module.exports = mongoose.model("Photography", PhotographySchema);
