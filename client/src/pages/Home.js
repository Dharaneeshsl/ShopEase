import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaShoppingCart, FaHeart, FaArrowRight, FaTruck, FaShieldAlt, FaUndo, FaHeadset } from 'react-icons/fa';
import { fetchProducts } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { getProductImage, getProductRating, getProductReviewCount } from '../utils/productHelpers';

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.auth);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories] = useState([
    { id: 1, name: 'Electronics', icon: '📱', color: 'bg-blue-500' },
    { id: 2, name: 'Clothing', icon: '👕', color: 'bg-pink-500' },
    { id: 3, name: 'Home & Garden', icon: '🏠', color: 'bg-green-500' },
    { id: 4, name: 'Sports', icon: '⚽', color: 'bg-orange-500' },
    { id: 5, name: 'Books', icon: '📚', color: 'bg-purple-500' },
    { id: 6, name: 'Toys', icon: '🎮', color: 'bg-red-500' }
  ]);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 48, featured: 'true' }));
  }, [dispatch]);

  useEffect(() => {
    if (products.length > 0) {
      // Get featured products (first 8 products)
      setFeaturedProducts(products.slice(0, 8));
    }
  }, [products]);

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err || 'Could not add to cart');
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!user) {
      toast.error('Please login to save items');
      return;
    }
    try {
      await dispatch(addToWishlist(product._id)).unwrap();
      toast.success('Saved to wishlist');
    } catch (err) {
      toast.error(err || 'Could not add to wishlist');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => dispatch(fetchProducts({ limit: 48 }))}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Welcome to <span className="text-yellow-300">ShopEase</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Discover amazing products at unbeatable prices. Shop with confidence and enjoy fast, secure delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/products" 
                  className="btn btn-primary btn-lg flex items-center justify-center"
                >
                  Shop Now
                  <FaArrowRight className="ml-2" />
                </Link>
                <Link 
                  to="/products?category=Electronics" 
                  className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Browse Electronics
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-full h-96 bg-white/10 rounded-lg backdrop-blur-sm"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛍️</div>
                    <p className="text-xl font-semibold">Your Shopping Destination</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTruck className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free shipping on orders over $50</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-2xl text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure payment processing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUndo className="text-2xl text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Returns</h3>
              <p className="text-gray-600">30-day return policy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeadset className="text-2xl text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round the clock customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                  <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 text-2xl`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of the best products
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleAddToWishlist(product)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <FaHeart className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(getProductRating(product))
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      ({getProductReviewCount(product)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price}
                    </span>
                    {(product.oldPrice || product.originalPrice) && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.oldPrice || product.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 btn btn-primary btn-sm flex items-center justify-center"
                    >
                      <FaShoppingCart className="mr-2" />
                      Add to Cart
                    </button>
                    <Link
                      to={`/products/${product._id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="btn btn-primary btn-lg"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest updates on new products, special offers, and exclusive deals.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
};

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const api = (await import('../services/api')).default;
      await api.post('/newsletter/subscribe', { email });
      toast.success('You are subscribed!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not subscribe');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={subscribe} className="max-w-md mx-auto flex gap-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? 'Saving...' : 'Subscribe'}
      </button>
    </form>
  );
};

export default Home; 