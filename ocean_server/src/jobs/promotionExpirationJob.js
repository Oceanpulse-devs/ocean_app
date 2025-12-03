const cron = require('node-cron');
const BoostManagementService = require('../services/boostManagementService');
const AutoReboostService = require('../services/autoReboostService');
const TopPlacementService = require('../services/topPlacementService');
const SpotlightService = require('../services/spotlightService');

/**
 * Promotion Expiration Job
 * 
 * Runs hourly to handle expired promotions:
 * - Expired boosts
 * - Expired top placements
 * - Expired spotlights (when implemented)
 * - Auto-reboost processing
 */
class PromotionExpirationJob {

  /**
   * Start the promotion expiration cron job
   * Runs every hour at minute 0
   */
  static start() {
    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
    cron.schedule('0 * * * *', async () => {
      console.log('Starting promotion expiration job...');
      
      try {
        const results = {
          timestamp: new Date().toISOString(),
          boosts: {},
          topPlacements: {},
          spotlights: {},
          autoReboosts: {}
        };

        // Handle expired boosts
        const expiredBoosts = await BoostManagementService.updateExpiredBoosts();
        results.boosts = {
          expired: expiredBoosts
        };

        // Handle expired top placements
        const topPlacementResults = await TopPlacementService.handleExpiredPlacements();
        results.topPlacements = topPlacementResults;

        // Handle expired spotlights
        const spotlightResults = await SpotlightService.handleExpiredSpotlights();
        results.spotlights = spotlightResults;

        // Process auto-reboosts
        const autoReboostResults = await AutoReboostService.processAllAutoReboosts();
        results.autoReboosts = autoReboostResults;

        console.log('Promotion expiration job completed:', results);
      } catch (error) {
        console.error('Error in promotion expiration job:', error);
      }
    });

    console.log('Promotion expiration cron job started (runs every hour)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running promotion expiration job manually...');
    
    try {
      const results = {
        boosts: {},
        topPlacements: {},
        spotlights: {},
        autoReboosts: {}
      };

      // Handle expired boosts
      const expiredBoosts = await BoostManagementService.updateExpiredBoosts();
      results.boosts = {
        expired: expiredBoosts
      };
      console.log(`Updated ${expiredBoosts} expired boosts`);

      // Handle expired top placements
      const topPlacementResults = await TopPlacementService.handleExpiredPlacements();
      results.topPlacements = topPlacementResults;
      console.log(`Handled ${topPlacementResults.updated} expired top placements`);

      // Handle expired spotlights
      const spotlightResults = await SpotlightService.handleExpiredSpotlights();
      results.spotlights = spotlightResults;
      console.log(`Handled ${spotlightResults.updated} expired spotlights`);

      // Process auto-reboosts
      const autoReboostResults = await AutoReboostService.processAllAutoReboosts();
      results.autoReboosts = autoReboostResults;
      console.log(`Processed ${autoReboostResults.successful} auto-reboosts`);

      console.log('Promotion expiration job completed:', results);
      return results;
    } catch (error) {
      console.error('Error in manual promotion expiration job:', error);
      throw error;
    }
  }
}

module.exports = PromotionExpirationJob;

