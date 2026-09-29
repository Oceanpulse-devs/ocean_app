const cleanStr = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, '') : val);

module.exports = {
  development: {
    username: cleanStr(process.env.DB_USERNAME || process.env.DB_USER) || 'root',
    password: cleanStr(process.env.DB_PASSWORD) || 'j@123098',
    database: cleanStr(process.env.DB_NAME) || 'ocean_app_db',
    host: cleanStr(process.env.DB_HOST) || '127.0.0.1',
    port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
    dialect: 'mysql'
  },
  test: {
    username: cleanStr(process.env.DB_USERNAME || process.env.DB_USER) || 'root',
    password: cleanStr(process.env.DB_PASSWORD) || null,
    database: cleanStr(process.env.DB_NAME) || 'database_test',
    host: cleanStr(process.env.DB_HOST) || '127.0.0.1',
    port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
    dialect: 'mysql'
  },
  production: {
    username: cleanStr(process.env.DB_USERNAME || process.env.DB_USER),
    password: cleanStr(process.env.DB_PASSWORD),
    database: cleanStr(process.env.DB_NAME),
    host: cleanStr(process.env.DB_HOST),
    port: parseInt(cleanStr(process.env.DB_PORT) || '3306', 10),
    dialect: 'mysql'
  }
};
