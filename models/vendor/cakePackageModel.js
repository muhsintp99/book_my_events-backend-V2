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

    /* ================= PRICING ================= */
    basePrice: {
      type: Number,
      required: true,
      default: 0,
    },

    discountType: {
      type: String,
      enum: ["flat", "percentage", "none"],
      default: "none",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      default: 0,
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
    attributes: [
      {
        name: String, // e.g. "Weight"
        values: [String], // e.g. ["0.5Kg", "1Kg", "2Kg"]
      },
    ],

    variations: [
      {
        name: String, // e.g. "0.5 Kg - Egg"
        price: Number,
        image: String,
        attributeValues: [String], // e.g. ["0.5Kg", "Egg"]
      },
    ],


    /* ================= ADD ONS ================= */
    addons: [
      {
        addonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CakeAddon",
        },
        selectedItems: [
          {
            type: mongoose.Schema.Types.ObjectId,
          }
        ]
      },
    ],


    addonTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CakeAddonTemplate",
    },


    /* ================= SHIPPING ================= */
    shipping: {
      free: { type: Boolean, default: false },
      flatRate: { type: Boolean, default: false },
      takeaway: { type: Boolean, default: false },
      takeawayLocation: { type: String, default: "" },
      pickupLatitude: { type: String, default: "" },
      pickupLongitude: { type: String, default: "" },
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
    /* ================= TERMS & CONDITIONS ================= */
    termsAndConditions: [
      {
        heading: { type: String, trim: true },
        points: [{ type: String, trim: true }],
      },
    ],
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