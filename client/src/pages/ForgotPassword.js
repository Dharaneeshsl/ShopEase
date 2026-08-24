import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../store/slices/authSlice';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(forgotPassword(email)).unwrap();
      toast.success(result.message || 'Reset link sent if the email exists');
      if (result.resetUrl) {
        toast.info('Dev reset link is in the API response — check the network tab or use the token below.');
      }
    } catch (err) {
      toast.error(err || 'Could not send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
        <p className="text-gray-600 mb-6">Enter your email and we will send a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
