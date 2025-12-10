const cron = require('node-cron');
const subscriptionService = require('../services/subscriptionService');

/**
 * Subscription Expiration Job
 * 
 * Runs daily to check for expired subscriptions and:
 * - Mark them as expired
 * - Send expiration emails to users
 * - Update user subscription status
 */
class SubscriptionExpirationJob {

  /**
   * Start the subscription expiration cron job
   * Runs daily at 10:00 AM (1 hour after reminder job)
   */
  static start() {
    // Run daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('Starting subscription expiration job...');
      
      try {
        const updatedCount = await subscriptionService.updateExpiredSubscriptions();
        
        console.log('Subscription expiration job completed:', {
          timestamp: new Date().toISOString(),
          expiredSubscriptions: updatedCount
        });
      } catch (error) {
        console.error('Error in subscription expiration job:', error);
      }
    });

    console.log('Subscription expiration cron job started (runs daily at 10:00 AM)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running subscription expiration job manually...');
    
    try {
      const updatedCount = await subscriptionService.updateExpiredSubscriptions();
      
      console.log('Subscription expiration job completed:', {
        expiredSubscriptions: updatedCount
      });
      
      return { expiredSubscriptions: updatedCount };
    } catch (error) {
      console.error('Error in manual subscription expiration job:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionExpirationJob;

