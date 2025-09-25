const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const { swapDealCreationMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');

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
    console.log(`📧 Swap deal notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating swap deal notification:', error);
  }
};

class SwapDealController {
  // Create a new swap deal offer
  async createSwapDeal(req, res) {
    try {
      const {
        title,
        description,
        responder_id,
        initiator_item_id,
        responder_item_id,
        // New fields for direct item creation
        myItem,
        wantedItem,
        swap_terms,
        meeting_location,
        meeting_date,
        initiator_message,
        expires_at
      } = req.body;

      const initiator_id = req.user.id;

      // Check subscription limits for swap deal creation
      const subscriptionCheck = await checkSubscriptionLimit(req.user.id, 'swap_deals');
      
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          message: subscriptionCheck.reason,
          upgradeRequired: true,
          currentPlan: subscriptionCheck.plan,
          suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
        });
      }

      // Check if user's plan allows creating swap deals
      const featureCheck = await checkFeatureAccess(req.user.id, 'canCreateSwapDeals');
      
      if (!featureCheck.allowed) {
        return res.status(403).json({
          message: featureCheck.reason,
          upgradeRequired: true,
          currentPlan: featureCheck.plan,
          suggestedPlan: 'wave'
        });
      }

      // Parse JSON strings for myItem and wantedItem
      let parsedMyItem, parsedWantedItem;
      try {
        console.log('Raw myItem:', myItem);
        console.log('Raw wantedItem:', wantedItem);
        parsedMyItem = typeof myItem === 'string' ? JSON.parse(myItem) : myItem;
        parsedWantedItem = typeof wantedItem === 'string' ? JSON.parse(wantedItem) : wantedItem;
        console.log('Parsed myItem:', parsedMyItem);
        console.log('Parsed wantedItem:', parsedWantedItem);
      } catch (error) {
        console.error('JSON parsing error:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for myItem or wantedItem. Please ensure they are valid JSON strings.'
        });
      }

      // Only support new format with file uploads - myItem and wantedItem are required
      if (!title || !description || !parsedMyItem || !parsedWantedItem) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields. Title, description, myItem, and wantedItem are required. File uploads are mandatory.'
        });
      }

      let finalInitiatorItemId = initiator_item_id;
      let finalResponderItemId = responder_item_id;
      let finalResponderId = responder_id;

      // Process file uploads and create items directly
        // Validate myItem
        if (!parsedMyItem.name || !parsedMyItem.description || !parsedMyItem.category) {
          return res.status(400).json({
            success: false,
            message: 'myItem must have name, description, and category'
          });
        }

        // Validate wantedItem
        if (!parsedWantedItem.name || !parsedWantedItem.description || !parsedWantedItem.category) {
          return res.status(400).json({
            success: false,
            message: 'wantedItem must have name, description, and category'
          });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'File uploads are mandatory. You must upload at least one image/video for each item.'
          });
        }

        // Process uploaded files
        let myItemImages = [];
        let wantedItemImages = [];
        
        if (req.files && req.files.length > 0) {
          console.log(`Processing ${req.files.length} uploaded files for swap deal`);
          console.log('File field names:', req.files.map(f => f.fieldname));
          
          // Split files between myItem and wantedItem based on field names
          const myItemFiles = req.files.filter(file => file.fieldname.startsWith('myItem'));
          const wantedItemFiles = req.files.filter(file => file.fieldname.startsWith('wantedItem'));
          
          console.log(`Found ${myItemFiles.length} myItem files and ${wantedItemFiles.length} wantedItem files`);
          
          // Upload myItem images
          for (let i = 0; i < myItemFiles.length; i++) {
            const file = myItemFiles[i];
            try {
              console.log(`Uploading myItem file ${i}: ${file.originalname}`);
              const uploadResult = await cloudinaryService.uploadProductImage(file.buffer, `swap-myitem-${Date.now()}-${i}`);
              
              if (!uploadResult.success) {
                console.error('Cloudinary upload failed for myItem:', uploadResult.error);
                throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
              }
              
              myItemImages.push(uploadResult.url);
              console.log(`myItem file ${i} uploaded successfully: ${uploadResult.url}`);
            } catch (error) {
              console.error(`Error processing myItem file ${file.originalname}:`, error);
              throw error;
            }
          }
          
          // Upload wantedItem images
          for (let i = 0; i < wantedItemFiles.length; i++) {
            const file = wantedItemFiles[i];
            try {
              console.log(`Uploading wantedItem file ${i}: ${file.originalname}`);
              const uploadResult = await cloudinaryService.uploadProductImage(file.buffer, `swap-wanted-${Date.now()}-${i}`);
              
              if (!uploadResult.success) {
                console.error('Cloudinary upload failed for wantedItem:', uploadResult.error);
                throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
              }
              
              wantedItemImages.push(uploadResult.url);
              console.log(`wantedItem file ${i} uploaded successfully: ${uploadResult.url}`);
            } catch (error) {
              console.error(`Error processing wantedItem file ${file.originalname}:`, error);
              throw error;
            }
          }
        }

        // Combine uploaded images with any provided URLs
        const finalMyItemImages = [...myItemImages, ...(parsedMyItem.images || [])];
        const finalWantedItemImages = [...wantedItemImages, ...(parsedWantedItem.images || [])];

        // Ensure both items have at least one image/video
        if (finalMyItemImages.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'You must upload at least one image/video for your item (myItem)'
          });
        }

        if (finalWantedItemImages.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'You must upload at least one image/video for the item you want (wantedItem)'
          });
        }

        // Map condition values to valid enum values
        const mapCondition = (condition) => {
          const conditionMap = {
            'excellent': 'like_new',
            'excellent condition': 'like_new',
            'mint': 'new',
            'mint condition': 'new',
            'very good': 'good',
            'good condition': 'good',
            'fair condition': 'fair',
            'poor condition': 'poor',
            'damaged': 'poor'
          };
          return conditionMap[condition?.toLowerCase()] || 'good';
        };

        // Check if user is a verified seller (required for swap deals)
        const sellerProfile = await db.SellersTable.findOne({
          where: { 
            userId: initiator_id,
            verificationStatus: 'approved'
          }
        });

        if (!sellerProfile) {
          return res.status(403).json({
            success: false,
            message: 'Only verified sellers can create swap deals. Please complete seller verification first.'
          });
        }

        console.log(`Using verified seller profile with ID: ${sellerProfile.id}`);

        // Create initiator's item (myItem) - exclude distress sale fields for compatibility
        const initiatorItem = await db.Product.create({
          title: parsedMyItem.name,
          description: parsedMyItem.description,
          price: parsedMyItem.estimatedValue || 0,
          currency: 'USD',
          category: parsedMyItem.category,
          condition: mapCondition(parsedMyItem.condition),
          location: meeting_location || 'Location TBD',
          images: finalMyItemImages,
          sellerId: sellerProfile.id, // Use verified seller profile ID
          status: 'active', // Use existing status
          // Exclude distress sale fields: isDistressSale, urgencyLevel, etc.
        });

        // Create wanted item (this will be a placeholder until someone responds)
        const wantedItemProduct = await db.Product.create({
          title: `[WANTED] ${parsedWantedItem.name}`,
          description: `Looking for: ${parsedWantedItem.description}`,
          price: parsedWantedItem.estimatedValue || 0,
          currency: 'USD',
          category: parsedWantedItem.category,
          condition: mapCondition(parsedWantedItem.condition),
          location: meeting_location || 'Location TBD',
          images: finalWantedItemImages,
          sellerId: sellerProfile.id, // Use verified seller profile ID
          status: 'inactive', // Use inactive status for wanted items
          // Exclude distress sale fields: isDistressSale, urgencyLevel, etc.
        });

        finalInitiatorItemId = initiatorItem.id;
        finalResponderItemId = wantedItemProduct.id;
        // For open swap deals, use initiator as responder since they're both offering and seeking
        finalResponderId = initiator_id;
        
        console.log('Swap deal details:', {
          initiator_id,
          responder_id: finalResponderId,
          initiator_item_id: finalInitiatorItemId,
          responder_item_id: finalResponderItemId
        });

      // No need to check for existing swaps since we're creating new items each time

      // Set expiration date (default 7 days from now)
      const expirationDate = expires_at ? new Date(expires_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const swapDeal = await db.SwapDeal.create({
        title,
        description,
        initiator_id,
        responder_id: finalResponderId,
        initiator_item_id: finalInitiatorItemId,
        responder_item_id: finalResponderItemId,
        swap_terms,
        meeting_location,
        meeting_date,
        initiator_message,
        expires_at: expirationDate,
        status: 'pending' // All swap deals start as pending
      });

      // Track subscription usage for swap deal creation
      await incrementUsage(initiator_id, 'swap_deals');

      console.log('Swap deal created successfully:', {
        id: swapDeal.id,
        title: swapDeal.title,
        status: swapDeal.status,
        initiator_id: swapDeal.initiator_id,
        responder_id: swapDeal.responder_id
      });

      // Send notification to initiator that their swap deal is now live
      await createNotification(
        initiator_id,
        'Swap Deal Created Successfully!',
        `Your swap deal "${title}" has been created and is now visible to other users.`,
        'success',
        'swap_deal',
        { 
          swapDealId: swapDeal.id,
          title: swapDeal.title,
          status: swapDeal.status,
          expiresAt: swapDeal.expires_at,
          initiatorItemId: finalInitiatorItemId,
          wantedItemId: finalResponderItemId
        }
      );

      res.status(201).json({
        success: true,
        message: 'Swap deal created successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error creating swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all swap deals with filters
  async getAllSwapDeals(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'active',
        initiator_id,
        responder_id,
        featured,
        search
      } = req.query;

      const currentUserId = req.user?.id;

      // Use subscription-aware search service
      const searchResults = await SubscriptionAwareSearchService.searchSwapDeals({
        query: search,
        status,
        initiatorId: initiator_id,
        responderId: responder_id,
        featured: featured === 'true',
        page: parseInt(page),
        limit: parseInt(limit)
      }, currentUserId);

      res.status(200).json({
        success: true,
        data: searchResults.swapDeals,
        pagination: searchResults.pagination
      });

    } catch (error) {
      console.error('Error fetching swap deals:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get a specific swap deal by ID
  async getSwapDealById(req, res) {
    try {
      const { id } = req.params;

      const swapDeal = await db.SwapDeal.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'initiator',
            attributes: ['id', 'username', 'profilePicture', 'email']
          },
          {
            model: db.UserTable,
            as: 'responder',
            attributes: ['id', 'username', 'profilePicture', 'email']
          },
          {
            model: db.Product,
            as: 'initiatorItem',
            attributes: ['id', 'title', 'description', 'price', 'images', 'status', 'condition']
          },
          {
            model: db.Product,
            as: 'responderItem',
            attributes: ['id', 'title', 'description', 'price', 'images', 'status', 'condition']
          }
        ]
      });

      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Increment view count
      await swapDeal.increment('views_count');

      res.json({
        success: true,
        data: swapDeal
      });

    } catch (error) {
      console.error('Error fetching swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update a swap deal
  async updateSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is involved in the swap deal
      if (swapDeal.initiator_id !== user_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this swap deal'
        });
      }

      // Prevent updates if swap deal is already completed or cancelled
      if (['completed', 'cancelled'].includes(swapDeal.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update swap deal that is already completed or cancelled'
        });
      }

      // Only allow certain fields to be updated
      const allowedUpdates = ['swap_terms', 'meeting_location', 'meeting_date'];
      const filteredUpdates = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredUpdates[field] = updateData[field];
        }
      });

      await swapDeal.update(filteredUpdates);

      res.json({
        success: true,
        message: 'Swap deal updated successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error updating swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Accept a swap deal
  async acceptSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const { responder_message } = req.body;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is the initiator (initiators cannot accept their own swap deals)
      if (swapDeal.initiator_id === user_id) {
        return res.status(403).json({
          success: false,
          message: 'You cannot accept your own swap deal'
        });
      }

      // For open swap deals (where responder_id = initiator_id), anyone except the initiator can accept
      // For direct swap deals (where responder_id != initiator_id), only the specific responder can accept
      if (swapDeal.responder_id !== swapDeal.initiator_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the designated responder can accept this swap deal'
        });
      }

      // Check if swap deal is still pending
      if (swapDeal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Swap deal is no longer pending'
        });
      }

      // Check if swap deal has expired
      if (swapDeal.expires_at && new Date(swapDeal.expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Swap deal has expired'
        });
      }

      // Update swap deal
      await swapDeal.update({
        status: 'accepted',
        responder_approval: true,
        responder_message: responder_message || swapDeal.responder_message
      });

      res.json({
        success: true,
        message: 'Swap deal accepted successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error accepting swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Reject a swap deal
  async rejectSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is the initiator (initiators cannot reject their own swap deals)
      if (swapDeal.initiator_id === user_id) {
        return res.status(403).json({
          success: false,
          message: 'You cannot reject your own swap deal'
        });
      }

      // For open swap deals (where responder_id = initiator_id), anyone except the initiator can reject
      // For direct swap deals (where responder_id != initiator_id), only the specific responder can reject
      if (swapDeal.responder_id !== swapDeal.initiator_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the designated responder can reject this swap deal'
        });
      }

      // Check if swap deal is still pending
      if (swapDeal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Swap deal is no longer pending'
        });
      }

      // Update swap deal
      await swapDeal.update({
        status: 'rejected',
        responder_message: reason || 'Swap deal rejected'
      });

      res.json({
        success: true,
        message: 'Swap deal rejected successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error rejecting swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Cancel a swap deal
  async cancelSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is the initiator
      if (swapDeal.initiator_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the initiator can cancel this swap deal'
        });
      }

      // Check if swap deal is still pending
      if (swapDeal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel swap deal that is no longer pending'
        });
      }

      // Update swap deal
      await swapDeal.update({
        status: 'cancelled'
      });

      res.json({
        success: true,
        message: 'Swap deal cancelled successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error cancelling swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Complete a swap deal
  async completeSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is involved in the swap deal
      if (swapDeal.initiator_id !== user_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to complete this swap deal'
        });
      }

      // Check if swap deal is accepted
      if (swapDeal.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Swap deal must be accepted before it can be completed'
        });
      }

      // Update swap deal status
      await swapDeal.update({
        status: 'completed'
      });

      // Update product statuses to 'swapped'
      await db.Product.update(
        { status: 'swapped' },
        { where: { id: [swapDeal.initiator_item_id, swapDeal.responder_item_id] } }
      );

      res.json({
        success: true,
        message: 'Swap deal completed successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error completing swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user's swap deals (initiated or received)
  async getUserSwapDeals(req, res) {
    try {
      const user_id = req.user.id;
      const { type = 'all' } = req.query; // 'initiated', 'received', 'all'

      let whereClause = {};

      if (type === 'initiated') {
        whereClause.initiator_id = user_id;
      } else if (type === 'received') {
        whereClause.responder_id = user_id;
      } else {
        // 'all' - get both initiated and received
        whereClause[Op.or] = [
          { initiator_id: user_id },
          { responder_id: user_id }
        ];
      }

      const swapDeals = await db.SwapDeal.findAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'initiator',
            attributes: ['id', 'username', 'profilePicture']
          },
          {
            model: db.UserTable,
            as: 'responder',
            attributes: ['id', 'username', 'profilePicture']
          },
          {
            model: db.Product,
            as: 'initiatorItem',
            attributes: ['id', 'title', 'price', 'images', 'status']
          },
          {
            model: db.Product,
            as: 'responderItem',
            attributes: ['id', 'title', 'price', 'images', 'status']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: swapDeals
      });

    } catch (error) {
      console.error('Error fetching user swap deals:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Accept a swap deal
  async acceptSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is the initiator (cannot accept own swap deal)
      if (swapDeal.initiator_id === user_id) {
        return res.status(403).json({
          success: false,
          message: 'You cannot accept your own swap deal'
        });
      }

      // Check if user is the designated responder or if it's an open swap deal
      if (swapDeal.responder_id !== swapDeal.initiator_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the designated responder can accept this swap deal'
        });
      }

      // Check if swap deal is still pending
      if (swapDeal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Swap deal is not available for acceptance'
        });
      }

      // Update swap deal status
      await swapDeal.update({ 
        status: 'accepted',
        responder_id: user_id // Update responder if it was an open deal
      });

      // Get responder info for notifications
      const responder = await db.UserTable.findByPk(user_id, {
        attributes: ['id', 'fullName', 'username', 'profilePicture']
      });

      // Send notification to initiator that their swap deal was accepted
      await createNotification(
        swapDeal.initiator_id,
        'Swap Deal Accepted!',
        `${responder.fullName || responder.username} accepted your swap deal "${swapDeal.title}"`,
        'success',
        'swap_deal',
        { 
          swapDealId: swapDeal.id,
          title: swapDeal.title,
          responderId: user_id,
          responderName: responder.fullName || responder.username,
          responderUsername: responder.username,
          status: 'accepted',
          acceptedAt: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Swap deal accepted successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error accepting swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Reject a swap deal
  async rejectSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const swapDeal = await db.SwapDeal.findByPk(id);
      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found'
        });
      }

      // Check if user is the initiator (cannot reject own swap deal)
      if (swapDeal.initiator_id === user_id) {
        return res.status(403).json({
          success: false,
          message: 'You cannot reject your own swap deal'
        });
      }

      // Check if user is the designated responder or if it's an open swap deal
      if (swapDeal.responder_id !== swapDeal.initiator_id && swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the designated responder can reject this swap deal'
        });
      }

      // Check if swap deal is still pending
      if (swapDeal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Swap deal is not available for rejection'
        });
      }

      // Update swap deal status
      await swapDeal.update({ 
        status: 'rejected',
        responder_id: user_id // Update responder if it was an open deal
      });

      // Get responder info for notifications
      const responder = await db.UserTable.findByPk(user_id, {
        attributes: ['id', 'fullName', 'username', 'profilePicture']
      });

      // Send notification to initiator that their swap deal was rejected
      await createNotification(
        swapDeal.initiator_id,
        'Swap Deal Rejected',
        `${responder.fullName || responder.username} rejected your swap deal "${swapDeal.title}"`,
        'warning',
        'swap_deal',
        { 
          swapDealId: swapDeal.id,
          title: swapDeal.title,
          responderId: user_id,
          responderName: responder.fullName || responder.username,
          responderUsername: responder.username,
          status: 'rejected',
          rejectedAt: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Swap deal rejected successfully',
        data: swapDeal
      });

    } catch (error) {
      console.error('Error rejecting swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get swap deal statistics
  async getSwapDealStats(req, res) {
    try {
      const stats = await db.SwapDeal.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const totalSwapDeals = await db.SwapDeal.count();
      const pendingSwapDeals = await db.SwapDeal.count({ where: { status: 'pending' } });
      const acceptedSwapDeals = await db.SwapDeal.count({ where: { status: 'accepted' } });
      const completedSwapDeals = await db.SwapDeal.count({ where: { status: 'completed' } });

      res.json({
        success: true,
        data: {
          status_breakdown: stats,
          total: totalSwapDeals,
          pending: pendingSwapDeals,
          accepted: acceptedSwapDeals,
          completed: completedSwapDeals
        }
      });

    } catch (error) {
      console.error('Error fetching swap deal stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new SwapDealController();
