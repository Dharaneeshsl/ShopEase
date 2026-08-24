const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [140, 'Product name cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [4000, 'Description cannot exceed 4000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'],
    },
    subcategory: { type: String, trim: true },
    brand: { type: String, trim: true },
    images: [
      {
        public_id: { type: String, default: 'seed' },
        url: { type: String, required: true },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: { type: String, unique: true, sparse: true, trim: true },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numOfReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    tags: [String],
    features: [String],
    specifications: { type: Map, of: String },
    featured: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    seller: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('image').get(function () {
  if (this.images && this.images.length > 0) return this.images[0].url;
  return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600';
});

productSchema.virtual('rating').get(function () {
  return this.ratings;
});

productSchema.virtual('numReviews').get(function () {
  return this.numOfReviews;
});

productSchema.virtual('oldPrice').get(function () {
  return this.originalPrice;
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: 1, ratings: -1 });

productSchema.methods.recalculateRating = function () {
  if (!this.reviews.length) {
    this.ratings = 0;
    this.numOfReviews = 0;
  } else {
    this.numOfReviews = this.reviews.length;
    this.ratings =
      Math.round(
        (this.reviews.reduce((acc, item) => acc + item.rating, 0) / this.reviews.length) * 10
      ) / 10;
  }
};

productSchema.methods.updateStock = async function (quantity) {
  this.stock = Math.max(0, this.stock - quantity);
  this.inStock = this.stock > 0;
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);
