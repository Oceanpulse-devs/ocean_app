const { Sequelize } = require('sequelize');
const path = require('path');

// Database connection for hosted database (Railway)
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'yamabiko.proxy.rlwy.net',
  port: 37286,
  username: 'root',
  password: 'OVVGRKCISlIWypaMxggpNjuQwnAmOUjc',
  database: 'railway',
  logging: console.log, // Enable SQL logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function runMigration() {
  try {
    console.log('🚀 Connecting to hosted database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
    // Import and run the migration
    const migration = require('./migrations/20240919120000-update-seller-document-image-nullable.js');
    
    console.log('📦 Running migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration();



