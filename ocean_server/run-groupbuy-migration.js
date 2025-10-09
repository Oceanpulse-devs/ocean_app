const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'yamabiko.proxy.rlwy.net',
    port: 37286,
    user: 'root',
    password: 'OVVGRKCISlIWypaMxggpNjuQwnAmOUjc',
    database: 'railway'
  });

  try {
    console.log('🚀 Starting GroupBuy timestamp columns migration...');

    // Rename created_at to createdAt in group_buys table
    console.log('📝 Renaming created_at to createdAt in group_buys table...');
    await connection.execute(`
      ALTER TABLE \`group_buys\` 
      CHANGE COLUMN \`created_at\` \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Renamed created_at to createdAt in group_buys');

    // Rename updated_at to updatedAt in group_buys table
    console.log('📝 Renaming updated_at to updatedAt in group_buys table...');
    await connection.execute(`
      ALTER TABLE \`group_buys\`
      CHANGE COLUMN \`updated_at\` \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ Renamed updated_at to updatedAt in group_buys');

    // Rename created_at to createdAt in group_buy_participants table
    console.log('📝 Renaming created_at to createdAt in group_buy_participants table...');
    await connection.execute(`
      ALTER TABLE \`group_buy_participants\`
      CHANGE COLUMN \`created_at\` \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Renamed created_at to createdAt in group_buy_participants');

    // Rename updated_at to updatedAt in group_buy_participants table
    console.log('📝 Renaming updated_at to updatedAt in group_buy_participants table...');
    await connection.execute(`
      ALTER TABLE \`group_buy_participants\` 
      CHANGE COLUMN \`updated_at\` \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ Renamed updated_at to updatedAt in group_buy_participants');

    // Update indexes
    console.log('📝 Updating indexes...');
    try {
      await connection.execute(`DROP INDEX IF EXISTS \`idx_group_buy_created_at\` ON \`group_buys\``);
      await connection.execute(`CREATE INDEX \`idx_group_buy_createdAt\` ON \`group_buys\` (\`createdAt\`)`);
      console.log('✅ Updated indexes');
    } catch (error) {
      console.log('⚠️ Index update failed (might not exist):', error.message);
    }

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const [groupBuysColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'group_buys' 
      AND COLUMN_NAME IN ('createdAt', 'updatedAt')
    `);

    const [participantsColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'group_buy_participants' 
      AND COLUMN_NAME IN ('createdAt', 'updatedAt')
    `);

    console.log('📊 Group Buys table columns:');
    groupBuysColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('📊 Group Buy Participants table columns:');
    participantsColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Migration completed successfully!');
    console.log('🚀 You can now deploy your backend - the GroupBuy model should work correctly!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
runMigration().catch(console.error);

