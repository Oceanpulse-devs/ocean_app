const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');

// Helper function to map swap deal field names for frontend
const mapSwapDealResponse = (swapDeal) => {
  const mapped = swapDeal.toJSON ? swapDeal.toJSON() : { ...swapDeal };
  return {
    ...mapped,
    myProductName: mapped.productToSwap,  // Map productToSwap → myProductName
    lookingForName: mapped.preferredItems || mapped.lookingFor || null  // Add lookingForName
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
    console.log(`📧 Swap deal notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating swap deal notification:', error);
  }
};

// Helper function to send DM notification
const sendDMNotification = async (sellerId, proposerId, swapDealId, proposalId) => {
  try {
    // This would integrate with your messaging system
    // For now, we'll create a notification
    await createNotification(
      sellerId,
      'New Swap Proposal',
      'You have received a new swap proposal for your product.',
      'swap_proposal',
      'swap',
      { swapDealId, proposalId, proposerId }
    );
    console.log(`📨 DM notification sent to seller ${sellerId} for swap proposal ${proposalId}`);
  } catch (error) {
    console.error('Error sending DM notification:', error);
  }
};

class SwapDealController {
  // Create a new swap deal (seller lists product for swap)
  async createSwapDeal(req, res) {
    try {
      const {
        productToSwap,
        categoryToSwap,
        brandToSwap,
        description,
        condition,
        preferredSwapCategory,
        preferredSwapSubcategories,
        swapConditions
      } = req.body;

      const sellerId = req.user.id;

      // Check subscription limits for swap deal creation
      const subscriptionCheck = await checkSubscriptionLimit(sellerId, 'swap_deals');
      
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          message: subscriptionCheck.reason,
          upgradeRequired: true,
          currentPlan: subscriptionCheck.plan,
          suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
        });
      }

      // Check if user's plan allows creating swap deals
      const featureCheck = await checkFeatureAccess(sellerId, 'canCreateSwapDeals');
      
      if (!featureCheck.allowed) {
        return res.status(403).json({
          message: featureCheck.reason,
          upgradeRequired: true,
          currentPlan: featureCheck.plan,
          suggestedPlan: 'wave'
        });
      }

      // Validate required fields
      if (!productToSwap || !categoryToSwap || !description || !condition || !preferredSwapCategory || !swapConditions) {
        return res.status(400).json({
          success: false,
          message: 'Product name, category, description, condition, preferred swap category, and swap conditions are required'
        });
      }

      // Process uploaded images for the swap deal
      let swapDealImages = [];
        if (req.files && req.files.length > 0) {
        console.log(`📸 Processing ${req.files.length} images for swap deal`);
        
        for (const file of req.files) {
          try {
            const uploadResult = await cloudinaryService.uploadProductImage(
              file.buffer, 
              `swap-deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            );
            
            if (uploadResult.success) {
              swapDealImages.push(uploadResult.url);
              console.log(`✅ Image uploaded successfully: ${uploadResult.url}`);
            } else {
              console.warn(`❌ Failed to upload image: ${file.originalname}. Error: ${uploadResult.error}`);
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading image ${file.originalname}:`, uploadError);
          }
        }
      }

      // Create the swap deal
      const swapDeal = await db.SwapDeal.create({
        sellerId: sellerId,
        productToSwap: productToSwap,
        categoryToSwap: categoryToSwap,
        brandToSwap: brandToSwap,
        description: description,
        condition: condition,
        preferredSwapCategory: preferredSwapCategory,
        preferredSwapSubcategories: JSON.stringify(preferredSwapSubcategories || []),
        swapConditions: swapConditions,
        title: `${productToSwap} - Swap Deal`,
        swapTerms: `Looking to swap ${productToSwap} (${brandToSwap || 'Any brand'}) in ${categoryToSwap} category`,
        preferredItems: `${categoryToSwap} items, preferably ${brandToSwap || 'any brand'}`,
        meetingLocation: null,
        meetingDate: null,
        status: 'active',
        viewsCount: 0,
        proposalsCount: 0,
        isFeatured: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        images: JSON.stringify(swapDealImages)
      });

      // Increment usage count
      await incrementUsage(sellerId, 'swap_deals');

      // Create notification
      await createNotification(
        sellerId,
        'Swap Deal Created',
        `Your swap deal for ${productToSwap} has been created successfully!`,
        'success',
        'swap'
      );

      // Map swap deal field names for frontend compatibility
      const swapDealObj = {
        id: swapDeal.id,
        sellerId: swapDeal.sellerId,
        productToSwap: swapDeal.productToSwap,
        categoryToSwap: swapDeal.categoryToSwap,
        brandToSwap: swapDeal.brandToSwap,
        description: swapDeal.description,
        condition: swapDeal.condition,
        preferredSwapCategory: swapDeal.preferredSwapCategory,
        preferredSwapSubcategories: JSON.parse(swapDeal.preferredSwapSubcategories || '[]'),
        swapConditions: swapDeal.swapConditions,
        title: swapDeal.title,
        swapTerms: swapDeal.swapTerms,
        preferredItems: swapDeal.preferredItems,
        status: swapDeal.status,
        viewsCount: swapDeal.viewsCount,
        proposalsCount: swapDeal.proposalsCount,
        images: JSON.parse(swapDeal.images || '[]'),
        createdAt: swapDeal.createdAt,
        expiresAt: swapDeal.expiresAt
      };

      const mappedSwapDeal = mapSwapDealResponse(swapDealObj);

      res.status(201).json({
        success: true,
        message: 'Swap deal created successfully',
        data: {
          swapDeal: mappedSwapDeal
        }
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

  // Get all active swap deals
  async getAllSwapDeals(req, res) {
    try {
      const { page = 1, limit = 20, category, location, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = { status: 'active' };

      // Add filters
      if (category) {
        whereClause['$product.category$'] = category;
      }
      if (location) {
        whereClause['$product.location$'] = { [Op.like]: `%${location}%` };
      }
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { '$product.title$': { [Op.like]: `%${search}%` } }
        ];
      }

      const swapDeals = await db.SwapDeal.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'username', 'profilePicture']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map swap deal field names for frontend compatibility
      const mappedSwapDeals = swapDeals.rows.map(mapSwapDealResponse);

      res.json({
        success: true,
        data: {
          swapDeals: mappedSwapDeals,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(swapDeals.count / limit),
            totalItems: swapDeals.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching swap deals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch swap deals',
        error: error.message
      });
    }
  }

  // Get swap deal by ID with proposals
  async getSwapDealById(req, res) {
    try {
      const { id } = req.params;

      const swapDeal = await db.SwapDeal.findOne({
        where: { id },
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'username', 'profilePicture']
          },
          {
            model: db.SwapProposal,
            as: 'proposals',
            include: [
              {
                model: db.UserTable,
                as: 'proposer',
                attributes: ['id', 'fullName', 'username', 'profilePicture']
              }
            ],
            order: [['createdAt', 'DESC']]
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
      await swapDeal.increment('viewsCount');

      // Map swap deal field names for frontend compatibility
      const mappedSwapDeal = mapSwapDealResponse(swapDeal);

      res.json({
        success: true,
        data: { swapDeal: mappedSwapDeal }
      });

    } catch (error) {
      console.error('Error fetching swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch swap deal',
        error: error.message
      });
    }
  }

  // Propose a swap (buyer proposes swap)
  async proposeSwap(req, res) {
    try {
      const { swapDealId } = req.params;
      const {
        proposerItemName,
        proposerItemDescription,
        proposerItemCondition,
        proposerMessage
      } = req.body;

      const proposerId = req.user.id;

      // Validate required fields
      if (!proposerItemName || !proposerItemDescription) {
        return res.status(400).json({
          success: false,
          message: 'Item name and description are required'
        });
      }

      // Verify swap deal exists and is active
      const swapDeal = await db.SwapDeal.findOne({
        where: { id: swapDealId, status: 'active' }
      });

      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found or no longer active'
        });
      }

      // Check if user already proposed for this swap deal
      const existingProposal = await db.SwapProposal.findOne({
        where: { swapDealId, proposerId }
      });

      if (existingProposal) {
        return res.status(400).json({
        success: false,
          message: 'You have already proposed a swap for this deal'
        });
      }

      // Process uploaded images if any
      let proposerItemImages = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          try {
            const uploadResult = await cloudinaryService.uploadProductImage(
              file.buffer, 
              `swap-proposal-${Date.now()}-${i}`
            );
            
            if (uploadResult.success) {
              proposerItemImages.push(uploadResult.url);
            }
          } catch (error) {
            console.error('Error uploading proposal image:', error);
          }
        }
      }

      // Create the swap proposal
      const proposal = await db.SwapProposal.create({
        swapDealId,
        proposerId,
        proposerItemName: proposerItemName.trim(),
        proposerItemDescription: proposerItemDescription.trim(),
        proposerItemImages: proposerItemImages,
        proposerItemCondition: proposerItemCondition || 'good',
        proposerMessage: proposerMessage?.trim(),
        status: 'pending'
      });

      // Increment proposals count on swap deal
      await swapDeal.increment('proposalsCount');

      // Send DM notification to seller
      await sendDMNotification(swapDeal.sellerId, proposerId, swapDealId, proposal.id);

      res.status(201).json({
        success: true,
        message: 'Swap proposal submitted successfully',
        data: {
          proposal: {
            id: proposal.id,
            proposerItemName: proposal.proposerItemName,
            proposerItemDescription: proposal.proposerItemDescription,
            status: proposal.status,
            createdAt: proposal.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Error creating swap proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create swap proposal',
        error: error.message
      });
    }
  }

  // Accept swap proposal (seller accepts)
  async acceptProposal(req, res) {
    try {
      const { proposalId } = req.params;
      const sellerId = req.user.id;

      const proposal = await db.SwapProposal.findOne({
        where: { id: proposalId, status: 'pending' },
        include: [
          {
            model: db.SwapDeal,
            as: 'swapDeal',
            where: { sellerId: sellerId }
          }
        ]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found or you do not own this swap deal'
        });
      }

      // Update proposal status
      await proposal.update({ status: 'accepted' });

      // Update swap deal status to completed
      await proposal.swapDeal.update({ status: 'completed' });

      // Create notifications
      await createNotification(
        proposal.proposerId,
        'Swap Proposal Accepted',
        `Your swap proposal for "${proposal.swapDeal.title}" has been accepted!`,
        'success',
        'swap'
      );

      await createNotification(
        sellerId,
        'Swap Deal Completed',
        `You have accepted a swap proposal for "${proposal.swapDeal.title}".`,
        'success',
        'swap'
      );

      res.json({
        success: true,
        message: 'Swap proposal accepted successfully',
        data: { proposal }
      });

    } catch (error) {
      console.error('Error accepting proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept proposal',
        error: error.message
      });
    }
  }

  // Reject swap proposal (seller rejects)
  async rejectProposal(req, res) {
    try {
      const { proposalId } = req.params;
      const sellerId = req.user.id;

      const proposal = await db.SwapProposal.findOne({
        where: { id: proposalId, status: 'pending' },
        include: [
          {
            model: db.SwapDeal,
            as: 'swapDeal',
            where: { sellerId: sellerId }
          }
        ]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found or you do not own this swap deal'
        });
      }

      // Update proposal status
      await proposal.update({ status: 'rejected' });

      // Create notification
      await createNotification(
        proposal.proposerId,
        'Swap Proposal Rejected',
        `Your swap proposal for "${proposal.swapDeal.title}" was not accepted.`,
        'info',
        'swap'
      );

      res.json({
        success: true,
        message: 'Swap proposal rejected',
        data: { proposal }
      });

    } catch (error) {
      console.error('Error rejecting proposal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject proposal',
        error: error.message
      });
    }
  }

  // Get user's swap deals (seller's perspective)
  async getUserSwapDeals(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const swapDeals = await db.SwapDeal.findAndCountAll({
        where: { sellerId: userId },
        include: [
          {
            model: db.SwapProposal,
            as: 'proposals',
            include: [
              {
                model: db.UserTable,
                as: 'proposer',
                attributes: ['id', 'fullName', 'username', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          swapDeals: swapDeals.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(swapDeals.count / limit),
            totalItems: swapDeals.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user swap deals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch swap deals',
        error: error.message
      });
    }
  }

  // Get user's swap proposals (buyer's perspective)
  async getUserProposals(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const proposals = await db.SwapProposal.findAndCountAll({
        where: { proposerId: userId },
        include: [
          {
            model: db.SwapDeal,
            as: 'swapDeal',
            include: [
          {
            model: db.UserTable,
                as: 'seller',
                attributes: ['id', 'fullName', 'username', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          proposals: proposals.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(proposals.count / limit),
            totalItems: proposals.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user proposals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch proposals',
        error: error.message
      });
    }
  }

  // Update swap deal
  async updateSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;
      const updateData = req.body;

      const swapDeal = await db.SwapDeal.findOne({
        where: { id, sellerId }
      });

      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Swap deal not found or you do not own this deal'
        });
      }

      // Update swap deal
      await swapDeal.update(updateData);

      res.json({
        success: true,
        message: 'Swap deal updated successfully',
        data: { swapDeal }
      });

    } catch (error) {
      console.error('Error updating swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update swap deal',
        error: error.message
      });
    }
  }

  // Cancel swap deal
  async cancelSwapDeal(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      const swapDeal = await db.SwapDeal.findOne({
        where: { id, sellerId, status: 'active' }
      });

      if (!swapDeal) {
        return res.status(404).json({
          success: false,
          message: 'Active swap deal not found or you do not own this deal'
        });
      }

      // Update swap deal status
      await swapDeal.update({ status: 'cancelled' });

      // Update all pending proposals to expired
      await db.SwapProposal.update(
        { status: 'expired' },
        { where: { swapDealId: id, status: 'pending' } }
      );

      res.json({
        success: true,
        message: 'Swap deal cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling swap deal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel swap deal',
        error: error.message
      });
    }
  }

  // Get swap deal statistics
  async getSwapDealStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Promise.all([
        // Total swap deals created
        db.SwapDeal.count({ where: { sellerId: userId } }),
        
        // Active swap deals
        db.SwapDeal.count({ where: { sellerId: userId, status: 'active' } }),
        
        // Completed swap deals
        db.SwapDeal.count({ where: { sellerId: userId, status: 'completed' } }),
        
        // Total proposals received
        db.SwapProposal.count({
          include: [{
            model: db.SwapDeal,
            as: 'swapDeal',
            where: { sellerId: userId }
          }]
        }),
        
        // Total proposals made
        db.SwapProposal.count({ where: { proposerId: userId } }),
        
        // Accepted proposals
        db.SwapProposal.count({ 
          where: { proposerId: userId, status: 'accepted' } 
        })
      ]);

      res.json({
        success: true,
        data: {
          swapDealsCreated: stats[0],
          activeSwapDeals: stats[1],
          completedSwapDeals: stats[2],
          proposalsReceived: stats[3],
          proposalsMade: stats[4],
          proposalsAccepted: stats[5]
        }
      });

    } catch (error) {
      console.error('Error fetching swap deal stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
}

module.exports = new SwapDealController();