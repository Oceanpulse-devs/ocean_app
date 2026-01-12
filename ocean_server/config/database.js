const { Sequelize } = require('sequelize');

// Get environment variables with fallbacks
const getConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false, // Disable logging in production
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  } else {
    // Development configuration - use environment variables if available, otherwise fallback to defaults
    return {
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'j@123098',
      database: process.env.DB_NAME || 'ocean_app_db',
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log
    };
  }
};

const sequelize = new Sequelize(getConfig());

module.exports = sequelize;
