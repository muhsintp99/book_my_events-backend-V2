// const mongoose = require('mongoose');

// const CateringSchema = new mongoose.Schema({
//   cateringId: { type: String, unique: true, sparse: true },

//   module: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Module',
//     index: true,
//     required: false
//   },

//   categories: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category',
//   }],

//   title: { type: String, required: true, trim: true },
//   subtitle: { type: String, trim: true },
//   description: { type: String, trim: true },

//   cateringType: { type: String, default: 'basic' },

//   includes: [{
//     title: { type: String, required: true, trim: true },
//     items: [{ type: String, required: true }]
//   }],

//   price: { type: Number, required: true, min: 0 },
//   images: [{ type: String }],
//   thumbnail: { type: String, default: null },

//   provider: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: false,
//     index: true
//   },

//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: false,
//     index: true
//   },

//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: false
//   },

//   isActive: { type: Boolean, default: true, index: true },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// }, { timestamps: true });

// CateringSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// module.exports = mongoose.model('Catering', CateringSchema);

const mongoose = require("mongoose");

const includesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    items: [{ type: String, required: true }],
  },
  { _id: true }
);

const CateringSchema = new mongoose.Schema(
  {
    cateringId: { type: String, unique: true, sparse: true },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      index: true,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    title: { type: String, required: true, trim: true },
    subtitle: { type: String },
    description: { type: String },

    cateringType: { type: String, default: "basic" },

    includes: [includesSchema],

    // ===============================
    // PRICING
    // ===============================
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    advanceBookingAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          // advance should not exceed total price
          return value <= this.price;
        },
        message: "Advance booking amount cannot be greater than price",
      },
    },

    // ===============================
    // MEDIA
    // ===============================
    images: [{ type: String }],
    thumbnail: { type: String },

    // ===============================
    // PROVIDER INFO
    // ===============================
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ===============================
    // FLAGS
    // ===============================
    isTopPick: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Catering", CateringSchema);
