const mongoose = require('mongoose');

// Pricing structure for each slot type
const slotPricingSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  startAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
  endTime: { type: String, required: true },
  endAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
  perDay: { type: Number, default: 0 },
  perHour: { type: Number, default: 0 },
  perPerson: { type: Number, default: 0 },
}, { _id: false });

// Daily schedule with morning and evening slots
const dailyScheduleSchema = new mongoose.Schema({
  morning: { type: slotPricingSchema, default: null },
  evening: { type: slotPricingSchema, default: null },
}, { _id: false });

// Pricing schedule organized by day
const pricingScheduleSchema = new mongoose.Schema({
  monday: { type: dailyScheduleSchema, default: {} },
  tuesday: { type: dailyScheduleSchema, default: {} },
  wednesday: { type: dailyScheduleSchema, default: {} },
  thursday: { type: dailyScheduleSchema, default: {} },
  friday: { type: dailyScheduleSchema, default: {} },
  saturday: { type: dailyScheduleSchema, default: {} },
  sunday: { type: dailyScheduleSchema, default: {} },
}, { _id: false });

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
}, { _id: true });

const venueSchema = new mongoose.Schema(
  {
    // Basic Information
    venueName: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    venueAddress: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    language: { type: String, default: 'EN' },
    
    // Contact Information
    contactPhone: { type: String },
    contactEmail: { type: String },
    contactWebsite: { type: String },
    
    // Owner / Manager Info
    ownerManagerName: { type: String },
    ownerManagerPhone: { type: String },
    ownerManagerEmail: { type: String },
    
    // Operating Hours
    openingHours: { type: String },
    closingHours: { type: String },
    holidaySchedule: { type: String },
    
    // Features & Amenities
    watermarkProtection: { type: Boolean, default: false },
    parkingAvailability: { type: Boolean, default: false },
    parkingCapacity: { type: String },
    wheelchairAccessibility: { type: Boolean, default: false },
    securityArrangements: { type: Boolean, default: false },
    foodCateringAvailability: { type: Boolean, default: false },
    wifiAvailability: { type: Boolean, default: false },
    stageLightingAudio: { type: Boolean, default: false },
    washroomsInfo: { type: String },
    dressingRooms: { type: String },
    
    // Pricing & Packages
    discount: { type: Number },
    customPackages: { type: String },
    dynamicPricing: { type: Boolean, default: false },
    advanceDeposit: { type: Number },
    cancellationPolicy: { type: String },
    extraCharges: { type: String },
    pricingSchedule: { type: pricingScheduleSchema, default: {} },
    
    // Guest Capacity
    seatingArrangement: { type: String },
    maxGuestsSeated: { type: Number },
    maxGuestsStanding: { type: Number },
    multipleHalls: { type: Boolean, default: false },
    
    // Location & Accessibility
    nearbyTransport: { type: String },
    accessibilityInfo: { type: String },
    
    // Search & Tags
    searchTags: [{ type: String, trim: true }],
    
    // FAQ Section
    faqs: [faqSchema],
    
    // Media
    thumbnail: { type: String },
    images: [{ type: String }],
    
    // Provider/Owner Reference (optional)
    provider: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Reviews & Ratings
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);