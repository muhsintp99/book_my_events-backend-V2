const mongoose = require("mongoose");

const OrnamentSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    /* ================= COLLECTIONS (For Men, For Women, etc) ================= */
    collections: [
      {
        type: String,
        enum: ["For Men", "For Women", "For Bride", "For Groom", "For Kids"],
        index: true,
      },
    ],

    unit: {
      type: String, // e.g., "Gram", "Kg", "Piece"
    },
    weight: {
      type: Number,
    },
    material: {
      type: String, // e.g., "Gold", "Silver", "Platinum", "Diamond"
    },

    /* ================= IMAGES ================= */
    thumbnail: {
      type: String,
      required: [true, "Thumbnail image is required"],
    },
    galleryImages: [
      {
        type: String,
      },
    ],
    ornamentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    /* ================= AVAILABILITY & PRICING ================= */
    availabilityMode: {
      type: String,
      enum: ["purchase", "rental", "all"],
      default: "purchase",
    },

    buyPricing: {
      unitPrice: { type: Number, default: 0 },
      discountType: {
        type: String,
        enum: ["flat", "percentage", "none"],
        default: "none",
      },
      discountValue: { type: Number, default: 0 },
      tax: { type: Number, default: 0 }, // GST %
      totalPrice: { type: Number, default: 0 },
    },

    rentalPricing: {
      pricePerDay: { type: Number, default: 0 },
      minimumDays: { type: Number, default: 1 },
      lateCharges: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 },
      advanceForBooking: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      cleaningFee: { type: Number, default: 0 },
      damagePolicy: { type: String, trim: true },
    },

    /* ================= STOCK ================= */
    stock: {
      quantity: { type: Number, default: 0 },
      lowStockAlert: { type: Number, default: 0 },
    },

    /* ================= SHIPPING ================= */
    /* ================= SHIPPING ================= */
    shipping: {
      freeShipping: { type: Boolean, default: false },
      flatRateShipping: { type: Boolean, default: false },
      takeaway: { type: Boolean, default: false },
      takeawayLocation: { type: String, default: "" },
      pickupLatitude: { type: String, default: "" },
      pickupLongitude: { type: String, default: "" },
      shippingPrice: { type: Number, default: 0 },
    },

    /* ================= FEATURES & OCCASIONS ================= */
    occasions: [{ type: String }], // e.g., ["Marriage", "Engagement", "Wedding", "Festival"]

    features: {
      basicFeatures: [
        {
          type: String,
          enum: [
            "wedding",
            "valentine",
            "festive",
            "dailyWear",
            "casualOutings",
            "anniversary",
            "engagement",
          ],
        },
      ],

      suitableFor: [
        {
          type: String,
          enum: ["men", "women", "kids", "bride", "groom"],
        },
      ],

      style: [
        {
          type: String,
          enum: ["antique", "traditional", "navaratna", "bridal"],
        },
      ],
    },

    /* ================= TERMS & TAGS ================= */
    termsAndConditions: [
      {
        heading: { type: String, trim: true },
        points: [{ type: String, trim: true }],
      },
    ],
    tags: [{ type: String }],

    /* ================= RELATED ITEMS ================= */
    relatedItems: {
      linkBy: {
        type: String,
        enum: ["product", "category"],
        default: "category",
      },
      items: [
        {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "relatedItems.linkByRef",
        },
      ],
      linkByRef: {
        type: String,
        enum: ["Ornament", "Category"],
      },
    },

    /* ================= RENTAL CALENDAR ================= */
    rentalAvailability: [
      {
        from: { type: Date },
        to: { type: Date },
        isBooked: { type: Boolean, default: false },
      },
    ],

    /* ================= STATUS & PROVIDER ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    isTopPick: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes
OrnamentSchema.index({ provider: 1, isActive: 1 });
OrnamentSchema.index({ category: 1 });
OrnamentSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("Ornament", OrnamentSchema);
