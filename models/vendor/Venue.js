const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    venueName: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    venueAddress: { type: String, required: true, trim: true },
    latitude: Number,
    longitude: Number,
    language: { type: String, default: "EN" },

    // Contact
    contactPhone: String,
    contactEmail: String,
    contactWebsite: String,

    // Owner / Manager Info
    ownerManagerName: String,
    ownerManagerPhone: String,
    ownerManagerEmail: String,

    openingHours: String,
    closingHours: String,
    holidaySchedule: String,

    // Features
    watermarkProtection: { type: Boolean, default: false },
    parkingAvailablity: { type: Boolean, default: false },
    wheelchairAccessiblity: { type: Boolean, default: false },
    securityArrangements: { type: Boolean, default: false },
    foodCateringAvailability: { type: Boolean, default: false },
    wifiAvailablity: { type: Boolean, default: false },
    stageLightingAudio: { type: Boolean, default: false },

    parkingCapacity: String,
    washroomsInfo: String,
    dressingRooms: String,

    // Pricing
    hourlyPrice: Number,
    perDayPrice: Number,
    discount: Number,
    distanceWisePrice: Number,
    customPackages: String,
    dynamicPricing: { type: Boolean, default: false },
    advanceDeposit: Number,
    cancellationPolicy: String,
    extraCharges: String,

    // Guests
    seatingArrangement: String,
    maxGuestsSeated: Number,
    maxGuestsStanding: Number,

    nearbyTransport: String,
    accessibilityInfo: String,
    multipleHalls: { type: Boolean, default: false },

    searchTags: String,
    rentalType: { type: String, enum: ["hourly", "daily"], default: "hourly" },

    // ✅ Now points to User model
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Media
    thumbnail: String,
    images: [String],

    // Reviews
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Venue", venueSchema);
