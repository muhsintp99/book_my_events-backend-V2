const mongoose = require("mongoose");

// Included Services Schema
const includedServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    items: [{ type: String, required: true }]
  },
  { _id: true }
);

const MakeupSchema = new mongoose.Schema(
  {
    makeupId: { type: String, unique: true, sparse: true },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      index: true,
      required: false
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
      }
    ],

    packageTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },

//     makeupType: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "MakeupType",
//   required: true
// },
    makeupType: {
      type: String,
      required: true,
      trim: true
    },


    includedServices: [includedServiceSchema],

    basePrice: { type: Number, required: true },
    offerPrice: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },

    gallery: [{ type: String }],

    trialMakeupIncluded: { type: Boolean, default: false },
    travelToVenue: { type: Boolean, default: false },
    advanceBookingAmount: { type: String },
    cancellationPolicy: { type: String },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    isTopPick: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

MakeupSchema.index({
  packageTitle: "text",
  description: "text"
});

module.exports = mongoose.model("Makeup", MakeupSchema);