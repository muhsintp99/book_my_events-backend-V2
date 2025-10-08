const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategorySchema = new Schema({
  categoryId: { type: String, unique: true, required: true },
  title: { type: String, required: true, trim: true },
  image: { type: String },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: true });

// ✅ FIXED: Robust ID generation with proper sorting
CategorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.categoryId) {
    try {
      const year = new Date().getFullYear();
      const prefix = `CAT${year}`;
      
      // Get all categoryIds for this year and extract numbers
      const categories = await mongoose.model('Category')
        .find({ categoryId: { $regex: `^${prefix}` } })
        .select('categoryId')
        .lean();
      
      let nextNumber = 1;
      
      if (categories.length > 0) {
        // Extract all numbers and find the maximum
        const numbers = categories
          .map(cat => parseInt(cat.categoryId.replace(prefix, ''), 10))
          .filter(num => !isNaN(num));
        
        if (numbers.length > 0) {
          const maxNumber = Math.max(...numbers);
          nextNumber = maxNumber + 1;
        }
      }
      
      const serial = String(nextNumber).padStart(3, '0');
      this.categoryId = `${prefix}${serial}`;
      
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Category', CategorySchema);