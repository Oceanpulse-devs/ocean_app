const dotenv = require('dotenv');
dotenv.config();

const redis = require('redis');

// Create Redis client with proper configuration
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('● Redis connected ✅');
});

redisClient.on('error', (err) => {
  console.error('● Redis connection error ❌', err);
});

redisClient.on('ready', () => {
  console.log('● Redis ready ✅');
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('● Redis client initialized ✅');
  })
  .catch(err => {
    console.error('● Redis connection failed ❌', err);
    // Don't exit the process, just log the error
  });

module.exports = redisClient;
