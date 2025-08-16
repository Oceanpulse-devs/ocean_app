const { UserReference, Conversation, ConversationParticipant } = require('../../models');
const { Op } = require('sequelize');

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
      attributes: ['id', 'fullName', 'profilePicture', 'accountType'],
      order: [['fullName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
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
      attributes: ['id', 'fullName', 'profilePicture', 'accountType'],
      order: [['fullName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
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
      attributes: ['id', 'fullName', 'profilePicture', 'accountType'],
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

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        accountType: user.accountType
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
                  attributes: ['id', 'fullName', 'profilePicture']
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
      .map(p => p.conversation.participants[0]?.user)
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

module.exports = {
  getOnlineUsers,
  searchUsers,
  getUserProfile,
  getRecentContacts,
  getConversationStats
}; 