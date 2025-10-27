const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  packageId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },

  module: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module', 
    index: true, 
    required: false
  },

  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],

  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  description: { type: String, trim: true },

  packageType: { type: String, default: 'basic' },

  includes: [{
    title: { type: String, required: true, trim: true },
    items: [{ type: String, required: true }]
  }],

  price: { type: Number, required: true, min: 0 },
  images: [{ type: String }],
  thumbnail: { type: String, default: null },

  // ✅ FIXED: Changed ref from 'Provider' to 'User'
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Changed from 'Provider' to 'User'
    required: false,
    index: true  // Added index for faster queries
  },

  // ✅ ADDED: updatedBy field
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true  // This automatically manages createdAt and updatedAt
});

// Pre-save middleware
PackageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Package', PackageSchema);
