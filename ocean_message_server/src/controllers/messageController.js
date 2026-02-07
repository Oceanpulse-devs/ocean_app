const { Message, Conversation, ConversationParticipant, UserReference, MessageReaction, Notification } = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Helper: call main server to send FCM push (non-blocking)
const sendPushViaMainServer = async (userId, title, body, data) => {
  const mainUrl = process.env.MAIN_SERVER_URL || 'http://localhost:5000';
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return;

  try {
    await axios.post(
      `${mainUrl}/api/internal/send-push`,
      { userId, title, body, data },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      }
    );
  } catch (err) {
    console.error('Push via main server failed:', err?.message || err);
  }
};

// Helper function to create notifications
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      category,
      metadata
    });
    console.log(`📧 Message notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating message notification:', error);
    // Don't throw - notifications are optional, but log the error
    return null;
  }
};

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
          attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'businessName', 'accountType']
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
    const { 
      conversationId, 
      content, 
      type = 'text', 
      replyToId, 
      mediaUrl, 
      mediaType,
      // Reference fields for context tracking
      referenceType,
      referenceId,
      referenceTitle,
      referenceCategory,
      buyerNeedId, // Special field to indicate if message is from buyer needs page
      senderId: overrideSenderId
    } = req.body;
    const isInternalCall = req.user?.isInternal;
    const userId = isInternalCall ? overrideSenderId : req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        message: 'Sender ID is required.'
      });
    }

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

    // Normalize referenceType: frontend may send 'demand', DB stores 'buyer_need'
    const normalizedReferenceType = referenceType === 'demand' ? 'buyer_need' : referenceType;

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      type,
      replyToId,
      mediaUrl,
      mediaType,
      // Reference fields for context tracking
      referenceType: normalizedReferenceType,
      referenceId,
      referenceTitle,
      referenceCategory,
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

    // Handle reach increment for buyer need messages (demand = buyer_need)
    if (buyerNeedId && (referenceType === 'buyer_need' || referenceType === 'demand')) {
      try {
        console.log(`📈 Incrementing reach for buyer need: ${buyerNeedId}`);
        
        // Make API call to main server to increment reach
        const axios = require('axios');
        const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:3000';
        
        const reachResponse = await axios.post(
          `${mainServerUrl}/api/buyer-needs/${buyerNeedId}/increment-reach`,
          {},
          {
            headers: {
              'Authorization': req.headers.authorization, // Forward the auth token
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (reachResponse.data.success) {
          console.log(`✅ Reach incremented successfully: ${reachResponse.data.currentReach}/${reachResponse.data.reachLimit}`);
          
          // Update notification metadata to include reach info
          const reachInfo = {
            currentReach: reachResponse.data.currentReach,
            reachLimit: reachResponse.data.reachLimit,
            reachExceeded: reachResponse.data.reachExceeded,
            canContact: reachResponse.data.canContact
          };
          
          // Store reach info in message metadata for later use
          await message.update({
            metadata: JSON.stringify({ reachInfo })
          });
        }
      } catch (reachError) {
        console.error('❌ Error incrementing reach:', reachError.message);
        // Don't fail the message sending if reach increment fails
      }
    }

    // Send notifications to other participants (not the sender)
    const otherParticipants = await ConversationParticipant.findAll({
      where: { 
        conversationId, 
        userId: { [Op.ne]: userId }, 
        isActive: true 
      },
      include: [
        {
          model: UserReference,
          as: 'user',
          attributes: ['id', 'fullName', 'profilePicture']
        }
      ]
    });

    // Get sender info for notifications
    const sender = await UserReference.findByPk(userId, {
      attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType']
    });

    // Send notification to each participant
    for (const participant of otherParticipants) {
      const notificationMetadata = { 
        conversationId: conversationId,
        messageId: message.id,
        senderId: userId,
        senderName: sender.businessName || sender.fullName,
        messagePreview: content ? content.substring(0, 100) : 'Media message',
        messageType: type
      };

      // Add reference information if available
      if (referenceType && referenceId) {
        notificationMetadata.reference = {
          type: referenceType,
          id: referenceId,
          title: referenceTitle,
          category: referenceCategory
        };
      }

      // Add reach information if this is a buyer need message (demand = buyer_need)
      if (buyerNeedId && (referenceType === 'buyer_need' || referenceType === 'demand')) {
        notificationMetadata.buyerNeedId = buyerNeedId;
        notificationMetadata.isBuyerNeedMessage = true;
      }

      const notification = await createNotification(
        participant.userId,
        'New Message Received',
        `${sender.businessName || sender.fullName}: ${content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Sent a media message'}`,
        'info',
        'message',
        notificationMetadata
      );

      // Send push via main server (non-blocking)
      if (notification) {
        const pushData = {
          ...notificationMetadata,
          type: 'message',
          category: 'message',
          notificationId: notification.id,
          createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
          relatedEntityId: conversationId
        };
        sendPushViaMainServer(
          participant.userId,
          'New Message Received',
          `${sender.businessName || sender.fullName}: ${content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Sent a media message'}`,
          pushData
        );
      }
    }

    // Load message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'businessName', 'accountType']
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