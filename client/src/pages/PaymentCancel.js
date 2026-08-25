import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';

const PaymentCancel = () => {
  const [params] = useSearchParams();
  const [release, setRelease] = useState({ status: 'idle', message: '' });
  const requestedRef = useRef(false);

  useEffect(() => {
    const orderId = params.get('orderId');
    if (!orderId || requestedRef.current) return;
    requestedRef.current = true;

    let active = true;
    api
      .put(`/orders/${orderId}/cancel`, {
        reason: 'Payment cancelled at the gateway',
        ifUnpaid: true,
      })
      .then(() => {
        if (active) {
          setRelease({
            status: 'done',
            message: 'Your unpaid order was cancelled and the reserved items were released back to stock.',
          });
        }
      })
      .catch(() => {
        if (active) {
          setRelease({
            status: 'error',
            message: 'We could not auto-cancel this order (it may already be paid or cancelled). Check your orders page.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-sm p-10 text-center max-w-md">
        <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
        <p className="text-gray-600 mb-2">No charge was made. You can try again whenever you are ready.</p>
        {release.message && (
          <p
            className={`text-sm mb-6 ${
              release.status === 'done' ? 'text-green-600' : 'text-orange-500'
            }`}
          >
            {release.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link to="/products" className="btn btn-outline">Browse products</Link>
          <Link to="/orders" className="btn btn-primary">View orders</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
