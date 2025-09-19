const mongoose = require("mongoose");

const coordinateSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    coordinates: {
      type: [coordinateSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length >= 2;
        },
        message: "A zone must have at least 3 coordinates.",
      },
    },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Zone", zoneSchema);
