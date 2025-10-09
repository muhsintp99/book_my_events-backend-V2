

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Counter schema for generating unique serial numbers
const CounterSchema = new Schema({
  _id: String, // sequence name (year prefix)
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', CounterSchema);

// ✅ SecondaryModule schema (no enum restriction now)
const SecondaryModuleSchema = new Schema({
  moduleId: { type: String, unique: true, required: true },
  title: { type: String, required: true, trim: true },
  icon: { type: String },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date }
}, { timestamps: true });

// Auto-generate moduleId safely using counter
SecondaryModuleSchema.pre('validate', async function (next) {
  if (this.isNew && !this.moduleId) {
    const year = new Date().getFullYear();
    const prefix = `SECMOD${year}`;
    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const serial = String(counter.seq).padStart(3, '0');
    this.moduleId = `${prefix}${serial}`;
  }
  next();
});

module.exports = mongoose.model('SecondaryModule', SecondaryModuleSchema);
