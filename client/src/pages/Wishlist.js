import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { getProductImage } from '../utils/productHelpers';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist, loading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const products = wishlist?.products || [];

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error || 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!products.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Save items you love for later.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Wishlist</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{products.length} saved</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((item) => {
            const product = item.product || item;
            if (!product || !product._id) return null;
            return (
              <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <Link to={`/products/${product._id}`}>
                  <img src={getProductImage(product)} alt={product.name} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {product.name}
                  </Link>
                  <p className="text-2xl font-bold text-blue-600 my-3">${product.price}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 btn btn-primary btn-sm flex items-center justify-center gap-2"
                      disabled={product.stock === 0}
                    >
                      <FaShoppingCart /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button onClick={() => handleRemove(product._id)} className="btn btn-outline btn-sm p-2">
                      <FaTrash className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
