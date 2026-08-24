import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaLock, FaMapMarkerAlt, FaPaypal } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import paymentService from '../services/paymentService';
import { getCurrentUser } from '../store/slices/authSlice';
import { clearCart, fetchCart } from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/orderSlice';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [gatewayConfig, setGatewayConfig] = useState({ stripeEnabled: false, paypalEnabled: false });
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const { items, totalItems, totalPrice, loading } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    paymentService.getConfig().then(setGatewayConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchCart());
    dispatch(getCurrentUser());
    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || prev.phone,
      }));
    }
  }, [dispatch, isAuthenticated, navigate, user]);

  useEffect(() => {
    if (items.length === 0 && !loading && !isProcessing) {
      navigate('/cart');
    }
  }, [items, loading, navigate, isProcessing]);

  const handleShippingChange = (field, value) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateShipping = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingInfo[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, subtotal: totalPrice });
      setCouponDiscount(data.coupon.discount);
      toast.success(`Coupon ${data.coupon.code} applied`);
    } catch (err) {
      setCouponDiscount(0);
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const subtotal = totalPrice;
  const tax = Math.max(0, subtotal - couponDiscount) * 0.1;
  const shipping = subtotal - couponDiscount >= 100 ? 0 : 10;
  const total = Math.max(0, subtotal + tax + shipping - couponDiscount);

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'stripe' && !gatewayConfig.stripeEnabled) {
      toast.error('Card payments are not configured yet.');
      return;
    }
    if (paymentMethod === 'paypal' && !gatewayConfig.paypalEnabled) {
      toast.error('PayPal is not configured yet.');
      return;
    }

    setIsProcessing(true);
    try {
      const order = await dispatch(
        createOrder({
          items: items.map((item) => ({
            productId: item.productId || item.product,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingInfo: {
            ...shippingInfo,
            phoneNo: shippingInfo.phone,
          },
          paymentMethod,
          couponCode: couponDiscount ? couponCode : undefined,
        })
      ).unwrap();

      if (paymentMethod === 'cod') {
        dispatch(clearCart());
        toast.success('Order placed. Pay on delivery.');
        navigate(`/orders/${order._id}`);
        return;
      }

      if (paymentMethod === 'stripe') {
        const session = await paymentService.createStripeCheckoutSession({
          orderId: order._id,
          amount: order.totalPrice,
          currency: 'usd',
          description: `ShopEase ${order.orderNumber}`,
        });
        window.location.assign(session.url);
        return;
      }

      const paypal = await paymentService.createPayPalOrder({
        orderId: order._id,
        amount: order.totalPrice,
        currency: 'USD',
      });
      if (!paypal.approvalUrl) {
        throw new Error('PayPal did not return a checkout URL');
      }
      window.location.assign(paypal.approvalUrl);
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase securely</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-blue-600" /> Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ['firstName', 'First Name'],
                      ['lastName', 'Last Name'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['address', 'Address'],
                      ['city', 'City'],
                      ['state', 'State'],
                      ['zipCode', 'ZIP Code'],
                    ].map(([field, label]) => (
                      <div key={field} className={field === 'address' ? 'md:col-span-2' : ''}>
                        <label className="form-label">{label}</label>
                        <input
                          type={field === 'email' ? 'email' : 'text'}
                          value={shippingInfo[field]}
                          onChange={(e) => handleShippingChange(field, e.target.value)}
                          className="form-input"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="form-label">Country</label>
                      <select
                        value={shippingInfo.country}
                        onChange={(e) => handleShippingChange('country', e.target.value)}
                        className="form-input"
                      >
                        <option>United States</option>
                        <option>Canada</option>
                        <option>United Kingdom</option>
                        <option>Australia</option>
                        <option>India</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <FaCreditCard className="mr-2 text-blue-600" /> Payment Method
                  </h2>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded-lg ${!gatewayConfig.stripeEnabled ? 'opacity-60' : ''}`}>
                      <input
                        type="radio"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        disabled={!gatewayConfig.stripeEnabled}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FaCreditCard className="mr-2" />
                      Credit / Debit card via Stripe
                      {!gatewayConfig.stripeEnabled && <span className="ml-2 text-xs text-gray-500">(not configured)</span>}
                    </label>
                    <label className={`flex items-center p-4 border rounded-lg ${!gatewayConfig.paypalEnabled ? 'opacity-60' : ''}`}>
                      <input
                        type="radio"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        disabled={!gatewayConfig.paypalEnabled}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FaPaypal className="mr-2" />
                      PayPal
                      {!gatewayConfig.paypalEnabled && <span className="ml-2 text-xs text-gray-500">(not configured)</span>}
                    </label>
                    <label className="flex items-center p-4 border rounded-lg">
                      <input
                        type="radio"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      Cash on Delivery
                    </label>
                  </div>
                  {paymentMethod === 'stripe' && (
                    <p className="text-sm text-gray-600 mt-4">You will be redirected to Stripe Checkout to pay securely. We never store card numbers.</p>
                  )}
                  {paymentMethod === 'paypal' && (
                    <p className="text-sm text-gray-600 mt-4">You will be redirected to PayPal to approve this payment.</p>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="font-semibold">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                    <p className="text-gray-600">{shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                    <p className="text-gray-600 mt-2 capitalize">Payment: {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</p>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded mr-3" />
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold">${Number(item.totalPrice || item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {currentStep > 1 && (
                  <button onClick={() => setCurrentStep((s) => s - 1)} className="btn btn-outline">Previous</button>
                )}
                {currentStep < 3 ? (
                  <button
                    onClick={() => {
                      if (currentStep === 1 && !validateShipping()) return;
                      setCurrentStep((s) => s + 1);
                    }}
                    className="btn btn-primary ml-auto"
                  >
                    Continue
                  </button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={isProcessing} className="btn btn-primary btn-lg ml-auto flex items-center">
                    {isProcessing ? <><LoadingSpinner size="sm" /><span className="ml-2">Processing...</span></> : <><FaLock className="mr-2" />Place Order</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal ({totalItems} items)</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-semibold text-green-600">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-semibold">${tax.toFixed(2)}</span></div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-${couponDiscount.toFixed(2)}</span></div>
                )}
                <div className="flex gap-2 pt-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="form-input flex-1" />
                  <button type="button" onClick={applyCoupon} className="btn btn-outline btn-sm">Apply</button>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
