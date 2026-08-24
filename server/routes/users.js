const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloud } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user: user.toSafeObject() });
  })
);

router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.addresses) updates.addresses = req.body.addresses;

    if (req.file) {
      updates.avatar = await uploadToCloud(req.file.path, 'shopease/avatars');
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: user.toSafeObject(), message: 'Profile updated successfully' });
  })
);

router.post(
  '/addresses',
  protect,
  [
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
    body('country').optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const street = req.body.street || req.body.address;
    if (!street) {
      return res.status(400).json({ success: false, message: 'Street address is required' });
    }

    const user = await User.findById(req.user.id);
    const isDefault = req.body.isDefault || user.addresses.length === 0;
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      type: req.body.type || 'home',
      street,
      address: street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      country: req.body.country || 'United States',
      phone: req.body.phone,
      isDefault,
    });

    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses, user: user.toSafeObject() });
  })
);

router.put(
  '/addresses/:addressId',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const street = req.body.street || req.body.address;
    if (street) {
      address.street = street;
      address.address = street;
    }
    ['type', 'city', 'state', 'zipCode', 'country', 'phone', 'isDefault'].forEach((field) => {
      if (req.body[field] !== undefined) address[field] = req.body[field];
    });

    if (address.isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== address._id.toString()) addr.isDefault = false;
      });
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses, user: user.toSafeObject() });
  })
);

router.delete(
  '/addresses/:addressId',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    address.deleteOne();
    await user.save();
    res.json({ success: true, addresses: user.addresses, user: user.toSafeObject() });
  })
);

module.exports = router;
