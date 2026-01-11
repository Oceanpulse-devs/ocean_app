const { sequelize } = require('../config/database');
const { SellerTester, BuyerTester, Feedback } = require('../models');

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - seller_testers');
    console.log('   - buyer_testers');
    console.log('   - feedback');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
