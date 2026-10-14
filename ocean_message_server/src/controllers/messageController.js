const { Message, Conversation, ConversationParticipant, UserReference, MessageReaction, Notification } = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { checkBlockRelationship } = require('../utils/userBlockHelper');
const { sanitizeProfilePicture } = require('../utils/urlHelper');

// Helper: check if target user is currently in the conversation socket room
const isUserInConversationRoom = (io, conversationId, targetUserId) => {
  if (!io || !conversationId || !targetUserId) return false;
  try {
    const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    if (!room) return false;
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (s && String(s.userId) === String(targetUserId)) {
        return true;
      }
    }
  } catch (err) {
    console.error('Error checking user in socket room:', err.message);
  }
  return false;
};

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
    const { page = 1, limit = 50, before, beforeId } = req.query;
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

    const parsedLimit = parseInt(limit, 10) || 50;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const whereConditions = [
      { conversationId },
      { isDeleted: false }
    ];

    // Check if user has cleared messages in this conversation (Requirement 5)
    let clearedAt = null;
    if (participant.metadata) {
      try {
        const meta = typeof participant.metadata === 'string'
          ? JSON.parse(participant.metadata)
          : participant.metadata;
        if (meta && meta.clearedAt) {
          clearedAt = new Date(meta.clearedAt);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    if (clearedAt) {
      whereConditions.push({ createdAt: { [Op.gt]: clearedAt } });
    }

    // Cursor-based pagination: before=<messageId> or beforeId=<messageId> (Requirement 2)
    const targetBefore = before || beforeId;
    if (targetBefore) {
      const refMessage = await Message.findByPk(targetBefore);
      if (refMessage) {
        whereConditions.push({ createdAt: { [Op.lt]: refMessage.createdAt } });
      } else {
        whereConditions.push({ id: { [Op.lt]: targetBefore } });
      }
    }

    const whereClause = {
      [Op.and]: whereConditions
    };

    const messages = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
            {
              model: UserReference,
              as: 'sender',
              attributes: ['id', 'fullName', 'businessName', 'accountType', 'sellerId']
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
      limit: parsedLimit,
      offset: targetBefore ? 0 : offset
    });

    // Update last read
    if (messages.rows.length > 0) {
      await participant.update({
        lastReadAt: new Date(),
        lastReadMessageId: messages.rows[0].id
      });
    }

    const totalPages = Math.ceil(messages.count / parsedLimit);
    const hasMore = messages.count > offset + messages.rows.length;

    // Messages must be ordered chronologically (oldest first) within the page
    const chronologicalMessages = messages.rows.reverse().map(msg => {
      const m = msg.toJSON ? msg.toJSON() : { ...msg };
      if (m.sender) {
        m.sender.profilePicture = sanitizeProfilePicture(m.sender.profilePicture);
        m.sender.avatar = m.sender.profilePicture;
      }
      if (m.replyTo && m.replyTo.sender) {
        m.replyTo.sender.profilePicture = sanitizeProfilePicture(m.replyTo.sender.profilePicture);
        m.replyTo.sender.avatar = m.replyTo.sender.profilePicture;
      }
      return m;
    });

    res.json({
      messages: chronologicalMessages,
      pagination: {
        currentPage: parsedPage,
        totalPages,
        totalMessages: messages.count,
        hasMore
      },
      // Backward compatibility for existing Flutter mobile app
      total: messages.count,
      currentPage: parsedPage,
      totalPages,
      hasMore
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
    let { 
      conversationId, 
      recipientId,
      receiverId,
      content, 
      type = 'text', 
      replyToId, 
      mediaUrl, 
      mediaType,
      // Reference fields for context tracking (Requirement 4)
      referenceType,
      referenceId,
      referenceTitle,
      referenceCategory,
      storyMetadata,
      marketMetadata,
      metadata,
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

    // Support recipientId / receiverId if conversationId is not passed
    const targetRecipientId = recipientId || receiverId;
    if (!conversationId && targetRecipientId) {
      console.log(`🔍 Finding or creating direct conversation between ${userId} and ${targetRecipientId}`);
      // Find existing direct conversation
      const participants = await ConversationParticipant.findAll({
        where: { userId: [userId, targetRecipientId], isActive: true }
      });

      const conversationCounts = {};
      for (const p of participants) {
        conversationCounts[p.conversationId] = (conversationCounts[p.conversationId] || 0) + 1;
        if (conversationCounts[p.conversationId] === 2) {
          const directConv = await Conversation.findOne({
            where: { id: p.conversationId, type: 'direct' }
          });
          if (directConv) {
            conversationId = directConv.id;
            break;
          }
        }
      }

      // If still not found, create new direct conversation atomically
      if (!conversationId) {
        const newConv = await Conversation.create({
          type: 'direct',
          createdBy: userId
        });
        await ConversationParticipant.bulkCreate([
          { conversationId: newConv.id, userId, role: 'admin' },
          { conversationId: newConv.id, userId: targetRecipientId, role: 'member' }
        ]);
        conversationId = newConv.id;
      }
    }

    if (!conversationId) {
      return res.status(400).json({
        message: 'conversationId or recipientId is required'
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

    // Fetch other active participants in this conversation
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
          attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType']
        }
      ]
    });

    // Check user block enforcement (Requirement 5)
    for (const other of otherParticipants) {
      const blockCheck = await checkBlockRelationship(userId, other.userId);
      if (blockCheck.isBlocked) {
        return res.status(403).json({
          message: 'You cannot message this user',
          code: 'USER_BLOCKED'
        });
      }
    }

    // Validate content
    if (!content && !mediaUrl) {
      return res.status(400).json({
        message: 'Message content or media is required'
      });
    }

    // Normalize referenceType: frontend may send 'demand', DB stores 'buyer_need'
    const normalizedReferenceType = referenceType === 'demand' ? 'buyer_need' : referenceType;

    // Build unified metadata object for story / market item previews
    let combinedMetadata = {};
    if (metadata) {
      try {
        combinedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : { ...metadata };
      } catch (e) {
        combinedMetadata = {};
      }
    }
    if (storyMetadata) {
      combinedMetadata.storyMetadata = storyMetadata;
    }
    if (marketMetadata) {
      combinedMetadata.marketMetadata = marketMetadata;
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
      // Reference fields for context tracking (Requirement 4)
      referenceType: normalizedReferenceType,
      referenceId,
      referenceTitle,
      referenceCategory,
      metadata: Object.keys(combinedMetadata).length > 0 ? combinedMetadata : null,
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
        const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:5000';
        
        const reachResponse = await axios.post(
          `${mainServerUrl}/api/buyer-needs/${buyerNeedId}/increment-reach`,
          {},
          {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (reachResponse.data.success) {
          console.log(`✅ Reach incremented successfully: ${reachResponse.data.currentReach}/${reachResponse.data.reachLimit}`);
          const reachInfo = {
            currentReach: reachResponse.data.currentReach,
            reachLimit: reachResponse.data.reachLimit,
            reachExceeded: reachResponse.data.reachExceeded,
            canContact: reachResponse.data.canContact
          };
          
          combinedMetadata.reachInfo = reachInfo;
          await message.update({
            metadata: combinedMetadata
          });
        }
      } catch (reachError) {
        console.error('❌ Error incrementing reach:', reachError.message);
      }
    }

    // Get sender info for notifications and response
    const sender = await UserReference.findByPk(userId, {
      attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
    });

    const senderDisplayName = sender?.businessName || sender?.fullName || 'Someone';
    const messagePreviewText = content 
      ? (content.length > 50 ? content.substring(0, 50) + '...' : content) 
      : 'Sent a media message';

    const io = req.app.get('io');

    // Send notifications to other participants (not the sender)
    for (const participant of otherParticipants) {
      const notificationMetadata = { 
        conversationId,
        messageId: message.id,
        senderId: userId,
        senderName: senderDisplayName,
        messagePreview: content ? content.substring(0, 100) : 'Media message',
        messageType: type
      };

      if (normalizedReferenceType && referenceId) {
        notificationMetadata.reference = {
          type: normalizedReferenceType,
          id: referenceId,
          title: referenceTitle,
          category: referenceCategory
        };
      }

      if (buyerNeedId && (referenceType === 'buyer_need' || referenceType === 'demand')) {
        notificationMetadata.buyerNeedId = buyerNeedId;
        notificationMetadata.isBuyerNeedMessage = true;
      }

      const notification = await createNotification(
        participant.userId,
        'New Message Received',
        `${senderDisplayName}: ${messagePreviewText}`,
        'info',
        'message',
        notificationMetadata
      );

      // Check if user is currently active in the socket room (Requirement 6)
      const userIsActiveInRoom = isUserInConversationRoom(io, conversationId, participant.userId);

      if (!userIsActiveInRoom) {
        // FCM Data Payload for chat messages conforming to frontend spec (Requirement 6)
        const pushData = {
          type: 'chat_message',
          conversationId: String(conversationId),
          senderId: String(userId),
          senderName: senderDisplayName,
          senderAvatar: sanitizeProfilePicture(sender?.profilePicture) || '',
          messageId: String(message.id),
          messagePreview: content ? content.substring(0, 100) : 'Media message',
          referenceType: normalizedReferenceType || '',
          referenceId: referenceId ? String(referenceId) : '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          category: 'message',
          notificationId: notification ? String(notification.id) : '',
          relatedEntityId: String(conversationId)
        };

        sendPushViaMainServer(
          participant.userId,
          senderDisplayName,
          messagePreviewText,
          pushData
        );
      } else {
        console.log(`📱 User ${participant.userId} is active in conversation room. Push suppressed.`);
      }
    }

    // Load message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: UserReference,
          as: 'sender',
          attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
            {
              model: UserReference,
              as: 'sender',
              attributes: ['id', 'fullName', 'businessName', 'accountType', 'sellerId']
            }
          ]
        }
      ]
    });

    const formattedMsg = messageWithSender ? (messageWithSender.toJSON ? messageWithSender.toJSON() : { ...messageWithSender }) : messageWithSender;
    if (formattedMsg && formattedMsg.sender) {
      formattedMsg.sender.profilePicture = sanitizeProfilePicture(formattedMsg.sender.profilePicture);
      formattedMsg.sender.avatar = formattedMsg.sender.profilePicture;
    }
    if (formattedMsg && formattedMsg.replyTo && formattedMsg.replyTo.sender) {
      formattedMsg.replyTo.sender.profilePicture = sanitizeProfilePicture(formattedMsg.replyTo.sender.profilePicture);
      formattedMsg.replyTo.sender.avatar = formattedMsg.replyTo.sender.profilePicture;
    }

    // Broadcast new_message event via Socket.IO if io is available
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new_message', {
        message: formattedMsg,
        conversationId
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: formattedMsg
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

// Security helper: verify binary magic numbers so executables/scripts masked as images are rejected
const validateImageMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  // GIF: 47 49 46 38 ('GIF8')
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;

  // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;

  // HEIC / HEIF (ftyp)
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) return true;
  }

  return false;
};

// Upload media attachment for chat messages (POST /api/messages/upload) - strictly images only
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide an image file in the "media" field.'
      });
    }

    // Security validation: verify binary content is a genuine safe image (no executables, documents, audio, or scripts)
    if (!validateImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Security validation failed: Only safe image files (JPEG, PNG, WEBP, GIF, HEIC) are permitted.'
      });
    }

    const storageService = require('../services/storageService');
    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      'ocean_app/chat_media',
      {
        resource_type: 'image',
        filename: req.file.originalname,
        mimetype: req.file.mimetype
      }
    );

    return res.status(200).json({
      success: true,
      mediaUrl: uploadResult.url,
      mediaType: req.file.mimetype,
      publicId: uploadResult.publicId || null,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading message media:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload media attachment',
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
  removeReaction,
  uploadMedia
}; 