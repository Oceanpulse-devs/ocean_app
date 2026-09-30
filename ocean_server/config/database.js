const { Sequelize } = require('sequelize');

const cleanStr = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, '') : val);

// Get environment variables with fallbacks
const getConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      username: cleanStr(process.env.DB_USERNAME || process.env.DB_USER),
      password: cleanStr(process.env.DB_PASSWORD),
      database: cleanStr(process.env.DB_NAME),
      host: cleanStr(process.env.DB_HOST),
      port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
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
      username: cleanStr(process.env.DB_USERNAME || process.env.DB_USER) || 'root',
      password: cleanStr(process.env.DB_PASSWORD) || 'j@123098',
      database: cleanStr(process.env.DB_NAME) || 'ocean_app_db',
      host: cleanStr(process.env.DB_HOST) || '127.0.0.1',
      port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
      dialect: 'mysql',
      logging: console.log
    };
  }
};

const sequelize = new Sequelize(getConfig());

module.exports = sequelize;
