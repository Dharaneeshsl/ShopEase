const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const { protect, authorizeRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      users,
      products,
      orders,
      revenueAgg,
      monthlyAgg,
      statusAgg,
      recentOrders,
      lowStock,
      payments,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
      Product.find({ stock: { $lte: 8 } }).sort({ stock: 1 }).limit(8).select('name stock price category images'),
      Payment.countDocuments({ status: 'succeeded' }),
    ]);

    const categorySales = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'prod',
        },
      },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$prod.category',
          sales: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          units: { $sum: '$orderItems.quantity' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        users,
        products,
        orders,
        payments,
        revenue: revenueAgg[0]?.total || 0,
        monthlyRevenue: monthlyAgg[0]?.total || 0,
        monthlyOrders: monthlyAgg[0]?.count || 0,
        byStatus: statusAgg,
        categorySales,
        recentOrders,
        lowStock,
      },
    });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const q = req.query.q
      ? { $or: [{ name: { $regex: req.query.q, $options: 'i' } }, { email: { $regex: req.query.q, $options: 'i' } }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(q),
    ]);
    res.json({
      success: true,
      users: users.map((u) => u.toSafeObject()),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.isBlocked !== undefined) updates.isBlocked = req.body.isBlocked;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeObject() });
  })
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status.charAt(0).toUpperCase() + req.query.status.slice(1);
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) || 1 });
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(),
    ]);
    res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) || 1 });
  })
);

router.get(
  '/coupons',
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  })
);

router.post(
  '/coupons',
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.create({
      code: String(req.body.code || '').toUpperCase(),
      description: req.body.description,
      type: req.body.type || 'percent',
      value: req.body.value,
      minPurchase: req.body.minPurchase || 0,
      maxDiscount: req.body.maxDiscount,
      expiresAt: req.body.expiresAt,
      usageLimit: req.body.usageLimit || 0,
      active: req.body.active !== false,
    });
    res.status(201).json({ success: true, coupon });
  })
);

router.put(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  })
);

router.delete(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await coupon.deleteOne();
    res.json({ success: true, message: 'Coupon deleted' });
  })
);

module.exports = router;
