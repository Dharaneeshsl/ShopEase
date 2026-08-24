const express = require('express');
const { body, validationResult } = require('express-validator');
const Newsletter = require('../models/Newsletter');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/subscribe',
  [body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const existing = await Newsletter.findOne({ email: req.body.email });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
      }
      return res.json({ success: true, message: 'You are already subscribed' });
    }

    await Newsletter.create({ email: req.body.email });
    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  })
);

module.exports = router;
