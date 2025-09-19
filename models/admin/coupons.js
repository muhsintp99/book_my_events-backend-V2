const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percentage','fixed_amount','free_shipping'], required: true },
  discount: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage','amount'], required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  totalUses: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true, default: Date.now },
  expireDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

CouponSchema.pre('save', function(next){
  if(this.expireDate <= this.startDate) next(new Error('Expire date must be after start date'));
  else next();
});

module.exports = mongoose.model('Coupon', CouponSchema);
