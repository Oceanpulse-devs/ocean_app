const db = require('../../models');
const { Op } = require('sequelize');

class UserManagementController {
  // Get all users with filtering and pagination
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        accountType,
        accountStatus,
        country,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (accountType) {
        whereClause.accountType = accountType;
      }
      if (accountStatus) {
        whereClause.accountStatus = accountStatus;
      }
      if (country) {
        whereClause.location = country;
      }
      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const users = await db.UserTable.findAndCountAll({
        where: whereClause,
        attributes: [
          'id', 'fullName', 'username', 'email', 'accountType', 
          'accountStatus', 'emailVerified', 'location', 'lastActive', 
          'createdAt', 'profilePicture'
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
            totalItems: users.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await db.UserTable.findByPk(id, {
        attributes: [
          'id', 'fullName', 'username', 'email', 'accountType', 
          'accountStatus', 'emailVerified', 'location', 
          'lastActive', 'createdAt', 'profilePicture', 'coverPicture',
          'bio', 'website'
        ],
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'businessName', 'verificationStatus', 'createdAt']
          },
          {
            model: db.Product,
            as: 'products',
            attributes: ['id', 'title', 'price', 'status', 'createdAt'],
            limit: 10
          },
          {
            model: db.Post,
            as: 'posts',
            attributes: ['id', 'content', 'createdAt'],
            limit: 10
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Suspend user
  async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { suspensionReason, suspensionDuration } = req.body;

      if (!suspensionReason) {
        return res.status(400).json({
          success: false,
          message: 'Suspension reason is required'
        });
      }

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.status(400).json({
          success: false,
          message: 'User is already suspended'
        });
      }

      // Calculate suspension end date
      const suspensionEndDate = suspensionDuration 
        ? new Date(Date.now() + suspensionDuration * 24 * 60 * 60 * 1000)
        : null;

      // Update user status
      await user.update({
        accountStatus: 'suspended',
        suspensionReason,
        suspensionStartDate: new Date(),
        suspensionEndDate
      });

      res.json({
        success: true,
        message: 'User suspended successfully',
        data: user
      });

    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Activate user
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const { activationNotes } = req.body;

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.accountStatus === 'active') {
        return res.status(400).json({
          success: false,
          message: 'User is already active'
        });
      }

      // Update user status
      await user.update({
        accountStatus: 'active',
        suspensionReason: null,
        suspensionStartDate: null,
        suspensionEndDate: null,
        activationNotes: activationNotes || 'User activated by admin'
      });

      res.json({
        success: true,
        message: 'User activated successfully',
        data: user
      });

    } catch (error) {
      console.error('Error activating user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Ban user
  async banUser(req, res) {
    try {
      const { id } = req.params;
      const { banReason, banDuration } = req.body;

      if (!banReason) {
        return res.status(400).json({
          success: false,
          message: 'Ban reason is required'
        });
      }

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.status(400).json({
          success: false,
          message: 'User is already banned/suspended'
        });
      }

      // Calculate ban end date
      const banEndDate = banDuration 
        ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
        : null;

      // Update user status
      await user.update({
        accountStatus: 'suspended',
        banReason,
        banStartDate: new Date(),
        banEndDate
      });

      res.json({
        success: true,
        message: 'User banned successfully',
        data: user
      });

    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Unban user
  async unbanUser(req, res) {
    try {
      const { id } = req.params;
      const { unbanNotes } = req.body;

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.accountStatus !== 'suspended') {
        return res.status(400).json({
          success: false,
          message: 'User is not banned/suspended'
        });
      }

      // Update user status
      await user.update({
        accountStatus: 'active',
        banReason: null,
        banStartDate: null,
        banEndDate: null,
        unbanNotes: unbanNotes || 'User unbanned by admin'
      });

      res.json({
        success: true,
        message: 'User unbanned successfully',
        data: user
      });

    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { deleteReason } = req.body;

      if (!deleteReason) {
        return res.status(400).json({
          success: false,
          message: 'Delete reason is required'
        });
      }

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has important data
      const productCount = await db.Product.count({
        where: { sellerId: id }
      });
      const postCount = await db.Post.count({
        where: { userId: id }
      });

      if (productCount > 0 || postCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete user with ${productCount} products and ${postCount} posts. Please handle user data first.`
        });
      }

      // Soft delete - mark as deactivated
      await user.update({
        accountStatus: 'deactivated',
        deleteReason,
        deletedAt: new Date()
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search users
  async searchUsers(req, res) {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const users = await db.UserTable.findAndCountAll({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${query}%` } },
            { username: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { location: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'fullName', 'username', 'email', 'accountType', 
          'accountStatus', 'location', 'lastActive', 'createdAt'
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
            totalItems: users.count,
            itemsPerPage: parseInt(limit)
          },
          searchQuery: query
        }
      });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user activity logs
  async getUserActivity(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const user = await db.UserTable.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's recent activity
      const activities = [];

      // Recent posts
      const recentPosts = await db.Post.findAll({
        where: { userId: id },
        attributes: ['id', 'content', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Recent products (if seller)
      const recentProducts = await db.Product.findAll({
        where: { sellerId: id },
        attributes: ['id', 'title', 'price', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Recent comments
      const recentComments = await db.PostComment.findAll({
        where: { userId: id },
        attributes: ['id', 'content', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            accountType: user.accountType,
            accountStatus: user.accountStatus,
            lastActive: user.lastActive
          },
          activities: {
            recentPosts,
            recentProducts,
            recentComments
          }
        }
      });

    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const stats = await db.UserTable.findAll({
        attributes: [
          'accountType',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['accountType']
      });

      const statusStats = await db.UserTable.findAll({
        attributes: [
          'accountStatus',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['accountStatus']
      });

      const totalUsers = await db.UserTable.count();
      const verifiedUsers = await db.UserTable.count({
        where: { emailVerified: true }
      });

      const recentUsers = await db.UserTable.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      const activeUsers = await db.UserTable.count({
        where: {
          lastActive: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          verifiedUsers,
          recentUsers,
          activeUsers,
          accountTypeBreakdown: stats,
          accountStatusBreakdown: statusStats,
          summary: {
            buyers: stats.find(s => s.accountType === 'buyer')?.count || 0,
            sellers: stats.find(s => s.accountType === 'seller')?.count || 0,
            admins: stats.find(s => s.accountType === 'admin')?.count || 0,
            pendingSellers: stats.find(s => s.accountType === 'pending-seller')?.count || 0,
            active: statusStats.find(s => s.accountStatus === 'active')?.count || 0,
            suspended: statusStats.find(s => s.accountStatus === 'suspended')?.count || 0,
            pending: statusStats.find(s => s.accountStatus === 'pending')?.count || 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new UserManagementController();
