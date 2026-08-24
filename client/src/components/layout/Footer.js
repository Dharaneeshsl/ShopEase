import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">ShopEase</span>
            </div>
            <p className="text-gray-300 mb-4">
              Your one-stop destination for everyday essentials. Competitive prices, secure checkout, and fast delivery.
            </p>
            <div className="flex space-x-4 mt-2">
              <a href="https://facebook.com" className="text-gray-400 hover:text-white" aria-label="Facebook"><FaFacebook /></a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://instagram.com" className="text-gray-400 hover:text-white" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://linkedin.com" className="text-gray-400 hover:text-white" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/products" className="hover:underline">All products</Link></li>
              <li><Link to="/cart" className="hover:underline">Cart</Link></li>
              <li><Link to="/wishlist" className="hover:underline">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:underline">Login</Link></li>
              <li><Link to="/register" className="hover:underline">Register</Link></li>
              <li><Link to="/orders" className="hover:underline">Orders</Link></li>
              <li><Link to="/profile" className="hover:underline">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              {['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty'].map((c) => (
                <li key={c}>
                  <Link to={`/products?category=${encodeURIComponent(c)}`} className="hover:underline">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-10">© {new Date().getFullYear()} ShopEase. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
