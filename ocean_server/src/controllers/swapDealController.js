const db = require('../../models');
const { Op } = require('sequelize');

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
        swap_terms,
        meeting_location,
        meeting_date,
        initiator_message,
        expires_at
      } = req.body;

      const initiator_id = req.user.id;

      // Validate required fields
      if (!title || !description || !responder_id || !initiator_item_id || !responder_item_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if initiator is not trying to swap with themselves
      if (initiator_id === responder_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create swap deal with yourself'
        });
      }

      // Check if responder exists
      const responder = await db.UserTable.findByPk(responder_id);
      if (!responder) {
        return res.status(400).json({
          success: false,
          message: 'Responder user not found'
        });
      }

      // Check if initiator owns the initiator item
      const initiatorItem = await db.Product.findOne({
        where: { id: initiator_item_id, seller_id: initiator_id }
      });
      if (!initiatorItem) {
        return res.status(400).json({
          success: false,
          message: 'You do not own the item you are offering'
        });
      }

      // Check if responder owns the responder item
      const responderItem = await db.Product.findOne({
        where: { id: responder_item_id, seller_id: responder_id }
      });
      if (!responderItem) {
        return res.status(400).json({
          success: false,
          message: 'Responder does not own the item you want to swap for'
        });
      }

      // Check if items are available for swap
      if (initiatorItem.status !== 'available' || responderItem.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'One or both items are not available for swap'
        });
      }

      // Check if there's already a pending swap deal between these users for these items
      const existingSwap = await db.SwapDeal.findOne({
        where: {
          [Op.or]: [
            {
              initiator_id,
              responder_id,
              initiator_item_id,
              responder_item_id,
              status: 'pending'
            },
            {
              initiator_id: responder_id,
              responder_id: initiator_id,
              initiator_item_id: responder_item_id,
              responder_item_id: initiator_item_id,
              status: 'pending'
            }
          ]
        }
      });

      if (existingSwap) {
        return res.status(400).json({
          success: false,
          message: 'A swap deal already exists for these items'
        });
      }

      // Set expiration date (default 7 days from now)
      const expirationDate = expires_at ? new Date(expires_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const swapDeal = await db.SwapDeal.create({
        title,
        description,
        initiator_id,
        responder_id,
        initiator_item_id,
        responder_item_id,
        swap_terms,
        meeting_location,
        meeting_date,
        initiator_message,
        expires_at: expirationDate,
        status: 'pending'
      });

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
        status,
        initiator_id,
        responder_id,
        featured,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status) whereClause.status = status;
      if (initiator_id) whereClause.initiator_id = initiator_id;
      if (responder_id) whereClause.responder_id = responder_id;
      if (featured === 'true') whereClause.is_featured = true;
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await db.SwapDeal.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'initiator',
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.UserTable,
            as: 'responder',
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.Product,
            as: 'initiatorItem',
            attributes: ['id', 'name', 'price', 'images', 'status']
          },
          {
            model: db.Product,
            as: 'responderItem',
            attributes: ['id', 'name', 'price', 'images', 'status']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
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
            attributes: ['id', 'username', 'profile_picture', 'email']
          },
          {
            model: db.UserTable,
            as: 'responder',
            attributes: ['id', 'username', 'profile_picture', 'email']
          },
          {
            model: db.Product,
            as: 'initiatorItem',
            attributes: ['id', 'name', 'description', 'price', 'images', 'status', 'condition']
          },
          {
            model: db.Product,
            as: 'responderItem',
            attributes: ['id', 'name', 'description', 'price', 'images', 'status', 'condition']
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

      // Check if user is the responder
      if (swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the responder can accept this swap deal'
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

      // Check if user is the responder
      if (swapDeal.responder_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the responder can reject this swap deal'
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
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.UserTable,
            as: 'responder',
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.Product,
            as: 'initiatorItem',
            attributes: ['id', 'name', 'price', 'images', 'status']
          },
          {
            model: db.Product,
            as: 'responderItem',
            attributes: ['id', 'name', 'price', 'images', 'status']
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
