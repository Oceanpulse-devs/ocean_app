const cron = require('node-cron');
const { PromotionUsage, UserSubscription } = require('../../models');
const { Op } = require('sequelize');

/**
 * Monthly Promotion Reset Job
 * 
 * Runs on the 1st of each month at midnight to:
 * - Reset monthly boost/placement/spotlight counters
 * - Update subscription usage
 * - Create new promotion_usage entries for the new month
 */
class MonthlyPromotionResetJob {

  /**
   * Start the monthly promotion reset cron job
   * Runs on the 1st of each month at 00:00 (midnight)
   */
  static start() {
    // Run on the 1st of each month at 00:00
    // Cron expression: '0 0 1 * *' = minute 0, hour 0, day 1, every month
    cron.schedule('0 0 1 * *', async () => {
      console.log('Starting monthly promotion reset job...');
      console.log(`Date: ${new Date().toISOString()}`);
      
      try {
        const results = {
          timestamp: new Date().toISOString(),
          newMonth: this.getCurrentMonthPeriod(),
          usersProcessed: 0,
          usageRecordsCreated: 0,
          errors: []
        };

        // Get current month period (YYYY-MM-01 format)
        const currentPeriod = this.getCurrentMonthPeriod();
        const previousPeriod = this.getPreviousMonthPeriod();

        console.log(`Resetting from ${previousPeriod} to ${currentPeriod}`);

        // Get all active subscriptions
        const activeSubscriptions = await UserSubscription.findAll({
          where: {
            status: 'active',
            endDate: {
              [Op.gte]: new Date() // Subscription is still active
            }
          }
        });

        console.log(`Found ${activeSubscriptions.length} active subscriptions`);

        // Process each subscription
        for (const subscription of activeSubscriptions) {
          try {
            const userId = subscription.userId;
            
            if (!userId) {
              console.warn(`Subscription ${subscription.id} has no userId, skipping`);
              continue;
            }

            // Check if usage record already exists for current month
            const existingUsage = await PromotionUsage.findOne({
              where: {
                user_id: userId,
                usage_period: currentPeriod
              }
            });

            if (existingUsage) {
              console.log(`Usage record already exists for user ${userId} for period ${currentPeriod}`);
              continue;
            }

            // Create new usage record for current month (counters start at 0)
            await PromotionUsage.create({
              userId: userId,
              subscriptionId: subscription.id,
              usagePeriod: currentPeriod,
              boostsUsed: 0,
              topPlacementsUsed: 0,
              spotlightsUsed: 0
            });

            results.usageRecordsCreated++;
            results.usersProcessed++;

            console.log(`Created usage record for user ${userId} for period ${currentPeriod}`);
          } catch (error) {
            console.error(`Error processing subscription ${subscription.id}:`, error);
            results.errors.push({
              subscriptionId: subscription.id,
              error: error.message
            });
          }
        }

        // Log summary
        console.log('Monthly promotion reset job completed:');
        console.log(`- Users processed: ${results.usersProcessed}`);
        console.log(`- Usage records created: ${results.usageRecordsCreated}`);
        console.log(`- Errors: ${results.errors.length}`);

        if (results.errors.length > 0) {
          console.error('Errors during monthly reset:', results.errors);
        }

        return results;
      } catch (error) {
        console.error('Error in monthly promotion reset job:', error);
        throw error;
      }
    });

    console.log('Monthly promotion reset job scheduled (runs on 1st of each month at 00:00)');
  }

  /**
   * Get current month period in YYYY-MM-01 format
   * @returns {string} Current month period
   */
  static getCurrentMonthPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }

  /**
   * Get previous month period in YYYY-MM-01 format
   * @returns {string} Previous month period
   */
  static getPreviousMonthPeriod() {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const month = String(previousMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }

  /**
   * Manually trigger the monthly reset (for testing)
   * @returns {Promise<Object>} Reset results
   */
  static async runManually() {
    console.log('Manually triggering monthly promotion reset...');
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        newMonth: this.getCurrentMonthPeriod(),
        usersProcessed: 0,
        usageRecordsCreated: 0,
        errors: []
      };

      const currentPeriod = this.getCurrentMonthPeriod();
      const previousPeriod = this.getPreviousMonthPeriod();

      console.log(`Resetting from ${previousPeriod} to ${currentPeriod}`);

      const activeSubscriptions = await UserSubscription.findAll({
        where: {
          status: 'active',
          endDate: {
            [Op.gte]: new Date()
          }
        }
      });

      console.log(`Found ${activeSubscriptions.length} active subscriptions`);

      for (const subscription of activeSubscriptions) {
        try {
          const userId = subscription.userId;
          
          if (!userId) {
            console.warn(`Subscription ${subscription.id} has no userId, skipping`);
            continue;
          }

          const existingUsage = await PromotionUsage.findOne({
            where: {
              user_id: userId,
              usage_period: currentPeriod
            }
          });

          if (existingUsage) {
            console.log(`Usage record already exists for user ${userId} for period ${currentPeriod}`);
            continue;
          }

          await PromotionUsage.create({
            userId: userId,
            subscriptionId: subscription.id,
            usagePeriod: currentPeriod,
            boostsUsed: 0,
            topPlacementsUsed: 0,
            spotlightsUsed: 0
          });

          results.usageRecordsCreated++;
          results.usersProcessed++;

          console.log(`Created usage record for user ${userId} for period ${currentPeriod}`);
        } catch (error) {
          console.error(`Error processing subscription ${subscription.id}:`, error);
          results.errors.push({
            subscriptionId: subscription.id,
            error: error.message
          });
        }
      }

      console.log('Monthly promotion reset completed:');
      console.log(`- Users processed: ${results.usersProcessed}`);
      console.log(`- Usage records created: ${results.usageRecordsCreated}`);
      console.log(`- Errors: ${results.errors.length}`);

      return results;
    } catch (error) {
      console.error('Error in manual monthly promotion reset:', error);
      throw error;
    }
  }
}

module.exports = MonthlyPromotionResetJob;

