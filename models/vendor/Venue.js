// const mongoose = require('mongoose');

// // Pricing structure for each slot type
// const slotPricingSchema = new mongoose.Schema({
//   startTime: { type: String, required: true },
//   startAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
//   endTime: { type: String, required: true },
//   endAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
//   perDay: { type: Number, default: 0 },
//   perHour: { type: Number, default: 0 },
//   perPerson: { type: Number, default: 0 },
// }, { _id: false });

// // Daily schedule with morning and evening slots
// const dailyScheduleSchema = new mongoose.Schema({
//   morning: { type: slotPricingSchema, default: null },
//   evening: { type: slotPricingSchema, default: null },
// }, { _id: false });

// // Pricing schedule organized by day
// const pricingScheduleSchema = new mongoose.Schema({
//   monday: { type: dailyScheduleSchema, default: {} },
//   tuesday: { type: dailyScheduleSchema, default: {} },
//   wednesday: { type: dailyScheduleSchema, default: {} },
//   thursday: { type: dailyScheduleSchema, default: {} },
//   friday: { type: dailyScheduleSchema, default: {} },
//   saturday: { type: dailyScheduleSchema, default: {} },
//   sunday: { type: dailyScheduleSchema, default: {} },
// }, { _id: false });

// // FAQ Schema
// const faqSchema = new mongoose.Schema({
//   question: { type: String, required: true, trim: true },
//   answer: { type: String, required: true, trim: true },
// }, { _id: true });

// const venueSchema = new mongoose.Schema(
//   {
//     // Basic Information
//     venueName: { type: String, required: true, trim: true },
//     shortDescription: { type: String, trim: true },
//     venueAddress: { type: String, required: true, trim: true },
//     latitude: { type: Number },
//     longitude: { type: Number },
//     language: { type: String, default: 'EN' },
    
//     // Contact Information
//     contactPhone: { type: String },
//     contactEmail: { type: String },
//     contactWebsite: { type: String },
    
//     // Owner / Manager Info
//     ownerManagerName: { type: String },
//     ownerManagerPhone: { type: String },
//     ownerManagerEmail: { type: String },
    
//     // Operating Hours
//     openingHours: { type: String },
//     closingHours: { type: String },
//     holidaySchedule: { type: String },
    
//     // Features & Amenities
//     watermarkProtection: { type: Boolean, default: false },
//     parkingAvailability: { type: Boolean, default: false },
//     parkingCapacity: { type: String },
//     wheelchairAccessibility: { type: Boolean, default: false },
//     securityArrangements: { type: Boolean, default: false },
//     foodCateringAvailability: { type: Boolean, default: false },
//     wifiAvailability: { type: Boolean, default: false },
//     stageLightingAudio: { type: Boolean, default: false },
//     washroomsInfo: { type: String },
//     dressingRooms: { type: String },
    
//     // Pricing & Packages
//     discount: { type: Number },
//     customPackages: { type: String },
//     dynamicPricing: { type: Boolean, default: false },
//     advanceDeposit: { type: Number },
//     cancellationPolicy: { type: String },
//     extraCharges: { type: String },
//     pricingSchedule: { type: pricingScheduleSchema, default: {} },
    
//     // Guest Capacity
//     seatingArrangement: { type: String },
//     maxGuestsSeated: { type: Number },
//     maxGuestsStanding: { type: Number },
//     multipleHalls: { type: Boolean, default: false },
    
//     // Location & Accessibility
//     nearbyTransport: { type: String },
//     accessibilityInfo: { type: String },
    
//     // Search & Tags
//     searchTags: [{ type: String, trim: true }],
    
//     // FAQ Section
//     faqs: [faqSchema],
    
//     // Media
//     thumbnail: { type: String },
//     images: [{ type: String }],
    
//     // Provider/Owner Reference (optional)
//     provider: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'User', 
//       required: false 
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
    
//     // Reviews & Ratings
//     rating: { type: Number, default: 0 },
//     reviewCount: { type: Number, default: 0 },
    
//     // Status
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Venue', venueSchema);

























// const mongoose = require('mongoose');

// // Pricing structure for each slot type
// const slotPricingSchema = new mongoose.Schema({
//   startTime: { type: String, required: true },
//   startAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
//   endTime: { type: String, required: true },
//   endAmpm: { type: String, required: true, enum: ['AM', 'PM'] },
//   perDay: { type: Number, default: 0 },
//   perHour: { type: Number, default: 0 },
//   perPerson: { type: Number, default: 0 },
// }, { _id: false });

// // Daily schedule with morning and evening slots
// const dailyScheduleSchema = new mongoose.Schema({
//   morning: { type: slotPricingSchema, default: null },
//   evening: { type: slotPricingSchema, default: null },
// }, { _id: false });

// // Pricing schedule organized by day
// const pricingScheduleSchema = new mongoose.Schema({
//   monday: { type: dailyScheduleSchema, default: {} },
//   tuesday: { type: dailyScheduleSchema, default: {} },
//   wednesday: { type: dailyScheduleSchema, default: {} },
//   thursday: { type: dailyScheduleSchema, default: {} },
//   friday: { type: dailyScheduleSchema, default: {} },
//   saturday: { type: dailyScheduleSchema, default: {} },
//   sunday: { type: dailyScheduleSchema, default: {} },
// }, { _id: false });

// // FAQ Schema
// const faqSchema = new mongoose.Schema({
//   question: { type: String, required: true, trim: true },
//   answer: { type: String, required: true, trim: true },
// }, { _id: true });

// const venueSchema = new mongoose.Schema(
//   {
//     // Basic Information
//     venueName: { type: String, required: true, trim: true },
//     shortDescription: { type: String, trim: true },
//     venueAddress: { type: String, required: true, trim: true },
//     latitude: { type: Number },
//     longitude: { type: Number },
//     language: { type: String, default: 'EN' },
    
//     // Categories
//     categories: [{ 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'Category' 
//     }],
//     module: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'Module' 
//     },
    
//     // Contact Information
//     contactPhone: { type: String },
//     contactEmail: { type: String },
//     contactWebsite: { type: String },
    
//     // Owner / Manager Info
//     ownerManagerName: { type: String },
//     ownerManagerPhone: { type: String },
//     ownerManagerEmail: { type: String },
    
//     // Operating Hours
//     openingHours: { type: String },
//     closingHours: { type: String },
//     holidaySchedule: { type: String },
    
//     // Features & Amenities
//     watermarkProtection: { type: Boolean, default: false },
//     parkingAvailability: { type: Boolean, default: false },
//     parkingCapacity: { type: String },
//     wheelchairAccessibility: { type: Boolean, default: false },
//     securityArrangements: { type: Boolean, default: false },
//     foodCateringAvailability: { type: Boolean, default: false },
//     wifiAvailability: { type: Boolean, default: false },
//     stageLightingAudio: { type: Boolean, default: false },
//     washroomsInfo: { type: String },
//     dressingRooms: { type: String },
    
//     // AC/Non-AC Availability - NEW FIELDS
//     acAvailable: { type: Boolean, default: false },
//     nonAcAvailable: { type: Boolean, default: false },
//     acType: { 
//       type: String, 
//       enum: ['Central AC', 'Split AC', 'Window AC', 'Coolers', 'Not Specified'],
//       default: 'Not Specified'
//     },
    
//     // Pricing & Packages
//     discount: { type: Number },
//     customPackages: { type: String },
//     dynamicPricing: { type: Boolean, default: false },
//     advanceDeposit: { type: Number },
//     cancellationPolicy: { type: String },
//     extraCharges: { type: String },
//     pricingSchedule: { type: pricingScheduleSchema, default: {} },
    
//     // Guest Capacity
//     seatingArrangement: { type: String },
//     maxGuestsSeated: { type: Number },
//     maxGuestsStanding: { type: Number },
//     multipleHalls: { type: Boolean, default: false },
    
//     // Location & Accessibility
//     nearbyTransport: { type: String },
//     accessibilityInfo: { type: String },
    
//     // Search & Tags
//     searchTags: [{ type: String, trim: true }],
    
//     // FAQ Section
//     faqs: [faqSchema],
    
//     // Media
//     thumbnail: { type: String },
//     images: [{ type: String }],
    
//     // Provider/Owner Reference
//     provider: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'User', 
//       required: false 
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
    
//     // Reviews & Ratings
//     rating: { type: Number, default: 0 },
//     reviewCount: { type: Number, default: 0 },
    
//     // Status
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Venue', venueSchema);





// Venue Model (Updated)

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

// NEW: Discount Schema - only packageDiscount and nonAc
const discountSchema = new mongoose.Schema({
  packageDiscount: { type: Number, min: 0, max: 100, default: 0 },
  nonAc: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
}, { _id: true });

const venueSchema = new mongoose.Schema(
  {
    // Basic Information
    venueName: { 
      type: String, 
      required: true, 
      trim: true,
      index: true
    },
    shortDescription: { 
      type: String, 
      trim: true,
      index: 'text'
    },
    venueAddress: { 
      type: String, 
      required: true, 
      trim: true,
      index: 'text'
    },
    latitude: { 
      type: Number,
      index: true
    },
    longitude: { 
      type: Number,
      index: true
    },
    language: { type: String, default: 'EN' },
    
    // Categories
    categories: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category',
      index: true
    }],
    module: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Module',
      index: true
    },
    
    // Packages
    packages: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Package',
      index: true
    }],
    
    // Contact Information
    contactPhone: { type: String },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactWebsite: { type: String, trim: true },
    
    // Owner / Manager Info
    ownerManagerName: { type: String, trim: true },
    ownerManagerPhone: { type: String },
    ownerManagerEmail: { type: String, lowercase: true, trim: true },
    
    // Operating Hours
    openingHours: { type: String },
    closingHours: { type: String },
    holidaySchedule: { type: String },
    
    // Features & Amenities
    watermarkProtection: { type: Boolean, default: false, index: true },
    parkingAvailability: { type: Boolean, default: false, index: true },
    parkingCapacity: { type: String },
    wheelchairAccessibility: { type: Boolean, default: false, index: true },
    securityArrangements: { type: Boolean, default: false, index: true },
    foodCateringAvailability: { type: Boolean, default: false, index: true },
    wifiAvailability: { type: Boolean, default: false, index: true },
    stageLightingAudio: { type: Boolean, default: false, index: true },
    washroomsInfo: { type: String },
    dressingRooms: { type: String },
    
    // AC/Non-AC Availability
    acAvailable: { type: Boolean, default: false, index: true },
    nonAcAvailable: { type: Boolean, default: false, index: true },
    acType: { 
      type: String, 
      enum: ['Central AC', 'Split AC', 'Window AC', 'Coolers', 'Not Specified'],
      default: 'Not Specified',
      index: true
    },
    
    // Pricing & Packages
    // UPDATED: Changed from simple Number to Object with packageDiscount and nonAc
    discount: { 
      type: discountSchema, 
      default: () => ({
        packageDiscount: 0,
        nonAc: 0
      })
    },
    customPackages: { type: String },
    dynamicPricing: { type: Boolean, default: false, index: true },
    advanceDeposit: { type: Number, min: 0 },
    cancellationPolicy: { type: String },
    extraCharges: { type: String },
    pricingSchedule: { type: pricingScheduleSchema, default: {} },
    
    // Guest Capacity
    seatingArrangement: { type: String },
    maxGuestsSeated: { type: Number, min: 0, index: true },
    maxGuestsStanding: { type: Number, min: 0, index: true },
    multipleHalls: { type: Boolean, default: false, index: true },
    
    // Location & Accessibility
    nearbyTransport: { type: String },
    accessibilityInfo: { type: String },
    
    // Search & Tags
    searchTags: [{ 
      type: String, 
      trim: true,
      lowercase: true,
      index: true
    }],
    
    // FAQ Section
    faqs: [faqSchema],
    
    // Media
    thumbnail: { type: String },
    images: [{ type: String }],
    
    // Provider/Owner Reference
    provider: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Reviews & Ratings
    rating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5,
      index: true
    },
    reviewCount: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    
    // Status
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    isTopPick: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { 
    timestamps: true,
    indexes: [
      { key: { latitude: 1, longitude: 1, isActive: 1 } },
      { key: { categories: 1, isActive: 1 } },
      { key: { module: 1, isActive: 1 } },
      { key: { packages: 1, isActive: 1 } },
      { key: { provider: 1, isActive: 1 } },
      { key: { createdBy: 1, isActive: 1 } },
      { key: { isActive: 1, acAvailable: 1, parkingAvailability: 1 } },
      { key: { isActive: 1, maxGuestsSeated: 1 } },
      { key: { isActive: 1, rating: -1 } },
      { key: { isActive: 1, isTopPick: 1 } },
      { key: { venueName: 'text', shortDescription: 'text', venueAddress: 'text', searchTags: 'text' } }
    ]
  }
);

// Virtual for full address
venueSchema.virtual('fullContactInfo').get(function() {
  return {
    phone: this.contactPhone,
    email: this.contactEmail,
    website: this.contactWebsite
  };
});

// Instance methods remain the same
venueSchema.methods.isAvailableOnDay = function(dayOfWeek) {
  const day = dayOfWeek.toLowerCase();
  const daySchedule = this.pricingSchedule?.[day];
  
  if (!daySchedule) return false;
  
  return (daySchedule.morning && Object.keys(daySchedule.morning).length > 0) ||
         (daySchedule.evening && Object.keys(daySchedule.evening).length > 0);
};

venueSchema.methods.getPricingForSlot = function(dayOfWeek, slotType) {
  const day = dayOfWeek.toLowerCase();
  const slot = slotType.toLowerCase();
  
  return this.pricingSchedule?.[day]?.[slot] || null;
};

venueSchema.methods.calculateDistance = function(latitude, longitude) {
  if (!this.latitude || !this.longitude) return null;
  
  const R = 6371;
  const dLat = (this.latitude - latitude) * Math.PI / 180;
  const dLon = (this.longitude - longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latitude * Math.PI / 180) * Math.cos(this.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

// Static methods remain the same
venueSchema.statics.findWithinRadius = async function(latitude, longitude, radiusKm = 10) {
  const venues = await this.find({
    latitude: { $exists: true, $ne: null },
    longitude: { $exists: true, $ne: null },
    isActive: true
  }).lean();
  
  return venues.filter(venue => {
    const distance = this.prototype.calculateDistance.call(venue, latitude, longitude);
    return distance !== null && distance <= radiusKm;
  }).map(venue => ({
    ...venue,
    distance: this.prototype.calculateDistance.call(venue, latitude, longitude),
    distanceUnit: 'km'
  })).sort((a, b) => a.distance - b.distance);
};

venueSchema.statics.advancedSearch = async function(filters) {
  const query = { isActive: true };
  
  if (filters.keyword) {
    const keywordRegex = new RegExp(filters.keyword, 'i');
    query.$or = [
      { venueName: keywordRegex },
      { shortDescription: keywordRegex },
      { venueAddress: keywordRegex },
      { searchTags: { $in: [keywordRegex] } }
    ];
  }
  
  if (filters.categoryId) {
    query.categories = filters.categoryId;
  }
  
  if (filters.moduleId) {
    query.module = filters.moduleId;
  }
  
  if (filters.packageId) {
    query.packages = filters.packageId;
  }
  
  if (filters.acAvailable !== undefined) {
    query.acAvailable = filters.acAvailable;
  }
  if (filters.parkingAvailability !== undefined) {
    query.parkingAvailability = filters.parkingAvailability;
  }
  if (filters.foodCateringAvailability !== undefined) {
    query.foodCateringAvailability = filters.foodCateringAvailability;
  }
  
  if (filters.minCapacity) {
    query.maxGuestsSeated = { $gte: filters.minCapacity };
  }
  
  if (filters.latitude && filters.longitude) {
    query.latitude = { $exists: true, $ne: null };
    query.longitude = { $exists: true, $ne: null };
  }
  
  return this.find(query)
    .populate('categories', 'title image categoryId module isActive')
    .populate('module', 'title moduleId icon isActive')
    .populate('packages')
    .populate('createdBy', 'name email phone')
    .populate('provider', 'name email phone')
    .lean();
};

// Pre-save middleware
venueSchema.pre('save', function(next) {
  if (!this.searchTags) {
    this.searchTags = [];
  }

  if (this.isModified('searchTags') && this.searchTags.length > 0) {
    const parsedTags = [];
    this.searchTags.forEach(tag => {
      if (typeof tag === 'string') {
        try {
          const parsed = JSON.parse(tag);
          if (Array.isArray(parsed)) {
            parsedTags.push(...parsed.map(t => t.trim().toLowerCase()));
          } else {
            parsedTags.push(tag.trim().toLowerCase());
          }
        } catch {
          parsedTags.push(tag.trim().toLowerCase());
        }
      }
    });
    this.searchTags = [...new Set(parsedTags.filter(tag => tag))];
  }

  if (this.venueName && !this.searchTags.includes(this.venueName.toLowerCase())) {
    this.searchTags.push(this.venueName.toLowerCase());
  }
  
  if (this.venueAddress) {
    const addressParts = this.venueAddress.split(',').map(part => part.trim().toLowerCase());
    addressParts.forEach(part => {
      if (part && !this.searchTags.includes(part)) {
        this.searchTags.push(part);
      }
    });
  }
  
  next();
});

// Pre-update middleware
venueSchema.pre('findOneAndUpdate', function(next) {
  this.options.runValidators = true;
  this.options.new = true;

  const update = this.getUpdate();
  if (update.searchTags) {
    let parsedTags = [];
    if (typeof update.searchTags === 'string') {
      try {
        parsedTags = JSON.parse(update.searchTags);
        if (!Array.isArray(parsedTags)) {
          parsedTags = [update.searchTags];
        }
      } catch {
        parsedTags = update.searchTags.split(',').map(tag => tag.trim());
      }
    } else if (Array.isArray(update.searchTags)) {
      parsedTags = update.searchTags;
    }
    update.searchTags = [...new Set(parsedTags
      .flat()
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag))];
  }

  next();
});

// Post-save middleware
venueSchema.post('save', function(doc) {
  console.log(`Venue ${doc.venueName} has been saved with ID: ${doc._id}`);
});

// Error handling middleware
venueSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('A venue with this information already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Venue', venueSchema);