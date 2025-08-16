const db = require('../../models');
const { Op } = require('sequelize');

class BuyerNeedController {
  // Create a new buyer need
  async createBuyerNeed(req, res) {
    try {
      const {
        title,
        description,
        category_id,
        budget_min,
        budget_max,
        currency,
        location,
        urgency,
        expires_at,
        tags,
        contact_preference,
        additional_requirements
      } = req.body;

      const buyer_id = req.user.id;

      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      // Validate budget range
      if (budget_min && budget_max && parseFloat(budget_min) > parseFloat(budget_max)) {
        return res.status(400).json({
          success: false,
          message: 'Minimum budget cannot be greater than maximum budget'
        });
      }

      // Validate expiration date (must be in the future)
      if (expires_at && new Date(expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date must be in the future'
        });
      }

      // Check if category exists if provided
      if (category_id) {
        const category = await db.ProductCategory.findByPk(category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }
      }

      // Set default expiration (30 days from now)
      const expirationDate = expires_at ? new Date(expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const buyerNeed = await db.BuyerNeed.create({
        title,
        description,
        buyer_id,
        category_id,
        budget_min: budget_min ? parseFloat(budget_min) : null,
        budget_max: budget_max ? parseFloat(budget_max) : null,
        currency: currency || 'USD',
        location,
        urgency: urgency || 'medium',
        expires_at: expirationDate,
        tags: tags ? JSON.parse(tags) : null,
        contact_preference: contact_preference || 'message',
        additional_requirements,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Buyer need created successfully',
        data: buyerNeed
      });

    } catch (error) {
      console.error('Error creating buyer need:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all buyer needs with filters
  async getAllBuyerNeeds(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category_id,
        location,
        urgency,
        budget_min,
        budget_max,
        featured,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status) whereClause.status = status;
      if (category_id) whereClause.category_id = category_id;
      if (urgency) whereClause.urgency = urgency;
      if (featured === 'true') whereClause.is_featured = true;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };

      // Budget filters
      if (budget_min || budget_max) {
        whereClause[Op.and] = [];
        if (budget_min) {
          whereClause[Op.and].push({
            [Op.or]: [
              { budget_max: { [Op.gte]: parseFloat(budget_min) } },
              { budget_max: null }
            ]
          });
        }
        if (budget_max) {
          whereClause[Op.and].push({
            [Op.or]: [
              { budget_min: { [Op.lte]: parseFloat(budget_max) } },
              { budget_min: null }
            ]
          });
        }
      }

      // Search filter
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { additional_requirements: { [Op.like]: `%${search}%` } }
        ];
      }

      // Only show active and non-expired needs
      whereClause.status = { [Op.in]: ['active', 'in_progress'] };
      whereClause.expires_at = { [Op.gt]: new Date() };

      const { count, rows } = await db.BuyerNeed.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'username', 'profile_picture', 'location']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
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
      console.error('Error fetching buyer needs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get a specific buyer need by ID
  async getBuyerNeedById(req, res) {
    try {
      const { id } = req.params;

      const buyerNeed = await db.BuyerNeed.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'username', 'profile_picture', 'email', 'location']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: db.BuyerNeedResponse,
            as: 'responses',
            include: [
              {
                model: db.UserTable,
                as: 'seller',
                attributes: ['id', 'username', 'profile_picture', 'location']
              }
            ],
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      // Increment view count
      await buyerNeed.increment('views_count');

      res.json({
        success: true,
        data: buyerNeed
      });

    } catch (error) {
      console.error('Error fetching buyer need:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update a buyer need
  async updateBuyerNeed(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user_id = req.user.id;

      const buyerNeed = await db.BuyerNeed.findByPk(id);
      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      // Check if user is the buyer
      if (buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can update this need'
        });
      }

      // Prevent updates if buyer need is fulfilled or cancelled
      if (['fulfilled', 'cancelled'].includes(buyerNeed.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update buyer need that is fulfilled or cancelled'
        });
      }

      // Validate budget range if updating
      if (updateData.budget_min && updateData.budget_max) {
        if (parseFloat(updateData.budget_min) > parseFloat(updateData.budget_max)) {
          return res.status(400).json({
            success: false,
            message: 'Minimum budget cannot be greater than maximum budget'
          });
        }
      }

      // Validate expiration date if updating
      if (updateData.expires_at && new Date(updateData.expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date must be in the future'
        });
      }

      await buyerNeed.update(updateData);

      res.json({
        success: true,
        message: 'Buyer need updated successfully',
        data: buyerNeed
      });

    } catch (error) {
      console.error('Error updating buyer need:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete a buyer need
  async deleteBuyerNeed(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const buyerNeed = await db.BuyerNeed.findByPk(id);
      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      // Check if user is the buyer
      if (buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can delete this need'
        });
      }

      // Check if there are responses
      const responseCount = await db.BuyerNeedResponse.count({
        where: { buyer_need_id: id }
      });

      if (responseCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete buyer need with responses. Consider cancelling instead.'
        });
      }

      await buyerNeed.destroy();

      res.json({
        success: true,
        message: 'Buyer need deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting buyer need:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Cancel a buyer need
  async cancelBuyerNeed(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const buyerNeed = await db.BuyerNeed.findByPk(id);
      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      // Check if user is the buyer
      if (buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can cancel this need'
        });
      }

      // Check if buyer need is already cancelled or fulfilled
      if (['cancelled', 'fulfilled'].includes(buyerNeed.status)) {
        return res.status(400).json({
          success: false,
          message: 'Buyer need is already cancelled or fulfilled'
        });
      }

      await buyerNeed.update({ status: 'cancelled' });

      res.json({
        success: true,
        message: 'Buyer need cancelled successfully',
        data: buyerNeed
      });

    } catch (error) {
      console.error('Error cancelling buyer need:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Mark buyer need as fulfilled
  async markBuyerNeedFulfilled(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const buyerNeed = await db.BuyerNeed.findByPk(id);
      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      // Check if user is the buyer
      if (buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can mark this need as fulfilled'
        });
      }

      // Check if buyer need is active or in progress
      if (!['active', 'in_progress'].includes(buyerNeed.status)) {
        return res.status(400).json({
          success: false,
          message: 'Only active or in-progress buyer needs can be marked as fulfilled'
        });
      }

      await buyerNeed.update({ status: 'fulfilled' });

      res.json({
        success: true,
        message: 'Buyer need marked as fulfilled successfully',
        data: buyerNeed
      });

    } catch (error) {
      console.error('Error marking buyer need fulfilled:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user's buyer needs (posted by the user)
  async getUserBuyerNeeds(req, res) {
    try {
      const user_id = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { buyer_id: user_id };

      if (status) whereClause.status = status;

      const { count, rows } = await db.BuyerNeed.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: db.BuyerNeedResponse,
            as: 'responses',
            attributes: ['id', 'status', 'created_at']
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
      console.error('Error fetching user buyer needs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get buyer need statistics
  async getBuyerNeedStats(req, res) {
    try {
      const stats = await db.BuyerNeed.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const totalBuyerNeeds = await db.BuyerNeed.count();
      const activeBuyerNeeds = await db.BuyerNeed.count({ 
        where: { 
          status: { [Op.in]: ['active', 'in_progress'] },
          expires_at: { [Op.gt]: new Date() }
        } 
      });
      const fulfilledBuyerNeeds = await db.BuyerNeed.count({ where: { status: 'fulfilled' } });

      res.json({
        success: true,
        data: {
          status_breakdown: stats,
          total: totalBuyerNeeds,
          active: activeBuyerNeeds,
          fulfilled: fulfilledBuyerNeeds
        }
      });

    } catch (error) {
      console.error('Error fetching buyer need stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BuyerNeedController();
