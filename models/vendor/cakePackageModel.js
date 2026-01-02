const mongoose = require("mongoose");

const CakeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    shortDescription: {
      type: String,
      required: true
    },

    /* ================= IMAGES ================= */
    thumbnail: {
      type: String, // /uploads/cake/xxx.jpg
      required: true
    },

    images: [
      {
        type: String
      }
    ],

    /* ================= STORE & CATEGORY ================= */
    // store: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Store",
    //   required: true
    // },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory"
      }
    ],

    itemType: {
      type: String,
      enum: ["Veg", "Non-Veg"],
      default: "Veg"
    },

    /* ================= NUTRITION & ALLERGEN ================= */
    nutrition: [
      {
        type: String
      }
    ],

    allergenIngredients: [
      {
        type: String
      }
    ],

    isHalal: {
      type: Boolean,
      default: false
    },

    /* ================= TIME SCHEDULE ================= */
    timeSchedule: {
      startTime: {
        type: String // "10:00"
      },
      endTime: {
        type: String // "22:00"
      }
    },

    /* ================= PRICE INFO ================= */
    priceInfo: {
      unitPrice: {
        type: Number,
        required: true
      },
      discountType: {
        type: String,
        enum: ["Percent", "Amount"],
        default: "Percent"
      },
      discount: {
        type: Number,
        default: 0
      },
      maxPurchaseQty: {
        type: Number
      }
    },

    /* ================= TAGS ================= */
    searchTags: [
      {
        type: String
      }
    ],

    /* ================= VARIATIONS ================= */
    variations: [
      {
        name: String, // eg: "Half Kg", "1 Kg"
        price: Number
      }
    ],

    /* ================= STATUS ================= */
    isActive: {
      type: Boolean,
      default: true
    },

    isTopPick: {
      type: Boolean,
      default: false
    },

    /* ================= PROVIDER ================= */
    // provider: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Provider",
    //   required: true
    // }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cake", CakeSchema);
