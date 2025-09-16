const mysql = require('mysql2/promise');

async function addEmailVerificationMigration() {
  let connection;
  
  try {
    console.log('🚀 Adding email verification fields to Railway database...');
    
    // Connect to Railway database
    connection = await mysql.createConnection({
      host: 'yamabiko.proxy.rlwy.net',
      user: 'root',
      password: 'OVVGRKCISlIWypaMxggpNjuQwnAmOUjc',
      database: 'railway',
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

    // Add email verification fields
    const migrations = [
      {
        name: 'emailVerified column',
        sql: 'ALTER TABLE users ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE',
        check: () => checkColumns('users', 'emailVerified')
      },
      {
        name: 'emailVerificationToken column',
        sql: 'ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255) NULL',
        check: () => checkColumns('users', 'emailVerificationToken')
      },
      {
        name: 'emailVerificationExpires column',
        sql: 'ALTER TABLE users ADD COLUMN emailVerificationExpires DATETIME NULL',
        check: () => checkColumns('users', 'emailVerificationExpires')
      },
      {
        name: 'passwordResetToken column',
        sql: 'ALTER TABLE users ADD COLUMN passwordResetToken VARCHAR(255) NULL',
        check: () => checkColumns('users', 'passwordResetToken')
      },
      {
        name: 'passwordResetExpires column',
        sql: 'ALTER TABLE users ADD COLUMN passwordResetExpires DATETIME NULL',
        check: () => checkColumns('users', 'passwordResetExpires')
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

    // Update accountStatus enum to include 'pending' status
    try {
      console.log('⏳ Updating accountStatus enum to include pending...');
      await connection.execute(`
        ALTER TABLE users 
        MODIFY COLUMN accountStatus ENUM('pending', 'active', 'suspended', 'deactivated') 
        DEFAULT 'pending'
      `);
      console.log('✅ Updated accountStatus enum');
    } catch (error) {
      console.log('⚠️  Could not update accountStatus enum:', error.message);
    }

    // Set existing users to verified (since they're already using the system)
    try {
      console.log('⏳ Setting existing users as verified...');
      await connection.execute(`
        UPDATE users 
        SET emailVerified = TRUE, accountStatus = 'active'
        WHERE emailVerified IS NULL
      `);
      console.log('✅ Set existing users as verified');
    } catch (error) {
      console.log('⚠️  Could not update existing users:', error.message);
    }

    console.log('🎉 Email verification migration finished successfully!');
    console.log('📊 Your Railway database now has email verification fields');

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

// Run the migration
addEmailVerificationMigration()
  .then(() => {
    console.log('🎯 Email verification migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Email verification migration failed:', error);
    process.exit(1);
  });
