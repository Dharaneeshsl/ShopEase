import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import paymentService from '../services/paymentService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, ok: false, message: '', orderId: params.get('orderId') });

  useEffect(() => {
    const complete = async () => {
      const gateway = params.get('gateway');
      const orderId = params.get('orderId');
      const sessionId = params.get('session_id');
      const paypalToken = params.get('token');

      try {
        if (gateway === 'stripe' || sessionId) {
          if (!sessionId) throw new Error('Missing Stripe session');
          const result = await paymentService.confirmStripeSession(sessionId, orderId);
          if (!result.paid) throw new Error('Stripe payment was not completed');
          setState({ loading: false, ok: true, message: 'Payment confirmed with Stripe.', orderId: result.orderId || orderId });
          return;
        }

        if (gateway === 'paypal' || paypalToken) {
          if (!paypalToken) throw new Error('Missing PayPal token');
          const result = await paymentService.capturePayPalPayment({
            paypalOrderId: paypalToken,
            shopOrderId: orderId,
          });
          setState({ loading: false, ok: true, message: 'Payment captured with PayPal.', orderId: result.orderId || orderId });
          return;
        }

        throw new Error('No payment reference was provided.');
      } catch (err) {
        setState({
          loading: false,
          ok: false,
          message: err.message || 'We could not confirm this payment.',
          orderId,
        });
      }
    };

    complete();
  }, [params]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-sm p-10 text-center max-w-md">
        {state.ok ? (
          <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
        ) : (
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold mb-2">{state.ok ? 'Payment successful' : 'Payment not confirmed'}</h1>
        <p className="text-gray-600 mb-6">{state.message}</p>
        <div className="flex gap-3 justify-center">
          {state.orderId && (
            <button onClick={() => navigate(`/orders/${state.orderId}`)} className="btn btn-primary">
              View order
            </button>
          )}
          <Link to="/orders" className="btn btn-outline">All orders</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
