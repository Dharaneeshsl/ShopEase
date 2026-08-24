const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const { protect, authorizeRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, orderConfirmationEmail, orderStatusEmail } = require('../utils/sendEmail');

const router = express.Router();

const normalizeShipping = (raw = {}) => ({
  firstName: raw.firstName || '',
  lastName: raw.lastName || '',
  email: raw.email || '',
  address: raw.address || raw.street || '',
  city: raw.city || '',
  state: raw.state || '',
  country: raw.country || 'United States',
  zipCode: raw.zipCode || '',
  phoneNo: raw.phoneNo || raw.phone || '',
  phone: raw.phone || raw.phoneNo || '',
});

const buildOrderItems = async (incoming) => {
  const items = [];
  for (const item of incoming) {
    const productId = item.product || item.productId;
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error(`Product not found: ${productId}`);
      err.statusCode = 404;
      throw err;
    }
    const qty = Number(item.quantity) || 1;
    if (product.stock < qty) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    items.push({
      name: product.name,
      quantity: qty,
      image: product.images?.[0]?.url || product.image,
      price: product.price,
      product: product._id,
    });
  }
  return items;
};

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const shippingRaw = req.body.shippingInfo || req.body.shippingAddress || {};
    const shippingInfo = normalizeShipping(shippingRaw);

    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      return res.status(400).json({ success: false, message: 'Complete shipping information is required' });
    }

    let incomingItems = req.body.orderItems || req.body.items || [];
    if (!incomingItems.length) {
      const cart = await Cart.findOne({ user: req.user.id });
      if (cart && cart.items.length) {
        incomingItems = cart.items.map((i) => ({ product: i.product, quantity: i.quantity }));
      }
    }

    if (!incomingItems.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    const orderItems = await buildOrderItems(incomingItems);
    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let discount = 0;
    let couponCode;
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: String(req.body.couponCode).toUpperCase() });
      if (coupon) {
        const check = coupon.isValid(itemsPrice);
        if (!check.valid) {
          return res.status(400).json({ success: false, message: check.message });
        }
        discount = coupon.calculateDiscount(itemsPrice);
        couponCode = coupon.code;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const totals = calculateOrderTotals({ itemsPrice, discount });

    const paymentMethod = req.body.paymentMethod || 'cod';
    const paymentInfo = req.body.paymentInfo || {
      id: paymentMethod === 'cod' ? `cod_${Date.now()}` : 'pending',
      status: 'pending',
      gateway: paymentMethod,
    };

    const order = await Order.create({
      orderItems,
      user: req.user.id,
      paymentInfo,
      paymentMethod,
      paidAt: undefined,
      itemsPrice: totals.itemsPrice,
      taxPrice: totals.taxPrice,
      shippingPrice: totals.shippingPrice,
      discount: totals.discount,
      couponCode,
      totalPrice: totals.totalPrice,
      shippingInfo,
      notes: req.body.notes,
    });

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) await product.updateStock(item.quantity);
    }

    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    if (paymentMethod === 'cod') {
      await Payment.create({
        user: req.user.id,
        order: order._id,
        gateway: 'cod',
        amount: totals.totalPrice,
        status: 'pending',
        transactionId: paymentInfo.id,
      });
      try {
        await sendEmail(orderConfirmationEmail(order, req.user));
      } catch (_e) {
        /* email is optional */
      }
    }

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully',
    });
  })
);

router.get(
  '/stats',
  protect,
  authorizeRoles('admin'),
  asyncHandler(async (_req, res) => {
    const [total, revenue, byStatus] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders: total,
        revenue: revenue[0]?.total || 0,
        byStatus,
      },
    });
  })
);

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user.id };
    if (req.query.status) {
      const status = req.query.status;
      filter.orderStatus = status.charAt(0).toUpperCase() + status.slice(1);
    }

    const orders = await Order.find(filter)
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  })
);

router.get(
  '/:id/invoice',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const rows = order.orderItems
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>`
      )
      .join('');

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;padding:32px;color:#111}
  h1{color:#2563eb}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left}
  .total{font-size:18px;font-weight:700;margin-top:16px}
</style></head>
<body>
  <h1>ShopEase Invoice</h1>
  <p><strong>${order.orderNumber}</strong> · ${new Date(order.createdAt).toLocaleDateString()}</p>
  <p>Bill to: ${order.user.name} (${order.user.email})</p>
  <p>${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zipCode}</p>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <p>Subtotal: $${order.itemsPrice.toFixed(2)}</p>
  <p>Shipping: $${order.shippingPrice.toFixed(2)}</p>
  <p>Tax: $${order.taxPrice.toFixed(2)}</p>
  ${order.discount ? `<p>Discount: -$${order.discount.toFixed(2)}</p>` : ''}
  <p class="total">Total: $${order.totalPrice.toFixed(2)}</p>
  <p>Payment: ${order.paymentMethod} · ${order.paymentInfo?.status || 'pending'}</p>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  })
);

router.get(
  '/:id/tracking',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        trackingNumber: order.trackingNumber || null,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        estimatedDelivery: order.shippedAt
          ? new Date(new Date(order.shippedAt).getTime() + 4 * 24 * 60 * 60 * 1000)
          : new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images sku');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const ownerId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    res.json({ success: true, order });
  })
);

router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${order.orderStatus.toLowerCase()} order` });
    }

    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    await order.save();

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity }, inStock: true });
    }

    res.json({ success: true, order, message: 'Order cancelled' });
  })
);

router.put(
  '/:id/status',
  protect,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { status, trackingNumber } = req.body;
    const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    const normalized = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
    if (!allowed.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = normalized;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (normalized === 'Shipped') {
      order.shippedAt = new Date();
      if (!order.trackingNumber) {
        order.trackingNumber = `TRK${Date.now().toString(36).toUpperCase()}`;
      }
    }
    if (normalized === 'Delivered') {
      order.deliveredAt = new Date();
      if (!order.shippedAt) order.shippedAt = new Date();
    }
    if (normalized === 'Cancelled') order.cancelledAt = new Date();
    await order.save();

    try {
      await sendEmail(orderStatusEmail(order, order.user, normalized));
    } catch (_e) {
      /* optional */
    }

    res.json({ success: true, order });
  })
);

router.post(
  '/:id/refund',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.refund = {
      requested: true,
      reason: req.body.reason || 'Requested by customer',
      status: req.user.role === 'admin' ? 'approved' : 'requested',
      amount: req.body.amount || order.totalPrice,
      processedAt: req.user.role === 'admin' ? new Date() : undefined,
    };
    await order.save();

    res.json({ success: true, order, message: 'Refund request submitted' });
  })
);

module.exports = router;
