const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    street: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'United States' },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

addressSchema.pre('validate', function (next) {
  if (!this.street && this.address) this.street = this.address;
  if (!this.address && this.street) this.address = this.street;
  next();
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      public_id: { type: String, default: '' },
      url: { type: String, default: 'https://ui-avatars.com/api/?name=ShopEase+User&background=2563eb&color=fff' },
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
    addresses: [addressSchema],
    phone: { type: String, trim: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    addresses: this.addresses,
    phone: this.phone,
    emailVerified: this.emailVerified,
    isBlocked: this.isBlocked,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
