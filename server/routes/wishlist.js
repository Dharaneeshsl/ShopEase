const express = require('express');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const getOrCreate = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
    wishlist = await wishlist.populate('products.product');
  }
  return wishlist;
};

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const wishlist = await getOrCreate(req.user.id);
    res.json({ success: true, wishlist, products: wishlist.products });
  })
);

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const productId = req.body.productId || req.body.product;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $setOnInsert: { user: req.user.id } },
      { upsert: true, new: true }
    );

    const exists = wishlist.products.some((p) => p.product.toString() === productId);
    if (!exists) {
      wishlist.products.push({ product: productId });
      await wishlist.save();
    }

    const populated = await wishlist.populate('products.product');
    res.json({
      success: true,
      message: exists ? 'Already in wishlist' : 'Added to wishlist',
      wishlist: populated,
    });
  })
);

router.post(
  '/:productId',
  protect,
  asyncHandler(async (req, res) => {
    req.body.productId = req.params.productId;
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $setOnInsert: { user: req.user.id } },
      { upsert: true, new: true }
    );
    const exists = wishlist.products.some((p) => p.product.toString() === req.params.productId);
    if (!exists) {
      wishlist.products.push({ product: req.params.productId });
      await wishlist.save();
    }
    const populated = await wishlist.populate('products.product');
    res.json({ success: true, wishlist: populated });
  })
);

router.delete(
  '/:productId',
  protect,
  asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.json({ success: true, wishlist: { products: [] } });
    }
    wishlist.products = wishlist.products.filter((p) => p.product.toString() !== req.params.productId);
    await wishlist.save();
    const populated = await wishlist.populate('products.product');
    res.json({ success: true, message: 'Removed from wishlist', wishlist: populated });
  })
);

router.post(
  '/:productId/cart',
  protect,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < 1) return res.status(400).json({ success: false, message: 'Out of stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (existing) existing.quantity += 1;
    else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url,
        quantity: 1,
        stock: product.stock,
      });
    }
    await cart.save();
    res.json({ success: true, message: 'Moved to cart', cart: cart.totals() });
  })
);

module.exports = router;
