const mongoose = require('mongoose');
const { Schema } = mongoose;

const VehicleCategorySchema = new Schema({
  vehicleCategoryId: { type: String, unique: true, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String },
  parentCategory: { type: String, trim: true },
  displayOrder: { type: Number, default: 0 },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true }, // Must be ObjectId
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: true });

// ✅ Auto-generate vehicleCategoryId
VehicleCategorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.vehicleCategoryId) {
    try {
      const year = new Date().getFullYear();
      const prefix = `VCAT${year}`;
      
      // Get all vehicleCategoryIds for this year and extract numbers
     const vehicleCategories = await VehicleCategory.find({
  module: new mongoose.Types.ObjectId(moduleId), // ✅ Use `new`
  isActive: true
})
  .populate('brands', '-__v')
  .populate('module', '-__v')
  .sort({ createdAt: -1 })
  .lean();

      
      let nextNumber = 1;
      
      if (vehicleCategories.length > 0) {
        // Extract all numbers and find the maximum
        const numbers = vehicleCategories
          .map(cat => parseInt(cat.vehicleCategoryId.replace(prefix, ''), 10))
          .filter(num => !isNaN(num));
        
        if (numbers.length > 0) {
          const maxNumber = Math.max(...numbers);
          nextNumber = maxNumber + 1;
        }
      }
      
      const serial = String(nextNumber).padStart(3, '0');
      this.vehicleCategoryId = `${prefix}${serial}`;
      
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('VehicleCategory', VehicleCategorySchema);