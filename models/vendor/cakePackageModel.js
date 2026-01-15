const mongoose = require("mongoose");

const CakeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    /* ================= IMAGES ================= */
    thumbnail: {
      type: String,
      required: true,
    },

    cakeId: {
      type: String,
      default: null,
    },

    images: [
      {
        type: String,
      },
    ],

    /* ================= MODULE & CATEGORY ================= */
    module: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Module",
  required: true,
  index: true,
},
/* ================= ADD ONS ================= */
addons: [
  {
    name: {
      type: String,
      required: true, // e.g. "Birthday Candles"
    },
    description: {
      type: String, // optional
    },
    price: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
],


    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    /* ================= CAKE TYPE ================= */
   itemType: {
  type: String,
  enum: ["Eggless", "Egg"],
  default: "Eggless"
},

    /* ================= NUTRITION ================= */
    nutrition: [{ type: String }],
    allergenIngredients: [{ type: String }],

    // isHalal: {
    //   type: Boolean,
    //   default: false,
    // },

/* ================= TIME ================= */
// timeSchedule: {
//   startTime: {
//     type: String, // e.g. "10:00"
//     required: true
//   },
//   startPeriod: {
//     type: String,
//     enum: ["AM", "PM"],
//     default: "AM"
//   },
//   endTime: {
//     type: String, // e.g. "06:00"
//     required: true
//   },
//   endPeriod: {
//     type: String,
//     enum: ["AM", "PM"],
//     default: "PM"
//   }
// },


      /* ================= VARIATIONS ================= */
    variations: [
      {
        name: String,
        price: Number,
      },
    ],

    /* ================= TAGS ================= */
    searchTags: [{ type: String }],

    /* ================= STATUS ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isTopPick: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ================= PROVIDER ================= */
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

// Fast provider listing
CakeSchema.index({ provider: 1, isActive: 1 });

// Category filter
CakeSchema.index({ category: 1 });

// Search support
CakeSchema.index({ name: "text", searchTags: "text" });

// Top picks query
CakeSchema.index({ isTopPick: 1, isActive: 1 });

module.exports = mongoose.model("Cake", CakeSchema);