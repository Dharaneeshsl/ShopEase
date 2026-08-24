const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.ObjectId, ref: 'Order' },
    gateway: { type: String, enum: ['stripe', 'paypal', 'cod'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    transactionId: String,
    clientSecret: String,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
