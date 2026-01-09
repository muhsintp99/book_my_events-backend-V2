const mongoose = require("mongoose");

const VehicleAttributeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    module: { type: String, required: true }, // Transport, etc.

    icon: { type: String }, // image file

    values: [
      {
        type: String
      }
    ],

    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "VehicleAttribute",
  VehicleAttributeSchema
);