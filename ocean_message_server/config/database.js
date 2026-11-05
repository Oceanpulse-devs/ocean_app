const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const env = process.env.NODE_ENV || 'development';

let config;

const cleanStr = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, '') : val);

const poolMax = parseInt(cleanStr(process.env.DB_POOL_MAX) || '20', 10);
const poolMin = parseInt(cleanStr(process.env.DB_POOL_MIN) || '5', 10);
const poolAcquire = parseInt(cleanStr(process.env.DB_POOL_ACQUIRE) || '60000', 10);
const poolIdle = parseInt(cleanStr(process.env.DB_POOL_IDLE) || '10000', 10);

if (env === 'production') {
  // Production configuration
  config = {
    username: cleanStr(process.env.DB_USER || process.env.DB_USERNAME),
    password: cleanStr(process.env.DB_PASSWORD),
    database: cleanStr(process.env.DB_NAME),
    host: cleanStr(process.env.DB_HOST),
    port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: poolMax,
      min: poolMin,
      acquire: poolAcquire,
      idle: poolIdle
    },
    dialectOptions: {
      ssl: false,
      connectTimeout: 60000
    }
  };
} else {
  // Development configuration
  config = {
    username: cleanStr(process.env.DB_USER) || 'root',
    password: cleanStr(process.env.DB_PASSWORD) || 'j@123098',
    database: cleanStr(process.env.DB_NAME) || 'ocean_app_db',
    host: cleanStr(process.env.DB_HOST) || '127.0.0.1',
    port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: poolMax,
      min: poolMin,
      acquire: poolAcquire,
      idle: poolIdle
    }
  };
}

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    console.log(`🔍 Database Config Debug:`);
    console.log(`DB_HOST: ${config.host}`);
    console.log(`DB_USERNAME: ${config.username}`);
    console.log(`DB_NAME: ${config.database}`);
    console.log(`DB_PORT: ${config.port}`);
    console.log(`NODE_ENV: ${env}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
