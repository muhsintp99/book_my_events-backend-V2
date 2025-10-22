const mongoose = require('mongoose');

const PriceRangeSchema = new mongoose.Schema({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 }
}, { _id: false });

const PackageSchema = new mongoose.Schema({
  module: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module', 
    index: true, 
    required: false
  },

  // ✅ Changed to multiple categories
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }
  ],

  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  description: { type: String, trim: true },

  packageType: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'deluxe', 'royal'],
    default: 'basic'
  },

  includes: { type: [String], default: [] },
  priceRange: { type: PriceRangeSchema, required: true },

  images: { type: String, default: null },
  thumbnail: { type: String, default: null },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PackageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Package', PackageSchema);
