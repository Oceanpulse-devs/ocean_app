const db = require('../../models');
const { Op } = require('sequelize');

class UserBlockController {

  /**
   * Block a user
   * POST /api/users/block/:targetUserId
   */
  async blockUser(req, res) {
    try {
      const blockerId = req.user.id;
      const { targetUserId } = req.params;
      const { reason } = req.body || {};

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'Target user ID is required'
        });
      }

      if (blockerId === targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot block yourself'
        });
      }

      const { UserTable, UserBlock, UserFollows } = db;

      // Check if target user exists
      const targetUser = await UserTable.findByPk(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User to block not found'
        });
      }

      // Create or find block record
      const [blockRecord, created] = await UserBlock.findOrCreate({
        where: {
          blockerId: blockerId,
          blockedId: targetUserId
        },
        defaults: {
          reason: reason || 'No reason provided'
        }
      });

      if (!created && reason) {
        await blockRecord.update({ reason });
      }

      // Automatically sever mutual follow relationships
      try {
        await UserFollows.destroy({
          where: {
            [Op.or]: [
              { userId: blockerId, followsUserId: targetUserId },
              { userId: targetUserId, followsUserId: blockerId }
            ]
          }
        });
      } catch (followErr) {
        console.error('Error severing follow relationship on block:', followErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'User blocked successfully',
        data: {
          blockedUserId: targetUserId,
          blockedAt: blockRecord.created_at || blockRecord.createdAt || new Date()
        }
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to block user',
        error: error.message
      });
    }
  }

  /**
   * Unblock a user
   * POST /api/users/unblock/:targetUserId
   */
  async unblockUser(req, res) {
    try {
      const blockerId = req.user.id;
      const { targetUserId } = req.params;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'Target user ID is required'
        });
      }

      const { UserBlock } = db;

      const deletedCount = await UserBlock.destroy({
        where: {
          blockerId: blockerId,
          blockedId: targetUserId
        }
      });

      return res.status(200).json({
        success: true,
        message: deletedCount > 0 ? 'User unblocked successfully' : 'User was not blocked',
        data: {
          unblockedUserId: targetUserId,
          unblockedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to unblock user',
        error: error.message
      });
    }
  }

  /**
   * Get list of users blocked by the authenticated user
   * GET /api/users/blocked
   */
  async getBlockedUsers(req, res) {
    try {
      const blockerId = req.user.id;
      const { UserBlock, UserTable, SellersTable } = db;

      const blocks = await UserBlock.findAll({
        where: { blockerId: blockerId },
        include: [{
          model: UserTable,
          as: 'blockedUser',
          attributes: ['id', 'fullName', 'username', 'profilePicture']
        }],
        order: [['created_at', 'DESC']]
      });

      // Format response with seller businessName if available
      const blockedList = await Promise.all(blocks.map(async (block) => {
        const u = block.blockedUser;
        if (!u) return null;

        const seller = await SellersTable.findOne({
          where: { userId: u.id },
          attributes: ['id', 'businessName']
        });

        return {
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          profilePicture: u.profilePicture,
          isSeller: !!seller,
          sellerId: seller ? seller.id : null,
          businessName: seller ? seller.businessName : null,
          blockedAt: block.created_at || block.createdAt
        };
      }));

      const filteredList = blockedList.filter(Boolean);

      return res.status(200).json({
        success: true,
        message: 'Blocked users retrieved successfully',
        data: filteredList
      });
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve blocked users',
        error: error.message
      });
    }
  }
}

module.exports = new UserBlockController();
