const db = require('../../models');
const { Op } = require('sequelize');

class DistressSaleController {
  // Create a distress sale product
  async createDistressSale(req, res) {
    try {
      const {
        title,
        description,
        price,
        originalPrice,
        discountPercentage,
        urgencyLevel,
        distressReason,
        distressExpiryDate,
        category,
        subcategory,
        brand,
        condition,
        location,
        images
      } = req.body;

      const sellerId = req.user.id;

      // Check if user is a verified seller
      const seller = await db.SellersTable.findOne({ where: { userId: sellerId } });
      if (!seller || seller.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can create distress sales'
        });
      }

      // Validate distress sale data
      if (!originalPrice || !discountPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Original price and discount percentage are required for distress sales'
        });
      }

      // Calculate the distress price if not provided
      const calculatedPrice = price || (originalPrice * (1 - discountPercentage / 100));

      if (discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }

      if (originalPrice <= calculatedPrice) {
        return res.status(400).json({
          success: false,
          message: 'Original price must be greater than current price for distress sales'
        });
      }

      // Handle location field (convert object to string if needed)
      let finalLocation = location;
      if (location && typeof location === 'object') {
        finalLocation = `${location.city || ''}, ${location.state || ''}, ${location.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
      }

      // Validate category if provided
      if (category) {
        let categoryRecord;
        // Try to find by UUID first
        if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          categoryRecord = await db.ProductCategory.findByPk(category);
        } else {
          // Try to find by name (for backward compatibility)
          categoryRecord = await db.ProductCategory.findOne({ where: { name: category } });
        }
        
        if (!categoryRecord) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category. Please select a valid category from the list.'
          });
        }
        
        // Update category usage count
        await categoryRecord.update({ usageCount: categoryRecord.usageCount + 1 });
      }

      // Create the distress sale product
      const distressProduct = await db.Product.create({
        sellerId,
        title,
        description,
        price: calculatedPrice,
        originalPrice,
        discountPercentage,
        urgencyLevel: urgencyLevel || 'medium',
        distressReason,
        distressExpiryDate,
        category,
        subcategory,
        brand,
        condition: condition || 'good',
        location: finalLocation,
        images: images || [],
        isDistressSale: true,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Distress sale product created successfully',
        data: distressProduct
      });
    } catch (error) {
      console.error('Error creating distress sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create distress sale product',
        error: error.message
      });
    }
  }

  // Get all distress sale products with filters
  async getAllDistressSales(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        urgencyLevel,
        maxDiscount,
        minDiscount,
        category,
        location,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build filter conditions
      const whereClause = {
        // isDistressSale: true, // Temporarily commented out until database columns are added
        status: 'active',
        isAvailable: true
      };

      if (urgencyLevel) {
        whereClause.urgencyLevel = urgencyLevel;
      }

      if (maxDiscount) {
        whereClause.discountPercentage = {
          [Op.lte]: parseFloat(maxDiscount)
        };
      }

      if (minDiscount) {
        whereClause.discountPercentage = {
          [Op.gte]: parseFloat(minDiscount)
        };
      }

      if (category) {
        whereClause.category = category;
      }

      if (location) {
        whereClause.location = {
          [Op.like]: `%${location}%`
        };
      }

      // Get distress sales with pagination and sorting
      console.log('Querying distress sales with filters:', whereClause);
      console.log('Available models:', Object.keys(db));
      console.log('UserTable model:', db.UserTable ? 'Available' : 'Not available');
      
      const { count, rows: distressSales } = await db.Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'location', 'email', 'accountType', 'profilePicture']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Log the results for debugging
      console.log(`Found ${count} distress sales`);
      console.log('Sample distress sale:', distressSales[0] ? JSON.stringify(distressSales[0], null, 2) : 'No sales found');

      // Filter out products without valid seller data
      const validDistressSales = distressSales.filter(sale => sale.seller && sale.seller.id);
      console.log(`Filtered to ${validDistressSales.length} valid distress sales with seller data`);

      // Calculate total pages
      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: validDistressSales,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching distress sales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distress sales',
        error: error.message
      });
    }
  }

  // Get distress sale by ID
  async getDistressSaleById(req, res) {
    try {
      const { id } = req.params;

      const distressSale = await db.Product.findOne({
        where: {
          id,
          // isDistressSale: true // Temporarily commented out until database columns are added
        },
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'fullName', 'location', 'email', 'accountType', 'profilePicture']
          }
        ]
      });

      if (!distressSale) {
        return res.status(404).json({
          success: false,
          message: 'Distress sale product not found'
        });
      }

      // Increment view count
      await distressSale.increment('views');

      res.json({
        success: true,
        data: distressSale
      });
    } catch (error) {
      console.error('Error fetching distress sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distress sale',
        error: error.message
      });
    }
  }

  // Update distress sale product
  async updateDistressSale(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const sellerId = req.user.id;

      // Find the distress sale product
      const distressSale = await db.Product.findOne({
        where: {
          id,
          sellerId,
          isDistressSale: true
        }
      });

      if (!distressSale) {
        return res.status(404).json({
          success: false,
          message: 'Distress sale product not found or you are not authorized to update it'
        });
      }

      // Validate discount data if being updated
      if (updateData.originalPrice && updateData.price) {
        if (updateData.originalPrice <= updateData.price) {
          return res.status(400).json({
            success: false,
            message: 'Original price must be greater than current price for distress sales'
          });
        }
      }

      if (updateData.discountPercentage) {
        if (updateData.discountPercentage < 0 || updateData.discountPercentage > 100) {
          return res.status(400).json({
            success: false,
            message: 'Discount percentage must be between 0 and 100'
          });
        }
      }

      // Update the product
      await distressSale.update(updateData);

      res.json({
        success: true,
        message: 'Distress sale product updated successfully',
        data: distressSale
      });
    } catch (error) {
      console.error('Error updating distress sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update distress sale product',
        error: error.message
      });
    }
  }

  // Delete distress sale product
  async deleteDistressSale(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      const distressSale = await db.Product.findOne({
        where: {
          id,
          sellerId,
          isDistressSale: true
        }
      });

      if (!distressSale) {
        return res.status(404).json({
          success: false,
          message: 'Distress sale product not found or you are not authorized to delete it'
        });
      }

      // Soft delete by setting status to inactive
      await distressSale.update({ status: 'inactive' });

      res.json({
        success: true,
        message: 'Distress sale product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting distress sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete distress sale product',
        error: error.message
      });
    }
  }

  // Get distress sale statistics
  async getDistressSaleStats(req, res) {
    try {
      const stats = await db.Product.findAll({
        where: {
          // isDistressSale: true, // Temporarily commented out until database columns are added
          status: 'active'
        },
        attributes: [
          'urgencyLevel',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          [db.sequelize.fn('AVG', db.sequelize.col('discountPercentage')), 'avgDiscount'],
          [db.sequelize.fn('MAX', db.sequelize.col('discountPercentage')), 'maxDiscount'],
          [db.sequelize.fn('MIN', db.sequelize.col('discountPercentage')), 'minDiscount']
        ],
        group: ['urgencyLevel']
      });

      // Get total distress sales count
      const totalCount = await db.Product.count({
        where: {
          // isDistressSale: true, // Temporarily commented out until database columns are added
          status: 'active'
        }
      });

      // Get category distribution
      const categoryStats = await db.Product.findAll({
        where: {
          // isDistressSale: true, // Temporarily commented out until database columns are added
          status: 'active'
        },
        attributes: [
          'category',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          totalCount,
          urgencyLevelStats: stats,
          topCategories: categoryStats
        }
      });
    } catch (error) {
      console.error('Error fetching distress sale stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distress sale statistics',
        error: error.message
      });
    }
  }

  // Convert regular product to distress sale
  async convertToDistressSale(req, res) {
    try {
      const { id } = req.params;
      const {
        originalPrice,
        discountPercentage,
        urgencyLevel,
        distressReason,
        distressExpiryDate
      } = req.body;

      const sellerId = req.user.id;

      // Find the product
      const product = await db.Product.findOne({
        where: {
          id,
          sellerId,
          isDistressSale: false
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or you are not authorized to modify it'
        });
      }

      // Validate distress sale data
      if (!originalPrice || !discountPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Original price and discount percentage are required'
        });
      }

      if (originalPrice <= product.price) {
        return res.status(400).json({
          success: false,
          message: 'Original price must be greater than current price'
        });
      }

      // Convert to distress sale
      await product.update({
        isDistressSale: true,
        originalPrice,
        discountPercentage,
        urgencyLevel: urgencyLevel || 'medium',
        distressReason,
        distressExpiryDate
      });

      res.json({
        success: true,
        message: 'Product converted to distress sale successfully',
        data: product
      });
    } catch (error) {
      console.error('Error converting to distress sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert product to distress sale',
        error: error.message
      });
    }
  }
}

module.exports = new DistressSaleController();
