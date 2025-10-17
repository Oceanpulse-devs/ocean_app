const { Story, StoryView, sequelize } = require('../../models');
const { Op } = require('sequelize');

class StoryCleanupService {
    // Clean up expired stories
    static async cleanupExpiredStories() {
        try {
            console.log('🧹 Starting story cleanup...');
            
            // Delete expired stories (views will be deleted automatically due to CASCADE)
            const deletedStories = await Story.destroy({
                where: {
                    expiresAt: { [Op.lt]: new Date() }
                }
            });

            console.log(`✅ Cleaned up ${deletedStories} expired stories`);
            
            return {
                success: true,
                deletedCount: deletedStories,
                message: `Cleaned up ${deletedStories} expired stories`
            };

        } catch (error) {
            console.error('❌ Error during story cleanup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get cleanup statistics
    static async getCleanupStats() {
        try {
            const totalStories = await Story.count();
            const expiredStories = await Story.count({
                where: {
                    expiresAt: { [Op.lt]: new Date() }
                }
            });
            const activeStories = totalStories - expiredStories;

            return {
                totalStories,
                activeStories,
                expiredStories,
                cleanupNeeded: expiredStories > 0
            };

        } catch (error) {
            console.error('Error getting cleanup stats:', error);
            return null;
        }
    }

    // Schedule automatic cleanup (run every hour)
    static scheduleCleanup() {
        // Run cleanup immediately
        this.cleanupExpiredStories();

        // Schedule cleanup every hour
        setInterval(() => {
            this.cleanupExpiredStories();
        }, 60 * 60 * 1000); // 1 hour

        console.log('⏰ Story cleanup scheduled to run every hour');
    }
}

module.exports = StoryCleanupService;
