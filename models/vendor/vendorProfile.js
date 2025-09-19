const mongoose = require("mongoose");

const vendorProfileSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [100, "Store name cannot exceed 100 characters"],
    },
    storeAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      fullAddress: {
        type: String,
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
    },
    logo: String,
    coverImage: String,

    // Owner Info
    ownerFirstName: {
      type: String,
      required: [true, "Owner first name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    ownerLastName: {
      type: String,
      required: [true, "Owner last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    ownerPhone: {
      type: String,
      required: [true, "Owner phone is required"],
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    // Business Info
    businessTIN: {
      type: String,
      required: [true, "Business TIN is required"],
      trim: true,
    },
    tinExpireDate: {
      type: Date,
      required: [true, "TIN expire date is required"],
    },
    tinCertificate: {
      type: String,
      required: [true, "TIN certificate is required"],
    },

    // Module & Zone
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: [true, "Module is required"],
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: [true, "Zone is required"],
    },

    // Request Status
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },

    // Admin Actions
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    rejectionReason: String,
    adminNotes: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    approvedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorProfile", vendorProfileSchema);
