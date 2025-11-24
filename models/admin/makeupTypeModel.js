const mongoose = require("mongoose");

const MakeupTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    image: {
      type: String,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MakeupType", MakeupTypeSchema);
