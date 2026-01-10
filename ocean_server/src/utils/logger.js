/**
 * Logger Utility
 * 
 * Reduces logging in production to prevent Railway rate limiting (500 logs/sec)
 * Only logs errors and critical events in production
 * Full logging available in development mode
 */

const isDevelopment = process.env.NODE_ENV !== 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'error');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = logLevels[LOG_LEVEL] || logLevels.error;

const logger = {
  error: (...args) => {
    if (currentLogLevel >= logLevels.error) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (currentLogLevel >= logLevels.warn) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (currentLogLevel >= logLevels.info) {
      console.log(...args);
    }
  },
  
  debug: (...args) => {
    if (currentLogLevel >= logLevels.debug && isDevelopment) {
      console.log(...args);
    }
  },
  
  // For backwards compatibility - only logs in development
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  }
};

module.exports = logger;
