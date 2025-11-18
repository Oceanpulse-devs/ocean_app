const { Conversation, ConversationParticipant, UserReference, Message } = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Helper function to format participant with both userId and sellerId
const formatParticipant = (participant) => {
  const user = participant.user || participant;
  const userData = user.toJSON ? user.toJSON() : user;
  
  const formatted = {
    userId: userData.id,  // User Table ID
    sellerId: userData.sellerId || null,  // Seller Table ID (if seller)
    fullName: userData.fullName,
    profilePicture: userData.profilePicture || null,
    accountType: userData.accountType || 'buyer',
    businessName: userData.businessName || null,
    isOnline: false, // TODO: Add online status tracking if available
    user: {
      id: userData.id,
      fullName: userData.fullName,
      profilePicture: userData.profilePicture || null,
      sellerId: userData.sellerId || null  // Also in nested object
    }
  };
  
  return formatted;
};

// Helper function to sync user from main server
const syncUserFromMainServer = async (userId) => {
  try {
    const mainServerUrl = process.env.MAIN_SERVER_URL || 'https://mainserver-production-7ad9.up.railway.app';
    
    // Check if user already exists in messaging system
    const existingUser = await UserReference.findByPk(userId);
    if (existingUser) {
      console.log('✅ User already exists in messaging system:', userId);
      
      // If businessName or sellerId is missing but user is a seller, try to fetch and update it
      if (existingUser.accountType === 'seller' && (!existingUser.businessName || !existingUser.sellerId)) {
        console.log('🔄 Seller missing businessName or sellerId, attempting to fetch...');
        try {
          const response = await axios.get(`${mainServerUrl}/api/user/${userId}`, {
            timeout: 5000,
            headers: { 'User-Agent': 'MessagingServer/1.0' }
          });
          
          if (response.data && response.data.data) {
            const data = response.data.data;
            const updateData = {};
            
            if (data.businessName && !existingUser.businessName) {
              updateData.businessName = data.businessName;
              console.log(`✅ Updated businessName: ${data.businessName}`);
            }
            
            if (data.sellerId && !existingUser.sellerId) {
              updateData.sellerId = data.sellerId;
              console.log(`✅ Updated sellerId: ${data.sellerId}`);
            }
            
            if (Object.keys(updateData).length > 0) {
              await existingUser.update(updateData);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch seller data:', error.message);
        }
      }
      
      return existingUser;
    }

    console.log(`🔄 Fetching user ${userId} from: ${mainServerUrl}/api/user/${userId}`);
    
    let userData = null;
    
    // Try to fetch from user endpoint first (returns businessName for sellers)
    try {
    const response = await axios.get(`${mainServerUrl}/api/user/${userId}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'MessagingServer/1.0'
      }
    });
    
    console.log(`✅ User fetch response status: ${response.status}`);
    console.log(`📋 User data received:`, response.data);

    if (response.data && response.data.data) {
        const data = response.data.data;
        userData = data;
        
        // Extract businessName if available (getUserProfileById returns it directly for sellers)
        if (data.businessName) {
          console.log(`🏪 Found business name: ${data.businessName}`);
        }
        
        // Extract sellerId if user is a seller
        if ((data.accountType === 'seller' || data.role === 'seller') && data.sellerId) {
          userData.sellerId = data.sellerId;
          console.log(`🏪 Found sellerId: ${userData.sellerId}`);
        }
      }
    } catch (userError) {
      console.log(`⚠️ User not found in users table, trying seller endpoint...`);
      
      // Try to fetch from seller endpoint
      try {
        // First try /api/admin/sellers/:id
        const sellerResponse = await axios.get(`${mainServerUrl}/api/admin/sellers/${userId}`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'MessagingServer/1.0'
          }
        });
        
        console.log(`✅ Seller fetch response status: ${sellerResponse.status}`);
        console.log(`📋 Seller data received:`, sellerResponse.data);

        if (sellerResponse.data && sellerResponse.data.data) {
          const sellerData = sellerResponse.data.data;
          userData = {
            id: sellerData.userId || sellerData.id || userId,
            fullName: sellerData.businessName || sellerData.fullName || 'Unknown Seller',
            email: sellerData.businessEmail || `${userId}@temp.com`,
            profilePicture: sellerData.businessLogo || null,
            role: 'seller',
            accountStatus: 'active',
            sellerId: sellerData.id || sellerData.sellerId || null // Store Seller Table ID
          };
        }
      } catch (sellerError) {
        console.log(`❌ Seller not found at /api/admin/sellers/${userId}`);
        console.log(`   Error: ${sellerError.message}`);
      }
    }

    // If we have user data, create the user record
    if (userData) {
      const newUser = await UserReference.create({
        id: userData.id,
        fullName: userData.fullName || `User ${userId.substring(0, 8)}`,
        email: userData.email || `${userId}@temp.com`,
        password: 'temp_password', // Required field
        profilePicture: userData.profilePicture || null,
        accountType: userData.role || 'buyer',
        accountStatus: userData.accountStatus || 'active',
        username: userData.username || null,
        bio: userData.bio || null,
        location: userData.location || null,
        website: userData.website || null,
        emailVerified: userData.emailVerified || false,
        businessName: userData.businessName || null, // Store business name for sellers
        sellerId: userData.sellerId || null // Store Seller Table ID if seller
      });

      console.log('✅ User synced successfully:', newUser.id);
      return newUser;
    }
    
    // If no user data found, create a minimal user record as fallback
    console.log('⚠️ No user data found, creating minimal user record');
    const fallbackUser = await UserReference.create({
      id: userId,
      fullName: `User ${userId.substring(0, 8)}`,
      email: `${userId}@temp.com`,
      password: 'temp_password', // Required field
      profilePicture: null,
      accountType: 'buyer',
      accountStatus: 'active',
      username: null,
      bio: null,
      location: null,
      website: null,
      emailVerified: false,
      businessName: null,
      sellerId: null
    });
    
    console.log('⚠️ Created fallback user:', fallbackUser.id);
    return fallbackUser;
    
  } catch (error) {
    console.error('❌ Error syncing user from main server:', error.message);
    
    // Create a minimal user record as fallback
    try {
      const fallbackUser = await UserReference.create({
        id: userId,
        fullName: `User ${userId.substring(0, 8)}`,
        email: `${userId}@temp.com`,
        password: 'temp_password', // Required field
        profilePicture: null,
        accountType: 'buyer',
        accountStatus: 'active',
        username: null,
        bio: null,
        location: null,
        website: null,
        emailVerified: false,
        sellerId: null
      });
      
      console.log('⚠️ Created fallback user:', fallbackUser.id);
      return fallbackUser;
    } catch (fallbackError) {
      console.error('❌ Failed to create fallback user:', fallbackError.message);
      throw new Error('Unable to sync user from main server');
    }
  }
};

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Fetching conversations for user:', userId);
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    console.log('📥 Query params: page=' + page + ', limit=' + limit + ', offset=' + offset);

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
                  model: UserReference,
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
                  model: UserReference,
                  as: 'user',
                  attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
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

    console.log('📊 Found ' + participants.count + ' conversations for user ' + userId);
    console.log('📋 Returning ' + participants.rows.length + ' conversations');

    // Calculate actual unread count for each conversation and format participants
    const conversationsWithUnread = await Promise.all(participants.rows.map(async (p) => {
      let unreadCount = 0;
      
      if (p.lastReadMessageId) {
        // Count messages after last read
        unreadCount = await Message.count({
          where: {
            conversationId: p.conversationId,
            createdAt: { [Op.gt]: p.lastReadAt || new Date(0) }
          }
        });
      } else if (p.conversation.lastMessageId) {
        // User hasn't read any messages, count all messages
        unreadCount = await Message.count({
          where: {
            conversationId: p.conversationId,
            isDeleted: false
          }
        });
      }
      
      // Format participants with both userId and sellerId
      const formattedParticipants = p.conversation.participants 
        ? p.conversation.participants.map(participant => formatParticipant(participant))
        : [];
      
      return {
        ...p.conversation.toJSON(),
        participants: formattedParticipants,
        unreadCount
      };
    }));

    res.json({
      conversations: conversationsWithUnread,
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
              model: UserReference,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
            }
          ]
        },
        {
          model: Message,
          as: 'lastMessage',
          include: [
            {
              model: UserReference,
              as: 'sender',
              attributes: ['id', 'fullName']
            }
          ]
        },
        {
          model: UserReference,
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

    // Format participants with both userId and sellerId
    const formattedParticipants = conversation.participants 
      ? conversation.participants.map(p => formatParticipant(p))
      : [];

    res.json({
      conversation: {
        ...conversation.toJSON(),
        participants: formattedParticipants
      },
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
    const { type = 'direct', name, description, participants, metadata } = req.body;
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
      console.log('🔍 Checking for existing direct conversation with participants:', participants);
      
      // For direct conversations, we need to find if there's already a conversation
      // with exactly these two participants
      const existingConversations = await Conversation.findAll({
        where: { type: 'direct' },
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { isActive: true }
          }
        ]
      });

      console.log('📋 Found existing conversations:', existingConversations.length);
      
      // Check if any existing conversation has exactly these two participants
      for (const conv of existingConversations) {
        console.log('🔍 Checking conversation:', conv.id, 'with participants:', conv.participants.map(p => p.userId));
        
        if (conv.participants.length === 2) {
          const convParticipantIds = conv.participants.map(p => p.userId).sort();
          const requestedParticipantIds = participants.sort();
          
          console.log('📊 Comparing:', convParticipantIds, 'vs', requestedParticipantIds);
          
          // Check if the participants match exactly
          if (convParticipantIds.length === 2 && 
              requestedParticipantIds.length === 2 &&
              convParticipantIds[0] === requestedParticipantIds[0] && 
              convParticipantIds[1] === requestedParticipantIds[1]) {
            
            console.log('❌ Found duplicate conversation:', conv.id);
            
            // If metadata is provided, always update it (allows updating with new product info)
            if (metadata) {
              console.log('📦 Updating existing conversation with metadata');
              await conv.update({ metadata });
              await conv.reload();
            }
            
            // Load conversation with participants to return full data
            const existingConv = await Conversation.findByPk(conv.id, {
              include: [
                {
                  model: ConversationParticipant,
                  as: 'participants',
                  include: [
                    {
                      model: UserReference,
                      as: 'user',
                      attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
                    }
                  ]
                },
                {
                  model: UserReference,
                  as: 'creator',
                  attributes: ['id', 'fullName']
                }
              ]
            });
            
            // Format participants
            const formattedParticipants = existingConv.participants 
              ? existingConv.participants.map(p => formatParticipant(p))
              : [];
            
            const responseData = {
              ...existingConv.toJSON(),
              participants: formattedParticipants
            };
            
            console.log('📤 Returning 400 with full conversation data:', {
              conversationId: conv.id,
              hasMetadata: !!existingConv.metadata,
              metadata: existingConv.metadata
            });
            
            return res.status(400).json({
              message: 'Direct conversation already exists',
              conversationId: conv.id,
              data: responseData
            });
          }
        }
      }
      
      console.log('✅ No duplicate conversation found, creating new one');
    }

    // Create conversation
    console.log('🚀 Creating new conversation with type:', type, 'and participants:', participants);
    if (metadata) {
      console.log('📦 Conversation metadata:', JSON.stringify(metadata));
    }
    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : null,
      description: type === 'group' ? description : null,
      createdBy: userId,
      metadata: metadata || null
    });
    console.log('✅ Conversation created with ID:', conversation.id);

    // Sync all participants to ensure they exist in the messaging system
    console.log('🔄 Syncing participants before adding to conversation...');
    console.log('📋 Total participants to sync:', participants.length);
    console.log('📋 Participant IDs:', participants);
    
    const syncedParticipants = [];
    
    for (const participantId of participants) {
      console.log(`🔄 Attempting to sync participant: ${participantId}`);
      try {
        const syncedUser = await syncUserFromMainServer(participantId);
        syncedParticipants.push(participantId);
        console.log(`✅ Successfully synced participant: ${participantId}`);
      } catch (error) {
        console.error(`❌ Failed to sync participant ${participantId}:`, error.message);
        // Continue with other participants even if one fails
      }
    }

    console.log('📊 Summary: Successfully synced ${syncedParticipants.length} out of ${participants.length} participants');

    // Only add participants that were successfully synced
    if (syncedParticipants.length === 0) {
      console.error('❌ No participants could be synced, aborting conversation creation');
      return res.status(400).json({
        message: 'No participants could be synced'
      });
    }

    // Add participants
    const participantData = syncedParticipants.map(participantId => ({
      conversationId: conversation.id,
      userId: participantId,
      role: participantId === userId ? 'admin' : 'member'
    }));

    console.log('👥 Adding participants:', participantData);
    await ConversationParticipant.bulkCreate(participantData);
    console.log('✅ Participants added successfully');

    // Load conversation with participants
    const conversationWithParticipants = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          include: [
            {
              model: UserReference,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture', 'businessName', 'accountType', 'sellerId']
            }
          ]
        },
        {
          model: UserReference,
          as: 'creator',
          attributes: ['id', 'fullName']
        }
      ]
    });

    // Format participants with both userId and sellerId
    const formattedParticipants = conversationWithParticipants.participants 
      ? conversationWithParticipants.participants.map(p => formatParticipant(p))
      : [];

    res.status(201).json({
      message: 'Conversation created successfully',
      data: {
        ...conversationWithParticipants.toJSON(),
        participants: formattedParticipants
      }
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
    const currentUserId = req.user?.id;

    // Check if this is an internal service call (using internal API token)
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix
    const isInternalCall = token === process.env.INTERNAL_API_TOKEN;

    // If internal call, skip admin check (for automatic group buy joins)
    if (!isInternalCall) {
      // Check if current user is admin
      const currentParticipant = await ConversationParticipant.findOne({
        where: { conversationId, userId: currentUserId, isActive: true }
      });

      if (!currentParticipant || currentParticipant.role !== 'admin') {
        return res.status(403).json({
          message: 'Only admins can add participants'
        });
      }
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

// Update participant nickname
const updateParticipantNickname = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, nickname } = req.body;
    const currentUserId = req.user.id;

    // Check if user is participant
    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId: currentUserId, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a participant in this conversation'
      });
    }

    // Find the participant to update nickname for
    const targetParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true }
    });

    if (!targetParticipant) {
      return res.status(404).json({
        message: 'Participant not found'
      });
    }

    // Update nickname
    await targetParticipant.update({ nickname });

    res.json({
      message: 'Nickname updated successfully',
      data: targetParticipant
    });

  } catch (error) {
    console.error('Error updating nickname:', error);
    res.status(500).json({
      message: 'Error updating nickname',
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