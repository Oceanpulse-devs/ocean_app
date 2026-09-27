const dotenv = require('dotenv');
dotenv.config();

const redis = require('redis');

const redisUrlRaw = process.env.REDIS_URL || 'redis://localhost:6379';
const redisUrl = redisUrlRaw.trim().replace(/^["']|["']$/g, '');
const isTls = redisUrl.startsWith('rediss://');

// Create Redis client with proper configuration
const redisClient = redis.createClient({
  url: redisUrl,
  pingInterval: 15000, // Periodically ping server to keep Aiven TLS socket alive and prevent idle timeouts
  socket: {
    tls: isTls,
    rejectUnauthorized: false, // Required for self-signed/Aiven certificates
    keepAlive: 10000, // Enable TCP keep-alive (10 seconds)
    reconnectStrategy: (retries) => {
      // Exponential backoff reconnect strategy for cloud Redis (max 3s)
      return Math.min(retries * 100, 3000);
    }
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
