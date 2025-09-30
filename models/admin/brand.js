const mongoose = require('mongoose');
const { Schema } = mongoose;

const BrandSchema = new Schema({
  brandId: { type: String, unique: true, required: true },
  title: { type: String, required: true, trim: true },
  icon: { type: String }, // we keep this instead of "image" if you prefer
  isActive: { type: Boolean, default: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true }, // ✅ single reference
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: true });

// Auto-generate brandId (BRD2025001)
BrandSchema.pre('validate', async function (next) {
  if (this.isNew && !this.brandId) {
    const year = new Date().getFullYear();
    const prefix = `BRD${year}`;
    const count = await mongoose.model('Brand').countDocuments({
      brandId: { $regex: `^${prefix}` },
    });
    const serial = String(count + 1).padStart(3, '0');
    this.brandId = `${prefix}${serial}`;
  }
  next();
});

module.exports = mongoose.model('Brand', BrandSchema);
