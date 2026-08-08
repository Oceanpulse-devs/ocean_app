const db = require('../../models');
const { Op } = require('sequelize');

/**
 * Get 2-way blocked user IDs for a given user.
 * Returns an array of user IDs containing:
 * 1. Users that `userId` has blocked
 * 2. Users that have blocked `userId`
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of blocked user IDs
 */
async function getBlockedUserIds(userId) {
  if (!userId) {
    return [];
  }

  try {
    const { UserBlock } = db;
    if (!UserBlock) {
      return [];
    }

    const blocks = await UserBlock.findAll({
      where: {
        [Op.or]: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      },
      attributes: ['blockerId', 'blockedId'],
      raw: true
    });

    if (!blocks || blocks.length === 0) {
      return [];
    }

    const blockedIdsSet = new Set();
    for (const b of blocks) {
      if (b.blockerId === userId && b.blockedId) {
        blockedIdsSet.add(b.blockedId);
      }
      if (b.blockedId === userId && b.blockerId) {
        blockedIdsSet.add(b.blockerId);
      }
    }

    return Array.from(blockedIdsSet);
  } catch (error) {
    console.error('Error fetching blocked user IDs:', error.message);
    return [];
  }
}

module.exports = {
  getBlockedUserIds
};
