const fs = require('fs');
const path = require('path');
const db = require('../../models');

/**
 * Trigger Manager
 * Automatically checks and recreates database triggers on server start
 * This ensures triggers are always present even after database resets
 */
class TriggerManager {
  /**
   * Restore all feed triggers from the migration file
   */
  static async restoreFeedTriggers() {
    try {
      const triggerFile = path.join(__dirname, '../../migrations/2026-01-15-restore-all-feed-triggers.sql');
      
      if (!fs.existsSync(triggerFile)) {
        console.log('⚠️  Trigger restoration file not found:', triggerFile);
        return false;
      }

      console.log('⚡ Restoring database feed triggers from 2026-01-15-restore-all-feed-triggers.sql...');
      const sqlContent = fs.readFileSync(triggerFile, 'utf8');

      // Split the file by `$$` which demarcates each statement in the migration script
      const rawStatements = sqlContent.split(/\$\$/);
      let executedCount = 0;

      for (let rawStmt of rawStatements) {
        // Remove DELIMITER declarations and trim
        let stmt = rawStmt
          .replace(/DELIMITER\s+\$\$/gi, '')
          .replace(/DELIMITER\s*;/gi, '')
          .trim();

        if (!stmt) continue;

        // Skip verification queries embedded in the file
        if (/^(SHOW|SELECT)\s+/i.test(stmt)) {
          continue;
        }

        // Clean trailing semicolons for single line statements if present
        if (stmt.endsWith(';') && !/BEGIN[\s\S]*END/i.test(stmt)) {
          stmt = stmt.slice(0, -1).trim();
        }

        if (stmt.length > 0) {
          try {
            await db.sequelize.query(stmt);
            executedCount++;
          } catch (stmtError) {
            const isDropStmt = /^DROP\s+TRIGGER/i.test(stmt);
            if (!isDropStmt) {
              console.error(`⚠️  Error executing trigger statement: ${stmtError.message.substring(0, 120)}`);
            }
          }
        }
      }

      console.log(`✅ Successfully executed ${executedCount} trigger setup statements`);
      return await this.verifyTriggers();
    } catch (error) {
      console.error('❌ Error restoring feed triggers:', error.message);
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
        'tr_auction_update_feed'
      ];

      const existingTriggers = results.map(r => r.TRIGGER_NAME);
      const missingTriggers = expectedTriggers.filter(t => !existingTriggers.includes(t));

      if (missingTriggers.length > 0) {
        console.log(`⚠️  Missing triggers (${missingTriggers.length}/${expectedTriggers.length}): ${missingTriggers.join(', ')}`);
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
   * Initialize triggers on server start:
   * First checks if all 12 triggers exist in INFORMATION_SCHEMA.
   * If existing, does NOT drop or re-run. If missing, restores them automatically.
   */
  static async initialize(forceRestore = false) {
    try {
      console.log('🔧 Checking database triggers...');
      
      if (!forceRestore) {
        // First verify if triggers exist
        const triggersExist = await this.verifyTriggers();
        
        if (triggersExist) {
          console.log('✅ All triggers already exist. Skipping trigger restoration.');
          return true;
        }
      }
      
      console.log('📦 Triggers missing or force restore requested. Restoring triggers now...');
      await this.restoreFeedTriggers();
    } catch (error) {
      console.error('❌ Error initializing triggers:', error.message);
      // Don't throw - allow server to continue
    }
  }
}

module.exports = TriggerManager;
