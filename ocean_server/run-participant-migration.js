const mysql = require('mysql2/promise');
require('dotenv').config();

async function runGroupBuyParticipantMigration() {
  const connection = await mysql.createConnection({
    host: 'yamabiko.proxy.rlwy.net',
    port: 37286,
    user: 'root',
    password: 'OVVGRKCISlIWypaMxggpNjuQwnAmOUjc',
    database: 'railway'
  });

  try {
    console.log('🚀 Starting GroupBuyParticipant timestamp columns migration...');

    // Check if the columns exist first
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'group_buy_participants' 
      AND TABLE_SCHEMA = 'railway'
      AND COLUMN_NAME IN ('created_at', 'updated_at', 'createdAt', 'updatedAt')
    `);

    console.log('📊 Existing timestamp columns:', columns.map(c => c.COLUMN_NAME));

    // Only rename if the old columns exist and new ones don't
    const hasOldCreatedAt = columns.some(c => c.COLUMN_NAME === 'created_at');
    const hasOldUpdatedAt = columns.some(c => c.COLUMN_NAME === 'updated_at');
    const hasNewCreatedAt = columns.some(c => c.COLUMN_NAME === 'createdAt');
    const hasNewUpdatedAt = columns.some(c => c.COLUMN_NAME === 'updatedAt');

    if (hasOldCreatedAt && !hasNewCreatedAt) {
      console.log('📝 Renaming created_at to createdAt in group_buy_participants table...');
      await connection.execute(`
        ALTER TABLE \`group_buy_participants\` 
        CHANGE COLUMN \`created_at\` \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Renamed created_at to createdAt in group_buy_participants');
    } else {
      console.log('ℹ️ created_at column already renamed or doesn\'t exist');
    }

    if (hasOldUpdatedAt && !hasNewUpdatedAt) {
      console.log('📝 Renaming updated_at to updatedAt in group_buy_participants table...');
      await connection.execute(`
        ALTER TABLE \`group_buy_participants\`
        CHANGE COLUMN \`updated_at\` \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ Renamed updated_at to updatedAt in group_buy_participants');
    } else {
      console.log('ℹ️ updated_at column already renamed or doesn\'t exist');
    }

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'group_buy_participants' 
      AND TABLE_SCHEMA = 'railway'
      AND COLUMN_NAME IN ('createdAt', 'updatedAt')
      ORDER BY COLUMN_NAME
    `);

    console.log('📊 Final GroupBuyParticipant timestamp columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 GroupBuyParticipant migration completed successfully!');
    console.log('🚀 You can now deploy your backend - both GroupBuy models should work correctly!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
runGroupBuyParticipantMigration().catch(console.error);
