// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//   userId: { type: String, required: true, unique: true },
//   firstName: { type: String, required: true, trim: true, maxlength: 50 },
//   lastName: { type: String, required: true, trim: true, maxlength: 50 },
//   email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//   password: { type: String, required: true },
//   phone: { type: String, trim: true },
//   role: { type: String, enum: ['superadmin','admin','vendor','user'], default: 'user' },
//   otp: String,
//   otpExpire: Date,
//   isActive: { type: Boolean, default: true },
//   isVerified: { type: Boolean, default: false },
//   lastLogin: Date,
//   refreshToken: String,
//   resetPasswordToken: String,
//   resetPasswordExpire: Date
// }, { timestamps: true });

// UserSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   next();
// });

// UserSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// UserSchema.methods.toJSON = function() {
//   const obj = this.toObject();
//   delete obj.password;
//   delete obj.refreshToken;
//   delete obj.otp;
//   return obj;
// };

// module.exports = mongoose.model('User', UserSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Social Media Schema
const socialMediaSchema = new mongoose.Schema({
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  youtube: { type: String, trim: true, default: '' },
  whatsapp: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  other: { type: String, trim: true, default: '' }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  
  // Additional fields for direct storage (optional - can be used as fallback)

   profilePhoto: { 
    type: String, 
    trim: true, 
    default: "" // e.g. /Uploads/profiles/xyz.jpg
  },
  
  mobile: { 
    type: String, 
    trim: true,
    default: ''
  },
  socialMedia: { 
    type: socialMediaSchema, 
    default: () => ({}) 
  },
  
  role: { type: String, enum: ['superadmin','admin','vendor','user'], default: 'user' },
  otp: String,
  otpExpire: Date,
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ VIRTUAL POPULATE FOR PROFILE ============
UserSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Pre-save middleware for password hashing
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Custom toJSON to exclude sensitive fields
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);