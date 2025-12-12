const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['automation', 'security', 'energy', 'entertainment', 'health', 'other']
  },
  provider: {
    name: String,
    email: String,
    phone: String,
    website: String
  },
  pricing: {
    model: { type: String, enum: ['free', 'one-time', 'subscription'], default: 'subscription' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    billingCycle: { type: String, enum: ['monthly', 'yearly', 'one-time'], default: 'monthly' }
  },
  features: [String],
  compatibility: {
    deviceTypes: [String],
    platforms: [String],
    minVersion: String
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  stats: {
    subscribers: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    installations: { type: Number, default: 0 }
  },
  availability: {
    regions: [String],
    languages: [String],
    support24x7: { type: Boolean, default: false }
  },
  media: {
    icon: String,
    images: [String],
    video: String
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

// Text index for search
serviceSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text',
  features: 'text'
});

// Other indexes
serviceSchema.index({ category: 1 });
serviceSchema.index({ 'rating.average': -1 });
serviceSchema.index({ 'pricing.amount': 1 });

module.exports = mongoose.model('Service', serviceSchema);
