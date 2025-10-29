const mongoose = require("mongoose");

// Social Links Schema
const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  youtube: { type: String, trim: true, default: '' },
  github: { type: String, trim: true, default: '' },
  whatsapp: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  other: { type: String, trim: true, default: '' }
}, { _id: false });

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensure one profile per user
      index: true // Add index for faster lookups
    },
    profilePhoto: {
      type: String,
      required: false,
      default: ''
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({})
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster user lookups
profileSchema.index({ userId: 1 });

// Virtual populate back to user
profileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model("Profile", profileSchema);