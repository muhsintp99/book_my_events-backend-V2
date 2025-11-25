// models/admin/makeupTypeModel.js
const mongoose = require("mongoose");

const MakeupTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // ❌ Image Removed Completely
    // image: String,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MakeupType", MakeupTypeSchema);
