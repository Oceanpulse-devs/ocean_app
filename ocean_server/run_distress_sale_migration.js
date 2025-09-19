const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('Connecting to Railway database...');
    
    // Use direct Railway connection string for faster execution
    connection = await mysql.createConnection('mysql://root:OVVGRKCISlIWypaMxggpNjuQwnAmOUjc@yamabiko.proxy.rlwy.net:37286/railway');

    console.log('Connected to database successfully!');

    // Read the migration SQL file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/add_distress_sale_columns.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await connection.execute(statement.trim());
        console.log('✅ Success');
      }
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Some columns already exist. This is normal if the migration was run before.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

runMigration();
