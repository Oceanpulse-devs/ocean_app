const { BuyerNeed, BuyerNeedMatch, sequelize } = require('../../models');
const { Op } = require('sequelize');
const buyerNeedController = require('../controllers/buyerNeedController');

class BuyerNeedSchedulerService {
    // Check for expired batches and route the next set of 5 sellers
    static async checkAndProcessExpiredBatches() {
        try {
            console.log('⏰ Running check for expired buyer need routing batches...');
            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

            // Find all active, unfulfilled buyer demands that have timed out
            const expiredNeeds = await BuyerNeed.findAll({
                where: {
                    status: 'active',
                    reach_exceeded: false,
                    batch_started_at: {
                        [Op.lt]: threeMinutesAgo
                    }
                }
            });

            console.log(`🔍 Found ${expiredNeeds.length} timed-out demand batches to advance.`);

            for (const buyerNeed of expiredNeeds) {
                try {
                    // Update any pending 'notified' matches to 'expired' for this timed-out batch
                    await BuyerNeedMatch.update(
                        { status: 'expired' },
                        {
                            where: {
                                buyer_need_id: buyerNeed.id,
                                status: 'notified'
                            }
                        }
                    );

                    console.log(`⏱️ Batch timeout reached for BuyerNeed ID: ${buyerNeed.id}. Routing next batch...`);
                    
                    // Advance to next batch of 5 matching sellers
                    await buyerNeedController.routeNextBatch(buyerNeed.id);
                } catch (err) {
                    console.error(`❌ Error advancing batch for BuyerNeed ${buyerNeed.id}:`, err);
                }
            }
        } catch (error) {
            console.error('❌ Error during buyer need matching schedule check:', error);
        }
    }

    // Schedule check to run every 60 seconds
    static scheduleMatchingRunner() {
        // Run check immediately
        this.checkAndProcessExpiredBatches();

        // Run check every 60 seconds
        setInterval(() => {
            this.checkAndProcessExpiredBatches();
        }, 60 * 1000); // 60 seconds

        console.log('⏰ Buyer Needs intelligent dispatcher cron loop started (60s tick)');
    }
}

module.exports = BuyerNeedSchedulerService;
