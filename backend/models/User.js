const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  profile: {
    avatar: String,
    bio: String,
    preferences: {
      notifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' }
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false }
  },
  stats: {
    totalDevices: { type: Number, default: 0 },
    totalServices: { type: Number, default: 0 },
    energySaved: { type: Number, default: 0 },
    costSavings: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ 'address.coordinates': '2dsphere' });

// Index for email lookup
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
