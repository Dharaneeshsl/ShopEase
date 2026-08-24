const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const respondCart = (res, cart, message) => {
  const totals = cart.totals();
  res.json({
    success: true,
    message,
    ...totals,
  });
};

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user.id);
    respondCart(res, cart);
  })
);

const addItemHandler = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  const productId = req.body.productId || req.body.product;
  const quantity = parseInt(req.body.quantity, 10) || 1;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ success: false, message: 'Valid product ID is required' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const cart = await getOrCreateCart(req.user.id);
  const existing = cart.items.find((item) => item.product.toString() === productId);
  const nextQty = (existing ? existing.quantity : 0) + quantity;

  if (product.stock < nextQty) {
    return res.status(400).json({ success: false, message: 'Insufficient stock' });
  }

  const image = product.images?.[0]?.url || product.image;
  if (existing) {
    existing.quantity = nextQty;
    existing.price = product.price;
    existing.stock = product.stock;
    existing.name = product.name;
    existing.image = image;
  } else {
    cart.items.push({
      product: productId,
      name: product.name,
      price: product.price,
      image,
      quantity,
      stock: product.stock,
    });
  }

  await cart.save();
  respondCart(res, cart, 'Item added to cart successfully');
});

router.post('/', protect, [body('quantity').optional().isInt({ min: 1 })], addItemHandler);
router.post('/add', protect, [body('quantity').optional().isInt({ min: 1 })], addItemHandler);

const updateItemHandler = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const quantity = parseInt(req.body.quantity, 10);

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock' });
  }

  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found in cart' });
  }

  item.quantity = quantity;
  item.price = product.price;
  item.stock = product.stock;
  await cart.save();
  respondCart(res, cart, 'Cart updated successfully');
});

router.put('/:productId', protect, updateItemHandler);
router.put('/update/:productId', protect, updateItemHandler);

const removeItemHandler = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  respondCart(res, cart, 'Item removed from cart successfully');
});

router.delete('/remove/:productId', protect, removeItemHandler);
router.delete('/clear', protect, asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = [];
  await cart.save();
  respondCart(res, cart, 'Cart cleared successfully');
}));

router.delete(
  '/:productId',
  protect,
  asyncHandler(async (req, res) => {
    if (req.params.productId === 'clear') {
      const cart = await getOrCreateCart(req.user.id);
      cart.items = [];
      await cart.save();
      return respondCart(res, cart, 'Cart cleared successfully');
    }
    return removeItemHandler(req, res);
  })
);

router.delete(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();
    respondCart(res, cart, 'Cart cleared successfully');
  })
);

module.exports = router;
