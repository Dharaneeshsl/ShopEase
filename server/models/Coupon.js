const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    value: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: Number,
    expiresAt: Date,
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function (subtotal = 0) {
  if (!this.active) return { valid: false, message: 'Coupon is inactive' };
  if (this.expiresAt && this.expiresAt < new Date()) {
    return { valid: false, message: 'Coupon has expired' };
  }
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  if (subtotal < this.minPurchase) {
    return { valid: false, message: `Minimum purchase of $${this.minPurchase} required` };
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (this.type === 'percent') {
    const amount = (subtotal * this.value) / 100;
    return this.maxDiscount ? Math.min(amount, this.maxDiscount) : amount;
  }
  return Math.min(this.value, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
