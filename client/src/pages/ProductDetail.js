import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo } from 'react-icons/fa';
import { fetchProductById, addProductReview } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { getProductImages } from '../utils/productHelpers';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  const { currentProduct, loading } = useSelector((state) => state.product);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await dispatch(addToCart({
        productId: currentProduct._id,
        quantity: quantity
      })).unwrap();
      toast.success('Item added to cart successfully!');
    } catch (err) {
      toast.error(err || 'Could not add to cart');
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save items');
      navigate('/login');
      return;
    }
    try {
      await dispatch(addToWishlist(currentProduct._id)).unwrap();
      toast.success('Saved to wishlist');
    } catch (err) {
      toast.error(err || 'Could not add to wishlist');
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add a review');
      return;
    }

    dispatch(addProductReview({
      productId: currentProduct._id,
      reviewData
    }));
    setShowReviewForm(false);
    setReviewData({ rating: 5, comment: '' });
    toast.success('Review added successfully!');
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= currentProduct?.stock) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-blue-600"
              >
                Home
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <button
                  onClick={() => navigate('/products')}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Products
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{currentProduct.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 w-full">
              <img
                src={getProductImages(currentProduct)[selectedImage]?.url}
                alt={currentProduct.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            
            {/* Thumbnail Images */}
            {getProductImages(currentProduct).length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {getProductImages(currentProduct).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-w-1 aspect-h-1 w-full rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${currentProduct.name} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentProduct.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(currentProduct.ratings || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 ml-2">
                  {currentProduct.ratings?.toFixed(1) || 0} ({currentProduct.numOfReviews || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${currentProduct.price}
                </span>
                {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through ml-2">
                      ${currentProduct.originalPrice}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold ml-2">
                      -{Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                {currentProduct.stock > 0 ? (
                  <span className="text-green-600 font-semibold">
                    In Stock ({currentProduct.stock} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {currentProduct.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Category:</span>
                <p className="font-semibold">{currentProduct.category}</p>
              </div>
              {currentProduct.brand && (
                <div>
                  <span className="text-gray-600">Brand:</span>
                  <p className="font-semibold">{currentProduct.brand}</p>
                </div>
              )}
              {currentProduct.sku && (
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <p className="font-semibold">{currentProduct.sku}</p>
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            {currentProduct.stock > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-16 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentProduct.stock}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn btn-primary btn-lg flex items-center justify-center"
                  >
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
                  </button>
                  <button onClick={handleWishlist} className="btn btn-outline btn-lg">
                    <FaHeart className="mr-2" />
                    Wishlist
                  </button>
                  <button className="btn btn-outline btn-lg">
                    <FaShare className="mr-2" />
                    Share
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <FaTruck className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Free Shipping</span>
                </div>
                <div className="flex items-center">
                  <FaShieldAlt className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="flex items-center">
                  <FaUndo className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews ({currentProduct.numOfReviews || 0})
            </h2>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-lg p-6 mb-8 border">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className="text-2xl"
                      >
                        <FaStar
                          className={`${
                            star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    rows={4}
                    className="form-input"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="btn btn-primary">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {currentProduct.reviews && currentProduct.reviews.length > 0 ? (
              currentProduct.reviews.map((review, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold">{review.name}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 