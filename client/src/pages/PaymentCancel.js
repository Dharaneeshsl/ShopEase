import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';

const PaymentCancel = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="bg-white rounded-lg shadow-sm p-10 text-center max-w-md">
      <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
      <p className="text-gray-600 mb-6">No charge was made. You can try again whenever you are ready.</p>
      <Link to="/checkout" className="btn btn-primary">Return to checkout</Link>
    </div>
  </div>
);

export default PaymentCancel;
