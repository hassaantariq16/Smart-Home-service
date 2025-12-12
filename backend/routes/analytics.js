const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getCassandraClient } = require('../config/cassandra');
const Device = require('../models/Device');
const User = require('../models/User');

const router = express.Router();

// Get device analytics
router.get('/devices/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period = '24h' } = req.query;

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

    // Calculate date range
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Query Cassandra for analytics data
    const cassandra = getCassandraClient();
    
    const query = `
      SELECT date, timestamp, temperature, humidity, power_consumption
      FROM device_readings
      WHERE device_id = ? AND date >= ? AND date <= ?
      LIMIT 1000
    `;

    const result = await cassandra.execute(query, [
      deviceId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ], { prepare: true });

    const readings = result.rows;

    // Calculate analytics
    const analytics = {
      deviceId,
      period,
      totalReadings: readings.length,
      temperature: {
        avg: 0,
        min: Infinity,
        max: -Infinity,
        current: null
      },
      humidity: {
        avg: 0,
        min: Infinity,
        max: -Infinity,
        current: null
      },
      powerConsumption: {
        total: 0,
        avg: 0,
        peak: 0
      },
      timeline: []
    };

    let tempSum = 0, tempCount = 0;
    let humSum = 0, humCount = 0;
    let powerSum = 0, powerCount = 0;

    readings.forEach(row => {
      if (row.temperature !== null) {
        tempSum += row.temperature;
        tempCount++;
        analytics.temperature.min = Math.min(analytics.temperature.min, row.temperature);
        analytics.temperature.max = Math.max(analytics.temperature.max, row.temperature);
        analytics.temperature.current = row.temperature;
      }

      if (row.humidity !== null) {
        humSum += row.humidity;
        humCount++;
        analytics.humidity.min = Math.min(analytics.humidity.min, row.humidity);
        analytics.humidity.max = Math.max(analytics.humidity.max, row.humidity);
        analytics.humidity.current = row.humidity;
      }

      if (row.power_consumption !== null) {
        powerSum += row.power_consumption;
        powerCount++;
        analytics.powerConsumption.peak = Math.max(analytics.powerConsumption.peak, row.power_consumption);
      }

      analytics.timeline.push({
        timestamp: row.timestamp,
        temperature: row.temperature,
        humidity: row.humidity,
        power: row.power_consumption
      });
    });

    analytics.temperature.avg = tempCount > 0 ? tempSum / tempCount : 0;
    analytics.humidity.avg = humCount > 0 ? humSum / humCount : 0;
    analytics.powerConsumption.avg = powerCount > 0 ? powerSum / powerCount : 0;
    analytics.powerConsumption.total = powerSum;

    // Reset infinity values
    if (analytics.temperature.min === Infinity) analytics.temperature.min = 0;
    if (analytics.temperature.max === -Infinity) analytics.temperature.max = 0;
    if (analytics.humidity.min === Infinity) analytics.humidity.min = 0;
    if (analytics.humidity.max === -Infinity) analytics.humidity.max = 0;

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get device analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching device analytics',
      error: error.message
    });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user with stats
    const user = await User.findById(userId).select('stats');

    // Get device count
    const deviceCount = await Device.countDocuments({ 
      userId, 
      isActive: true 
    });

    // Get online devices
    const onlineDevices = await Device.countDocuments({
      userId,
      isActive: true,
      'status.online': true
    });

    res.json({
      success: true,
      data: {
        totalDevices: deviceCount,
        activeDevices: onlineDevices,
        totalServices: user.stats.totalServices,
        energySaved: user.stats.energySaved,
        costSavings: user.stats.costSavings
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

// Get recent activity
router.get('/activity/recent', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Query Cassandra for recent system logs
    const cassandra = getCassandraClient();
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `
      SELECT date, timestamp, user_id, event_type, description
      FROM system_logs
      WHERE date IN (?, ?) AND user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const result = await cassandra.execute(query, [
      today,
      yesterday,
      req.user.userId.toString(),
      parseInt(limit)
    ], { prepare: true });

    const activities = result.rows.map(row => ({
      timestamp: row.timestamp,
      type: row.event_type,
      description: row.description
    }));

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
});

module.exports = router;
