const { Conversation, ConversationParticipant, UserTable, Message } = require('../../models');
const { Op } = require('sequelize');

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const participants = await ConversationParticipant.findAndCountAll({
      where: { userId, isActive: true },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            {
              model: Message,
              as: 'lastMessage',
              include: [
                {
                  model: UserTable,
                  as: 'sender',
                  attributes: ['id', 'fullName']
                }
              ]
            },
            {
              model: ConversationParticipant,
              as: 'participants',
              include: [
                {
                  model: UserTable,
                  as: 'user',
                  attributes: ['id', 'fullName', 'profilePicture']
                }
              ]
            }
          ]
        }
      ],
      order: [[{ model: Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      conversations: participants.rows.map(p => ({
        ...p.conversation.toJSON(),
        unreadCount: p.lastReadMessageId ? 
          (p.conversation.lastMessageId === p.lastReadMessageId ? 0 : 1) : 
          (p.conversation.lastMessageId ? 1 : 0)
      })),
      total: participants.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(participants.count / limit)
    });

  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      message: 'Error retrieving conversations',
      error: error.message
    });
  }
};

// Get single conversation
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture']
            }
          ]
        },
        {
          model: Message,
          as: 'lastMessage',
          include: [
            {
              model: UserTable,
              as: 'sender',
              attributes: ['id', 'fullName']
            }
          ]
        },
        {
          model: UserTable,
          as: 'creator',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    res.json({
      conversation,
      unreadCount: participant.lastReadMessageId ? 
        (conversation.lastMessageId === participant.lastReadMessageId ? 0 : 1) : 
        (conversation.lastMessageId ? 1 : 0)
    });

  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      message: 'Error retrieving conversation',
      error: error.message
    });
  }
};

// Create new conversation
const createConversation = async (req, res) => {
  try {
    const { type = 'direct', name, description, participants } = req.body;
    const userId = req.user.id;

    // Validate participants
    if (!participants || participants.length === 0) {
      return res.status(400).json({
        message: 'At least one participant is required'
      });
    }

    // Add creator to participants if not already included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // For direct conversations, ensure only 2 participants
    if (type === 'direct' && participants.length !== 2) {
      return res.status(400).json({
        message: 'Direct conversations must have exactly 2 participants'
      });
    }

    // Check if direct conversation already exists
    if (type === 'direct') {
      const existingConversation = await Conversation.findOne({
        where: { type: 'direct' },
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: { [Op.in]: participants }, isActive: true }
          }
        ]
      });

      if (existingConversation) {
        return res.status(400).json({
          message: 'Direct conversation already exists',
          conversationId: existingConversation.id
        });
      }
    }

    // Create conversation
    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : null,
      description: type === 'group' ? description : null,
      createdBy: userId
    });

    // Add participants
    const participantData = participants.map(participantId => ({
      conversationId: conversation.id,
      userId: participantId,
      role: participantId === userId ? 'admin' : 'member'
    }));

    await ConversationParticipant.bulkCreate(participantData);

    // Load conversation with participants
    const conversationWithParticipants = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture']
            }
          ]
        },
        {
          model: UserTable,
          as: 'creator',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.status(201).json({
      message: 'Conversation created successfully',
      data: conversationWithParticipants
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      message: 'Error creating conversation',
      error: error.message
    });
  }
};

// Add participant to conversation
const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, role = 'member' } = req.body;
    const currentUserId = req.user.id;

    // Check if current user is admin
    const currentParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId: currentUserId, isActive: true }
    });

    if (!currentParticipant || currentParticipant.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can add participants'
      });
    }

    // Check if user is already a participant
    const existingParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId }
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        return res.status(400).json({
          message: 'User is already a participant'
        });
      } else {
        // Reactivate participant
        await existingParticipant.update({
          isActive: true,
          leftAt: null
        });
      }
    } else {
      // Add new participant
      await ConversationParticipant.create({
        conversationId,
        userId,
        role
      });
    }

    res.json({
      message: 'Participant added successfully'
    });

  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({
      message: 'Error adding participant',
      error: error.message
    });
  }
};

// Remove participant from conversation
const removeParticipant = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if current user is admin or removing themselves
    const currentParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId: currentUserId, isActive: true }
    });

    if (!currentParticipant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    if (currentParticipant.role !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({
        message: 'Only admins can remove other participants'
      });
    }

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Participant not found'
      });
    }

    await participant.update({
      isActive: false,
      leftAt: new Date()
    });

    res.json({
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      message: 'Error removing participant',
      error: error.message
    });
  }
};

// Update conversation
const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can update conversation'
      });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Only allow updates for group conversations
    if (conversation.type === 'direct') {
      return res.status(400).json({
        message: 'Direct conversations cannot be updated'
      });
    }

    await conversation.update({
      name,
      description,
      avatar
    });

    res.json({
      message: 'Conversation updated successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      message: 'Error updating conversation',
      error: error.message
    });
  }
};

// Mark conversation as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    await participant.update({
      lastReadAt: new Date(),
      lastReadMessageId: conversation.lastMessageId
    });

    res.json({
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({
      message: 'Error marking conversation as read',
      error: error.message
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  addParticipant,
  removeParticipant,
  updateConversation,
  markAsRead
}; 