const mysql = require('mysql2');
const dotenv = require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME, // Changed from DB_USER to DB_USERNAME
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Added port
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Debug environment variables
console.log('🔍 Database Config Debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

pool.getConnection((err, connection) => {
    if (err) {
      console.log('❌ Database connection error:', err);
    } else {
      console.log(`● Db Connected on ${connection.threadId} ✅`);
    }
  });


module.exports = pool;