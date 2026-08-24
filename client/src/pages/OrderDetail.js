import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaCreditCard,
  FaPrint,
  FaDownload,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import { fetchOrderById, cancelOrder } from '../store/slices/orderSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { currentOrder: order, loading } = useSelector((state) => state.order);

  useEffect(() => {
    if (isAuthenticated && id) {
      dispatch(fetchOrderById(id)).unwrap().catch(() => toast.error('Failed to fetch order details'));
    }
  }, [isAuthenticated, id, dispatch]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'shipped':
        return <FaTruck className="text-blue-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaBox className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    const map = {
      delivered: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-purple-100 text-purple-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view order details</h2>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loading ? <LoadingSpinner size="lg" /> : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Order not found</h2>
            <button onClick={() => navigate('/orders')} className="btn btn-primary">Back to Orders</button>
          </div>
        )}
      </div>
    );
  }

  const status = (order.orderStatus || 'Processing').toLowerCase();
  const items = order.orderItems || [];
  const ship = order.shippingInfo || {};
  const total = Number(order.totalPrice || 0);
  const subtotal = Number(order.itemsPrice || 0);
  const tax = Number(order.taxPrice || 0);
  const shipping = Number(order.shippingPrice || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/orders')} className="mr-4 text-gray-600 hover:text-blue-600">
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
              <p className="text-gray-600">{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => window.print()} className="btn btn-outline btn-sm flex items-center">
              <FaPrint className="mr-2" /> Print
            </button>
            <button
              onClick={() => window.open(`${API_BASE_URL}/orders/${id}/invoice?token=${localStorage.getItem('token') || ''}`, '_blank')}
              className="btn btn-outline btn-sm flex items-center"
            >
              <FaDownload className="mr-2" /> Invoice
            </button>
            {status === 'processing' && (
              <button
                onClick={async () => {
                  if (!window.confirm('Cancel this order?')) return;
                  try {
                    await dispatch(cancelOrder({ id, reason: 'Cancelled by customer' })).unwrap();
                    toast.success('Order cancelled');
                  } catch (err) {
                    toast.error(err || 'Could not cancel');
                  }
                }}
                className="btn btn-danger btn-sm"
              >
                Cancel order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Order Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(status)}`}>
                  {getStatusIcon(status)} {order.orderStatus}
                </span>
              </div>
              <div className="grid grid-cols-3 text-center text-sm">
                <div>
                  <p className="text-gray-500">Ordered</p>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Shipped</p>
                  <p>{order.shippedAt ? new Date(order.shippedAt).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Delivered</p>
                  <p>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              {order.trackingNumber && (
                <p className="mt-4 text-sm">Tracking: <strong>{order.trackingNumber}</strong></p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Items</h2>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-600" /> Shipping
              </h2>
              <p className="font-semibold">{ship.firstName} {ship.lastName}</p>
              <p>{ship.address}</p>
              <p>{ship.city}, {ship.state} {ship.zipCode}</p>
              <p>{ship.country}</p>
              <p>{ship.phoneNo || ship.phone}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${Number(order.discount).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center"><FaCreditCard className="mr-2 text-blue-600" /> Payment</h2>
              <p className="capitalize">{order.paymentMethod}</p>
              <p className="text-sm text-gray-600">{order.paymentInfo?.status || 'pending'}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
              <p className="flex items-center text-sm mb-2"><FaPhone className="mr-2 text-blue-600" /> 1-800-123-4567</p>
              <p className="flex items-center text-sm"><FaEnvelope className="mr-2 text-blue-600" /> support@shopease.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
