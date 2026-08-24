import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaEye, FaCalendar, FaDollarSign } from 'react-icons/fa';
import { fetchOrders as fetchOrdersAction } from '../store/slices/orderSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const Orders = () => {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { orders, loading } = useSelector((state) => state.order);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchOrdersAction()).unwrap().catch(() => toast.error('Failed to fetch orders'));
    }
  }, [isAuthenticated, dispatch]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'shipped':
        return <FaTruck className="text-blue-600" />;
      case 'processing':
        return <FaBox className="text-yellow-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaBox className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const normalizeStatus = (order) =>
    (order.orderStatus || order.status || 'processing').toLowerCase();

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return normalizeStatus(order) === filter;
  });

  const orderItems = (order) => order.orderItems || order.items || [];
  const orderTotal = (order) => Number(order.totalPrice ?? order.totalAmount ?? 0);
  const shipping = (order) => order.shippingInfo || order.shippingAddress || {};
  const itemImage = (item) => item.image || item.product?.images?.[0]?.url || item.product?.image;
  const itemName = (item) => item.name || item.product?.name;
  const itemPrice = (item) => Number(item.price ?? item.product?.price ?? 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h2>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your order history and status</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Orders' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600 mb-8">
              {filter === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`
              }
            </p>
            {filter === 'all' && (
              <Link to="/products" className="btn btn-primary btn-lg">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {getStatusIcon(normalizeStatus(order))}
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(normalizeStatus(order))}`}>
                          {getStatusText(normalizeStatus(order))}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${orderTotal(order).toFixed(2)}</p>
                      <p className="text-sm text-gray-600 capitalize">{order.paymentInfo?.status || order.paymentStatus || order.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {orderItems(order).map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <img
                          src={itemImage(item)}
                          alt={itemName(item)}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{itemName(item)}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${itemPrice(item).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                        <div className="text-sm text-gray-600">
                          <p>{shipping(order).address}</p>
                          <p>
                            {shipping(order).city}, {shipping(order).state} {shipping(order).zipCode}
                          </p>
                          <p>{shipping(order).country}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Order Timeline</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <FaCalendar className="text-gray-400 mr-2" />
                            <span className="text-gray-600">
                              Ordered: {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {order.shippedAt && (
                            <div className="flex items-center">
                              <FaTruck className="text-blue-600 mr-2" />
                              <span className="text-gray-600">
                                Shipped: {new Date(order.shippedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {order.deliveredAt && (
                            <div className="flex items-center">
                              <FaCheckCircle className="text-green-600 mr-2" />
                              <span className="text-gray-600">
                                Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-outline btn-sm flex items-center"
                      >
                        <FaEye className="mr-2" />
                        View Details
                      </Link>
                      {normalizeStatus(order) === 'delivered' && (
                        <button className="btn btn-outline btn-sm">
                          Write Review
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaDollarSign className="text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        Total: ${orderTotal(order).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders; 