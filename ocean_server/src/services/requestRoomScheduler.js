const db = require('../../models');
const { Op } = require('sequelize');

class RequestRoomScheduler {
  /**
   * Scan and expire active request rooms older than 24 hours
   */
  static async checkExpiredRooms() {
    try {
      const now = new Date();

      // Find active rooms that passed their expiration timestamp
      const expiredRooms = await db.RequestRoom.findAll({
        where: {
          status: 'ACTIVE',
          expiresAt: { [Op.lt]: now }
        }
      });

      if (expiredRooms.length === 0) {
        return { success: true, expiredCount: 0 };
      }

      const roomIds = expiredRooms.map(r => r.id);
      const insightIds = expiredRooms.map(r => r.insightId).filter(Boolean);

      console.log(`⏰ [RequestRoomScheduler] Found ${roomIds.length} expired request rooms:`, roomIds);

      // 1. Mark rooms as EXPIRED
      await db.RequestRoom.update(
        { status: 'EXPIRED' },
        { where: { id: roomIds } }
      );

      // 2. Mark corresponding search insights as EXPIRED (if still OPEN or CLOSED_FULL)
      if (insightIds.length > 0) {
        await db.BuyerSearchInsight.update(
          { status: 'EXPIRED' },
          {
            where: {
              id: insightIds,
              status: { [Op.in]: ['OPEN', 'CLOSED_FULL'] }
            }
          }
        );
      }

      console.log(`✅ [RequestRoomScheduler] Successfully expired ${roomIds.length} request rooms`);

      return {
        success: true,
        expiredCount: roomIds.length
      };

    } catch (error) {
      console.error('❌ [RequestRoomScheduler] Error expiring request rooms:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule automatic checks (run every 15 minutes)
   */
  static scheduleChecks() {
    // Run immediate check on boot
    this.checkExpiredRooms();

    // Schedule check every 15 minutes
    setInterval(() => {
      this.checkExpiredRooms();
    }, 15 * 60 * 1000);

    console.log('⏰ Request room 24-hour expiration runner scheduled to run every 15 minutes');
  }
}

module.exports = RequestRoomScheduler;
