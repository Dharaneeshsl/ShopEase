const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  image: String,
  quantity: { type: Number, required: true, min: 1, default: 1 },
  stock: Number,
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.methods.totals = function () {
  const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const mapped = this.items.map((item) => ({
    productId: item.product,
    product: item.product,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    stock: item.stock,
    totalPrice: item.price * item.quantity,
  }));
  return { items: mapped, cart: mapped, totalItems, totalPrice };
};

module.exports = mongoose.model('Cart', cartSchema);
