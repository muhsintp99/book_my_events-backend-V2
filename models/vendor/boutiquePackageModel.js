const mongoose = require("mongoose");

const BoutiqueSchema = new mongoose.Schema(
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
        boutiqueId: {
            type: String,
            unique: true,
            sparse: true,
        },

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
            tax: { type: Number, default: 0 }, // GST % or similar
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

        /* ================= VARIATIONS ================= */
        // Inspired by Cake Model
        attributes: [
            {
                name: String, // e.g. "Size", "Color", "Material"
                values: [String], // e.g. ["S", "M", "L"]
            },
        ],

        variations: [
            {
                name: String, // e.g. "S - Blue"
                price: Number, // Additional or specific price for this variation
                image: String,
                attributeValues: [String], // e.g. ["S", "Blue"]
                stockQuantity: { type: Number, default: 0 },
            },
        ],

        /* ================= STOCK ================= */
        stock: {
            quantity: { type: Number, default: 0 }, // Total stock if no variations, or aggregate
            lowStockAlert: { type: Number, default: 0 },
        },

        /* ================= SHIPPING ================= */
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


        /* ================= FEATURES & OCCASIONS ================= */
        occasions: [{ type: String }],
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
                enum: ["Boutique", "Category"],
            },
        },

        /* ================= SPECIALIZED FIELDS ================= */
        material: {
            type: String, // Silk, Cotton, Linen, Velvet, etc. (mirrors ingredients in Cake)
        },
        availableColors: [{ type: String }], // e.g. ["Red", "Blue", "Black"]
        availableSizes: [{ type: String }], // e.g. ["S", "M", "L", "XL"]

        careInstructions: {
            type: String, // Dry clean only, Hand wash, etc.
        },
        sizeGuideImage: {
            type: String,
        },

        /* ================= RENTAL CALENDAR ================= */
        rentalAvailability: [
            {
                from: { type: Date },
                to: { type: Date },
                isBooked: { type: Boolean, default: false },
            },
        ],

        /* ================= POLICIES ================= */
        returnPolicy: {
            type: String,
            trim: true,
        },
        cancellationPolicy: {
            type: String,
            trim: true,
        },
        termsAndConditions: [
            {
                heading: { type: String, trim: true },
                points: [{ type: String, trim: true }],
            },
        ],

        /* ================= STATUS & PROVIDER ================= */
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
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Indexes
BoutiqueSchema.index({ provider: 1, isActive: 1 });
BoutiqueSchema.index({ category: 1 });
BoutiqueSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("Boutique", BoutiqueSchema);
