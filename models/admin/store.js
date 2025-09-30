const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters'],
    minlength: [2, 'Store name must be at least 2 characters']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    fullAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  operatingHours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } }
  },
  manager: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [
    {
      url: String,
      caption: String,
      isPrimary: { type: Boolean, default: false }
    }
  ],
  amenities: [String],
  capacity: {
    type: Number,
    min: [0, 'Capacity cannot be negative']
  },
  priceRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    website: String
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ----------------- Indexes -----------------
storeSchema.index({ zone: 1, isActive: 1 });
storeSchema.index({ storeName: 'text', 'address.fullAddress': 'text', description: 'text' });
storeSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
storeSchema.index({ createdAt: -1 });
storeSchema.index({ 'rating.average': -1 });
storeSchema.index({ zone: 1, storeName: 1 }, { unique: true });

// ----------------- Virtual -----------------
storeSchema.virtual('fullAddress').get(function () {
  if (this.address && this.address.fullAddress) return this.address.fullAddress;
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  return parts.join(', ');
});

// ----------------- Methods -----------------
storeSchema.methods.isOpenNow = function () {
  const now = new Date();
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = dayNames[now.getDay()];
  const todayHours = this.operatingHours[today];

  if (!todayHours || todayHours.isClosed) return false;
  if (!todayHours.open || !todayHours.close) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
};

// ----------------- Middlewares -----------------
storeSchema.pre('save', function (next) {
  if (this.address && !this.address.fullAddress) {
    const parts = [];
    if (this.address.street) parts.push(this.address.street);
    if (this.address.city) parts.push(this.address.city);
    if (this.address.state) parts.push(this.address.state);
    if (this.address.zipCode) parts.push(this.address.zipCode);
    if (parts.length > 0) this.address.fullAddress = parts.join(', ');
  }
  next();
});

storeSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Store', storeSchema);
