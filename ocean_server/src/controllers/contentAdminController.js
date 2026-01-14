const db = require('../../models');
const { Op } = require('sequelize');

class ContentAdminController {
  // Get all posts with admin details
  async getAllPosts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all', // all, published, draft, archived, deleted
        contentType = 'all', // all, text, image, video, mixed
        sortBy = 'createdAt', // createdAt, updatedAt, likesCount, commentsCount
        sortOrder = 'DESC', // ASC, DESC
        search = '',
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status !== 'all') {
        whereClause.status = status;
      }
      if (contentType !== 'all') {
        whereClause.contentType = contentType;
      }
      if (search) {
        whereClause[Op.or] = [
          { content: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } }
        ];
      }
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const posts = await db.Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'email', 'profilePicture']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          posts: posts.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(posts.count / limit),
            totalItems: posts.count,
            itemsPerPage: parseInt(limit)
          },
          filters: { status, contentType, sortBy, sortOrder, search, startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Error getting all posts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get post by ID with admin details
  async getPostById(req, res) {
    try {
      const { id } = req.params;

      const post = await db.Post.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'email', 'profilePicture']
          },
          {
            model: db.PostComment,
            as: 'comments',
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'username', 'profilePicture']
              }
            ],
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.json({
        success: true,
        data: post
      });

    } catch (error) {
      console.error('Error getting post by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update post status
  async updatePostStatus(req, res) {
    try {
      const { id } = req.params;
      const { 
        status // published, draft, archived, deleted
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['published', 'draft', 'archived', 'deleted'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const post = await db.Post.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      await post.update({
        status,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Post status updated successfully',
        data: {
          id: post.id,
          status: post.status,
          updatedAt: post.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating post status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete post (soft delete)
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const { 
        reason = 'Post deleted by admin',
        permanent = false // true for hard delete
      } = req.body;

      const post = await db.Post.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (permanent) {
        // Hard delete - remove from database
        await post.destroy();
      } else {
        // Soft delete - mark as deleted
        await post.update({
          status: 'deleted',
          updatedAt: new Date()
        });
      }

      res.json({
        success: true,
        message: permanent ? 'Post permanently deleted' : 'Post deleted successfully',
        data: {
          id: post.id,
          deletedAt: new Date(),
          permanent
        }
      });

    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all products with admin details
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all', // all, active, inactive, pending, rejected
        category = 'all',
        sortBy = 'createdAt', // createdAt, updatedAt, price, viewsCount
        sortOrder = 'DESC', // ASC, DESC
        search = '',
        minPrice,
        maxPrice,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status !== 'all') {
        whereClause.status = status;
      }
      if (category !== 'all') {
        whereClause.categoryId = category;
      }
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      if (minPrice && maxPrice) {
        whereClause.price = {
          [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
        };
      }
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const products = await db.Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'email', 'profilePicture']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          products: products.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(products.count / limit),
            totalItems: products.count,
            itemsPerPage: parseInt(limit)
          },
          filters: { status, category, sortBy, sortOrder, search, minPrice, maxPrice, startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Error getting all products:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get product by ID with admin details
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await db.Product.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'email', 'profilePicture']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Error getting product by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update product status
  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { 
        status // active, inactive, pending, rejected
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['active', 'inactive', 'pending', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const product = await db.Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({
        status,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Product status updated successfully',
        data: {
          id: product.id,
          status: product.status,
          updatedAt: product.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating product status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all categories
  async getAllCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status = 'all', // all, active, inactive
        search = '',
        sortBy = 'name', // name, createdAt, productCount
        sortOrder = 'ASC' // ASC, DESC
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (status !== 'all') {
        whereClause.status = status;
      }
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const categories = await db.ProductCategory.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add product count to each category by counting products with matching category name
      const categoriesWithCount = await Promise.all(
        categories.rows.map(async (category) => {
          const productCount = await db.Product.count({
            where: {
              category: category.name
            }
          });
          
          return {
            ...category.toJSON(),
            productCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          categories: categoriesWithCount,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(categories.count / limit),
            totalItems: categories.count,
            itemsPerPage: parseInt(limit)
          },
          filters: { status, search, sortBy, sortOrder }
        }
      });

    } catch (error) {
      console.error('Error getting all categories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      const { 
        name, 
        description, 
        icon, 
        color, 
        parentId = null,
        isActive = true 
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      // Check if category already exists
      const existingCategory = await db.ProductCategory.findOne({
        where: { name: { [Op.like]: name } }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      const category = await db.ProductCategory.create({
        name,
        description,
        icon,
        color,
        parentId,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });

    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        icon, 
        color, 
        parentId, 
        isActive 
      } = req.body;

      const category = await db.ProductCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if new name conflicts with existing category
      if (name && name !== category.name) {
        const existingCategory = await db.ProductCategory.findOne({
          where: { 
            name: { [Op.like]: name },
            id: { [Op.ne]: id }
          }
        });

        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
      }

      await category.update({
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        icon: icon !== undefined ? icon : category.icon,
        color: color !== undefined ? color : category.color,
        parentId: parentId !== undefined ? parentId : category.parentId,
        isActive: isActive !== undefined ? isActive : category.isActive,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });

    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { 
        reason = 'Category deleted by admin',
        force = false // true to delete even if products exist
      } = req.body;

      const category = await db.ProductCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has products
      const productCount = await db.Product.count({
        where: { categoryId: id }
      });

      if (productCount > 0 && !force) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. ${productCount} products are using this category. Use force=true to delete anyway.`
        });
      }

      await category.destroy();

      res.json({
        success: true,
        message: 'Category deleted successfully',
        data: {
          id: category.id,
          name: category.name,
          deletedAt: new Date(),
          productCount
        }
      });

    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get content statistics
  async getContentStats(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = this.getDateRange(period);

      const stats = await Promise.all([
        this.getPostStats(dateRange),
        this.getProductStats(dateRange),
        this.getCategoryStats(),
        this.getContentEngagementStats(dateRange)
      ]);

      const [postStats, productStats, categoryStats, engagementStats] = stats;

      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            start: dateRange.start,
            end: dateRange.end
          },
          posts: postStats,
          products: productStats,
          categories: categoryStats,
          engagement: engagementStats
        }
      });

    } catch (error) {
      console.error('Error getting content stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Bulk operations
  async bulkUpdatePosts(req, res) {
    try {
      const { 
        postIds, 
        action, // status, category, archive, delete
        value // new status, category ID, etc.
      } = req.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Post IDs array is required'
        });
      }

      if (!action) {
        return res.status(400).json({
          success: false,
          message: 'Action is required'
        });
      }

      const validActions = ['status', 'category', 'archive', 'delete'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
      }

      const updateData = {};
      
      switch (action) {
        case 'status':
          updateData.status = value;
          break;
        case 'category':
          updateData.categoryId = value;
          break;
        case 'archive':
          updateData.status = 'archived';
          break;
        case 'delete':
          updateData.status = 'deleted';
          updateData.deletedAt = new Date();
          break;
      }

      const [updatedCount] = await db.Post.update(updateData, {
        where: { id: { [Op.in]: postIds } }
      });

      res.json({
        success: true,
        message: `Bulk update completed. ${updatedCount} posts updated.`,
        data: {
          action,
          value,
          updatedCount,
          postIds
        }
      });

    } catch (error) {
      console.error('Error bulk updating posts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper methods
  getDateRange(period) {
    const now = new Date();
    let start;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }

  async getPostStats(dateRange) {
    const totalPosts = await db.Post.count();
    const postsInRange = await db.Post.count({
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const statusBreakdown = await db.Post.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const postTypeBreakdown = await db.Post.findAll({
      attributes: [
        'postType',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['postType'],
      raw: true
    });

    return {
      total: totalPosts,
      inRange: postsInRange,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      postTypeBreakdown: postTypeBreakdown.reduce((acc, item) => {
        acc[item.postType] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  async getProductStats(dateRange) {
    const totalProducts = await db.Product.count();
    const productsInRange = await db.Product.count({
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const statusBreakdown = await db.Product.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return {
      total: totalProducts,
      inRange: productsInRange,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  async getCategoryStats() {
    const totalCategories = await db.ProductCategory.count();
    const activeCategories = await db.ProductCategory.count({
      where: { isActive: true }
    });

    // Get all categories and check which ones have products
    const allCategories = await db.ProductCategory.findAll();
    const categoriesWithProducts = await Promise.all(
      allCategories.map(async (category) => {
        const productCount = await db.Product.count({
          where: {
            category: category.name
          }
        });
        return productCount > 0;
      })
    );

    const withProductsCount = categoriesWithProducts.filter(hasProducts => hasProducts).length;

    return {
      total: totalCategories,
      active: activeCategories,
      inactive: totalCategories - activeCategories,
      withProducts: withProductsCount,
      withoutProducts: totalCategories - withProductsCount
    };
  }

  async getContentEngagementStats(dateRange) {
    const totalLikes = await db.PostLike.count();
    const totalComments = await db.PostComment.count();
    const totalViews = await db.PostView?.count() || 0;

    const engagementInRange = {
      likes: await db.PostLike.count({
        where: {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        }
      }),
      comments: await db.PostComment.count({
        where: {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        }
      }),
      views: await db.PostView?.count({
        where: {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        }
      }) || 0
    };

    return {
      total: {
        likes: totalLikes,
        comments: totalComments,
        views: totalViews
      },
      inRange: engagementInRange
    };
  }
}

module.exports = new ContentAdminController();
