const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['thermostat', 'light', 'camera', 'lock', 'sensor', 'speaker', 'outlet', 'other']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  location: {
    room: String,
    floor: String,
    building: String
  },
  configuration: {
    firmwareVersion: String,
    settings: mongoose.Schema.Types.Mixed,
    capabilities: [String]
  },
  status: {
    online: { type: Boolean, default: false },
    battery: Number,
    signalStrength: Number,
    lastSeen: Date
  },
  lastDataPoint: {
    timestamp: Date,
    values: mongoose.Schema.Types.Mixed
  },
  metadata: {
    installDate: Date,
    warrantyExpiry: Date,
    maintenanceSchedule: String
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

// Indexes
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ userId: 1 });
deviceSchema.index({ type: 1 });
deviceSchema.index({ 'status.online': 1 });

module.exports = mongoose.model('Device', deviceSchema);
