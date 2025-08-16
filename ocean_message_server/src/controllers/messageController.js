const { Message, Conversation, ConversationParticipant, UserReference, MessageReaction } = require('../../models');
const { Op } = require('sequelize');

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, beforeId } = req.query;
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

    const offset = (page - 1) * limit;
    const whereClause = {
      conversationId,
      isDeleted: false
    };

    // If beforeId is provided, get messages before that ID
    if (beforeId) {
      whereClause.id = { [Op.lt]: beforeId };
    }

    const messages = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'profilePicture']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
            {
              model: UserReference,
              as: 'sender',
              attributes: ['id', 'fullName']
            }
          ]
        },
        {
          model: MessageReaction,
          as: 'reactions',
          include: [
            {
              model: UserReference,
              as: 'user',
              attributes: ['id', 'fullName']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Update last read
    if (messages.rows.length > 0) {
      await participant.update({
        lastReadAt: new Date(),
        lastReadMessageId: messages.rows[0].id
      });
    }

    res.json({
      messages: messages.rows.reverse(), // Reverse to get chronological order
      total: messages.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(messages.count / limit),
      hasMore: messages.count > offset + messages.rows.length
    });

  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      message: 'Error retrieving messages',
      error: error.message
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyToId, mediaUrl, mediaType } = req.body;
    const userId = req.user.id;

    // Validate conversation access
    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    // Validate content
    if (!content && !mediaUrl) {
      return res.status(400).json({
        message: 'Message content or media is required'
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      type,
      replyToId,
      mediaUrl,
      mediaType,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update conversation last message
    await Conversation.update(
      {
        lastMessageAt: new Date(),
        lastMessageId: message.id
      },
      { where: { id: conversationId } }
    );

    // Load message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'profilePicture']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
            {
              model: UserReference,
              as: 'sender',
              attributes: ['id', 'fullName']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageWithSender
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Edit a message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: { id: messageId, senderId: userId, isDeleted: false }
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or you do not have permission to edit it'
      });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      return res.status(400).json({
        message: 'Message cannot be edited after 15 minutes'
      });
    }

    await message.update({
      content,
      isEdited: true,
      editedAt: new Date()
    });

    res.json({
      message: 'Message updated successfully',
      data: message
    });

  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: { id: messageId, senderId: userId, isDeleted: false }
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or you do not have permission to delete it'
      });
    }

    await message.update({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    res.json({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user.id;

    // Check if message exists
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user is participant in conversation
    const participant = await ConversationParticipant.findOne({
      where: { conversationId: message.conversationId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    // Check if reaction already exists
    const existingReaction = await MessageReaction.findOne({
      where: { messageId, userId, reaction }
    });

    if (existingReaction) {
      return res.status(400).json({
        message: 'Reaction already exists'
      });
    }

    // Create reaction
    const messageReaction = await MessageReaction.create({
      messageId,
      userId,
      reaction
    });

    // Load reaction with user info
    const reactionWithUser = await MessageReaction.findByPk(messageReaction.id, {
      include: [
        {
          model: UserReference,
          as: 'user',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.status(201).json({
      message: 'Reaction added successfully',
      data: reactionWithUser
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

// Remove reaction from message
const removeReaction = async (req, res) => {
  try {
    const { messageId, reaction } = req.params;
    const userId = req.user.id;

    const messageReaction = await MessageReaction.findOne({
      where: { messageId, userId, reaction }
    });

    if (!messageReaction) {
      return res.status(404).json({
        message: 'Reaction not found'
      });
    }

    await messageReaction.destroy();

    res.json({
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      message: 'Error removing reaction',
      error: error.message
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
}; 