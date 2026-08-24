const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, passwordResetEmail } = require('../utils/sendEmail');

const router = express.Router();

const formatErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
    return true;
  }
  return false;
};

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  asyncHandler(async (req, res) => {
    if (formatErrors(req, res)) return;

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject(),
      message: 'Registration successful',
    });
  })
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  asyncHandler(async (req, res) => {
    if (formatErrors(req, res)) return;

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: user.toSafeObject(),
      message: 'Login successful',
    });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: user.toSafeObject(),
    });
  })
);

router.post('/logout', protect, (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')],
  asyncHandler(async (req, res) => {
    if (formatErrors(req, res)) return;

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail(passwordResetEmail(user, resetUrl));
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl }),
    });
  })
);

router.put(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')],
  asyncHandler(async (req, res) => {
    if (formatErrors(req, res)) return;

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: user.toSafeObject(),
      message: 'Password reset successful',
    });
  })
);

router.put(
  '/update-password',
  protect,
  [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    if (formatErrors(req, res)) return;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  })
);

module.exports = router;
