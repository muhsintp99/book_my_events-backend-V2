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

    // ❌ REMOVED UNIQUE cakeId (THIS WAS CAUSING DUPLICATES)
    cakeId: {
      type: String,
      default: null, // optional, NOT unique
    },

    images: [
      {
        type: String,
      },
    ],

    /* ================= CATEGORY ================= */
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
      enum: ["Veg", "Non-Veg"],
      default: "Veg",
    },

    /* ================= NUTRITION ================= */
    nutrition: [{ type: String }],
    allergenIngredients: [{ type: String }],

    isHalal: {
      type: Boolean,
      default: false,
    },

    /* ================= TIME ================= */
    timeSchedule: {
      startTime: String,
      endTime: String,
    },

    /* ================= PRICE ================= */
    priceInfo: {
      unitPrice: {
        type: Number,
        required: true,
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
    },

    isTopPick: {
      type: Boolean,
      default: false,
    },

    /* ================= PROVIDER ================= */
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES (SAFE ONLY) ================= */

// ✅ Fast provider listing
CakeSchema.index({ provider: 1, isActive: 1 });

// ✅ Category filter
CakeSchema.index({ category: 1 });

// ✅ Search support
CakeSchema.index({ name: "text", searchTags: "text" });

// ❌ NO unique indexes at all

module.exports = mongoose.model("Cake", CakeSchema);
