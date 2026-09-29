const { Op } = require('sequelize');
const db = require('../../models');

/**
 * Get all user IDs involved in blocks with a given user (both directions).
 * Returns array of user IDs.
 */
async function getBlockedUserIds(userId) {
  if (!userId) return [];

  try {
    const { UserBlock } = db;
    if (!UserBlock) return [];

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

    if (!blocks || blocks.length === 0) return [];

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
    console.error('Error fetching blocked user IDs in message server:', error.message);
    return [];
  }
}

/**
 * Check if a 2-way block relationship exists between two users.
 * Returns { isBlocked: boolean, blockedBySender: boolean, blockedByRecipient: boolean }
 */
async function checkBlockRelationship(senderId, recipientId) {
  if (!senderId || !recipientId || senderId === recipientId) {
    return { isBlocked: false, blockedBySender: false, blockedByRecipient: false };
  }

  try {
    const { UserBlock } = db;
    if (!UserBlock) {
      return { isBlocked: false, blockedBySender: false, blockedByRecipient: false };
    }

    const blocks = await UserBlock.findAll({
      where: {
        [Op.or]: [
          { blockerId: senderId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderId }
        ]
      },
      attributes: ['blockerId', 'blockedId'],
      raw: true
    });

    let blockedBySender = false;
    let blockedByRecipient = false;

    for (const b of blocks) {
      if (b.blockerId === senderId && b.blockedId === recipientId) {
        blockedBySender = true;
      }
      if (b.blockerId === recipientId && b.blockedId === senderId) {
        blockedByRecipient = true;
      }
    }

    return {
      isBlocked: blockedBySender || blockedByRecipient,
      blockedBySender,
      blockedByRecipient
    };
  } catch (error) {
    console.error('Error checking block relationship:', error.message);
    return { isBlocked: false, blockedBySender: false, blockedByRecipient: false };
  }
}

module.exports = {
  getBlockedUserIds,
  checkBlockRelationship
};
