const { Message, Conversation, ConversationParticipant, UserReference } = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');
const PresenceService = require('../services/presenceService');
const { checkBlockRelationship } = require('../utils/userBlockHelper');
const { sanitizeProfilePicture } = require('../utils/urlHelper');

// Helper: send push via main server from socket events
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
    console.error('Push via main server failed from socket:', err?.message || err);
  }
};

// Helper: check if user is active in conversation socket room
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

const socketHandler = (io, socket) => {
  console.log(`🔌 Socket handler initialized for user: ${socket.userId}`);

  // Join user to their conversations and announce online presence
  const joinUserConversationsAndInitPresence = async () => {
    try {
      const participants = await ConversationParticipant.findAll({
        where: { userId: socket.userId, isActive: true },
        include: [{ model: Conversation, as: 'conversation' }]
      });

      participants.forEach(participant => {
        socket.join(`conversation:${participant.conversationId}`);
        console.log(`👥 User ${socket.userId} joined conversation: ${participant.conversationId}`);
      });

      // Update Redis presence state
      await PresenceService.setUserOnline(socket.userId, socket.id);

      // Broadcast user_online to all conversation rooms the user belongs to
      participants.forEach(participant => {
        socket.to(`conversation:${participant.conversationId}`).emit('user_online', {
          userId: socket.userId,
          isOnline: true
        });
      });
    } catch (error) {
      console.error('Error joining conversations and setting online presence:', error);
    }
  };

  // Join conversations on connection
  joinUserConversationsAndInitPresence();

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { 
        conversationId, 
        content, 
        type = 'text', 
        replyToId, 
        mediaUrl, 
        mediaType,
        referenceType,
        referenceId,
        referenceTitle,
        referenceCategory,
        storyMetadata,
        marketMetadata,
        metadata
      } = data;

      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) {
        socket.emit('error', { message: 'You are not a participant in this conversation' });
        return;
      }

      // Check user block enforcement (Requirement 5)
      const otherParticipants = await ConversationParticipant.findAll({
        where: { 
          conversationId, 
          userId: { [Op.ne]: socket.userId }, 
          isActive: true 
        }
      });

      for (const other of otherParticipants) {
        const blockCheck = await checkBlockRelationship(socket.userId, other.userId);
        if (blockCheck.isBlocked) {
          socket.emit('error', {
            message: 'You cannot message this user',
            code: 'USER_BLOCKED'
          });
          return;
        }
      }

      // Normalize referenceType: frontend may send 'demand', DB stores 'buyer_need'
      const normalizedReferenceType = referenceType === 'demand' ? 'buyer_need' : referenceType;

      // Build unified metadata object
      let combinedMetadata = {};
      if (metadata) {
        try {
          combinedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : { ...metadata };
        } catch (e) {
          combinedMetadata = {};
        }
      }
      if (storyMetadata) combinedMetadata.storyMetadata = storyMetadata;
      if (marketMetadata) combinedMetadata.marketMetadata = marketMetadata;

      // Create message
      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content,
        type,
        replyToId,
        mediaUrl,
        mediaType,
        referenceType: normalizedReferenceType,
        referenceId,
        referenceTitle,
        referenceCategory,
        metadata: Object.keys(combinedMetadata).length > 0 ? combinedMetadata : null,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

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

      // Update conversation last message
      await Conversation.update(
        {
          lastMessageAt: new Date(),
          lastMessageId: message.id
        },
        { where: { id: conversationId } }
      );

      const formattedMsg = messageWithSender ? (messageWithSender.toJSON ? messageWithSender.toJSON() : { ...messageWithSender }) : messageWithSender;
      if (formattedMsg && formattedMsg.sender) {
        formattedMsg.sender.profilePicture = sanitizeProfilePicture(formattedMsg.sender.profilePicture);
        formattedMsg.sender.avatar = formattedMsg.sender.profilePicture;
      }
      if (formattedMsg && formattedMsg.replyTo && formattedMsg.replyTo.sender) {
        formattedMsg.replyTo.sender.profilePicture = sanitizeProfilePicture(formattedMsg.replyTo.sender.profilePicture);
        formattedMsg.replyTo.sender.avatar = formattedMsg.replyTo.sender.profilePicture;
      }

      // Emit to conversation room (Requirement 3: new_message event)
      io.to(`conversation:${conversationId}`).emit('new_message', {
        message: formattedMsg,
        conversationId
      });

      // Emit delivery receipt to sender (Requirement 3: message_sent event)
      socket.emit('message_sent', {
        messageId: message.id,
        conversationId,
        timestamp: new Date()
      });

      // FCM push notification to participants not in the room (Requirement 6)
      const senderDisplayName = messageWithSender.sender?.businessName || messageWithSender.sender?.fullName || 'Someone';
      const messagePreviewText = content 
        ? (content.length > 50 ? content.substring(0, 50) + '...' : content) 
        : 'Sent a media message';

      for (const other of otherParticipants) {
        const inRoom = isUserInConversationRoom(io, conversationId, other.userId);
        if (!inRoom) {
          const pushData = {
            type: 'chat_message',
            conversationId: String(conversationId),
            senderId: String(socket.userId),
            senderName: senderDisplayName,
            senderAvatar: sanitizeProfilePicture(messageWithSender.sender?.profilePicture) || '',
            messageId: String(message.id),
            messagePreview: content ? content.substring(0, 100) : 'Media message',
            referenceType: normalizedReferenceType || '',
            referenceId: referenceId ? String(referenceId) : '',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            category: 'message',
            relatedEntityId: String(conversationId)
          };

          sendPushViaMainServer(
            other.userId,
            senderDisplayName,
            messagePreviewText,
            pushData
          );
        }
      }

      console.log(`💬 Message sent in conversation ${conversationId} by user ${socket.userId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing_start', async (data) => {
    try {
      const { conversationId } = data;
      
      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) return;

      // Emit to other participants
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.user.fullName,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing_stop', async (data) => {
    try {
      const { conversationId } = data;
      
      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) return;

      // Emit to other participants
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.user.fullName,
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  // Handle message read
  socket.on('mark_read', async (data) => {
    try {
      const { conversationId, messageId } = data;

      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) return;

      // Update last read
      await participant.update({
        lastReadAt: new Date(),
        lastReadMessageId: messageId
      });

      // Emit read receipt to conversation (new messages_read contract + legacy message_read)
      const readAt = new Date().toISOString();
      socket.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        readerId: socket.userId,
        readAt
      });
      socket.to(`conversation:${conversationId}`).emit('message_read', {
        conversationId,
        messageId,
        readBy: socket.userId,
        readAt
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnect with 15s grace period
  socket.on('disconnect', async () => {
    try {
      console.log(`🔌 User ${socket.userId} socket ${socket.id} disconnected`);
      await PresenceService.setUserOffline(socket.userId, socket.id, async ({ userId, isOnline, lastSeen }) => {
        try {
          const participants = await ConversationParticipant.findAll({
            where: { userId, isActive: true }
          });
          participants.forEach(p => {
            io.to(`conversation:${p.conversationId}`).emit('user_offline', {
              userId,
              isOnline: false,
              lastSeen
            });
          });
          console.log(`🔴 User ${userId} confirmed offline after grace period. Broadcasted user_offline.`);
        } catch (broadcastErr) {
          console.error('Error broadcasting user_offline:', broadcastErr);
        }
      });
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle join conversation
  socket.on('join_conversation', async (data) => {
    try {
      const { conversationId } = data;
      
      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) {
        socket.emit('error', { message: 'You are not a participant in this conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`👥 User ${socket.userId} joined conversation: ${conversationId}`);

    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle leave conversation
  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation:${conversationId}`);
    console.log(`👥 User ${socket.userId} left conversation: ${conversationId}`);
  });
};

module.exports = socketHandler; 