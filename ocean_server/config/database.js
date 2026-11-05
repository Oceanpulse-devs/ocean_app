const { Sequelize } = require('sequelize');

const cleanStr = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, '') : val);

// Get environment variables with fallbacks
const getConfig = () => {
  const poolMax = parseInt(cleanStr(process.env.DB_POOL_MAX) || '25', 10);
  const poolMin = parseInt(cleanStr(process.env.DB_POOL_MIN) || '5', 10);
  const poolAcquire = parseInt(cleanStr(process.env.DB_POOL_ACQUIRE) || '60000', 10);
  const poolIdle = parseInt(cleanStr(process.env.DB_POOL_IDLE) || '10000', 10);

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
        max: poolMax,
        min: poolMin,
        acquire: poolAcquire,
        idle: poolIdle
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
      logging: console.log,
      pool: {
        max: poolMax,
        min: poolMin,
        acquire: poolAcquire,
        idle: poolIdle
      }
    };
  }
};

const sequelize = new Sequelize(getConfig());

module.exports = sequelize;
