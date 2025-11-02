const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');

// Helper function to map buyer need response to match post structure
const mapBuyerNeedResponse = (buyerNeed) => {
  const mapped = buyerNeed.toJSON ? buyerNeed.toJSON() : { ...buyerNeed };
  
  // Return only fields that match post structure - no budget/urgency fields
  return {
    id: mapped.id,
    caption: mapped.description || mapped.title,  // Use caption only (matches post structure)
    reach_limit: mapped.reach_limit || 5,
    category_id: mapped.category_id,
    user: mapped.buyer ? {
      id: mapped.buyer.id,
      fullName: mapped.buyer.fullName,
      profilePicture: mapped.buyer.profilePicture,
      accountType: mapped.buyer.accountType,
      accountStatus: mapped.buyer.accountStatus
    } : null,
    media: mapped.media || [],
    category: mapped.category ? {
      id: mapped.category.id,
      name: mapped.category.name
    } : null,
    responses_count: mapped.responses_count || 0,
    createdAt: mapped.created_at || mapped.createdAt,
    updatedAt: mapped.updated_at || mapped.updatedAt
  };
};

class BuyerNeedController {
  // Create a new buyer need (matches post structure - accepts content/caption, reach_limit, category_id, images)
  async createBuyerNeed(req, res) {
    try {
      console.log('Create buyer need request body:', req.body);
      console.log('Create buyer need request files:', req.files);
      
      // Parse form data - handle both multer parsed and raw FormData
      let formData = {};
      if (!req.files && req.body._parts) {
        console.log('Files not parsed by multer, handling manually');
        // Parse the _parts array to extract form data
        req.body._parts.forEach(part => {
          if (part[0] !== 'media') {
            formData[part[0]] = part[1];
          }
        });
        console.log('Parsed form data:', formData);
      } else {
        formData = req.body;
      }
      
      // Extract only the fields the frontend actually uses (same as posts)
      const { 
        content, 
        caption,  // Accept caption as alternative to content
        reach_limit, 
        category_id
      } = formData;
      
      const buyer_id = req.user.id;

      // Validate required fields - only content is required now (same as posts)
      const finalContent = content || caption;  // Accept either content or caption
      if (!finalContent || finalContent.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Content/Caption is required'
        });
      }

      // Validate reach_limit if provided (same as posts)
      let parsedReachLimit = 5; // Default value
      if (reach_limit !== undefined && reach_limit !== null && reach_limit !== '') {
        parsedReachLimit = parseInt(reach_limit);
        if (isNaN(parsedReachLimit) || parsedReachLimit < 1 || parsedReachLimit > 50) {
          return res.status(400).json({
            success: false,
            message: 'Reach limit must be a number between 1 and 50'
          });
        }
      }

      // Validate category_id if provided (should be a valid UUID) - same as posts
      let validatedCategoryId = null;
      if (category_id !== undefined && category_id !== null && category_id !== '') {
        // Basic UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(category_id)) {
          return res.status(400).json({
            success: false,
            message: 'Category ID must be a valid UUID'
          });
        }
        
        // Verify category exists in database
        const category = await db.ProductCategory.findByPk(category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Category not found'
          });
        }
        validatedCategoryId = category_id;
        
        // Update category usage count
        await category.update({ usageCount: category.usageCount + 1 });
      }

      // Set default expiration (30 days from now)
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create buyer need (store content as both title and description for backward compatibility)
      const buyerNeed = await db.BuyerNeed.create({
        title: finalContent.trim(),  // Store content as title
        description: finalContent.trim(),  // Also store as description for backward compatibility
        buyer_id,
        category_id: validatedCategoryId,
        reach_limit: parsedReachLimit,
        expires_at: expirationDate,
        status: 'active',
        current_reach: 0,
        reach_exceeded: false
      });

      // Add media if provided (optional - same as posts)
      if (req.files && req.files.length > 0) {
        console.log(`Processing ${req.files.length} media files for buyer need ${buyerNeed.id}`);
        const mediaPromises = req.files.map(async (file, index) => {
          try {
            // Determine media type from file mimetype
            const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
            
            // Upload to Cloudinary
            console.log(`Uploading file ${index} to Cloudinary...`);
            const uploadResult = await cloudinaryService.uploadBuyerNeedMedia(file.buffer, buyerNeed.id);
            
            if (!uploadResult.success) {
              console.error('Cloudinary upload failed:', uploadResult.error);
              throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
            }
            
            console.log(`Cloudinary upload successful for file ${index}:`, uploadResult.url);
            
            // Create BuyerNeedMedia record with Cloudinary URLs
            const mediaRecord = await db.BuyerNeedMedia.create({
              buyerNeedId: buyerNeed.id,
              mediaType: mediaType,
              mediaUrl: uploadResult.url,
              thumbnailUrl: uploadResult.thumbnailUrl,
              mediaOrder: index,
              altText: file.originalname
            });
            
            console.log(`Created BuyerNeedMedia record for file ${index}:`, mediaRecord.id);
            return mediaRecord;
          } catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
            throw error;
          }
        });
        
        await Promise.all(mediaPromises);
        console.log('All media files processed successfully');
      }

      // Get created buyer need with associations (same structure as posts)
      const createdBuyerNeed = await db.BuyerNeed.findByPk(buyerNeed.id, {
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
            order: [['mediaOrder', 'ASC']]
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      // Map buyer need response to match post structure
      const mappedBuyerNeed = mapBuyerNeedResponse(createdBuyerNeed);

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
      if (featured === 'true') whereClause.is_featured = true;

      // Search filter
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Only show active and non-expired needs
      whereClause.status = { [Op.in]: ['active', 'in_progress'] };
      whereClause.expires_at = { [Op.gt]: new Date() };

      // Access control: Buyers can only see their own needs, sellers/admin can see all
      const userAccountType = req.user.accountType;
      if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
        whereClause.buyer_id = req.user.id;
      }
      // Sellers and admins can see all buyer needs (no additional filter)

      const { count, rows } = await db.BuyerNeed.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'accountStatus']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
            order: [['mediaOrder', 'ASC']],
            required: false
          }
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Map buyer need field names for frontend compatibility (match post structure)
      const mappedBuyerNeeds = rows.map(buyerNeed => mapBuyerNeedResponse(buyerNeed));

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
            attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'accountStatus']
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
            order: [['mediaOrder', 'ASC']],
            required: false
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

      // Access control: Buyers can only view their own needs, sellers/admin can view any
      const userAccountType = req.user.accountType;
      if ((userAccountType === 'buyer' || userAccountType === 'pending-seller') && buyerNeed.buyer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own buyer needs'
        });
      }

      // Increment view count
      await buyerNeed.increment('views_count');

      // Map buyer need response to match post structure
      const mappedBuyerNeed = mapBuyerNeedResponse(buyerNeed);

      res.json({
        success: true,
        data: mappedBuyerNeed
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

      // Only allow updating fields that exist in the model (title, description, reach_limit, category_id, status, expires_at)
      // Remove any deleted fields from updateData
      const allowedFields = ['title', 'description', 'reach_limit', 'category_id', 'status', 'expires_at'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // Handle content/caption field - update both title and description
      if (updateData.content || updateData.caption) {
        const finalContent = updateData.content || updateData.caption;
        updateData.title = finalContent.trim();
        updateData.description = finalContent.trim();
        delete updateData.content;
        delete updateData.caption;
      }

      // Validate expiration date if updating
      if (updateData.expires_at && new Date(updateData.expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date must be in the future'
        });
      }

      await buyerNeed.update(updateData);

      // Reload with associations for proper response
      const updatedBuyerNeed = await db.BuyerNeed.findByPk(buyerNeed.id, {
        include: [
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'fullName', 'profilePicture', 'accountType', 'accountStatus']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
            order: [['mediaOrder', 'ASC']],
            required: false
          },
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      // Map buyer need response to match post structure
      const mappedBuyerNeed = mapBuyerNeedResponse(updatedBuyerNeed);

      res.json({
        success: true,
        message: 'Buyer need updated successfully',
        data: mappedBuyerNeed
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

  // Track failed search (when product search returns no results)
  async trackFailedSearch(req, res) {
    try {
      const {
        search_term,
        category_id,
        location,
        search_filters,
        device_type
      } = req.body;

      // Validate required field
      if (!search_term || search_term.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const user_id = req.user?.id || null;
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;

      // Create buyer search insight record
      const searchInsight = await db.BuyerSearchInsight.create({
        search_term: search_term.trim(),
        user_id: user_id,
        category_id: category_id || null,
        location: location || null,
        search_filters: search_filters ? JSON.parse(JSON.stringify(search_filters)) : null,
        device_type: device_type || null,
        ip_address: ip_address
      });

      res.status(201).json({
        success: true,
        message: 'Failed search tracked successfully',
        data: {
          id: searchInsight.id,
          search_term: searchInsight.search_term,
          tracked_at: searchInsight.created_at
        }
      });

    } catch (error) {
      console.error('Error tracking failed search:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get buyer search insights (aggregated unmet searches)
  async getBuyerSearchInsights(req, res) {
    try {
      const {
        timeframe = 'week',
        category = 'all',
        page = 1,
        limit = 20,
        sort_by = 'search_count'
      } = req.query;

      // Only sellers and admins can access buyer search insights
      const userAccountType = req.user.accountType;
      if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
        return res.status(403).json({
          success: false,
          message: 'Only sellers can access buyer search insights'
        });
      }

      // Calculate date range based on timeframe
      const now = new Date();
      let startDate;
      let previousStartDate;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Build base where clause
      const whereClause = {
        created_at: {
          [Op.gte]: startDate
        }
      };

      // Filter by category if provided
      if (category !== 'all' && category) {
        whereClause.category_id = category;
      }

      // Get all insights for current period
      const currentInsights = await db.BuyerSearchInsight.findAll({
        where: whereClause,
        include: [
          {
            model: db.ProductCategory,
            as: 'category',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Get insights for previous period for trend calculation
      const previousWhereClause = {
        created_at: {
          [Op.gte]: previousStartDate,
          [Op.lt]: startDate
        }
      };
      if (category !== 'all' && category) {
        previousWhereClause.category_id = category;
      }

      const previousInsights = await db.BuyerSearchInsight.findAll({
        where: previousWhereClause,
        attributes: ['search_term', 'category_id']
      });

      // Aggregate by search_term
      const aggregated = {};
      
      // Aggregate current period
      currentInsights.forEach(insight => {
        const term = insight.search_term.toLowerCase().trim();
        if (!aggregated[term]) {
          aggregated[term] = {
            searchTerm: insight.search_term,
            searchCount: 0,
            locations: new Set(),
            categories: new Map(),
            lastSearched: insight.created_at,
            search_filters: []
          };
        }
        aggregated[term].searchCount++;
        if (insight.location) {
          aggregated[term].locations.add(insight.location);
        }
        if (insight.category_id) {
          const categoryName = insight.category?.name || 'Unknown';
          aggregated[term].categories.set(
            categoryName, 
            (aggregated[term].categories.get(categoryName) || 0) + 1
          );
        }
        if (insight.created_at > aggregated[term].lastSearched) {
          aggregated[term].lastSearched = insight.created_at;
        }
        if (insight.search_filters) {
          aggregated[term].search_filters.push(insight.search_filters);
        }
      });

      // Count previous period for trends
      const previousCounts = {};
      previousInsights.forEach(insight => {
        const term = insight.search_term.toLowerCase().trim();
        previousCounts[term] = (previousCounts[term] || 0) + 1;
      });

      // Convert to array and calculate trends
      let insightsArray = Object.values(aggregated).map(item => {
        const term = item.searchTerm.toLowerCase().trim();
        const previousCount = previousCounts[term] || 0;
        const currentCount = item.searchCount;
        
        let trend = 'stable';
        let trendPercentage = 0;
        
        if (previousCount === 0 && currentCount > 0) {
          trend = 'up';
          trendPercentage = 100;
        } else if (currentCount > previousCount) {
          trend = 'up';
          trendPercentage = Math.round(((currentCount - previousCount) / previousCount) * 100);
        } else if (currentCount < previousCount) {
          trend = 'down';
          trendPercentage = Math.round(((previousCount - currentCount) / previousCount) * 100);
        }

        // Get most common category
        let mostCommonCategory = 'All';
        let maxCategoryCount = 0;
        item.categories.forEach((count, categoryName) => {
          if (count > maxCategoryCount) {
            maxCategoryCount = count;
            mostCommonCategory = categoryName;
          }
        });

        // Calculate average budget from search filters if available
        let avgBudget = null;
        if (item.search_filters.length > 0) {
          const budgets = item.search_filters
            .filter(f => f.minPrice || f.maxPrice)
            .map(f => {
              if (f.minPrice && f.maxPrice) {
                return (parseFloat(f.minPrice) + parseFloat(f.maxPrice)) / 2;
              }
              return f.minPrice ? parseFloat(f.minPrice) : parseFloat(f.maxPrice);
            });
          
          if (budgets.length > 0) {
            const sum = budgets.reduce((a, b) => a + b, 0);
            avgBudget = Math.round(sum / budgets.length);
          }
        }

        // Generate tags from search term (simple keyword extraction)
        const tags = item.searchTerm
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1));

        // Calculate time ago
        const timeDiff = now - new Date(item.lastSearched);
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        let lastSearched = '';
        if (daysAgo > 0) {
          lastSearched = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        } else if (hoursAgo > 0) {
          lastSearched = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          lastSearched = 'Just now';
        }

        return {
          searchTerm: item.searchTerm,
          category: mostCommonCategory,
          searchCount: currentCount,
          avgBudget: avgBudget ? `₦${avgBudget.toLocaleString()}` : null,
          trend: trend,
          trendPercentage: trendPercentage,
          tags: tags.length > 0 ? tags : ['High Demand'],
          description: `${item.searchTerm} - ${mostCommonCategory === 'All' ? 'Popular search' : `Popular in ${mostCommonCategory}`}`,
          lastSearched: lastSearched,
          locations: Array.from(item.locations).slice(0, 5) // Top 5 locations
        };
      });

      // Sort by specified criteria
      switch (sort_by) {
        case 'trend':
          insightsArray.sort((a, b) => {
            if (a.trend === 'up' && b.trend !== 'up') return -1;
            if (b.trend === 'up' && a.trend !== 'up') return 1;
            return b.trendPercentage - a.trendPercentage;
          });
          break;
        case 'last_searched':
          insightsArray.sort((a, b) => {
            const aTime = currentInsights.find(i => i.search_term === a.searchTerm)?.created_at || 0;
            const bTime = currentInsights.find(i => i.search_term === b.searchTerm)?.created_at || 0;
            return new Date(bTime) - new Date(aTime);
          });
          break;
        default: // search_count
          insightsArray.sort((a, b) => b.searchCount - a.searchCount);
      }

      // Add ranking
      insightsArray = insightsArray.map((item, index) => ({
        ...item,
        rank: index + 1,
        id: `insight-${index + 1}`
      }));

      // Pagination
      const offset = (page - 1) * limit;
      const paginatedInsights = insightsArray.slice(offset, offset + parseInt(limit));

      // Calculate summary stats
      const totalUnmetSearches = currentInsights.length;
      const categoriesCount = new Set(
        currentInsights
          .filter(i => i.category_id)
          .map(i => i.category_id)
      ).size;
      
      // Calculate overall average budget
      let overallAvgBudget = null;
      const allBudgets = currentInsights
        .filter(i => i.search_filters)
        .map(i => {
          const f = i.search_filters;
          if (f.minPrice && f.maxPrice) {
            return (parseFloat(f.minPrice) + parseFloat(f.maxPrice)) / 2;
          }
          return f.minPrice ? parseFloat(f.minPrice) : (f.maxPrice ? parseFloat(f.maxPrice) : null);
        })
        .filter(b => b !== null);
      
      if (allBudgets.length > 0) {
        const sum = allBudgets.reduce((a, b) => a + b, 0);
        overallAvgBudget = Math.round(sum / allBudgets.length);
      }

      res.json({
        success: true,
        data: paginatedInsights,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(insightsArray.length / limit),
          total_items: insightsArray.length,
          items_per_page: parseInt(limit)
        },
        summary: {
          totalUnmetSearches: totalUnmetSearches,
          avgBudget: overallAvgBudget ? `₦${overallAvgBudget.toLocaleString()}` : null,
          categoriesCount: categoriesCount
        }
      });

    } catch (error) {
      console.error('Error fetching buyer search insights:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BuyerNeedController();
