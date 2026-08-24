const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cod', 'card'],
      default: 'stripe',
    },
    paymentInfo: {
      id: { type: String, default: 'pending' },
      status: { type: String, default: 'pending' },
      gateway: String,
    },
    paidAt: Date,
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    totalPrice: { type: Number, required: true, default: 0 },
    orderStatus: {
      type: String,
      required: true,
      default: 'Processing',
      enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    },
    deliveredAt: Date,
    shippedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    trackingNumber: String,
    refund: {
      requested: { type: Boolean, default: false },
      reason: String,
      status: { type: String, enum: ['none', 'requested', 'approved', 'rejected', 'refunded'], default: 'none' },
      amount: Number,
      processedAt: Date,
    },
    shippingInfo: {
      firstName: String,
      lastName: String,
      email: String,
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      phoneNo: String,
      phone: String,
    },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.virtual('status').get(function () {
  return (this.orderStatus || 'Processing').toLowerCase();
});

orderSchema.virtual('totalAmount').get(function () {
  return this.totalPrice;
});

orderSchema.virtual('items').get(function () {
  return this.orderItems;
});

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${year}-${rand}`;
  }
  if (this.shippingInfo && !this.shippingInfo.phoneNo && this.shippingInfo.phone) {
    this.shippingInfo.phoneNo = this.shippingInfo.phone;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
