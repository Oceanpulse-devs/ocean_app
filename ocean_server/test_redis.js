const redis = require('redis');

async function testRedis() {
  console.log('🧪 Testing Redis connection...');
  
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('✅ Redis connected successfully!');
    
    // Test basic operations
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('✅ Redis set/get test:', value);
    
    await client.del('test_key');
    console.log('✅ Redis delete test passed');
    
    await client.disconnect();
    console.log('🎉 Redis test completed successfully!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Make sure Redis is installed and running');
    console.log('2. Check if Redis is running on localhost:6379');
    console.log('3. Install Redis: https://redis.io/download');
    console.log('4. Start Redis: redis-server');
  }
}

testRedis();
