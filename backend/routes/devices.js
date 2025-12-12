const express = require('express');
const Device = require('../models/Device');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { getRedisClient } = require('../config/redis');
const { getCassandraClient } = require('../config/cassandra');

const router = express.Router();

// Get all devices for user
router.get('/', authenticate, async (req, res) => {
  try {
    const devices = await Device.find({ 
      userId: req.user.userId,
      isActive: true 
    });

    res.json({
      success: true,
      count: devices.length,
      data: devices
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching devices'
    });
  }
});

// Register new device
router.post('/register', authenticate, async (req, res) => {
  try {
    const { deviceId, name, type, manufacturer, model, location } = req.body;

    if (!deviceId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide deviceId, name, and type'
      });
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Device with this ID already exists'
      });
    }

    // Create device
    const device = new Device({
      deviceId,
      userId: req.user.userId,
      name,
      type,
      manufacturer,
      model,
      location,
      status: {
        online: true,
        lastSeen: new Date()
      }
    });

    await device.save();

    // Update user stats
    await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { 'stats.totalDevices': 1 } }
    );

    // Initialize device in Redis
    const redis = getRedisClient();
    await redis.hset(
      `device:realtime:${deviceId}`,
      'status', 'online',
      'lastUpdate', new Date().toISOString()
    );
    await redis.expire(`device:realtime:${deviceId}`, 300); // 5 min TTL

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });

  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device'
    });
  }
});

// Get device details
router.get('/:deviceId', authenticate, async (req, res) => {
  try {
    const device = await Device.findOne({
      deviceId: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Get real-time status from Redis
    const redis = getRedisClient();
    const realtimeData = await redis.hgetall(`device:realtime:${req.params.deviceId}`);

    res.json({
      success: true,
      data: {
        ...device.toObject(),
        realtime: realtimeData
      }
    });

  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching device'
    });
  }
});

// Post device reading
router.post('/:deviceId/readings', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { values } = req.body;

    if (!values) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reading values'
      });
    }

    const timestamp = new Date();

    // 1. Update MongoDB (latest reading)
    await Device.findOneAndUpdate(
      { deviceId, userId: req.user.userId },
      {
        $set: {
          'lastDataPoint.timestamp': timestamp,
          'lastDataPoint.values': values,
          'status.lastSeen': timestamp,
          'status.online': true
        }
      }
    );

    // 2. Update Redis (real-time cache)
    const redis = getRedisClient();
    await redis.hset(
      `device:realtime:${deviceId}`,
      'values', JSON.stringify(values),
      'timestamp', timestamp.toISOString(),
      'status', 'online'
    );
    await redis.expire(`device:realtime:${deviceId}`, 300);

    // 3. Store in Cassandra (historical data)
    const cassandra = getCassandraClient();
    const date = timestamp.toISOString().split('T')[0];
    
    const query = `
      INSERT INTO device_readings (
        device_id, date, timestamp, 
        temperature, humidity, power_consumption, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await cassandra.execute(query, [
      deviceId,
      date,
      timestamp,
      values.temperature || null,
      values.humidity || null,
      values.power || null,
      'active'
    ], { prepare: true });

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    io.to(`device:${deviceId}`).emit('reading', {
      deviceId,
      timestamp,
      values
    });

    res.json({
      success: true,
      message: 'Reading recorded successfully',
      data: {
        deviceId,
        timestamp,
        values
      }
    });

  } catch (error) {
    console.error('Post reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording reading',
      error: error.message
    });
  }
});

// Get device historical data
router.get('/:deviceId/history', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    // Verify device ownership
    const device = await Device.findOne({
      deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Query Cassandra for historical data
    const cassandra = getCassandraClient();
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const query = `
      SELECT * FROM device_readings 
      WHERE device_id = ? AND date >= ? AND date <= ?
      LIMIT ?
    `;

    const result = await cassandra.execute(query, [deviceId, start, end, parseInt(limit)], { prepare: true });

    const readings = result.rows.map(row => ({
      timestamp: row.timestamp,
      temperature: row.temperature,
      humidity: row.humidity,
      powerConsumption: row.power_consumption,
      status: row.status
    }));

    res.json({
      success: true,
      count: readings.length,
      data: readings
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching historical data',
      error: error.message
    });
  }
});

// Delete device
router.delete('/:deviceId', authenticate, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId, userId: req.user.userId },
      { isActive: false },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update user stats
    await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { 'stats.totalDevices': -1 } }
    );

    // Remove from Redis
    const redis = getRedisClient();
    await redis.del(`device:realtime:${req.params.deviceId}`);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting device'
    });
  }
});

module.exports = router;
