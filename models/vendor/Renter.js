const mongoose = require("mongoose");

const renterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    brand: String,
    category: { type: String, required: true }, // e.g., Car, Bike, Bus
    model: String,
    type: String,

    engineCapacity: String,
    enginePower: String,
    seatingCapacity: Number,
    airCondition: { type: Boolean, default: false },
    fuelType: { type: String, enum: ["Petrol", "Diesel", "Electric", "Hybrid"] },
    transmissionType: { type: String, enum: ["Manual", "Automatic"] },

    pricing: {
      hourly: { type: Number, default: 0 },
      perDay: { type: Number, default: 0 },
      distanceWise: { type: Number, default: 0 },
    },

    discount: Number,
    searchTags: [String],

    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    thumbnail: String,
    vehicleImages: [String],

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Renter", renterSchema);
