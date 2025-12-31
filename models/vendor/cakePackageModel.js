const mongoose = require("mongoose");

const CakeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /* ================= CATEGORY (SAME AS TRANSPORT) ================= */
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

    /* ================= IMAGES ================= */
    thumbnail: {
      type: String,
    },

    images: [
      {
        type: String,
      },
    ],

    /* ================= PRICE INFO ================= */
    priceInfo: {
      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      advanceBookingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxPurchaseQty: {
        type: Number,
        min: 1,
      },
    },

    /* ================= OPTIONAL FIELDS ================= */
    itemType: {
      type: String, // free text (NO ENUM)
      trim: true,
    },

    nutrition: [{ type: String }],
    allergenIngredients: [{ type: String }],

    isHalal: {
      type: Boolean,
      default: false,
    },

    timeSchedule: {
      startTime: String,
      endTime: String,
    },

    /* ================= STATUS ================= */
    isTopPick: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
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

/* ================= INDEXES ================= */
CakeSchema.index({ provider: 1, isActive: 1 });
CakeSchema.index({ category: 1 });
CakeSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Cake", CakeSchema);
