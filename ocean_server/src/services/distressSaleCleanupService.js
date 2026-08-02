const db = require('../../models');
const { Op } = require('sequelize');

class DistressSaleCleanupService {
    /**
     * Scan database and delete all expired distress sale products
     * along with their public feed post mappings.
     */
    static async cleanupExpiredSales() {
        try {
            console.log('🧹 Starting expired distress sales cleanup...');
            
            // Find all expired distress sale products
            const expiredSales = await db.Product.findAll({
                where: {
                    isDistressSale: true,
                    distressExpiryDate: { [Op.lt]: new Date() }
                }
            });

            if (expiredSales.length === 0) {
                console.log('✅ No expired distress sales found');
                return { success: true, deletedCount: 0 };
            }

            const expiredIds = expiredSales.map(sale => sale.id);
            console.log(`🔍 Found ${expiredIds.length} expired distress sales to delete:`, expiredIds);

            // 1. Delete associated feed posts from posts table
            const deletedPosts = await db.Post.destroy({
                where: {
                    sourceId: expiredIds.map(String)
                }
            });
            console.log(`🗑️ Deleted ${deletedPosts} matching feed posts from posts table`);

            // 2. Delete the products themselves
            const deletedProducts = await db.Product.destroy({
                where: {
                    id: expiredIds
                }
            });
            console.log(`✅ Successfully deleted ${deletedProducts} expired distress sale products`);

            // Flush Redis cache to ensure the feeds are updated immediately
            try {
                const redisClient = require('../config/redisdb');
                if (redisClient && typeof redisClient.keys === 'function') {
                    const keys = await redisClient.keys('distressSales:*');
                    if (keys && keys.length > 0) {
                        await redisClient.del(keys);
                        console.log(`🧹 Flushed ${keys.length} distress sales Redis cache keys`);
                    }
                }
            } catch (cacheErr) {
                console.warn('⚠️ Could not flush Redis cache during distress sale cleanup:', cacheErr.message);
            }

            return {
                success: true,
                deletedCount: deletedProducts,
                message: `Cleaned up ${deletedProducts} expired distress sales`
            };

        } catch (error) {
            console.error('❌ Error during distress sale cleanup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Schedule automatic cleanup (run every hour)
     */
    static scheduleCleanup() {
        // Run cleanup immediately at startup for backward compatibility (clears existing expired records)
        this.cleanupExpiredSales();

        // Schedule cleanup every hour
        setInterval(() => {
            this.cleanupExpiredSales();
        }, 60 * 60 * 1000); // 1 hour

        console.log('⏰ Distress sales cleanup scheduled to run every hour');
    }
}

module.exports = DistressSaleCleanupService;
