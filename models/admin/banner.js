// const mongoose = require('mongoose');

// const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, 'Banner title is required'],
//     trim: true,
//     maxlength: [100, 'Title cannot exceed 100 characters']
//   },
//   description: {
//     type: String,
//     trim: true,
//     maxlength: [500, 'Description cannot exceed 500 characters']
//   },
//   image: {
//     type: String,
//     required: [true, 'Banner image is required']
//   },
//   zone: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Zone',
//     required: [true, 'Zone is required']
//   },
//   bannerType: {
//     type: String,
//     enum: {
//       values: ['top_deal', 'cash_back', 'zone_wise'],
//       message: '{VALUE} is not a valid banner type. Valid types are: top_deal, cash_back, zone_wise'
//     },
//     required: [true, 'Banner type is required']
//   },
//   isFeatured: { type: Boolean, default: false },
//   isActive: { type: Boolean, default: true },
//   displayOrder: { type: Number, default: 0 },
//   startDate: { type: Date, default: Date.now },
//   endDate: { type: Date },
//   clickCount: { type: Number, default: 0 },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, {
//   timestamps: true
// });

// // CRITICAL: Normalize bannerType BEFORE validation runs
// bannerSchema.pre('validate', function(next) {
//   // Normalize bannerType to lowercase
//   if (this.bannerType && typeof this.bannerType === 'string') {
//     this.bannerType = this.bannerType.toLowerCase().trim();
//   }
  
//   next();
// });

// // For updates - normalize bannerType
// bannerSchema.pre('findOneAndUpdate', function(next) {
//   const update = this.getUpdate();
  
//   // Handle different update formats
//   if (update.bannerType) {
//     update.bannerType = update.bannerType.toLowerCase().trim();
//   }
//   if (update.$set && update.$set.bannerType) {
//     update.$set.bannerType = update.$set.bannerType.toLowerCase().trim();
//   }
  
//   next();
// });

// // Indexes
// bannerSchema.index({ zone: 1, isActive: 1 });
// bannerSchema.index({ bannerType: 1 });
// bannerSchema.index({ isFeatured: 1, isActive: 1 });
// bannerSchema.index({ displayOrder: 1 });
// bannerSchema.index({ startDate: 1, endDate: 1 });

// module.exports = mongoose.model('Banner', bannerSchema);


















// const mongoose = require('mongoose');

// const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, 'Banner title is required'],
//     trim: true,
//     maxlength: [100, 'Title cannot exceed 100 characters']
//   },
//   description: {
//     type: String,
//     trim: true,
//     maxlength: [500, 'Description cannot exceed 500 characters']
//   },
//   image: {
//     type: String,
//     required: [true, 'Banner image is required']
//   },
//   zone: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Zone',
//     required: [true, 'Zone is required']
//   },
//   // Added vendor field
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor'
//   },
//   store: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Store'
//   },
//   bannerType: {
//     type: String,
//     enum: {
//       values: ['top_deal', 'cash_back', 'zone_wise'],
//       message: '{VALUE} is not a valid banner type. Valid types are: top_deal, cash_back, zone_wise'
//     },
//     required: [true, 'Banner type is required']
//   },
//   isFeatured: { type: Boolean, default: false },
//   isActive: { type: Boolean, default: true },
//   displayOrder: { type: Number, default: 0 },
//   startDate: { type: Date, default: Date.now },
//   endDate: { type: Date },
//   clickCount: { type: Number, default: 0 },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, {
//   timestamps: true
// });

// // CRITICAL: Normalize bannerType BEFORE validation runs
// bannerSchema.pre('validate', function(next) {
//   if (this.bannerType && typeof this.bannerType === 'string') {
//     this.bannerType = this.bannerType.toLowerCase().trim();
//   }
//   next();
// });

// // For updates - normalize bannerType
// bannerSchema.pre('findOneAndUpdate', function(next) {
//   const update = this.getUpdate();
  
//   if (update.bannerType) {
//     update.bannerType = update.bannerType.toLowerCase().trim();
//   }
//   if (update.$set && update.$set.bannerType) {
//     update.$set.bannerType = update.$set.bannerType.toLowerCase().trim();
//   }
  
//   next();
// });

// // Indexes
// bannerSchema.index({ zone: 1, isActive: 1 });
// bannerSchema.index({ bannerType: 1 });
// bannerSchema.index({ isFeatured: 1, isActive: 1 });
// bannerSchema.index({ displayOrder: 1 });
// bannerSchema.index({ startDate: 1, endDate: 1 });
// bannerSchema.index({ vendor: 1, isActive: 1 }); // Added vendor index

// module.exports = mongoose.model('Banner', bannerSchema);


// models/admin/banner.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Banner image is required']
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone is required']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  /** 👇 ADD THIS FIELD */
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  bannerType: {
    type: String,
    enum: {
      values: ['top_deal', 'cash_back', 'zone_wise'],
      message: '{VALUE} is not a valid banner type.'
    },
    required: [true, 'Banner type is required']
  },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  clickCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

bannerSchema.index({ module: 1, isActive: 1 });
bannerSchema.index({ zone: 1, isActive: 1 });
bannerSchema.index({ vendor: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
