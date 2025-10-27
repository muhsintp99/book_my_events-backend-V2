const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  module: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module', 
    index: true, 
    required: false
  },

  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }
  ],

  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  description: { type: String, trim: true },

  // ✅ Flexible package type
  packageType: { type: String, default: 'basic' },

  // ✅ Includes: array of objects
  includes: [
    {
      title: { type: String, required: true, trim: true },
      items: [{ type: String, required: true }]
    }
  ],

  price: { type: Number, required: true, min: 0 },

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

