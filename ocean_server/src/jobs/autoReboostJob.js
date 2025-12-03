const cron = require('node-cron');
const AutoReboostService = require('../services/autoReboostService');
const BoostManagementService = require('../services/boostManagementService');

/**
 * Auto-Reboost Cron Job
 * 
 * Runs hourly to process expired boosts that have auto-reboost enabled
 */
class AutoReboostJob {

  /**
   * Start the auto-reboost cron job
   * Runs every hour at minute 0
   */
  static start() {
    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
    cron.schedule('0 * * * *', async () => {
      console.log('Starting auto-reboost job...');
      
      try {
        // First, update expired boosts
        await BoostManagementService.updateExpiredBoosts();
        
        // Then process auto-reboosts
        const results = await AutoReboostService.processAllAutoReboosts();
        
        console.log('Auto-reboost job completed:', {
          timestamp: new Date().toISOString(),
          results: results
        });
      } catch (error) {
        console.error('Error in auto-reboost job:', error);
      }
    });

    console.log('Auto-reboost cron job started (runs every hour)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running auto-reboost job manually...');
    
    try {
      // First, update expired boosts
      const expiredCount = await BoostManagementService.updateExpiredBoosts();
      console.log(`Updated ${expiredCount} expired boosts`);
      
      // Then process auto-reboosts
      const results = await AutoReboostService.processAllAutoReboosts();
      
      console.log('Auto-reboost job completed:', results);
      return results;
    } catch (error) {
      console.error('Error in manual auto-reboost job:', error);
      throw error;
    }
  }
}

module.exports = AutoReboostJob;

