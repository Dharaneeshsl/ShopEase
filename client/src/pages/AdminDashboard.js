import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProductImage } from '../utils/productHelpers';

const tabs = ['Overview', 'Orders', 'Products', 'Users', 'Coupons'];

const AdminDashboard = () => {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    name: '',
    description: 'A great product from ShopEase with quality you can trust.',
    price: 29.99,
    category: 'Other',
    stock: 10,
    brand: 'ShopEase',
    images: [{ public_id: 'manual', url: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=800' }],
  });
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: 10, minPurchase: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const [s, o, p, u, c] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/orders'),
        api.get('/admin/products'),
        api.get('/admin/users'),
        api.get('/admin/coupons'),
      ]);
      setStats(s.data.stats);
      setOrders(o.data.orders || []);
      setProducts(p.data.products || []);
      setUsers(u.data.users || []);
      setCoupons(c.data.coupons || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success('Order updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', productForm);
      toast.success('Product created');
      setProductForm({ ...productForm, name: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleUser = async (id, isBlocked) => {
    try {
      await api.put(`/admin/users/${id}`, { isBlocked });
      toast.success(isBlocked ? 'User blocked' : 'User unblocked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', couponForm);
      toast.success('Coupon created');
      setCouponForm({ code: '', type: 'percent', value: 10, minPurchase: 0 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create coupon');
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                ['Revenue', `$${(stats.revenue || 0).toFixed(2)}`],
                ['Orders', stats.orders],
                ['Products', stats.products],
                ['Customers', stats.users],
              ].map(([label, value]) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-3">Recent orders</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y">
              {(stats.recentOrders || []).map((o) => (
                <div key={o._id} className="p-4 flex justify-between">
                  <span>{o.orderNumber}</span>
                  <span>{o.orderStatus}</span>
                  <span>${Number(o.totalPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="p-3">{o.orderNumber}</td>
                    <td className="p-3">{o.user?.name || o.user?.email}</td>
                    <td className="p-3">${Number(o.totalPrice).toFixed(2)}</td>
                    <td className="p-3">{o.orderStatus}</td>
                    <td className="p-3">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="form-input"
                      >
                        {['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Products' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form onSubmit={createProduct} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-lg">New product</h2>
              <input className="form-input" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              <textarea className="form-input" rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              <input type="number" step="0.01" className="form-input" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
              <input type="number" className="form-input" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
              <select className="form-input" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                {['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary w-full">Create</button>
            </form>
            <div className="lg:col-span-2 space-y-3">
              {products.map((p) => (
                <div key={p._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center gap-4">
                  <img src={getProductImage(p)} alt="" className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-500">${p.price} · stock {p.stock}</p>
                  </div>
                  <button onClick={() => deleteProduct(p._id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y">
            {users.map((u) => (
              <div key={u.id || u._id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email} · {u.role}</p>
                </div>
                {u.role !== 'admin' && (
                  <button onClick={() => toggleUser(u.id || u._id, !u.isBlocked)} className="btn btn-outline btn-sm">
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'Coupons' && (
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={createCoupon} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-lg">New coupon</h2>
              <input className="form-input" placeholder="CODE" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required />
              <select className="form-input" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              <input type="number" className="form-input" value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })} />
              <input type="number" className="form-input" placeholder="Min purchase" value={couponForm.minPurchase} onChange={(e) => setCouponForm({ ...couponForm, minPurchase: Number(e.target.value) })} />
              <button className="btn btn-primary w-full">Create coupon</button>
            </form>
            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex justify-between">
                  <div>
                    <p className="font-semibold">{c.code}</p>
                    <p className="text-sm text-gray-500">{c.type} · {c.value} · used {c.usedCount}</p>
                  </div>
                  <button onClick={() => deleteCoupon(c._id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
