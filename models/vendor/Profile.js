


// const mongoose = require("mongoose");

// // Social Links Schema
// const socialLinksSchema = new mongoose.Schema({
//   facebook: { type: String, trim: true, default: '' },
//   instagram: { type: String, trim: true, default: '' },
//   twitter: { type: String, trim: true, default: '' },
//   // linkedin: { type: String, trim: true, default: '' },
//   youtube: { type: String, trim: true, default: '' },
//   // github: { type: String, trim: true, default: '' },
//   whatsapp: { type: String, trim: true, default: '' },
//   website: { type: String, trim: true, default: '' },
//   other: { type: String, trim: true, default: '' }
// }, { _id: false });

// const profileSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true,
//       index: true
//     },
//     name: {
//       type: String,
//       trim: true,
//       required: false,
//       default: ""
//     },
//     address: {
//       type: String,
//       trim: true,
//       required: false,
//       default: ""
//     },
//     profilePhoto: {
//       type: String,
//       default: ""
//     },
//     mobileNumber: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     socialLinks: {
//       type: socialLinksSchema,
//       default: () => ({})
//     },
//   },
//   { timestamps: true }
// );
// // Index for faster user lookups
// profileSchema.index({ userId: 1 });

// profileSchema.virtual('profile', {
//   ref: 'Profile',
//   localField: '_id',
//   foreignField: 'userId',  
//   justOne: true
// });





const mongoose = require("mongoose");
// Social Links Schema - Updated to match frontend support
const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' }, // Uncommented
  youtube: { type: String, trim: true, default: '' },
  pinterest: { type: String, trim: true, default: '' }, // Added
  snapchat: { type: String, trim: true, default: '' }, // Added
  telegram: { type: String, trim: true, default: '' }, // Added
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
      unique: true,
      index: true
    },
    // Changed 'name' to 'vendorName' to match frontend payload
    vendorName: {
      type: String,
      trim: true,
      required: false,
      default: ""
    },
    // Changed 'address' to 'businessAddress' to match frontend payload
    businessAddress: {
      type: String,
      trim: true,
      required: false,
      default: ""
    },
    profilePhoto: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    mobileNumber: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({})
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branchName: { type: String, default: '' },
      accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
      },
      upiId: { type: String, default: '' }
    },
    bio: {
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' }
}
,
    kycDetails: {
      personalInfo: {
        fullName: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' }
      },
      documentInfo: {
        documentType: { type: String, default: '' },
        frontImage: { type: String, default: '' },
        backImage: { type: String, default: '' }
      },
      bankDetails: {
        accountHolder: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifsc: { type: String, default: '' },
        bankName: { type: String, default: '' }
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      rejectionReason: { type: String, default: '' },
      submittedAt: { type: Date }
    },
  },
  { timestamps: true }
);
// Index for faster user lookups
profileSchema.index({ userId: 1 });
module.exports = mongoose.model("Profile", profileSchema);



