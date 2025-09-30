const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategorySchema = new Schema({
  categoryId: { type: String, unique: true, required: true },
  title: { type: String, required: true, trim: true },
  image: { type: String },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true }, // ✅ single module
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: true });

CategorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.categoryId) {
    const year = new Date().getFullYear();
    const prefix = `CAT${year}`;
    const count = await mongoose.model('Category').countDocuments({
      categoryId: { $regex: `^${prefix}` },
    });
    const serial = String(count + 1).padStart(3, '0');
    this.categoryId = `${prefix}${serial}`;
  }
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
