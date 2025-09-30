const mongoose = require("mongoose");

const vendorProfileSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      trim: true,
      maxlength: [100, "Store name cannot exceed 100 characters"],
      default: ""
    },
    storeAddress: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      zipCode: { type: String, trim: true, default: "" },
      fullAddress: {
        type: String,
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
        default: ""
      }
    },
    logo: { type: String, trim: true, default: "" },
    coverImage: { type: String, trim: true, default: "" },
    tinCertificate: { type: String, trim: true, default: "" },
    ownerFirstName: {
      type: String,
      required: [true, "Owner first name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"]
    },
    ownerLastName: {
      type: String,
      required: [true, "Owner last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    ownerPhone: {
      type: String,
      trim: true,
      default: ""
    },
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email"
      ]
    },
    businessTIN: {
      type: String,
      trim: true,
      default: ""
    },
    tinExpireDate: {
      type: Date,
      default: null
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      default: null
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date,
    rejectionReason: String,
    adminNotes: String,
    isActive: {
      type: Boolean,
      default: true
    },
    approvedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorProfile", vendorProfileSchema);