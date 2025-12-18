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

    // Query Cassandra - need to query each date individually (partition key requirement)
    const cassandra = getCassandraClient();

    // Generate dates to query
    const dates = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Query each date and combine results
    let allReadings = [];
    for (const date of dates) {
      const query = `
        SELECT date, timestamp, temperature, humidity, power_consumption, status
        FROM device_readings
        WHERE device_id = ? AND date = ?
      `;

      try {
        const result = await cassandra.execute(query, [deviceId, date], { prepare: true });
        allReadings.push(...result.rows);
      } catch (dateError) {
        console.log(`No data for ${deviceId} on ${date}`);
      }
    }

    // Sort by timestamp and limit
    allReadings.sort((a, b) => b.timestamp - a.timestamp);
    const limit = parseInt(req.query.limit) || 1000;
    const readings = allReadings.slice(0, limit);

    // Format data for frontend
    const data = readings.map(row => ({
      timestamp: row.timestamp,
      temperature: row.temperature,
      humidity: row.humidity,
      power: row.power_consumption,  // Map power_consumption to power
      status: row.status
    }));

    // Calculate analytics from the data
    let tempSum = 0, humSum = 0, powerSum = 0;
    let tempCount = 0, humCount = 0, powerCount = 0;

    data.forEach(r => {
      if (r.temperature != null) { tempSum += r.temperature; tempCount++; }
      if (r.humidity != null) { humSum += r.humidity; humCount++; }
      if (r.power != null) { powerSum += r.power; powerCount++; }
    });

    const responseData = {
      deviceId,
      period,
      totalReadings: data.length,
      temperature: {
        avg: tempCount > 0 ? tempSum / tempCount : 0,
        data: data.map(r => ({ timestamp: r.timestamp, value: r.temperature })).filter(d => d.value != null)
      },
      humidity: {
        avg: humCount > 0 ? humSum / humCount : 0,
        data: data.map(r => ({ timestamp: r.timestamp, value: r.humidity })).filter(d => d.value != null)
      },
      powerConsumption: {
        total: powerSum,
        avg: powerCount > 0 ? powerSum / powerCount : 0,
        data: data.map(r => ({ timestamp: r.timestamp, value: r.power })).filter(d => d.value != null)
      }
    };

    res.json({
      success: true,
      data: responseData
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
