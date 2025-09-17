const mysql = require('mysql2/promise');
const dotenv = require('dotenv').config();

async function cleanMigration() {
  let connection;
  
  try {
    console.log('🚀 Running clean Railway database migration...');
    
    // Connect to Railway database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.RDB_USERNAME,
      password: process.env.RDB_PASSWORD,
      database: process.env.RDB_NAME,
      port: 37286,
      ssl: { rejectUnauthorized: false },
      acquireTimeout: 60000,
      timeout: 60000
    });

    console.log('✅ Connected to Railway database');

    // Check if columns already exist
    const checkColumns = async (table, column) => {
      try {
        await connection.execute(`SELECT ${column} FROM ${table} LIMIT 1`);
        return true;
      } catch (error) {
        return false;
      }
    };

    // Add columns only if they don't exist
    const migrations = [
      {
        name: 'username column',
        sql: 'ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE NULL',
        check: () => checkColumns('users', 'username')
      },
      {
        name: 'lastActive column',
        sql: 'ALTER TABLE users ADD COLUMN lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        check: () => checkColumns('users', 'lastActive')
      },
      {
        name: 'likes column to products',
        sql: 'ALTER TABLE products ADD COLUMN likes INT DEFAULT 0',
        check: () => checkColumns('products', 'likes')
      },
      {
        name: 'postSubType column to posts',
        sql: 'ALTER TABLE posts ADD COLUMN postSubType ENUM(\'buyer\', \'seller\') NULL',
        check: () => checkColumns('posts', 'postSubType')
      },
      {
        name: 'minBudget column to posts',
        sql: 'ALTER TABLE posts ADD COLUMN minBudget DECIMAL(10, 2) NULL',
        check: () => checkColumns('posts', 'minBudget')
      },
      {
        name: 'maxBudget column to posts',
        sql: 'ALTER TABLE posts ADD COLUMN maxBudget DECIMAL(10, 2) NULL',
        check: () => checkColumns('posts', 'maxBudget')
      },
      {
        name: 'category column to posts',
        sql: 'ALTER TABLE posts ADD COLUMN category VARCHAR(100) NULL',
        check: () => checkColumns('posts', 'category')
      },
      {
        name: 'condition column to posts',
        sql: 'ALTER TABLE posts ADD COLUMN `condition` VARCHAR(50) NULL',
        check: () => checkColumns('posts', 'condition')
      }
    ];

    // Execute each migration
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        const exists = await migration.check();
        if (exists) {
          console.log(`⚠️  ${migration.name} already exists - skipping`);
        } else {
          console.log(`⏳ Adding ${migration.name}...`);
          await connection.execute(migration.sql);
          console.log(`✅ Added ${migration.name}`);
        }
      } catch (error) {
        console.error(`❌ Error with ${migration.name}:`, error.message);
        throw error;
      }
    }

    // Update existing users with generated usernames
    try {
      console.log('⏳ Generating usernames for existing users...');
      await connection.execute(`
        UPDATE users 
        SET username = CONCAT('@', SUBSTRING(email, 1, LOCATE('@', email) - 1), '_', SUBSTRING(UUID(), 1, 8))
        WHERE username IS NULL
      `);
      console.log('✅ Generated usernames for existing users');
    } catch (error) {
      console.log('⚠️  Could not update usernames:', error.message);
    }

    console.log('🎉 Clean migration finished successfully!');
    console.log('📊 Your Railway database now has all required columns');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.log('⚠️  Error closing connection:', error.message);
      }
    }
  }
}

// Run the clean migration
cleanMigration()
  .then(() => {
    console.log('🎯 Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
