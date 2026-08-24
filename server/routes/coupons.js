const express = require('express');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/validate',
  protect,
  asyncHandler(async (req, res) => {
    const code = String(req.body.code || req.query.code || '').toUpperCase().trim();
    const subtotal = Number(req.body.subtotal || req.body.amount || 0);

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const check = coupon.isValid(subtotal);
    if (!check.valid) {
      return res.status(400).json({ success: false, message: check.message });
    }

    const discount = coupon.calculateDiscount(subtotal);
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        description: coupon.description,
      },
    });
  })
);

router.get(
  '/:code',
  protect,
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findOne({ code: String(req.params.code).toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    const check = coupon.isValid(Number(req.query.subtotal || 0));
    res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, valid: check.valid, message: check.message });
  })
);

module.exports = router;
