const db = require('../../models');
const { Op } = require('sequelize');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const { groupBuyCreationMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');
const cloudinaryService = require('../services/cloudinaryService');
const axios = require('axios');

// Helper function to map group buy field names for frontend
const mapGroupBuyResponse = (groupBuy) => {
  const mapped = groupBuy.toJSON ? groupBuy.toJSON() : { ...groupBuy };
  return {
    ...mapped,
    pricePerUnit: mapped.group_price,
    endDate: mapped.deadline
  };
};

// Helper function to create notifications
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type,
      category,
      metadata
    });
    console.log(`📧 Group buy notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating group buy notification:', error);
  }
};

// Helper function to create group conversation in messaging server
const createGroupConversation = async (groupBuy, creatorId, authToken) => {
  try {
    // Remove trailing slash if present
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    messageServerUrl = messageServerUrl.replace(/\/$/, '');
    
    // Get creator info
    const creator = await db.UserTable.findByPk(creatorId, {
      include: [{
        model: db.SellersTable,
        as: 'seller',
        attributes: ['businessName']
      }]
    });
    
    if (!creator) {
      throw new Error('Creator not found');
    }
    
    // Get business name for sellers, otherwise use fullName
    const businessName = creator.seller?.businessName || creator.fullName;
    const groupName = `BP ${businessName} - ${groupBuy.product_name}`;
    
    console.log(`🗨️ Creating group conversation: ${groupName}`);
    console.log(`🔗 Message Server URL: ${messageServerUrl}`);
    console.log(`🔑 Auth token available: ${authToken ? 'Yes' : 'No'}`);
    
    // Create group conversation via messaging server API
    const response = await axios.post(
      `${messageServerUrl}/api/conversations`,
      {
        type: 'group',
        name: groupName,
        description: groupBuy.description.substring(0, 200), // Limit description length
        participants: [creatorId] // Creator is automatically added
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken || process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📦 Response data:`, JSON.stringify(response.data, null, 2));
    
    const conversationId = response.data.data?.id;
    console.log(`✅ Group conversation created with ID: ${conversationId}`);
    
    return conversationId;
  } catch (error) {
    console.error('❌ Error creating group conversation:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    // Don't throw - group buy can still be created without conversation
    return null;
  }
};

// Helper function to add participant to group conversation
const addParticipantToGroupChat = async (conversationId, userId) => {
  try {
    // Remove trailing slash if present
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    messageServerUrl = messageServerUrl.replace(/\/$/, '');
    
    console.log(`👤 Adding user ${userId} to conversation ${conversationId}`);
    
    const response = await axios.post(
      `${messageServerUrl}/api/conversations/${conversationId}/participants`,
      { userId },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ User added to group conversation`);
    return true;
  } catch (error) {
    console.error('❌ Error adding participant to group chat:', error.message);
    // Don't throw - group buy join can still succeed without chat
    return false;
  }
};

// Helper function to calculate remaining units for a group buy
const calculateRemainingUnits = async (groupBuyId) => {
  try {
    const groupBuy = await db.GroupBuy.findByPk(groupBuyId);
    
    // If quantity_unit is not set, return null
    if (!groupBuy || groupBuy.quantity_unit === null || groupBuy.quantity_unit === undefined) {
      return null;
    }
    
    // Get all active participants (exclude cancelled ones)
    const participants = await db.GroupBuyParticipant.findAll({
      where: { 
        group_buy_id: groupBuyId,
        status: { [Op.ne]: 'cancelled' }
      }
    });
    
    // Sum all participant quantities
    const totalReservedUnits = participants.reduce((sum, p) => sum + (p.quantity || 0), 0);
    
    // Calculate remaining units
    const remainingUnits = groupBuy.quantity_unit - totalReservedUnits;
    
    // Ensure it doesn't go negative (shouldn't happen if validation is correct, but safety check)
    return Math.max(0, remainingUnits);
  } catch (error) {
    console.error('Error calculating remaining units:', error);
    return null;
  }
};

class GroupBuyController {
  // Create a new group buy
  async createGroupBuy(req, res) {
    try {
      const {
        title,
        description,
        category_id,
        subcategory,
        product_name,
        product_image,
        original_price,
        group_price,
        pricePerUnit,  // Accept frontend field name
        min_buyers,
        max_buyers,
        quantity_unit,
        location,
        deadline,
        endDate,  // Accept frontend field name
        terms_conditions,
        tags
      } = req.body;

      // Transform frontend field names to backend field names
      const finalGroupPrice = pricePerUnit || group_price;
      const finalDeadline = endDate || deadline;
      let parsedQuantityUnit = quantity_unit;
      if (parsedQuantityUnit !== undefined && parsedQuantityUnit !== null && parsedQuantityUnit !== '') {
        parsedQuantityUnit = parseInt(parsedQuantityUnit, 10);
        if (Number.isNaN(parsedQuantityUnit)) {
          parsedQuantityUnit = null;
        }
      } else {
        parsedQuantityUnit = null;
      }

      const creator_id = req.user.id;

      // Check subscription limits for group buy creation
      const subscriptionCheck = await checkSubscriptionLimit(req.user.id, 'group_buys');
      
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          message: subscriptionCheck.reason,
          upgradeRequired: true,
          currentPlan: subscriptionCheck.plan,
          suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
        });
      }

      // Check if user's plan allows creating group buys
      const featureCheck = await checkFeatureAccess(req.user.id, 'canCreateGroupBuy');
      
      if (!featureCheck.allowed) {
        return res.status(403).json({
          message: featureCheck.reason,
          upgradeRequired: true,
          currentPlan: featureCheck.plan,
          suggestedPlan: 'wave'
        });
      }

      // Validate required fields
      if (!title || !description || !category_id || !product_name || !original_price || !finalGroupPrice || !min_buyers || !finalDeadline) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate prices (convert to numbers for comparison)
      const numOriginalPrice = parseFloat(original_price);
      const numGroupPrice = parseFloat(finalGroupPrice);
      
      if (numGroupPrice >= numOriginalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Group price must be less than original price'
        });
      }

      // Validate deadline (must be in the future)
      if (new Date(finalDeadline) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }

      // Validate min_buyers
      if (min_buyers < 2) {
        return res.status(400).json({
          success: false,
          message: 'Minimum buyers must be at least 2'
        });
      }

      // Validate quantity_unit if provided
      if (parsedQuantityUnit !== null) {
        if (parsedQuantityUnit <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Quantity unit must be a positive integer'
          });
        }
      }

      // Accept category from seller's registration (no strict validation)
      console.log('📋 Category received:', category_id);
      
      // Try to find category in database, but don't require it
      let categoryId = category_id;
      if (category_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Already a UUID
        console.log('Category is UUID format');
      } else {
        // Try to find by name in database
        const category = await db.ProductCategory.findOne({ where: { name: category_id } });
        if (category) {
          console.log('✅ Found category in database:', category.name, category.id);
          categoryId = category.id;
        } else {
          console.log('⚠️ Category not in database, using as-is:', category_id);
          // Accept the category string as-is from seller's selection
          categoryId = category_id;
        }
      }

      // Validate and set location with fallback
      let groupBuyLocation = location?.trim();
      
      // DEBUG: Log received location
      console.log('📍 Group Buy Location received:', {
          raw: location,
          trimmed: groupBuyLocation,
          isEmpty: !groupBuyLocation || groupBuyLocation.length === 0
      });
      
      // If location is empty or undefined, try to get from creator's profile
      if (!groupBuyLocation || groupBuyLocation.length === 0) {
          // Get creator's country/location as fallback
          const creator = await db.UserTable.findByPk(creator_id, {
              include: [{
                  model: db.SellersTable,
                  as: 'seller',
                  attributes: ['country', 'businessAddress'],
                  required: false
              }],
              attributes: ['id', 'location']
          });
          
          // Try seller's country, then user's location, then default
          groupBuyLocation = creator?.seller?.country || 
                           creator?.location || 
                           'Nigeria';
          
          console.log('⚠️ Group Buy location was empty/undefined, using fallback:', {
              sellerCountry: creator?.seller?.country,
              userLocation: creator?.location,
              finalLocation: groupBuyLocation
          });
      }

      const groupBuy = await db.GroupBuy.create({
        title,
        description,
        category_id: categoryId, // Use resolved category ID or name
        subcategory: subcategory || null,
        product_name,
        product_image: '', // Will be updated with first uploaded image URL
        original_price: numOriginalPrice,
        group_price: numGroupPrice,  // Use parsed numeric value
        min_buyers,
        max_buyers,
        quantity_unit: parsedQuantityUnit,
        remaining_units: parsedQuantityUnit, // Initialize remaining units to total
        creator_id,
        location: groupBuyLocation, // Use validated/fallback location
        deadline: finalDeadline,  // Use transformed value
        terms_conditions,
        tags: tags ? (typeof tags === 'string' ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim())) : tags) : null,
        status: 'active'
      });

      // Handle image uploads to Cloudinary
      const imageUrls = [];
      if (req.files && req.files.images && req.files.images.length > 0) {
        console.log(`Uploading ${req.files.images.length} image(s) to Cloudinary for group buy ${groupBuy.id}`);
        
        // Upload all images
        for (let i = 0; i < req.files.images.length; i++) {
          const file = req.files.images[i];
          try {
            const uploadResult = await cloudinaryService.uploadProductImage(
              file.buffer, 
              `groupbuy-${groupBuy.id}/image-${i + 1}`
            );
            
            if (uploadResult.success) {
              imageUrls.push(uploadResult.url);
              console.log(`Image ${i + 1}/${req.files.images.length} uploaded successfully: ${uploadResult.url}`);
            } else {
              console.error(`Cloudinary upload failed for image ${i + 1}:`, uploadResult.error);
            }
          } catch (uploadError) {
            console.error(`Error uploading image ${i + 1}:`, uploadError.message);
          }
        }
        
        // Update group buy with all image URLs
        if (imageUrls.length > 0) {
          await groupBuy.update({ product_image: imageUrls });
          console.log(`✅ Group buy ${groupBuy.id} updated with ${imageUrls.length} image(s)`);
        }
      }

      // Upload AR model if provided (optional)
      let arModelUrl = null;
      if (req.files && req.files.arModel && req.files.arModel.length > 0) {
        const arFile = req.files.arModel[0];
        console.log('📤 Attempting to upload AR model for group buy:', {
          filename: arFile.originalname,
          mimetype: arFile.mimetype,
          size: arFile.size
        });
        
        try {
          const arUploadResult = await cloudinaryService.uploadGroupBuyARModel(arFile.buffer, groupBuy.id);
          
          if (!arUploadResult.success) {
            console.error('AR model upload failed:', arUploadResult.error);
            console.warn('Group buy created but AR model upload failed');
          } else {
            arModelUrl = arUploadResult.url;
            console.log('✅ AR model uploaded successfully:', arModelUrl);
            // Update group buy with AR model URL
            await groupBuy.update({ arModel: arModelUrl });
          }
        } catch (error) {
          console.error('Error uploading AR model:', error);
          // Don't fail the group buy creation if AR upload fails
        }
      }

      // Create group conversation for this group buy
      // Get auth token from request headers
      const authToken = req.headers.authorization?.replace('Bearer ', '') || null;
      console.log(`🔑 Extracted auth token: ${authToken ? 'Yes (length: ' + authToken.length + ')' : 'No'}`);
      
      const conversationId = await createGroupConversation(groupBuy, creator_id, authToken);
      if (conversationId) {
        await groupBuy.update({ conversation_id: conversationId });
        console.log(`✅ Group buy ${groupBuy.id} linked to conversation ${conversationId}`);
      } else {
        console.log(`⚠️ Group buy ${groupBuy.id} created but no conversation was created`);
        console.log(`⚠️ Check backend logs above for detailed error messages`);
      }

      // Track subscription usage for group buy creation
      await incrementUsage(creator_id, 'group_buys');

      // Get creator info for notifications
      const creator = await db.UserTable.findByPk(creator_id, {
        attributes: ['id', 'fullName', 'username', 'profilePicture']
      });

      // Find users who might be interested in this category
      // This could be users who have saved products in this category or have shown interest
      const interestedUsers = await db.SavedProduct.findAll({
        include: [
          {
            model: db.Product,
            as: 'product',
            attributes: ['category'],
            where: { category: category_id }
          },
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'email']
          }
        ],
        limit: 50 // Limit to avoid spam
      });

      // Send notifications to interested users (excluding the creator)
      for (const savedProduct of interestedUsers) {
        if (savedProduct.user.id !== creator_id) {
          await createNotification(
            savedProduct.user.id,
            'New Group Buy Created!',
            `${creator.fullName || creator.username} created a new group buy "${title}" in ${category_id}`,
            'info',
            'group_buy',
            { 
              groupBuyId: groupBuy.id,
              title: groupBuy.title,
              creatorId: creator_id,
              creatorName: creator.fullName || creator.username,
              creatorUsername: creator.username,
              category: category_id,
              productName: product_name,
              originalPrice: original_price,
              groupPrice: group_price,
              minBuyers: min_buyers,
              maxBuyers: max_buyers,
              deadline: deadline,
              location: location
            }
          );
        }
      }

      // Fetch group buy with creator and seller associations for complete response
      const createdGroupBuy = await db.GroupBuy.findByPk(groupBuy.id, {
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'fullName', 'username', 'profilePicture', 'email'],
            include: [
              {
                model: db.SellersTable,
                as: 'seller',
                attributes: ['id', 'userId', 'businessName', 'businessEmail']
              }
            ]
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
          }
        ]
      });

      // Map group buy response
      const groupBuyJson = createdGroupBuy.toJSON ? createdGroupBuy.toJSON() : createdGroupBuy;
      
      // Add sellerEntityId and sellerMeta to creator
      if (groupBuyJson.creator && groupBuyJson.creator.seller) {
        groupBuyJson.creator.sellerEntityId = groupBuyJson.creator.seller.id;
        groupBuyJson.creator.sellerMeta = {
          businessName: groupBuyJson.creator.seller.businessName || null,
          profilePicture: groupBuyJson.creator.profilePicture || null,
          businessEmail: groupBuyJson.creator.seller.businessEmail || null
        };
      }

      res.status(201).json({
        success: true,
        message: 'Group buy created successfully',
        data: groupBuyJson
      });

    } catch (error) {
      console.error('Error creating group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all group buys with filters
  async getAllGroupBuys(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'active',
        category_id,
        subcategory,
        location,
        min_price,
        max_price,
        featured,
        search
      } = req.query;

      const currentUserId = req.user?.id;

      // Use subscription-aware search service
      const searchResults = await SubscriptionAwareSearchService.searchGroupBuys({
        query: search,
        category: category_id,
        subcategory: subcategory,
        location,
        minPrice: min_price ? parseFloat(min_price) : undefined,
        maxPrice: max_price ? parseFloat(max_price) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      }, currentUserId);

      // Map group buy field names for frontend compatibility
      const mappedGroupBuys = searchResults.groupBuys.map(mapGroupBuyResponse);

      res.status(200).json({
        success: true,
        data: mappedGroupBuys,
        pagination: searchResults.pagination
      });

    } catch (error) {
      console.error('Error fetching group buys:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get group buy by conversation ID
  async getGroupBuyByConversationId(req, res) {
    try {
      const { conversationId } = req.params;

      const groupBuy = await db.GroupBuy.findOne({
        where: { conversation_id: conversationId },
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'profilePicture', 'email', 'businessName'],
            include: [{
              model: db.SellersTable,
              as: 'seller',
              attributes: ['businessName'],
              required: false
            }]
          }
        ]
      });

      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found for this conversation'
        });
      }

      const groupBuyJson = groupBuy.toJSON ? groupBuy.toJSON() : groupBuy;

      res.json({
        success: true,
        data: groupBuyJson
      });

    } catch (error) {
      console.error('Error fetching group buy by conversation ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get a specific group buy by ID
  async getGroupBuyById(req, res) {
    try {
      const { id } = req.params;

      const groupBuy = await db.GroupBuy.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'profilePicture', 'email', 'businessName'],
            include: [{
              model: db.SellersTable,
              as: 'seller',
              attributes: [
                'id',                    // ✅ CRITICAL: Seller Table ID
                'userId',                // User ID (for profile navigation)
                'businessName',
                'businessEmail',
                'businessPhone',
                'businessAddress',
                'businessDescription',
                'verificationStatus',
                'category',              // Business category (UUID)
                'sellerType',            // retailer, wholesaler, manufacturer, distributor
                'selectedCategories',    // Array of selected main categories
                'selectedSubcategories' // Object mapping categories to subcategories
              ],
              required: false
            }]
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
          },
          {
            model: db.GroupBuyParticipant,
            as: 'participants',
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'username', 'profilePicture']
              }
            ]
          }
        ]
      });

      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      // Increment view count (deduplicated for logged-in users)
      if (req.user && req.user.id) {
        const currentUserId = req.user.id;
        const [view, created] = await db.GroupBuyView.findOrCreate({
          where: { groupBuyId: groupBuy.id, viewerId: currentUserId },
          defaults: { viewedAt: new Date() }
        });
        if (created) {
          await groupBuy.increment('views_count');
        }
      } else {
        await groupBuy.increment('views_count');
      }

      // Calculate and update remaining units if quantity_unit is set
      if (groupBuy.quantity_unit !== null && groupBuy.quantity_unit !== undefined) {
        const remainingUnits = await calculateRemainingUnits(id);
        if (remainingUnits !== null) {
          await groupBuy.update({ remaining_units: remainingUnits });
          // Reload to get updated remaining_units
          await groupBuy.reload();
        }
      }

      // Convert to JSON to ensure nested relationships are serialized
      const groupBuyJson = groupBuy.toJSON ? groupBuy.toJSON() : groupBuy;
      
      // Calculate follow statistics for creator
      if (groupBuyJson.creator && groupBuyJson.creator.id) {
        try {
          const [followersCount, followingCount] = await Promise.all([
            db.UserFollows.count({
              where: { followsUserId: groupBuyJson.creator.id }
            }),
            db.UserFollows.count({
              where: { userId: groupBuyJson.creator.id }
            })
          ]);

          groupBuyJson.creator.followersCount = followersCount || 0;
          groupBuyJson.creator.followingCount = followingCount || 0;

          // Check if current user is following creator (if logged in)
          if (req.user && req.user.id && req.user.id !== groupBuyJson.creator.id) {
            const isFollowing = await db.UserFollows.findOne({
              where: {
                userId: req.user.id,
                followsUserId: groupBuyJson.creator.id
              }
            });
            groupBuyJson.creator.isFollowing = !!isFollowing;
          } else {
            // Not logged in or viewing own profile
            groupBuyJson.creator.isFollowing = false;
          }
        } catch (error) {
          console.error('Error calculating follow statistics:', error);
          // Set defaults if there's an error
          groupBuyJson.creator.followersCount = 0;
          groupBuyJson.creator.followingCount = 0;
          groupBuyJson.creator.isFollowing = false;
        }
      }
      
      // Add sellerEntityId alias for consistency with swap deals
      if (groupBuyJson.creator && groupBuyJson.creator.seller) {
        groupBuyJson.creator.seller.sellerEntityId = groupBuyJson.creator.seller.id;
        // Mirror for flat access when needed by frontend
        groupBuyJson.creator.sellerEntityId = groupBuyJson.creator.seller.id;
      }
      
      console.log('📦 Group Buy Creator:', JSON.stringify(groupBuyJson.creator, null, 2));
      console.log('🏪 Creator Seller:', JSON.stringify(groupBuyJson.creator?.seller, null, 2));
      console.log('💬 Conversation ID:', groupBuyJson.conversation_id);

      // Ensure conversation_id is included in response (also as conversationId for frontend compatibility)
      const responseData = {
        ...groupBuyJson,
        conversationId: groupBuyJson.conversation_id || groupBuyJson.conversationId
      };

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update a group buy
  async updateGroupBuy(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      const user_id = req.user.id;

      const groupBuy = await db.GroupBuy.findByPk(id);
      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      // Check if user is the creator
      if (groupBuy.creator_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the creator can update this group buy'
        });
      }

      // Prevent updates if group buy is already active or successful
      if (['active', 'successful'].includes(groupBuy.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update group buy that is already active or successful'
        });
      }

      // Handle frontend field name transformations
      // pricePerUnit → group_price
      if (updateData.pricePerUnit !== undefined) {
        updateData.group_price = updateData.pricePerUnit;
        delete updateData.pricePerUnit;
      }
      
      // endDate → deadline
      if (updateData.endDate !== undefined) {
        updateData.deadline = updateData.endDate;
        delete updateData.endDate;
      }

      // Validate prices if updating
      if (updateData.group_price && updateData.original_price) {
        if (parseFloat(updateData.group_price) >= parseFloat(updateData.original_price)) {
          return res.status(400).json({
            success: false,
            message: 'Group price must be less than original price'
          });
        }
      }

      // Validate deadline if updating
      if (updateData.deadline && new Date(updateData.deadline) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }

      // Validate quantity_unit if provided
      if (updateData.quantity_unit !== undefined && updateData.quantity_unit !== null && updateData.quantity_unit !== '') {
        const parsedQuantityUnit = parseInt(updateData.quantity_unit, 10);
        if (Number.isNaN(parsedQuantityUnit) || parsedQuantityUnit <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Quantity unit must be a positive integer'
          });
        }
        updateData.quantity_unit = parsedQuantityUnit;
      } else {
        delete updateData.quantity_unit;
      }

      // Process uploaded images if any
      if (req.files && req.files.images && req.files.images.length > 0) {
        console.log(`Uploading ${req.files.images.length} image(s) to Cloudinary for group buy update ${groupBuy.id}`);
        const imageUrls = [];
        
        for (let i = 0; i < req.files.images.length; i++) {
          const file = req.files.images[i];
          try {
            const uploadResult = await cloudinaryService.uploadProductImage(
              file.buffer, 
              `groupbuy-${groupBuy.id}/image-${i + 1}`
            );
            
            if (uploadResult.success) {
              imageUrls.push(uploadResult.url);
              console.log(`Image ${i + 1}/${req.files.images.length} uploaded successfully: ${uploadResult.url}`);
            } else {
              console.error(`Cloudinary upload failed for image ${i + 1}:`, uploadResult.error);
            }
          } catch (uploadError) {
            console.error(`Error uploading image ${i + 1}:`, uploadError.message);
          }
        }
        
        if (imageUrls.length > 0) {
          updateData.product_image = imageUrls;
        }
      }

      // Process AR model upload if provided (optional, replaces existing)
      if (req.files && req.files.arModel && req.files.arModel.length > 0) {
        const arFile = req.files.arModel[0];
        console.log('📤 Attempting to upload AR model for group buy update:', {
          filename: arFile.originalname,
          mimetype: arFile.mimetype,
          size: arFile.size
        });
        
        try {
          const arUploadResult = await cloudinaryService.uploadGroupBuyARModel(arFile.buffer, groupBuy.id);
          
          if (!arUploadResult.success) {
            console.error('AR model upload failed:', arUploadResult.error);
            console.warn('Group buy updated but AR model upload failed');
          } else {
            updateData.arModel = arUploadResult.url;
            console.log('✅ AR model uploaded successfully:', arUploadResult.url);
          }
        } catch (error) {
          console.error('Error uploading AR model:', error);
          // Don't fail the group buy update if AR upload fails
        }
      }

      // Update the group buy
      await groupBuy.update(updateData);

      // Recalculate remaining_units if quantity_unit was updated
      if (updateData.quantity_unit !== undefined) {
        const remainingUnits = await calculateRemainingUnits(groupBuy.id);
        if (remainingUnits !== null) {
          await groupBuy.update({ remaining_units: remainingUnits });
        }
      }

      // Reload the group buy to get updated data
      const updatedGroupBuy = await db.GroupBuy.findByPk(groupBuy.id);

      res.json({
        success: true,
        message: 'Group buy updated successfully',
        data: updatedGroupBuy
      });

    } catch (error) {
      console.error('Error updating group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete a group buy
  async deleteGroupBuy(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const groupBuy = await db.GroupBuy.findByPk(id);
      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      // Check if user is the creator
      if (groupBuy.creator_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the creator can delete this group buy'
        });
      }

      // Check if there are participants
      const participantCount = await db.GroupBuyParticipant.count({
        where: { group_buy_id: id }
      });

      if (participantCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete group buy with participants'
        });
      }

      await groupBuy.destroy();

      res.json({
        success: true,
        message: 'Group buy deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Join a group buy
  async joinGroupBuy(req, res) {
    try {
      const { id } = req.params;
      const {
        quantity = 1,
        pickup_location,
        delivery_address,
        special_requests
      } = req.body;
      const user_id = req.user.id;

      const groupBuy = await db.GroupBuy.findByPk(id);
      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      // Check if user is the creator (creators cannot join their own group buy)
      if (groupBuy.creator_id === user_id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot join your own group buy'
        });
      }

      // Check if group buy is still open (accept both 'active' and 'pending' statuses)
      if (groupBuy.status !== 'active' && groupBuy.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Group buy is not open for joining'
        });
      }

      // Check if deadline has passed
      if (new Date(groupBuy.deadline) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Group buy deadline has passed'
        });
      }

      // Check if user is already a participant
      const existingParticipant = await db.GroupBuyParticipant.findOne({
        where: { group_buy_id: id, user_id }
      });

      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          message: 'You are already a participant in this group buy'
        });
      }

      // Check if max buyers limit reached
      if (groupBuy.max_buyers && groupBuy.current_buyers >= groupBuy.max_buyers) {
        return res.status(400).json({
          success: false,
          message: 'Group buy is full'
        });
      }

      // Validate quantity if provided
      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer'
        });
      }

      // Check if quantity_unit is set and validate remaining units
      if (groupBuy.quantity_unit !== null && groupBuy.quantity_unit !== undefined) {
        // Calculate remaining units
        const remainingUnits = await calculateRemainingUnits(id);
        
        if (remainingUnits === null) {
          // This shouldn't happen, but handle gracefully
          console.error('Error calculating remaining units for group buy:', id);
        } else {
          // Check if requested quantity exceeds available units
          if (quantity > remainingUnits) {
            return res.status(400).json({
              success: false,
              message: `Not enough units available. Only ${remainingUnits} unit(s) remaining.`
            });
          }
        }
      }

      // Calculate total amount
      const total_amount = quantity * groupBuy.group_price;

      const participant = await db.GroupBuyParticipant.create({
        group_buy_id: id,
        user_id,
        quantity,
        pickup_location,
        delivery_address,
        special_requests,
        total_amount
      });

      // Update current buyers count
      await groupBuy.increment('current_buyers');

      // Update remaining units if quantity_unit is set
      if (groupBuy.quantity_unit !== null && groupBuy.quantity_unit !== undefined) {
        const updatedRemainingUnits = await calculateRemainingUnits(id);
        if (updatedRemainingUnits !== null) {
          await groupBuy.update({ remaining_units: updatedRemainingUnits });
        }
      }

      // Add buyer to group conversation if it exists
      if (groupBuy.conversation_id) {
        await addParticipantToGroupChat(groupBuy.conversation_id, user_id);
      }

      // Get joiner info for notifications
      const joiner = await db.UserTable.findByPk(user_id, {
        attributes: ['id', 'fullName', 'username', 'profilePicture']
      });

      // Send notification to group buy creator that someone joined
      await createNotification(
        groupBuy.creator_id,
        'Someone Joined Your Group Buy!',
        `${joiner.fullName || joiner.username} joined your group buy "${groupBuy.title}"`,
        'info',
        'group_buy',
        { 
          groupBuyId: groupBuy.id,
          title: groupBuy.title,
          joinerId: user_id,
          joinerName: joiner.fullName || joiner.username,
          joinerUsername: joiner.username,
          currentBuyers: groupBuy.current_buyers + 1,
          maxBuyers: groupBuy.max_buyers,
          groupPrice: groupBuy.group_price
        }
      );

      // Check if minimum threshold is met
      if (groupBuy.current_buyers + 1 >= groupBuy.min_buyers) {
        await groupBuy.update({ status: 'active' });
        
        // Send notification to creator that threshold is met
        await createNotification(
          groupBuy.creator_id,
          'Group Buy Threshold Met!',
          `Your group buy "${groupBuy.title}" has reached the minimum threshold and is now active!`,
          'success',
          'group_buy',
          { 
            groupBuyId: groupBuy.id,
            title: groupBuy.title,
            currentBuyers: groupBuy.current_buyers + 1,
            minBuyers: groupBuy.min_buyers,
            groupPrice: groupBuy.group_price
          }
        );

        // Send notification to all participants that group buy is now active
        const participants = await db.GroupBuyParticipant.findAll({
          where: { group_buy_id: id },
          include: [
            {
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        });

        for (const participant of participants) {
          await createNotification(
            participant.user_id,
            'Group Buy is Now Active!',
            `The group buy "${groupBuy.title}" has reached the minimum threshold and is now active!`,
            'success',
            'group_buy',
            { 
              groupBuyId: groupBuy.id,
              title: groupBuy.title,
              currentBuyers: groupBuy.current_buyers + 1,
              minBuyers: groupBuy.min_buyers,
              groupPrice: groupBuy.group_price
            }
          );
        }
      }

      res.status(201).json({
        success: true,
        message: 'Successfully joined group buy',
        data: {
          participant: participant,
          conversationId: groupBuy.conversation_id // Include conversation ID for navigation
        }
      });

    } catch (error) {
      console.error('Error joining group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get participants of a group buy
  async getParticipants(req, res) {
    try {
      const { id } = req.params;

      const groupBuy = await db.GroupBuy.findByPk(id);
      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      const participants = await db.GroupBuyParticipant.findAll({
        where: { group_buy_id: id },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'profilePicture']
          }
        ],
        order: [['joined_at', 'ASC']] // Order by join date
      });

      res.json({
        success: true,
        data: {
          participants: participants,
          total: participants.length,
          current_buyers: groupBuy.current_buyers,
          max_buyers: groupBuy.max_buyers
        }
      });

    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Leave a group buy
  async leaveGroupBuy(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const participant = await db.GroupBuyParticipant.findOne({
        where: { group_buy_id: id, user_id }
      });

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'You are not a participant in this group buy'
        });
      }

      // Check if group buy is still pending
      const groupBuy = await db.GroupBuy.findByPk(id);
      if (groupBuy.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave group buy that is no longer pending'
        });
      }

      const participantQuantity = participant.quantity || 0;

      await participant.destroy();

      // Update current buyers count
      await groupBuy.decrement('current_buyers');

      // Recalculate remaining units if quantity_unit is set
      if (groupBuy.quantity_unit !== null && groupBuy.quantity_unit !== undefined) {
        const updatedRemainingUnits = await calculateRemainingUnits(id);
        if (updatedRemainingUnits !== null) {
          await groupBuy.update({ remaining_units: updatedRemainingUnits });
        }
      }

      // Check if we need to revert to pending status
      if (groupBuy.current_buyers < groupBuy.min_buyers) {
        await groupBuy.update({ status: 'pending' });
      }

      res.json({
        success: true,
        message: 'Successfully left group buy'
      });

    } catch (error) {
      console.error('Error leaving group buy:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user's group buys (created or participated)
  async getUserGroupBuys(req, res) {
    try {
      const user_id = req.user.id;
      const { type = 'all' } = req.query; // 'created', 'participated', 'all'

      let whereClause = {};
      let includeClause = [];

      if (type === 'created') {
        whereClause.creator_id = user_id;
      } else if (type === 'participated') {
        includeClause.push({
          model: db.GroupBuyParticipant,
          as: 'participants',
          where: { user_id },
          required: true
        });
      } else {
        // 'all' - get both created and participated
        whereClause[Op.or] = [
          { creator_id: user_id },
          { '$participants.user_id$': user_id }
        ];
        includeClause.push({
          model: db.GroupBuyParticipant,
          as: 'participants',
          include: [
            {
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture']
            }
          ]
        });
      }

      const groupBuys = await db.GroupBuy.findAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'username', 'profilePicture']
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
          },
          ...includeClause
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: groupBuys
      });

    } catch (error) {
      console.error('Error fetching user group buys:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get group buys by user ID or seller ID (for visiting profiles)
  async getUserGroupBuysById(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Try to find user by userId first
      let actualUserId = userId;
      let user = await db.UserTable.findOne({ where: { id: userId } });

      // If not found as User ID, try as Seller Table ID
      if (!user) {
        const seller = await db.SellersTable.findByPk(userId);
        if (seller) {
          actualUserId = seller.userId;
        } else {
          return res.status(404).json({
            success: false,
            message: 'User or seller not found'
          });
        }
      }

      const groupBuys = await db.GroupBuy.findAndCountAll({
        where: { creator_id: actualUserId },
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'profilePicture', 'email'],
            include: [{
              model: db.SellersTable,
              as: 'seller',
              attributes: ['id', 'businessName', 'verificationStatus'],
              required: false
            }]
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
          },
          {
            model: db.GroupBuyParticipant,
            as: 'participants',
            include: [{
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map group buy field names for frontend
      const mappedGroupBuys = groupBuys.rows.map(groupBuy => {
        const mapped = mapGroupBuyResponse(groupBuy);
        return mapped;
      });

      res.json({
        success: true,
        data: {
          groupBuys: mappedGroupBuys,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(groupBuys.count / limit),
            totalGroupBuys: groupBuys.count,
            hasNextPage: offset + limit < groupBuys.count,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user group buys:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Mark group buy as successful (admin/creator only)
  async markGroupBuySuccessful(req, res) {
    try {
      const { id } = req.params;
      const { delivery_date } = req.body;
      const user_id = req.user.id;

      const groupBuy = await db.GroupBuy.findByPk(id);
      if (!groupBuy) {
        return res.status(404).json({
          success: false,
          message: 'Group buy not found'
        });
      }

      // Check if user is the creator or admin
      if (groupBuy.creator_id !== user_id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only the creator or admin can mark group buy as successful'
        });
      }

      // Check if minimum threshold is met
      if (groupBuy.current_buyers < groupBuy.min_buyers) {
        return res.status(400).json({
          success: false,
          message: 'Minimum threshold not met'
        });
      }

      await groupBuy.update({
        status: 'successful',
        delivery_date: delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days from now
      });

      res.json({
        success: true,
        message: 'Group buy marked as successful',
        data: groupBuy
      });

    } catch (error) {
      console.error('Error marking group buy successful:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get group buy statistics
  async getGroupBuyStats(req, res) {
    try {
      const stats = await db.GroupBuy.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('current_buyers')), 'total_participants']
        ],
        group: ['status']
      });

      const totalGroupBuys = await db.GroupBuy.count();
      const activeGroupBuys = await db.GroupBuy.count({ where: { status: 'active' } });
      const successfulGroupBuys = await db.GroupBuy.count({ where: { status: 'successful' } });

      res.json({
        success: true,
        data: {
          status_breakdown: stats,
          total: totalGroupBuys,
          active: activeGroupBuys,
          successful: successfulGroupBuys
        }
      });

    } catch (error) {
      console.error('Error fetching group buy stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new GroupBuyController();
