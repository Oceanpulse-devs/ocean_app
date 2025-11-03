const db = require('../../models');
const { Op, fn, col } = require('sequelize');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');

// Helper function to map distress sale field names for frontend
const mapDistressSaleResponse = (distressSale) => {
  const mapped = distressSale.toJSON ? distressSale.toJSON() : { ...distressSale };
  return {
    ...mapped,
    productName: mapped.title
  };
};

class DistressSaleController {
  // Create a distress sale product
  async createDistressSale(req, res) {
    try {
      const {
        title,
        productName,  // Accept frontend field name
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

      // Transform frontend field name to backend field name
      const finalTitle = productName || title;

      const sellerId = req.user.id;

      // Check if user is a verified seller
      const seller = await db.SellersTable.findOne({ where: { userId: sellerId } });
      if (!seller || seller.verificationStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can create distress sales'
        });
      }

      // Check subscription limits for distress sale creation
      const subscriptionCheck = await checkSubscriptionLimit(req.user.id, 'distress_sales');
      
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          message: subscriptionCheck.reason,
          upgradeRequired: true,
          currentPlan: subscriptionCheck.plan,
          suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
        });
      }

      // Check if user's plan allows creating distress sales
      const featureCheck = await checkFeatureAccess(req.user.id, 'canCreateDistressSales');
      
      if (!featureCheck.allowed) {
        return res.status(403).json({
          message: featureCheck.reason,
          upgradeRequired: true,
          currentPlan: featureCheck.plan,
          suggestedPlan: 'wave'
        });
      }

      // Validate distress sale data
      if (!originalPrice || !discountPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Original price and discount percentage are required for distress sales'
        });
      }

      // Parse prices to numbers to avoid string comparison issues
      const parsedOriginalPrice = parseFloat(originalPrice);
      const parsedDiscountPercentage = parseFloat(discountPercentage);
      const parsedPrice = price !== undefined && price !== null && price !== '' ? parseFloat(price) : null;

      if (isNaN(parsedOriginalPrice) || isNaN(parsedDiscountPercentage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid price or discount percentage format'
        });
      }

      // Process uploaded images
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const cloudinaryService = require('../services/cloudinaryService');
        console.log(`Processing ${req.files.length} uploaded images for distress sale`);
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          try {
            const uploadResult = await cloudinaryService.uploadFile(
              file.buffer,
              `ocean-app/distress-sales/${seller.id}/${Date.now()}-${i}`,
              {
                resource_type: 'image',
                quality: 'auto'
              }
            );
            imageUrls.push(uploadResult.url);
            console.log(`Uploaded distress sale image ${i + 1}: ${uploadResult.url}`);
          } catch (error) {
            console.error(`Error uploading distress sale image ${i + 1}:`, error);
            return res.status(500).json({
              success: false,
              message: `Failed to upload image ${i + 1}`,
              error: error.message
            });
          }
        }
      }

      // Use uploaded images or fallback to provided images
      const finalImages = imageUrls.length > 0 ? imageUrls : (images || []);

      // Calculate the distress price if not provided
      // Use provided price if available, otherwise calculate from discount percentage
      const calculatedPrice = parsedPrice !== null && !isNaN(parsedPrice) 
        ? parsedPrice 
        : (parsedOriginalPrice * (1 - parsedDiscountPercentage / 100));

      if (parsedDiscountPercentage < 0 || parsedDiscountPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }

      console.log(`💰 Price validation: Original=${parsedOriginalPrice}, Calculated=${calculatedPrice}, Discount=${parsedDiscountPercentage}%`);

      if (parsedOriginalPrice <= calculatedPrice) {
        return res.status(400).json({
          success: false,
          message: 'Original price must be greater than current price for distress sales'
        });
      }

      // Handle location field (convert object to string if needed) and provide default
      let finalLocation = location;
      if (location && typeof location === 'object') {
        finalLocation = `${location.city || ''}, ${location.state || ''}, ${location.country || ''}`
          .trim()
          .replace(/^,\s*|,\s*$/g, '');
      }
      if (!finalLocation || (typeof finalLocation === 'string' && finalLocation.trim() === '')) {
        finalLocation = 'Not specified';
      }

      // Accept any category string from frontend; no validation against ProductCategory
      const finalCategory = (category ?? '').toString().trim();
      const finalSubcategory = (subcategory ?? '').toString().trim();

      // Create the distress sale product
      const distressProduct = await db.Product.create({
        sellerId: seller.id,
        title: finalTitle,  // Use transformed value
        description,
        price: calculatedPrice,
        originalPrice: parsedOriginalPrice,
        discountPercentage: parsedDiscountPercentage,
        urgencyLevel: urgencyLevel || 'medium',
        distressReason,
        distressExpiryDate,
        category: finalCategory || null,
        subcategory: finalSubcategory || null,
        brand,
        condition: condition || 'good',
        location: finalLocation,
        images: finalImages,
        isDistressSale: true,
        status: 'active'
      });

      // Track subscription usage for distress sale creation
      await incrementUsage(sellerId, 'distress_sales');

      // Fetch distress sale with seller associations for complete response
      const createdDistressSale = await db.Product.findByPk(distressProduct.id, {
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessEmail'],
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'profilePicture']
              }
            ]
          }
        ]
      });

      // Map distress sale field names for frontend compatibility
      const mappedDistressProduct = mapDistressSaleResponse(createdDistressSale);
      
      // Attach sellerEntityId and sellerMeta
      if (mappedDistressProduct?.seller?.id) {
        mappedDistressProduct.sellerEntityId = mappedDistressProduct.seller.id;
        mappedDistressProduct.sellerMeta = {
          businessName: mappedDistressProduct.seller.businessName || null,
          profilePicture: mappedDistressProduct.seller.user?.profilePicture || null,
          businessEmail: mappedDistressProduct.seller.businessEmail || null
        };
      }

      res.status(201).json({
        success: true,
        message: 'Distress sale product created successfully',
        data: mappedDistressProduct
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
        isDistressSale: true,
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
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
            include: [
              {
                model: db.UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType']
              }
            ]
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
          isDistressSale: true
        },
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus']
            // Removed nested 'user' include - only seller business info needed
          }
        ]
      });

      if (!distressSale) {
        return res.status(404).json({
          success: false,
          message: 'Distress sale product not found'
        });
      }

      // Increment view count (deduplicated for logged-in users)
      // Distress sales use Product model, so use ProductView for tracking
      if (req.user && req.user.id) {
        const currentUserId = req.user.id;
        const seller = await db.SellersTable.findOne({ where: { id: distressSale.sellerId } });
        if (seller && currentUserId !== seller.userId) {
          const [view, created] = await db.ProductView.findOrCreate({
            where: { productId: distressSale.id, viewerId: currentUserId },
            defaults: { viewedAt: new Date() }
          });
          if (created) {
            await distressSale.increment('views');
          }
        }
      } else {
        await distressSale.increment('views');
      }

      // Attach canonical sellerEntityId
      const distressSaleData = distressSale.toJSON ? distressSale.toJSON() : distressSale;
      if (distressSaleData?.seller?.id) {
        distressSaleData.sellerEntityId = distressSaleData.seller.id;
      }

      res.json({
        success: true,
        data: distressSaleData
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
      const updateData = { ...req.body };
      const userId = req.user.id;

      // Find the seller record
      console.log('Looking for seller with userId:', userId);
      const seller = await db.SellersTable.findOne({
        where: { userId: userId }
      });

      console.log('Found seller:', seller ? `Yes (ID: ${seller.id})` : 'No');
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can update distress sales'
        });
      }

      // Find the distress sale product
      console.log('Looking for distress sale with:', { id, sellerId: seller.id });
      const distressSale = await db.Product.findOne({
        where: {
          id,
          sellerId: seller.id,
          isDistressSale: true
        }
      });

      console.log('Found distress sale:', distressSale ? 'Yes' : 'No');
      if (!distressSale) {
        return res.status(404).json({
          success: false,
          message: 'Distress sale product not found or you are not authorized to update it'
        });
      }

      // Handle frontend field name transformation
      // productName → title (for backward compatibility)
      if (updateData.productName !== undefined && !updateData.title) {
        updateData.title = updateData.productName;
        delete updateData.productName;
      }

      // Validate discount data if being updated
      if (updateData.originalPrice && updateData.price) {
        if (parseFloat(updateData.originalPrice) <= parseFloat(updateData.price)) {
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

      // Process uploaded images if any
      if (req.files && req.files.length > 0) {
        const cloudinaryService = require('../services/cloudinaryService');
        console.log(`Processing ${req.files.length} uploaded images for update`);
        
        const imageUrls = [];
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          try {
            const uploadResult = await cloudinaryService.uploadFile(
              file.buffer,
              `ocean-app/distress-sales/${seller.id}/${Date.now()}-${i}`,
              {
                resource_type: 'image',
                quality: 'auto'
              }
            );
            imageUrls.push(uploadResult.url);
            console.log(`Uploaded image ${i + 1}: ${uploadResult.url}`);
          } catch (error) {
            console.error(`Error uploading image ${i + 1}:`, error);
            return res.status(500).json({
              message: `Failed to upload image ${i + 1}`,
              error: error.message
            });
          }
        }
        
        // Update images if new ones were uploaded
        if (imageUrls.length > 0) {
          updateData.images = imageUrls;
        }
      }

      // Recalculate discounted price if originalPrice or discountPercentage is being updated
      if (updateData.originalPrice || updateData.discountPercentage) {
        try {
          console.log('distressSale exists:', !!distressSale);
          console.log('distressSale.originalPrice:', distressSale ? distressSale.originalPrice : 'N/A');
          console.log('distressSale.discountPercentage:', distressSale ? distressSale.discountPercentage : 'N/A');
          
          // Convert string values to numbers for form-data
          const originalPrice = updateData.originalPrice ? parseFloat(updateData.originalPrice) : (distressSale ? distressSale.originalPrice : null);
          const discountPercentage = updateData.discountPercentage ? parseFloat(updateData.discountPercentage) : (distressSale ? distressSale.discountPercentage : null);
          
          console.log('Calculated originalPrice:', originalPrice);
          console.log('Calculated discountPercentage:', discountPercentage);
          
          if (originalPrice && discountPercentage) {
            const calculatedPrice = originalPrice * (1 - discountPercentage / 100);
            updateData.price = calculatedPrice.toFixed(2);
            console.log('Calculated price:', updateData.price);
          }
        } catch (error) {
          console.error('Error in price calculation:', error);
          throw error;
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
      const userId = req.user.id;

      // Find the seller record
      const seller = await db.SellersTable.findOne({
        where: { userId: userId }
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can delete distress sales'
        });
      }

      const distressSale = await db.Product.findOne({
        where: {
          id,
          sellerId: seller.id,
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

      const userId = req.user.id;

      // Find the seller record
      console.log('Looking for seller with userId:', userId);
      const seller = await db.SellersTable.findOne({
        where: { userId: userId }
      });

      console.log('Found seller:', seller ? `Yes (ID: ${seller.id})` : 'No');
      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can convert products to distress sales'
        });
      }

      // Find the product
      console.log('Looking for product with:', { id, sellerId: seller.id, isDistressSale: false });
      const product = await db.Product.findOne({
        where: {
          id,
          sellerId: seller.id,
          isDistressSale: false
        }
      });

      console.log('Found product:', product ? 'Yes' : 'No');

      if (!product) {
        // Let's check if the product exists at all (without seller restriction)
        const anyProduct = await db.Product.findOne({
          where: { id }
        });
        
        console.log('Product exists in database:', anyProduct ? 'Yes' : 'No');
        if (anyProduct) {
          console.log('Product sellerId:', anyProduct.sellerId);
          console.log('Product isDistressSale:', anyProduct.isDistressSale);
          console.log('Expected sellerId:', seller.id);
        }
        
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

      // Calculate the discounted price
      const discountedPrice = originalPrice * (1 - discountPercentage / 100);
      console.log(`Converting product: Original price: ${originalPrice}, Discount: ${discountPercentage}%, New price: ${discountedPrice.toFixed(2)}`);

      // Convert to distress sale
      await product.update({
        isDistressSale: true,
        originalPrice,
        discountPercentage,
        price: discountedPrice.toFixed(2), // Set the discounted price
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
