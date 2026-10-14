const { UserReference, Conversation, ConversationParticipant } = require('../../models');
const { Op } = require('sequelize');
const { sanitizeProfilePicture } = require('../utils/urlHelper');

// Get online users
const getOnlineUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;

    const users = await UserReference.findAndCountAll({
      where: {
        id: { [Op.ne]: userId }, // Exclude current user
        accountStatus: 'active'
      },
      attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'sellerId', 'businessName'],
      order: [['fullName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format users with both userId and sellerId
    const formattedUsers = users.rows.map(user => {
      const userData = user.toJSON ? user.toJSON() : user;
      const cleanPic = sanitizeProfilePicture(userData.profilePicture);
      return {
        id: userData.id,
        userId: userData.id,
        sellerId: userData.sellerId || null,
        fullName: userData.fullName,
        profilePicture: cleanPic,
        avatar: cleanPic,
        accountType: userData.accountType,
        businessName: userData.businessName || null
      };
    });

    res.json({
      users: formattedUsers,
      total: users.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });

  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      message: 'Error retrieving online users',
      error: error.message
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters long'
      });
    }

    const offset = (page - 1) * limit;

    const users = await UserReference.findAndCountAll({
      where: {
        id: { [Op.ne]: userId }, // Exclude current user
        accountStatus: 'active',
        [Op.or]: [
          { fullName: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'sellerId', 'businessName'],
      order: [['fullName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format users with both userId and sellerId
    const formattedUsers = users.rows.map(user => {
      const userData = user.toJSON ? user.toJSON() : user;
      const cleanPic = sanitizeProfilePicture(userData.profilePicture);
      return {
        id: userData.id,
        userId: userData.id,
        sellerId: userData.sellerId || null,
        fullName: userData.fullName,
        profilePicture: cleanPic,
        avatar: cleanPic,
        accountType: userData.accountType,
        businessName: userData.businessName || null
      };
    });

    res.json({
      users: formattedUsers,
      total: users.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      message: 'Error searching users',
      error: error.message
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await UserReference.findByPk(userId, {
      attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'sellerId', 'businessName'],
      include: [
        {
          model: ConversationParticipant,
          as: 'conversationParticipants',
          include: [
            {
              model: Conversation,
              as: 'conversation',
              where: { type: 'direct' },
              include: [
                {
                  model: ConversationParticipant,
                  as: 'participants',
                  where: { userId: currentUserId, isActive: true }
                }
              ]
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if there's an existing direct conversation
    const existingConversation = user.conversationParticipants.find(p => 
      p.conversation && p.conversation.participants.length > 0
    );

    const userData = user.toJSON ? user.toJSON() : user;
    const cleanPic = sanitizeProfilePicture(userData.profilePicture);
    res.json({
      user: {
        id: userData.id,
        userId: userData.id,
        sellerId: userData.sellerId || null,
        fullName: userData.fullName,
        profilePicture: cleanPic,
        avatar: cleanPic,
        accountType: userData.accountType,
        businessName: userData.businessName || null
      },
      existingConversationId: existingConversation ? existingConversation.conversation.id : null
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      message: 'Error retrieving user profile',
      error: error.message
    });
  }
};



// Get user's recent contacts
const getRecentContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get users from recent conversations
    const recentParticipants = await ConversationParticipant.findAll({
      where: { userId, isActive: true },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { type: 'direct' },
          include: [
            {
              model: ConversationParticipant,
              as: 'participants',
              where: { userId: { [Op.ne]: userId }, isActive: true },
              include: [
                {
                  model: UserReference,
                  as: 'user',
                  attributes: ['id', 'fullName', 'profilePicture', 'sellerId', 'businessName', 'accountType']
                }
              ]
            }
          ]
        }
      ],
      order: [[{ model: Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']],
      limit: parseInt(limit)
    });

    const contacts = recentParticipants
      .map(p => {
        const user = p.conversation.participants[0]?.user;
        if (!user) return null;
        
        const userData = user.toJSON ? user.toJSON() : user;
        const cleanPic = sanitizeProfilePicture(userData.profilePicture);
        return {
          id: userData.id,
          userId: userData.id,
          sellerId: userData.sellerId || null,
          fullName: userData.fullName,
          profilePicture: cleanPic,
          avatar: cleanPic,
          accountType: userData.accountType,
          businessName: userData.businessName || null
        };
      })
      .filter(Boolean);

    res.json({
      contacts
    });

  } catch (error) {
    console.error('Error getting recent contacts:', error);
    res.status(500).json({
      message: 'Error retrieving recent contacts',
      error: error.message
    });
  }
};

// Get user's conversation stats
const getConversationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await ConversationParticipant.findAll({
      where: { userId, isActive: true },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            {
              model: ConversationParticipant,
              as: 'participants',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    const totalConversations = stats.length;
    const directConversations = stats.filter(s => s.conversation.type === 'direct').length;
    const groupConversations = stats.filter(s => s.conversation.type === 'group').length;
    const totalParticipants = stats.reduce((sum, s) => sum + s.conversation.participants.length, 0);

    res.json({
      totalConversations,
      directConversations,
      groupConversations,
      totalParticipants
    });

  } catch (error) {
    console.error('Error getting conversation stats:', error);
    res.status(500).json({
      message: 'Error retrieving conversation stats',
      error: error.message
    });
  }
};

// Batch presence query endpoint (POST /api/users/presence)
const getBatchUserPresence = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        message: 'userIds must be an array of user IDs'
      });
    }

    const PresenceService = require('../services/presenceService');
    const presenceMap = await PresenceService.getBatchPresence(userIds);

    // Return mapped presence dictionary as requested by frontend
    return res.status(200).json(presenceMap);
  } catch (error) {
    console.error('Error getting batch user presence:', error);
    res.status(500).json({
      message: 'Error retrieving user presence',
      error: error.message
    });
  }
};

module.exports = {
  getOnlineUsers,
  searchUsers,
  getUserProfile,
  getRecentContacts,
  getConversationStats,
  getBatchUserPresence
};
 