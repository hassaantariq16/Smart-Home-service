const Redis = require('ioredis');

let redisClient = null;

async function connectRedis() {
  if (redisClient) {
    console.log('✅ Redis already connected');
    return redisClient;
  }

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
    });

    // Test connection
    await redisClient.ping();

    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error;
  }
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not connected');
  }
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
