// const mongoose = require("mongoose");

// const coordinateSchema = new mongoose.Schema(
//   {
//     lat: { type: Number, required: true },
//     lng: { type: Number, required: true },
//   },
//   { _id: false }
// );

// const zoneSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true, unique: true },
//     description: { type: String, trim: true },
//     coordinates: {
//       type: [coordinateSchema],
//       required: true,
//       validate: {
//         validator: function (v) {
//           return v.length >= 2;
//         },
//         message: "A zone must have at least 3 coordinates.",
//       },
//     },
//     city: { type: String, trim: true },
//     country: { type: String, trim: true },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Zone", zoneSchema);
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
          return v.length >= 3;
        },
        message: "A zone must have at least 3 coordinates.",
      },
    },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isTopZone: { type: Boolean, default: false },
    icon: { type: String, trim: true }, // URL or path to the uploaded icon
  },
  { timestamps: true }
);

// Index for faster queries on top zones
zoneSchema.index({ isActive: 1, isTopZone: 1 });

module.exports = mongoose.model("Zone", zoneSchema);