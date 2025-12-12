const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Redis session
    const redis = getRedisClient();
    const session = await redis.get(`session:${token}`);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    // Add user info to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = { authenticate };
