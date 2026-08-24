import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../store/slices/authSlice';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      toast.success('Password updated. You are now signed in.');
      navigate('/');
    } catch (err) {
      toast.error(err || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="New password"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="form-input"
            placeholder="Confirm password"
          />
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Updating...' : 'Reset password'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
