import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Wishlist = () => {
    const dispatch = useDispatch();
    const { wishlist, loading } = useSelector((state) => state.wishlist || { wishlist: { products: [] }, loading: false });
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch wishlist from API
            // dispatch(fetchWishlist());
        }
    }, [dispatch, isAuthenticated]);

    const handleRemoveFromWishlist = async (productId) => {
        try {
            // dispatch(removeFromWishlist(productId));
            toast.success('Removed from wishlist');
        } catch (error) {
            toast.error('Failed to remove from wishlist');
        }
    };

    const handleAddToCart = async (product) => {
        try {
            // dispatch(addToCart({ productId: product._id, quantity: 1 }));
            toast.success('Added to cart');
        } catch (error) {
            toast.error('Failed to add to cart');
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!wishlist || wishlist.products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <FaHeart className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Your Wishlist is Empty
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Save items you love for later. Start adding products to your wishlist!
                        </p>
                        <Link to="/products" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        My Wishlist
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {wishlist.products.length} {wishlist.products.length === 1 ? 'item' : 'items'} saved
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlist.products.map((item) => (
                        <div
                            key={item.product._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                            <Link to={`/products/${item.product._id}`} className="block">
                                <div className="relative pb-[100%]">
                                    <img
                                        src={item.product.images[0]?.url || 'https://via.placeholder.com/400'}
                                        alt={item.product.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                            </Link>

                            <div className="p-4">
                                <Link
                                    to={`/products/${item.product._id}`}
                                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 mb-2"
                                >
                                    {item.product.name}
                                </Link>

                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            ${item.product.price}
                                        </span>
                                        {item.product.originalPrice && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                                                ${item.product.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAddToCart(item.product)}
                                        className="flex-1 btn btn-primary btn-sm flex items-center justify-center gap-2"
                                        disabled={item.product.stock === 0}
                                    >
                                        <FaShoppingCart />
                                        {item.product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                                        className="btn btn-outline btn-sm p-2"
                                        title="Remove from wishlist"
                                    >
                                        <FaTrash className="text-red-500" />
                                    </button>
                                </div>

                                {item.product.stock > 0 && item.product.stock < 10 && (
                                    <p className="text-xs text-orange-500 mt-2">
                                        Only {item.product.stock} left in stock!
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
