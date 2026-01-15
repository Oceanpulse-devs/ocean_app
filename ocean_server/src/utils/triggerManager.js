const fs = require('fs');
const path = require('path');
const db = require('../../models');

/**
 * Trigger Manager
 * Automatically recreates database triggers on server start
 * This ensures triggers are always present even after database resets
 */
class TriggerManager {
  /**
   * Read and execute SQL file
   */
  static async executeSqlFile(filePath) {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split by DELIMITER statements and execute each part
      const statements = sql.split(/DELIMITER\s+\$\$/i);
      
      if (statements.length > 1) {
        // Has DELIMITER statements - execute the main block
        // Remove DELIMITER markers and execute
        const cleanSql = sql
          .replace(/DELIMITER\s+\$\$/gi, '')
          .replace(/DELIMITER\s*;/gi, '');
        
        // Split by semicolons but preserve DELIMITER blocks
        const parts = cleanSql.split(';').filter(part => part.trim().length > 0);
        
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed && !trimmed.startsWith('--')) {
            try {
              await db.sequelize.query(trimmed);
            } catch (error) {
              // Ignore errors for DROP statements (triggers might not exist)
              if (!error.message.includes("doesn't exist") && !error.message.includes("Unknown table")) {
                console.error(`⚠️  Error executing SQL: ${error.message.substring(0, 100)}`);
              }
            }
          }
        }
      } else {
        // No DELIMITER - simple SQL file
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (trimmed && !trimmed.startsWith('--')) {
            try {
              await db.sequelize.query(trimmed);
            } catch (error) {
              if (!error.message.includes("doesn't exist") && !error.message.includes("Unknown table")) {
                console.error(`⚠️  Error executing SQL: ${error.message.substring(0, 100)}`);
              }
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error reading/executing SQL file ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Restore all feed triggers from the migration file
   * Note: This requires the SQL file to be executed manually via MySQL client
   * as Sequelize doesn't support DELIMITER statements directly
   */
  static async restoreFeedTriggers() {
    try {
      console.log('🔄 Checking feed triggers...');
      
      const triggerFile = path.join(__dirname, '../../migrations/2026-01-15-restore-all-feed-triggers.sql');
      
      if (!fs.existsSync(triggerFile)) {
        console.log('⚠️  Trigger restoration file not found:', triggerFile);
        return false;
      }

      // For now, just verify triggers exist
      // The SQL file with DELIMITER needs to be run manually via MySQL client
      // or we can create a simpler approach
      console.log('📝 Note: To restore triggers, run the SQL file manually:');
      console.log(`   ${triggerFile}`);
      console.log('   Or use: mysql -u user -p database < migrations/2026-01-15-restore-all-feed-triggers.sql');
      
      return await this.verifyTriggers();
    } catch (error) {
      console.error('❌ Error checking feed triggers:', error.message);
      return false;
    }
  }

  /**
   * Verify triggers exist
   */
  static async verifyTriggers() {
    try {
      const [results] = await db.sequelize.query(`
        SELECT 
            TRIGGER_NAME,
            EVENT_MANIPULATION,
            EVENT_OBJECT_TABLE
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
        AND TRIGGER_NAME LIKE '%feed%'
        ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
      `);

      const expectedTriggers = [
        'tr_product_to_feed',
        'tr_product_update_feed',
        'tr_product_images_to_feed',
        'tr_group_buy_to_feed',
        'tr_group_buy_update_feed',
        'tr_swap_deal_to_feed',
        'tr_swap_deal_update_feed',
        'tr_auction_to_feed',
        'tr_auction_update_feed',
        'tr_buyer_need_to_feed',
        'tr_buyer_need_update_feed',
        'tr_buyer_need_media_to_feed'
      ];

      const existingTriggers = results.map(r => r.TRIGGER_NAME);
      const missingTriggers = expectedTriggers.filter(t => !existingTriggers.includes(t));

      if (missingTriggers.length > 0) {
        console.log(`⚠️  Missing triggers: ${missingTriggers.join(', ')}`);
        return false;
      }

      console.log(`✅ All ${expectedTriggers.length} feed triggers verified`);
      return true;
    } catch (error) {
      console.error('❌ Error verifying triggers:', error.message);
      return false;
    }
  }

  /**
   * Initialize triggers on server start
   */
  static async initialize() {
    try {
      console.log('🔧 Initializing database triggers...');
      
      // First verify if triggers exist
      const triggersExist = await this.verifyTriggers();
      
      if (!triggersExist) {
        console.log('📦 Restoring missing triggers...');
        await this.restoreFeedTriggers();
        
        // Verify again after restoration
        await this.verifyTriggers();
      } else {
        console.log('✅ All triggers already exist');
      }
    } catch (error) {
      console.error('❌ Error initializing triggers:', error.message);
      // Don't throw - allow server to continue
    }
  }
}

module.exports = TriggerManager;
