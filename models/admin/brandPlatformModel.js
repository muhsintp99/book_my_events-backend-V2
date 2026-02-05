const mongoose = require("mongoose");

const brandPlatformSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    icon: {
      type: String,
      default: ""
    },

    url: {
      type: String,
      default: ""
    },

    showFirst: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandPlatform", brandPlatformSchema);
