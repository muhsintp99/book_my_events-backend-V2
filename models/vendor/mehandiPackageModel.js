const mongoose = require("mongoose");

const mehandiPackageSchema = new mongoose.Schema(
  {
    packageId: {
      type: String,
      required: true,
      unique: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SecondaryModule",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    packageName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    packagePrice: {
      type: Number,
      required: true,
      default: 0,
    },

    advanceBookingAmount: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isTopPick: {
      type: Boolean,
      default: false,
    },

   
  },
  { timestamps: true }
);

module.exports = mongoose.model("MehandiPackage", mehandiPackageSchema);