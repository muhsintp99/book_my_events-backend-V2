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


    /* ================= PRICE ================= */
    priceInfo: {
  unitPrice: {
    type: Number,
    required: true,
  },

  // ✅ MUST BE HERE
  advanceBookingAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  discountType: {
    type: String,
    enum: ["Percent", "Amount"],
    default: "Percent",
  },

  discount: {
    type: Number,
    default: 0,
  },

  maxPurchaseQty: Number,
},

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