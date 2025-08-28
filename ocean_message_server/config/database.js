const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const env = process.env.NODE_ENV || 'development';

let config;

if (env === 'production') {
  // Production configuration (Railway)
  config = {
    username: process.env.DB_USER || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: false, // Railway internal connections don't need SSL
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    }
  };
} else {
  // Development configuration
  config = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'j@123098',
    database: process.env.DB_NAME || 'ocean_app_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
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
