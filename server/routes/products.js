const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { upload, uploadToCloud } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      keyword,
      search,
      q,
      category,
      minPrice,
      maxPrice,
      rating,
      brand,
      featured,
      sort,
      page = 1,
      limit = 48,
    } = req.query;

    const filter = {};
    const term = keyword || search || q;
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
      ];
    }

    if (category) {
      const decoded = decodeURIComponent(category);
      const match = CATEGORIES.find((c) => c.toLowerCase() === decoded.toLowerCase());
      if (match) filter.category = match;
    }

    if (featured === 'true') filter.featured = true;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (rating) filter.ratings = { $gte: parseFloat(rating) };

    let sortObj = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { ratings: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'name':
        sortObj = { name: 1 };
        break;
      default:
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 48));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).limit(limitNum).skip(skip).populate('seller', 'name'),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalProducts: total,
        hasNextPage: skip + products.length < total,
        hasPrevPage: pageNum > 1,
      },
    });
  })
);

router.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const products = await Product.find({ featured: true }).limit(8).populate('seller', 'name');
    res.json({ success: true, products });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({
      success: true,
      categories: CATEGORIES.map((name) => ({
        name,
        count: counts.find((c) => c._id === name)?.count || 0,
      })),
    });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    req.query.keyword = req.query.q || req.query.keyword;
    const {
      keyword,
      page = 1,
      limit = 12,
    } = req.query;
    const filter = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const products = await Product.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    const total = await Product.countDocuments(filter);
    res.json({
      success: true,
      products,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  })
);

router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  upload.array('images', 6),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const payload = { ...req.body, seller: req.user.id };
    if (payload.category && !CATEGORIES.includes(payload.category)) {
      payload.category = 'Other';
    }

    if (req.files && req.files.length) {
      payload.images = await Promise.all(req.files.map((f) => uploadToCloud(f.path)));
    } else if (typeof payload.images === 'string') {
      try {
        payload.images = JSON.parse(payload.images);
      } catch (_e) {
        payload.images = [{ public_id: 'manual', url: payload.images }];
      }
    }

    if (!payload.sku) {
      payload.sku = `SE-${Date.now().toString(36).toUpperCase()}`;
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, product });
  })
);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  upload.array('images', 6),
  asyncHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = { ...req.body };
    if (req.files && req.files.length) {
      const uploaded = await Promise.all(req.files.map((f) => uploadToCloud(f.path)));
      updates.images = [...(product.images || []), ...uploaded];
    }

    if (updates.stock !== undefined) {
      updates.inStock = Number(updates.stock) > 0;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, product });
  })
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  })
);

router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 4 }).withMessage('Comment must be at least 4 characters long'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find((review) => review.user.toString() === req.user.id);
    if (alreadyReviewed) {
      alreadyReviewed.rating = Number(req.body.rating);
      alreadyReviewed.comment = req.body.comment;
    } else {
      product.reviews.push({
        user: req.user.id,
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      });
    }

    product.recalculateRating();
    await product.save();

    res.status(200).json({
      success: true,
      message: alreadyReviewed ? 'Review updated' : 'Review added successfully',
      product,
      productId: product._id,
    });
  })
);

router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, reviews: product.reviews, ratings: product.ratings, numOfReviews: product.numOfReviews });
  })
);

module.exports = router;
