const db = require('../../models');
const { Op, Sequelize, fn, col, where } = require('sequelize');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const PromotionHelperService = require('../services/promotionHelperService');
const RankingService = require('../services/rankingService');
const SpotlightService = require('../services/spotlightService');
const TopPlacementService = require('../services/topPlacementService');

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
      if (req.files && req.files.images && req.files.images.length > 0) {
        const cloudinaryService = require('../services/cloudinaryService');
        console.log(`Processing ${req.files.images.length} uploaded images for distress sale`);
        
        for (let i = 0; i < req.files.images.length; i++) {
          const file = req.files.images[i];
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

      // Upload AR model if provided (optional)
      let arModelUrl = null;
      if (req.files && req.files.arModel && req.files.arModel.length > 0) {
        const arFile = req.files.arModel[0];
        console.log('📤 Attempting to upload AR model for distress sale:', {
          filename: arFile.originalname,
          mimetype: arFile.mimetype,
          size: arFile.size
        });
        
        try {
          const cloudinaryService = require('../services/cloudinaryService');
          const arUploadResult = await cloudinaryService.uploadDistressSaleARModel(arFile.buffer, distressProduct.id);
          
          if (!arUploadResult.success) {
            console.error('AR model upload failed:', arUploadResult.error);
            console.warn('Distress sale created but AR model upload failed');
          } else {
            arModelUrl = arUploadResult.url;
            console.log('✅ AR model uploaded successfully:', arModelUrl);
            // Update product with AR model URL
            await distressProduct.update({ arModel: arModelUrl });
          }
        } catch (error) {
          console.error('Error uploading AR model:', error);
          // Don't fail the distress sale creation if AR upload fails
        }
      }

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
        subcategory,
        location,
        search,
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

      // Additional conditions array for complex filters
      const additionalConditions = [];

      // Category filter - case-insensitive matching
      if (category) {
        additionalConditions.push(
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Product.category')),
            { [Op.like]: `%${category.trim().toLowerCase()}%` }
          )
        );
      }

      // Subcategory filter - case-insensitive matching
      if (subcategory) {
        additionalConditions.push(
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Product.subcategory')),
            { [Op.like]: `%${subcategory.trim().toLowerCase()}%` }
          )
        );
      }

      // Search filter - searches in title and description
      if (search) {
        additionalConditions.push({
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
          ]
        });
      }

      // Location filter - case-insensitive
      if (location) {
        whereClause.location = {
          [Op.like]: `%${location}%`
        };
      }

      // Combine additional conditions with whereClause
      if (additionalConditions.length > 0) {
        whereClause[Op.and] = additionalConditions;
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

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = validDistressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      // Calculate total pages
      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: mappedDistressSales,
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
            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'businessPhone', 'country', 'state', 'category', 'verificationStatus']
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
      let distressSaleData = distressSale.toJSON ? distressSale.toJSON() : distressSale;
      if (distressSaleData?.seller?.id) {
        distressSaleData.sellerEntityId = distressSaleData.seller.id;
      }

      // Map distress sale field names and include promotion fields
      distressSaleData = mapDistressSaleResponse(distressSaleData);
      distressSaleData = PromotionHelperService.includePromotionFields(distressSaleData);

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

      // Map snake_case field names from frontend to camelCase for Product model
      // product_name → title
      if (updateData.product_name !== undefined && !updateData.title) {
        updateData.title = updateData.product_name;
        delete updateData.product_name;
      }
      
      // original_price → originalPrice
      if (updateData.original_price !== undefined) {
        updateData.originalPrice = updateData.original_price;
        delete updateData.original_price;
      }
      
      // distress_price → price
      if (updateData.distress_price !== undefined) {
        updateData.price = updateData.distress_price;
        delete updateData.distress_price;
      }
      
      // distress_reason → distressReason
      if (updateData.distress_reason !== undefined) {
        updateData.distressReason = updateData.distress_reason;
        delete updateData.distress_reason;
      }
      
      // distress_expiry_date → distressExpiryDate
      if (updateData.distress_expiry_date !== undefined) {
        updateData.distressExpiryDate = updateData.distress_expiry_date;
        delete updateData.distress_expiry_date;
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
      if (req.files && req.files.images && req.files.images.length > 0) {
        const cloudinaryService = require('../services/cloudinaryService');
        console.log(`Processing ${req.files.images.length} uploaded images for update`);
        
        const imageUrls = [];
        for (let i = 0; i < req.files.images.length; i++) {
          const file = req.files.images[i];
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

      // Process AR model upload if provided (optional, replaces existing)
      if (req.files && req.files.arModel && req.files.arModel.length > 0) {
        const arFile = req.files.arModel[0];
        console.log('📤 Attempting to upload AR model for distress sale update:', {
          filename: arFile.originalname,
          mimetype: arFile.mimetype,
          size: arFile.size
        });
        
        try {
          const cloudinaryService = require('../services/cloudinaryService');
          const arUploadResult = await cloudinaryService.uploadDistressSaleARModel(arFile.buffer, distressSale.id);
          
          if (!arUploadResult.success) {
            console.error('AR model upload failed:', arUploadResult.error);
            console.warn('Distress sale updated but AR model upload failed');
          } else {
            updateData.arModel = arUploadResult.url;
            console.log('✅ AR model uploaded successfully:', arUploadResult.url);
          }
        } catch (error) {
          console.error('Error uploading AR model:', error);
          // Don't fail the distress sale update if AR upload fails
        }
      }

      // Recalculate discounted price ONLY if discountPercentage is being updated
      // If user is explicitly setting both originalPrice and price (distress_price), respect those values
      if (updateData.discountPercentage) {
        try {
          console.log('distressSale exists:', !!distressSale);
          console.log('distressSale.originalPrice:', distressSale ? distressSale.originalPrice : 'N/A');
          console.log('distressSale.discountPercentage:', distressSale ? distressSale.discountPercentage : 'N/A');
          
          // Convert string values to numbers for form-data
          const originalPrice = updateData.originalPrice ? parseFloat(updateData.originalPrice) : (distressSale ? distressSale.originalPrice : null);
          const discountPercentage = parseFloat(updateData.discountPercentage);
          
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
      // If discountPercentage is not being updated, use the price (distress_price) that was explicitly set
      // This ensures originalPrice and price (distress_price) are saved as-is when user sets them directly

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

  // Get distress sales for a specific user (for profile tabs)
  async getUserDistressSalesById(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const currentUserId = req.user?.id;

      // Try to find user by userId first
      let actualUserId = userId;
      let seller = await db.SellersTable.findOne({
        where: { userId: userId },
        include: [{
          model: db.UserTable,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
        }]
      });

      // If not found by userId, try as Seller Table ID
      if (!seller) {
        seller = await db.SellersTable.findByPk(userId, {
          include: [{
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
          }]
        });
        if (seller) {
          actualUserId = seller.userId;
        }
      }

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'User is not a seller or not found'
        });
      }

      // Get distress sales (products with isDistressSale: true)
      const distressSales = await db.Product.findAndCountAll({
        where: {
          sellerId: seller.id,
          isDistressSale: true,
          status: 'active',
          isAvailable: true
        },
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'businessEmail', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
            include: [{
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add engagement status for current user
      const distressSalesWithEngagement = await Promise.all(
        distressSales.rows.map(async (distressSale) => {
          const saleData = distressSale.toJSON();
          
          if (currentUserId) {
            const [userSaved, userLike] = await Promise.all([
              db.SavedProduct.findOne({ where: { productId: distressSale.id, userId: currentUserId } }),
              db.ProductLike.findOne({ where: { productId: distressSale.id, userId: currentUserId } })
            ]);

            saleData.isSaved = !!userSaved;
            saleData.isLiked = !!userLike;
          } else {
            saleData.isSaved = false;
            saleData.isLiked = false;
          }

          // Map to distress sale format
          const mappedSale = {
            ...mapDistressSaleResponse(saleData),
            productName: saleData.title,
            currentPrice: saleData.price,
            originalPrice: saleData.originalPrice,
            discountPercentage: saleData.discountPercentage,
            urgencyLevel: saleData.urgencyLevel,
            distressReason: saleData.distressReason,
            expiryDate: saleData.distressExpiryDate,
            timeLeft: saleData.distressExpiryDate 
              ? this.calculateTimeLeft(saleData.distressExpiryDate)
              : null
          };

          // Add sellerEntityId and sellerMeta for consistency with other endpoints
          if (mappedSale?.seller?.id) {
            mappedSale.sellerEntityId = mappedSale.seller.id;
            mappedSale.sellerMeta = {
              businessName: mappedSale.seller.businessName || null,
              profilePicture: mappedSale.seller.user?.profilePicture || null,
              businessEmail: mappedSale.seller.businessEmail || null
            };
          }

          return mappedSale;
        })
      );

      res.status(200).json({
        success: true,
        data: {
          distressSales: distressSalesWithEngagement,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(distressSales.count / limit),
            totalDistressSales: distressSales.count,
            hasNextPage: offset + limit < distressSales.count,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get user distress sales error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user distress sales',
        error: error.message
      });
    }
  }

  // Helper method to calculate time left
  calculateTimeLeft(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days ${hours} hours`;
    if (hours > 0) return `${hours} hours ${minutes} minutes`;
    return `${minutes} minutes`;
  }

  // Get trending distress sales
  async getTrendingDistressSales(req, res) {
    try {
      const { category = null, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      // Get user location if available
      let buyerLocation = null;
      if (currentUserId) {
        const user = await db.UserTable.findByPk(currentUserId, {
          attributes: ['location']
        });
        buyerLocation = user?.location || null;
      }

      // Get trending distress sales using ranking service
      const distressSales = await RankingService.getTrendingItems('distress_sale', {
        category,
        limit: parseInt(limit),
        offset: parseInt(offset),
        buyerLocation
      });

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = distressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      res.status(200).json({
        success: true,
        message: "Trending distress sales retrieved successfully",
        data: {
          distressSales: mappedDistressSales,
          pagination: {
            currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalDistressSales: mappedDistressSales.length,
            hasNextPage: mappedDistressSales.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get trending distress sales error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving trending distress sales", 
        error: error.message 
      });
    }
  }

  // Get similar distress sales
  async getSimilarDistressSales(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Get similar distress sales using ranking service
      const distressSales = await RankingService.getSimilarItems('distress_sale', id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = distressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      res.status(200).json({
        success: true,
        message: "Similar distress sales retrieved successfully",
        data: {
          distressSales: mappedDistressSales,
          pagination: {
            currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalDistressSales: mappedDistressSales.length,
            hasNextPage: mappedDistressSales.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get similar distress sales error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving similar distress sales", 
        error: error.message 
      });
    }
  }

  // Get recommended distress sales
  async getRecommendedDistressSales(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({ 
          success: false,
          message: "Authentication required for recommendations" 
        });
      }

      // Get recommended distress sales using ranking service
      const distressSales = await RankingService.getRecommendedItems(currentUserId, 'distress_sale', {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = distressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      res.status(200).json({
        success: true,
        message: "Recommended distress sales retrieved successfully",
        data: {
          distressSales: mappedDistressSales,
          pagination: {
            currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalDistressSales: mappedDistressSales.length,
            hasNextPage: mappedDistressSales.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get recommended distress sales error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving recommended distress sales", 
        error: error.message 
      });
    }
  }

  // Get spotlight distress sales
  async getSpotlightDistressSales(req, res) {
    try {
      const { slotType = 'homepage', category = null, limit = 20, offset = 0 } = req.query;

      // Get spotlight slots
      const spotlightSlots = await SpotlightService.getSpotlightsBySlotType(slotType, {
        category,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Extract distress sale IDs from spotlight slots
      // Use camelCase for Sequelize model attributes (not snake_case database columns)
      const distressSaleIds = spotlightSlots
        .filter(slot => (slot.itemType || slot.item_type) === 'distress_sale')
        .map(slot => slot.itemId || slot.item_id);

      if (distressSaleIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Spotlight distress sales retrieved successfully",
          data: {
            distressSales: [],
            pagination: {
              currentPage: 1,
              limit: parseInt(limit),
              totalDistressSales: 0,
              hasNextPage: false
            }
          }
        });
      }

      // Get distress sales (from Product table with isDistressSale: true)
      const distressSales = await db.Product.findAll({
        where: {
          id: { [Op.in]: distressSaleIds },
          isDistressSale: true,
          status: 'active',
          isAvailable: true
        },
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'country', 'state'],
            include: [{
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
            }]
          }
        ]
      });

      // Sort distress sales to match spotlight slot order
      const sortedDistressSales = distressSaleIds
        .map(id => distressSales.find(ds => ds.id === id))
        .filter(ds => ds !== undefined);

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = sortedDistressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      res.status(200).json({
        success: true,
        message: "Spotlight distress sales retrieved successfully",
        data: {
          distressSales: mappedDistressSales,
          pagination: {
            currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalDistressSales: mappedDistressSales.length,
            hasNextPage: mappedDistressSales.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get spotlight distress sales error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving spotlight distress sales", 
        error: error.message 
      });
    }
  }

  // Get top placement distress sales
  async getTopPlacementDistressSales(req, res) {
    try {
      const { category = null, placementType = null, limit = 20, offset = 0 } = req.query;

      // Get top placements
      const placements = await TopPlacementService.getTopPlacementsByType('distress_sale', {
        category,
        placementType,
        limit: parseInt(limit) + parseInt(offset) // Get more to handle offset
      });

      // Apply offset
      const paginatedPlacements = placements.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      // Extract distress sale IDs from placements
      // Use camelCase for Sequelize model attributes (not snake_case database columns)
      const distressSaleIds = paginatedPlacements.map(placement => placement.itemId || placement.item_id);

      if (distressSaleIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Top placement distress sales retrieved successfully",
          data: {
            distressSales: [],
            pagination: {
              currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
              limit: parseInt(limit),
              totalDistressSales: 0,
              hasNextPage: false
            }
          }
        });
      }

      // Get distress sales (from Product table with isDistressSale: true)
      const distressSales = await db.Product.findAll({
        where: {
          id: { [Op.in]: distressSaleIds },
          isDistressSale: true,
          status: 'active',
          isAvailable: true
        },
        include: [
          {
            model: db.SellersTable,
            as: 'seller',
            attributes: ['id', 'userId', 'businessName', 'country', 'state'],
            include: [{
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
            }]
          }
        ]
      });

      // Sort distress sales to match placement order
      const sortedDistressSales = distressSaleIds
        .map(id => distressSales.find(ds => ds.id === id))
        .filter(ds => ds !== undefined);

      // Map distress sale field names and include promotion fields
      let mappedDistressSales = sortedDistressSales.map(mapDistressSaleResponse);
      mappedDistressSales = PromotionHelperService.processItemsForResponse(mappedDistressSales);

      res.status(200).json({
        success: true,
        message: "Top placement distress sales retrieved successfully",
        data: {
          distressSales: mappedDistressSales,
          pagination: {
            currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalDistressSales: placements.length,
            hasNextPage: parseInt(offset) + parseInt(limit) < placements.length
          }
        }
      });
    } catch (error) {
      console.error('Get top placement distress sales error:', error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving top placement distress sales", 
        error: error.message 
      });
    }
  }
}

module.exports = new DistressSaleController();
