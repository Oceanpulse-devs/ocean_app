const db = require('../../models');
const { Op } = require('sequelize');

class GroupBuyController {
  // Create a new group buy
  async createGroupBuy(req, res) {
    try {
      const {
        title,
        description,
        category_id,
        product_name,
        product_image,
        original_price,
        group_price,
        min_buyers,
        max_buyers,
        location,
        deadline,
        terms_conditions,
        tags
      } = req.body;

      const creator_id = req.user.id;

      // Validate required fields
      if (!title || !description || !category_id || !product_name || !original_price || !group_price || !min_buyers || !deadline) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate prices
      if (group_price >= original_price) {
        return res.status(400).json({
          success: false,
          message: 'Group price must be less than original price'
        });
      }

      // Validate deadline (must be in the future)
      if (new Date(deadline) <= new Date()) {
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

      // Check if category exists
      const category = await db.ProductCategory.findByPk(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }

      const groupBuy = await db.GroupBuy.create({
        title,
        description,
        category_id,
        product_name,
        product_image,
        original_price,
        group_price,
        min_buyers,
        max_buyers,
        creator_id,
        location,
        deadline,
        terms_conditions,
        tags: tags ? JSON.parse(tags) : null,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Group buy created successfully',
        data: groupBuy
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
        status,
        category_id,
        location,
        min_price,
        max_price,
        featured,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status) whereClause.status = status;
      if (category_id) whereClause.category_id = category_id;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };
      if (featured === 'true') whereClause.is_featured = true;
      if (min_price) whereClause.group_price = { [Op.gte]: parseFloat(min_price) };
      if (max_price) {
        whereClause.group_price = whereClause.group_price || {};
        whereClause.group_price[Op.lte] = parseFloat(max_price);
      }
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { product_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await db.GroupBuy.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'creator',
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
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
      console.error('Error fetching group buys:', error);
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
            attributes: ['id', 'username', 'profile_picture', 'email']
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
                attributes: ['id', 'username', 'profile_picture']
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

      // Increment view count
      await groupBuy.increment('views_count');

      res.json({
        success: true,
        data: groupBuy
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
      const updateData = req.body;
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

      // Validate prices if updating
      if (updateData.group_price && updateData.original_price) {
        if (updateData.group_price >= updateData.original_price) {
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

      await groupBuy.update(updateData);

      res.json({
        success: true,
        message: 'Group buy updated successfully',
        data: groupBuy
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

      // Check if group buy is still open
      if (groupBuy.status !== 'pending') {
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

      // Check if minimum threshold is met
      if (groupBuy.current_buyers + 1 >= groupBuy.min_buyers) {
        await groupBuy.update({ status: 'active' });
      }

      res.status(201).json({
        success: true,
        message: 'Successfully joined group buy',
        data: participant
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

      await participant.destroy();

      // Update current buyers count
      await groupBuy.decrement('current_buyers');

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
          model: GroupBuyParticipant,
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
          model: GroupBuyParticipant,
          as: 'participants',
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'username', 'profile_picture']
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
            attributes: ['id', 'username', 'profile_picture']
          },
          {
            model: db.ProductCategory,
            as: 'groupBuyCategory',
            attributes: ['id', 'name']
          },
          ...includeClause
        ],
        order: [['created_at', 'DESC']]
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
