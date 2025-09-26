// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const ModuleSchema = new Schema({
//   moduleId: { type: String, unique: true, required: true },
//   title: { 
//     type: String, 
//     required: true, 
//     trim: true,
//     enum: [
//       'venue',
//       'rental',
//       'event',
//       'mehandi',
//       'photography',
//       'catering',
//       'makeup',
//       'dj',
//       'music'
//     ]
//   },
//   icon: { type: String },
//   categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
//   isActive: { type: Boolean, default: true },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   deletedAt: { type: Date }
// }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// // Auto-generate moduleId
// ModuleSchema.pre('validate', async function (next) {
//   if (this.isNew && !this.moduleId) {
//     const year = new Date().getFullYear();
//     const prefix = `MOD${year}`;
//     const count = await mongoose.model('Module').countDocuments({
//       moduleId: { $regex: `^${prefix}` },
//     });
//     const serial = String(count + 1).padStart(3, '0');
//     this.moduleId = `${prefix}${serial}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Module', ModuleSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ModuleSchema = new Schema({
  moduleId: { type: String, unique: true, required: true },
  title: { 
    type: String, 
    required: true, 
    trim: true
    // Removed enum restriction to allow any module title
  },
  icon: { type: String },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Auto-generate moduleId
ModuleSchema.pre('validate', async function (next) {
  if (this.isNew && !this.moduleId) {
    const year = new Date().getFullYear();
    const prefix = `MOD${year}`;
    const count = await mongoose.model('Module').countDocuments({
      moduleId: { $regex: `^${prefix}` },
    });
    const serial = String(count + 1).padStart(3, '0');
    this.moduleId = `${prefix}${serial}`;
  }
  next();
});

module.exports = mongoose.model('Module', ModuleSchema);
