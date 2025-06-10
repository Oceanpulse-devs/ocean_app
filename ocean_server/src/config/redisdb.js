
const redis = require('redis');

const client = redis.createClient({
  url: 'redis://localhost:6379', // or use REDIS_URL env variable
});

client.connect()
  .then(() => console.log('● Redis connected ✅'))
  .catch(err => console.error('● Redis connection error ❌', err));

module.exports = client;
