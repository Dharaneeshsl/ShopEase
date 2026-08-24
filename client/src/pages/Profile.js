import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { getCurrentUser, updateProfile, addAddress, updateAddress, deleteAddress } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const Profile = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [newAddress, setNewAddress] = useState({
    type: 'home',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false
  });

  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    try {
      await dispatch(addAddress({
        ...newAddress,
        street: newAddress.address,
      })).unwrap();
      setShowAddAddress(false);
      setNewAddress({
        type: 'home',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        isDefault: false
      });
      toast.success('Address added successfully!');
    } catch (error) {
      toast.error(error || 'Failed to add address');
    }
  };

  const handleSaveAddress = async (addressId) => {
    try {
      await dispatch(updateAddress({ id: addressId, isDefault: true })).unwrap();
      setIsEditingAddress(null);
      toast.success('Address updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddress(addressId)).unwrap();
        toast.success('Address deleted successfully!');
      } catch (error) {
        toast.error(error || 'Failed to delete address');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'addresses', label: 'Addresses', icon: FaMapMarkerAlt }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-outline btn-sm flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        className="form-input"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="form-input"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="form-input"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary flex items-center"
                      >
                        <FaSave className="mr-2" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || ''
                          });
                        }}
                        className="btn btn-secondary flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FaUser className="text-gray-400 mr-3 w-5" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold text-gray-900">{profileData.name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaEnvelope className="text-gray-400 mr-3 w-5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaPhone className="text-gray-400 mr-3 w-5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{profileData.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Addresses</h2>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="btn btn-primary btn-sm flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Address
                  </button>
                </div>

                {/* Add New Address Form */}
                {showAddAddress && (
                  <div className="mb-6 p-6 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Address Type</label>
                        <select
                          value={newAddress.type}
                          onChange={(e) => handleAddressChange('type', e.target.value)}
                          className="form-input"
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Country</label>
                        <select
                          value={newAddress.country}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          className="form-input"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Street Address</label>
                        <input
                          type="text"
                          value={newAddress.address}
                          onChange={(e) => handleAddressChange('address', e.target.value)}
                          className="form-input"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div>
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="form-input"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="form-label">State/Province</label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="form-input"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="form-label">ZIP/Postal Code</label>
                        <input
                          type="text"
                          value={newAddress.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          className="form-input"
                          placeholder="Enter ZIP code"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => handleAddressChange('isDefault', e.target.checked)}
                            className="mr-2"
                          />
                          Set as default address
                        </label>
                      </div>
                    </div>
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={handleAddAddress}
                        className="btn btn-primary flex items-center"
                      >
                        <FaSave className="mr-2" />
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddAddress(false)}
                        className="btn btn-secondary flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Addresses List */}
                <div className="space-y-4">
                  {user?.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                                {address.type}
                              </span>
                              {address.isDefault && (
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 font-medium">{address.address || address.street}</p>
                            <p className="text-gray-600">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-gray-600">{address.country}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveAddress(address._id)}
                              className="text-blue-600 hover:text-blue-700"
                              title={isEditingAddress === address._id ? 'Saving' : 'Set as default'}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FaMapMarkerAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No addresses added yet</p>
                      <button
                        onClick={() => setShowAddAddress(true)}
                        className="btn btn-primary"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 