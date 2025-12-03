const cron = require('node-cron');
const ScoreRecalculationService = require('../services/scoreRecalculationService');

/**
 * Score Recalculation Cron Job
 * 
 * Runs hourly to recalculate visibility scores for all active items
 */
class ScoreRecalculationJob {

  /**
   * Start the score recalculation cron job
   * Runs every hour at minute 5 (e.g., 1:05, 2:05, 3:05, etc.)
   * This gives time for other hourly jobs to complete first
   */
  static start() {
    // Run every hour at minute 5
    cron.schedule('5 * * * *', async () => {
      console.log('Starting score recalculation job...');
      
      try {
        const results = await ScoreRecalculationService.recalculateAllScores({
          batchSize: 100
        });
        
        console.log('Score recalculation job completed:', {
          timestamp: new Date().toISOString(),
          totalProcessed: results.totalProcessed,
          totalSuccessful: results.totalSuccessful,
          totalFailed: results.totalFailed,
          duration: `${results.duration}ms`
        });
      } catch (error) {
        console.error('Error in score recalculation job:', error);
      }
    });

    console.log('Score recalculation cron job started (runs every hour at :05)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running score recalculation job manually...');
    
    try {
      const results = await ScoreRecalculationService.recalculateAllScores({
        batchSize: 100
      });
      
      console.log('Score recalculation job completed:', results);
      return results;
    } catch (error) {
      console.error('Error in manual score recalculation job:', error);
      throw error;
    }
  }
}

module.exports = ScoreRecalculationJob;

