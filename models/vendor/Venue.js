const mongoose = require('mongoose');

const pricingScheduleSchema = new mongoose.Schema({
  day: { type: String, required: true },
  slotType: { type: String, required: true },
  startTime: { type: String, required: true },
  startAmpm: { type: String, required: true },
  endTime: { type: String, required: true },
  endAmpm: { type: String, required: true },
  price: { type: Number, required: true },
});

const venueSchema = new mongoose.Schema(
  {
    venueName: { type: String, required: true },
    shortDescription: { type: String },
    venueAddress: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    openingHours: { type: String },
    closingHours: { type: String },
    holidaySchedule: { type: String },
    parkingAvailability: { type: Boolean, default: false },
    parkingCapacity: { type: Number },
    foodCateringAvailability: { type: Boolean, default: false },
    stageLightingAudio: { type: Boolean, default: false },
    wheelchairAccessibility: { type: Boolean, default: false },
    securityArrangements: { type: Boolean, default: false },
    wifiAvailability: { type: Boolean, default: false },
    washroomsInfo: { type: String },
    dressingRooms: { type: String },
    venueType: {
      type: String,
      required: true,
      enum: ['per_person', 'per_hour', 'per_function'],
    },
    discount: { type: Number },
    advanceDeposit: { type: Number },
    cancellationPolicy: { type: String },
    extraCharges: { type: String },
    seatingArrangement: { type: String, required: true },
    maxGuestsSeated: { type: Number, required: true },
    maxGuestsStanding: { type: Number },
    multipleHalls: { type: Boolean, default: false },
    nearbyTransport: { type: String },
    accessibilityInfo: { type: Boolean, default: false },
    searchTags: [{ type: String }],
    pricingSchedule: [pricingScheduleSchema],
    thumbnail: { type: String },
    images: [{ type: String }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);