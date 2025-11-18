const mongoose = require("mongoose");

const photographyPackageSchema = new mongoose.Schema(
  {
    photographyId: { type: String, required: true, unique: true },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],

    packageTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    photographyType: {
      type: String,
      enum: ["Candid", "Traditional", "Cinematic", "Drone", "Pre-Wedding"],
      required: true,
    },

includedServices: [
  {
    title: { type: String, required: true },
    items: [{ type: String }]
  }
],

    basePrice: { type: Number, required: true },
    offerPrice: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },

    travelToVenue: { type: Boolean, default: false },

    advanceBookingAmount: { type: String, default: "" },
    cancellationPolicy: { type: String, default: "" },

    gallery: [{ type: String }],

    // Extra fields (same style as makeup)
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


    isTopPick: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Photography", photographyPackageSchema);
