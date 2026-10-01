const dotenv = require('dotenv');
dotenv.config();

const redis = require('redis');

// Construct Redis URL from environment variables
let redisUrl = process.env.REDIS_URL;
if (!redisUrl && process.env.REDIS_HOST) {
  const auth = process.env.REDIS_PASSWORD ? `default:${process.env.REDIS_PASSWORD}@` : '';
  const port = process.env.REDIS_PORT || 6379;
  redisUrl = `redis://${auth}${process.env.REDIS_HOST}:${port}`;
}

const cleanedUrl = (redisUrl || 'redis://localhost:6379').trim().replace(/^["']|["']$/g, '');
const isTls = cleanedUrl.startsWith('rediss://');

const redisClient = redis.createClient({
  url: cleanedUrl,
  pingInterval: 15000,
  socket: {
    tls: isTls,
    rejectUnauthorized: false,
    keepAlive: 10000,
    reconnectStrategy: (retries) => {
      // Exponential backoff reconnect strategy (max 3s) - never abort
      return Math.min(retries * 100, 3000);
    }
  }
});


redisClient.on('connect', () => {
  console.log('● Messaging Server Redis connected ✅');
});

redisClient.on('error', (err) => {
  console.error('● Messaging Server Redis error ❌', err?.message || err);
});

redisClient.on('ready', () => {
  console.log('● Messaging Server Redis ready ✅');
});

// Connect to Redis asynchronously (non-blocking)
redisClient.connect().catch(err => {
  console.error('● Messaging Server Redis connection failed ❌', err?.message || err);
});

module.exports = redisClient;
