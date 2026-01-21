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
      default: "Eggless",
    },

    uom: {
      type: String,
      enum: ["Kg", "Gm", "Piece", "Litre"],
      default: "Kg",
    },

    weight: {
      type: Number,
    },

    occasions: [{ type: String }],

    prepTime: {
      type: String,
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

    /* ================= VARIATIONS ================= */
    variations: [
      {
        name: String,
        price: Number,
        image: String,
      },
    ],

    /* ================= ADD ONS ================= */
    addons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CakeAddon",
      },
    ],

    /* ================= SHIPPING ================= */
    shipping: {
      free: { type: Boolean, default: false },
      flatRate: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
    },

    /* ================= RELATED ITEMS ================= */
    relatedItems: {
      linkBy: {
        type: String,
        enum: ["product", "category"],
      },
      items: [
        {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "relatedItems.linkByRef",
        },
      ],
      linkByRef: {
        type: String,
        enum: ["Cake", "Category"],
      },
    },

    /* ================= NUTRITION ================= */
    nutrition: [{ type: String }],
    allergenIngredients: [{ type: String }],

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