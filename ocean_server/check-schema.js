const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: 'yamabiko.proxy.rlwy.net',
    port: 37286,
    user: 'root',
    password: 'OVVGRKCISlIWypaMxggpNjuQwnAmOUjc',
    database: 'railway'
  });

  try {
    console.log('🔍 Checking database schema...');

    // Check if group_buys table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'group_buys'
    `);

    if (tables.length === 0) {
      console.log('❌ group_buys table does not exist!');
      return;
    }

    console.log('✅ group_buys table exists');

    // Get all columns in group_buys table
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'group_buys' AND TABLE_SCHEMA = 'railway'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📊 Columns in group_buys table:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if group_buy_participants table exists
    const [participantTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'group_buy_participants'
    `);

    if (participantTables.length > 0) {
      console.log('✅ group_buy_participants table exists');
      
      // Get all columns in group_buy_participants table
      const [participantColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'group_buy_participants' AND TABLE_SCHEMA = 'railway'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('📊 Columns in group_buy_participants table:');
      participantColumns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ group_buy_participants table does not exist!');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await connection.end();
  }
}

// Run the schema check
checkDatabaseSchema().catch(console.error);
