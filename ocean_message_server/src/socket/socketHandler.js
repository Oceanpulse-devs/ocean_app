const { Message, Conversation, ConversationParticipant, UserReference } = require('../../models');

const socketHandler = (io, socket) => {
  console.log(`🔌 Socket handler initialized for user: ${socket.userId}`);

  // Join user to their conversations
  const joinUserConversations = async () => {
    try {
      const participants = await ConversationParticipant.findAll({
        where: { userId: socket.userId, isActive: true },
        include: [{ model: Conversation, as: 'conversation' }]
      });

      participants.forEach(participant => {
        socket.join(`conversation:${participant.conversationId}`);
        console.log(`👥 User ${socket.userId} joined conversation: ${participant.conversationId}`);
      });
    } catch (error) {
      console.error('Error joining conversations:', error);
    }
  };

  // Join conversations on connection
  joinUserConversations();

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text', replyToId, mediaUrl, mediaType } = data;

      // Validate conversation access
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId, isActive: true }
      });

      if (!participant) {
        socket.emit('error', { message: 'You are not a participant in this conversation' });
        return;
      }

      // Create message
      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content,
        type,
        replyToId,
        mediaUrl,
        mediaType,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

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

      // Update conversation last message
      await Conversation.update(
        {
          lastMessageAt: new Date(),
          lastMessageId: message.id
        },
        { where: { id: conversationId } }
      );

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('new_message', {
        message: messageWithSender,
        conversationId
      });

      // Emit delivery receipt to sender
      socket.emit('message_sent', {
        messageId: message.id,
        conversationId,
        timestamp: new Date()
      });

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

      // Emit read receipt to conversation
      socket.to(`conversation:${conversationId}`).emit('message_read', {
        conversationId,
        messageId,
        readBy: socket.userId,
        readAt: new Date()
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      console.log(`🔌 User ${socket.userId} disconnected`);
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