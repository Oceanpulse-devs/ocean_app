// Test database connection
const { sequelize, testConnection } = require('./config/database');

async function test() {
  console.log('Testing database connection...\n');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n📊 Database Info:');
    console.log(`   Database: ${sequelize.config.database}`);
    console.log(`   Host: ${sequelize.config.host}`);
    console.log(`   User: ${sequelize.config.username}`);
    console.log(`   Dialect: ${sequelize.config.dialect}`);
  }
  
  await sequelize.close();
  process.exit(isConnected ? 0 : 1);
}

test();
