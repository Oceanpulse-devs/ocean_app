const db = require('../../models');
const { Op } = require('sequelize');

// Helper function to map buyer need field names for frontend
const mapBuyerNeedResponse = (buyerNeed) => {
  const mapped = buyerNeed.toJSON ? buyerNeed.toJSON() : { ...buyerNeed };
  return {
    ...mapped,
    caption: mapped.title
  };
};

class BuyerNeedController {
  // Create a new buyer need
  async createBuyerNeed(req, res) {
    try {
      const {
        title,
        caption,  // Accept frontend field name
        description,
        category_id,
        budget,
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

      // Transform frontend field name to backend field name
      const finalTitle = caption || title;

      // Extract budget values from nested object or direct fields
      const finalBudgetMin = budget?.min || budget_min;
      const finalBudgetMax = budget?.max || budget_max;
      const finalCurrency = budget?.currency || currency;

      const buyer_id = req.user.id;

      // Validate required fields
      if (!finalTitle || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title/Caption and description are required'
        });
      }

      // Validate budget range
      if (finalBudgetMin && finalBudgetMax && parseFloat(finalBudgetMin) > parseFloat(finalBudgetMax)) {
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

      // Check if category exists if provided (supports both UUID and name)
      if (category_id) {
        let category;
        // Try to find by UUID first
        if (category_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          category = await db.ProductCategory.findByPk(category_id);
        } else {
          // Try to find by name (for backward compatibility)
          category = await db.ProductCategory.findOne({ where: { name: category_id } });
        }
        
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category. Please select a valid category from the list.'
          });
        }
        
        // Update category usage count
        await category.update({ usageCount: category.usageCount + 1 });
      }

      // Set default expiration (30 days from now)
      const expirationDate = expires_at ? new Date(expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const buyerNeed = await db.BuyerNeed.create({
        title: finalTitle,  // Use transformed value
        description,
        buyer_id,
        category_id,
        budget_min: finalBudgetMin ? parseFloat(finalBudgetMin) : null,
        budget_max: finalBudgetMax ? parseFloat(finalBudgetMax) : null,
        currency: finalCurrency || 'USD',
        location: location ? (typeof location === 'object' ? `${location.city || ''}, ${location.state || ''}, ${location.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : location) : null,
        urgency: urgency || 'medium',
        expires_at: expirationDate,
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : null,
        contact_preference: contact_preference || 'message',
        additional_requirements,
        status: 'active'
      });

      // Map buyer need field names for frontend compatibility
      const mappedBuyerNeed = mapBuyerNeedResponse(buyerNeed);

      res.status(201).json({
        success: true,
        message: 'Buyer need created successfully',
        data: mappedBuyerNeed
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
            attributes: ['id', 'username', 'profilePicture', 'location']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description', 'icon', 'isCustom', 'usageCount']
          }
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map buyer need field names for frontend compatibility
      const mappedBuyerNeeds = rows.map(buyerNeed => {
        const need = mapBuyerNeedResponse(buyerNeed);
        return {
          ...need,
          canContact: !buyerNeed.reach_exceeded && buyerNeed.current_reach < buyerNeed.reach_limit,
          reachStatus: `${buyerNeed.current_reach}/${buyerNeed.reach_limit}`
        };
      });

      res.json({
        success: true,
        data: mappedBuyerNeeds,
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
            attributes: ['id', 'username', 'profilePicture', 'email', 'location']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description', 'icon', 'isCustom', 'usageCount']
          },
          {
            model: db.BuyerNeedResponse,
            as: 'responses',
            include: [
              {
                model: db.UserTable,
                as: 'seller',
                attributes: ['id', 'username', 'profilePicture', 'location']
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

      // Extract budget values from nested object or direct fields
      const finalBudgetMin = updateData.budget?.min || updateData.budget_min;
      const finalBudgetMax = updateData.budget?.max || updateData.budget_max;
      const finalCurrency = updateData.budget?.currency || updateData.currency;

      // Update the updateData object with extracted values
      if (finalBudgetMin !== undefined) updateData.budget_min = finalBudgetMin;
      if (finalBudgetMax !== undefined) updateData.budget_max = finalBudgetMax;
      if (finalCurrency !== undefined) updateData.currency = finalCurrency;

      // Handle location field (convert object to string if needed)
      if (updateData.location && typeof updateData.location === 'object') {
        updateData.location = `${updateData.location.city || ''}, ${updateData.location.state || ''}, ${updateData.location.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
      }

      // Handle tags field (convert string to array if needed)
      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
      }

      // Validate budget range if updating
      if (finalBudgetMin && finalBudgetMax) {
        if (parseFloat(finalBudgetMin) > parseFloat(finalBudgetMax)) {
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
            attributes: ['id', 'name', 'description', 'icon', 'isCustom', 'usageCount']
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

  // Increment reach for a buyer need
  async incrementReach(req, res) {
    try {
      const { id } = req.params;
      
      const buyerNeed = await db.BuyerNeed.findByPk(id);
      if (!buyerNeed) {
        return res.status(404).json({ 
          success: false, 
          message: 'Buyer need not found' 
        });
      }

      if (buyerNeed.current_reach < buyerNeed.reach_limit) {
        await buyerNeed.increment('current_reach');
        
        // Check if reach limit is now exceeded
        if (buyerNeed.current_reach >= buyerNeed.reach_limit) {
          await buyerNeed.update({ reach_exceeded: true });
        }
        
        res.json({ 
          success: true, 
          currentReach: buyerNeed.current_reach,
          reachLimit: buyerNeed.reach_limit,
          reachExceeded: buyerNeed.reach_exceeded,
          canContact: !buyerNeed.reach_exceeded && buyerNeed.current_reach < buyerNeed.reach_limit
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Reach limit already exceeded' 
        });
      }
    } catch (error) {
      console.error('Error incrementing reach:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get reach status for a buyer need
  async getReachStatus(req, res) {
    try {
      const { id } = req.params;
      
      const buyerNeed = await db.BuyerNeed.findByPk(id, {
        attributes: ['id', 'current_reach', 'reach_limit', 'reach_exceeded']
      });
      
      if (!buyerNeed) {
        return res.status(404).json({ 
          success: false, 
          message: 'Buyer need not found' 
        });
      }

      res.json({
        success: true,
        data: {
          currentReach: buyerNeed.current_reach,
          reachLimit: buyerNeed.reach_limit,
          reachExceeded: buyerNeed.reach_exceeded,
          canContact: !buyerNeed.reach_exceeded && buyerNeed.current_reach < buyerNeed.reach_limit,
          reachStatus: `${buyerNeed.current_reach}/${buyerNeed.reach_limit}`
        }
      });
    } catch (error) {
      console.error('Error getting reach status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BuyerNeedController();
