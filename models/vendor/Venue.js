const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
      minlength: [1, "Venue name cannot be empty"],
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    venueAddress: {
      type: String,
      required: [true, "Venue address is required"],
      trim: true,
      minlength: [1, "Venue address cannot be empty"],
    },
    latitude: Number,
    longitude: Number,
    language: {
      type: String,
      default: "EN",
      enum: ["EN", "ES", "FR", "DE"], // Optional: restrict to specific languages
    },

    // Contact
    contactPhone: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"], // Optional: email validation
    },
    contactWebsite: {
      type: String,
      trim: true,
    },

    // Owner / Manager Info
    ownerManagerName: {
      type: String,
      trim: true,
    },
    ownerManagerPhone: {
      type: String,
      trim: true,
    },
    ownerManagerEmail: {
      type: String,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"], // Optional: email validation
    },

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
    rentalType: {
      type: String,
      enum: ["hourly", "daily"],
      default: "hourly",
    },

    // Points to User model, now required
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider is required"],
    },

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