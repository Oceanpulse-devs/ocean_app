const db = require('../../models');
const { Op } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const videoUploadService = require('../services/videoUploadService');
const imageCompressionService = require('../services/imageCompressionService');
const redisClient = require('../config/redisdb');
const { createNotification } = require('./notificationController');

// Helper function to map buyer need response to match post structure
const mapBuyerNeedResponse = (buyerNeed) => {
  const mapped = buyerNeed.toJSON ? buyerNeed.toJSON() : { ...buyerNeed };
  
  // Return only fields that match post structure - no budget/urgency fields
  return {
    id: mapped.id,
    caption: mapped.description || mapped.title,  // Use caption only (matches post structure)
    reach_limit: mapped.reach_limit || 5,
    category: mapped.category || null,  // Store category as string name directly
    user: mapped.buyer ? {
      id: mapped.buyer.id,
      fullName: mapped.buyer.fullName,
      profilePicture: mapped.buyer.profilePicture,
      accountType: mapped.buyer.accountType,
      accountStatus: mapped.buyer.accountStatus
    } : null,
    media: mapped.media || [],
    responses_count: mapped.responses_count || 0,
    createdAt: mapped.created_at || mapped.createdAt,
    updatedAt: mapped.updated_at || mapped.updatedAt
  };
};

class BuyerNeedController {
  // Create a new buyer need (matches post structure - accepts content/caption, reach_limit, category (string), images)
  async createBuyerNeed(req, res) {
    try {
      // Parse form data - handle both multer parsed and raw FormData
      let formData = {};
      if (!req.files && req.body._parts) {
        // Parse the _parts array to extract form data
        req.body._parts.forEach(part => {
          if (part[0] !== 'images') {  // Changed from 'media' to 'images'
            formData[part[0]] = part[1];
          }
        });
      } else {
        formData = req.body;
      }
      
      // Extract only the fields the frontend actually uses
      const { 
        content, 
        caption,  // Accept caption as alternative to content
        reach_limit, 
        category,  // Accept category as string name (not category_id)
        country,
        state
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

      // Validate reach_limit if provided
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

      // Store category as string (accept category name directly)
      const categoryName = category ? category.trim() : null;

      // Optionally map category name to category_id internally for seller matching
      let mappedCategoryId = null;
      if (categoryName) {
        try {
          // Try to find category by name for internal mapping
          const categoryRecord = await db.ProductCategory.findOne({
            where: { name: { [Op.like]: categoryName } }
          });
          if (categoryRecord) {
            mappedCategoryId = categoryRecord.id;
            // Update category usage count
            await categoryRecord.update({ usageCount: categoryRecord.usageCount + 1 });
          }
        } catch (error) {
          // Category mapping not found, storing as string only
        }
      }

      // Set default expiration (30 days from now)
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create buyer need (store content as both title and description for backward compatibility)
      const buyerNeed = await db.BuyerNeed.create({
        title: finalContent.trim(),  // Store content as title
        description: finalContent.trim(),  // Also store as description for backward compatibility
        buyer_id,
        category: categoryName,  // Store category as string name directly
        category_id: mappedCategoryId,  // Store mapped ID for internal use (optional)
        reach_limit: parsedReachLimit,
        expires_at: expirationDate,
        status: 'active',
        current_reach: 0,
        reach_exceeded: false,
        country: country || null,
        state: state || null,
        current_batch: 1,
        batch_started_at: new Date()
      });

      // Add images if provided (optional - field name changed from media to images)
      if (req.files && req.files.length > 0) {
        const mediaPromises = req.files.map(async (file, index) => {
          try {
            // Determine media type from file mimetype
            const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
            
            // Compress image before upload if it's an image file
            let fileBuffer = file.buffer;
            if (mediaType === 'image') {
                fileBuffer = await imageCompressionService.compressPostImage(file.buffer);
            }
            
            let uploadResult;
            if (mediaType === 'video') {
                // Use unified video upload service (AWS S3 if configured, otherwise Cloudinary)
                uploadResult = await videoUploadService.uploadVideo(
                    fileBuffer,
                    `ocean-app/buyer-needs/${buyerNeed.id}`,
                    {
                        mimetype: file.mimetype
                    }
                );
            } else {
                // Images always use Cloudinary
                uploadResult = await cloudinaryService.uploadBuyerNeedMedia(fileBuffer, buyerNeed.id);
            }
            
            if (!uploadResult.success) {
              console.error('Upload failed:', uploadResult.error);
              throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
            }
            
            // Create BuyerNeedMedia record with Cloudinary URLs
            const mediaRecord = await db.BuyerNeedMedia.create({
              buyerNeedId: buyerNeed.id,
              mediaType: mediaType,
              mediaUrl: uploadResult.url,
              thumbnailUrl: uploadResult.thumbnailUrl,
              mediaOrder: index,
              altText: file.originalname
            });
            
            return mediaRecord;
          } catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
            throw error;
          }
        });
        
        await Promise.all(mediaPromises);
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
          }
        ]
      });

      // Map buyer need response to match post structure
      const mappedBuyerNeed = mapBuyerNeedResponse(createdBuyerNeed);

      // Notify matching sellers about the new buyer need
      try {
        await this.notifyMatchingSellers(buyerNeed, categoryName);
      } catch (notifyError) {
        console.error('Error notifying matching sellers:', notifyError);
        // Don't fail the request if notification fails
      }

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
        category,  // Changed from category_id to category (string)
        featured,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const currentUserId = req.user?.id;
      const userAccountType = req.user.accountType;

      // Create cache key based on query parameters
      const cacheKey = `buyerNeeds:${page}:${limit}:${status || ''}:${category || ''}:${featured || ''}:${search || ''}:${sort_by}:${sort_order}:${currentUserId}:${userAccountType}`;
      
      // Try to get from Redis cache first
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          return res.json(cachedData);
        }
      } catch (redisError) {
        console.error('Redis cache read failed:', redisError.message);
        // Continue with DB query if cache fails
      }

      const whereClause = {};

      // Apply filters
      if (status) whereClause.status = status;
      if (category) whereClause.category = { [Op.like]: `%${category}%` };  // Filter by category string
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
      if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
        whereClause.buyer_id = currentUserId;
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

      const responseData = {
        success: true,
        data: mappedBuyerNeeds,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      };

      // Cache the response in Redis for 2 minutes
      try {
        await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));
      } catch (redisError) {
        console.error('Redis cache write failed:', redisError.message);
        // Continue even if caching fails
      }

      res.json(responseData);

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

      // Only allow updating fields that exist in the model (title, description, reach_limit, category (string), status, expires_at)
      // Remove any deleted fields from updateData
      const allowedFields = ['title', 'description', 'reach_limit', 'category', 'status', 'expires_at'];
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

      // Handle category field - store as string, optionally map to category_id internally
      if (updateData.category) {
        const categoryName = updateData.category.trim();
        updateData.category = categoryName;
        
        // Optionally map to category_id internally
        try {
          const categoryRecord = await db.ProductCategory.findOne({
            where: { name: { [Op.like]: categoryName } }
          });
          if (categoryRecord) {
            // Store category_id internally but don't expose in response
            updateData.category_id = categoryRecord.id;
          }
        } catch (error) {
          // Category mapping not found for update
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
            as: 'productCategory',
            attributes: ['id', 'name', 'description', 'icon', 'isCustom', 'usageCount']
          },
          {
            model: db.BuyerNeedMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder']
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
        subcategory,
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
        subcategory: subcategory || null,
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

  // Get buyer search insights (flat list: each search term with user info)
  async getBuyerSearchInsights(req, res) {
    try {
      const {
        page = 1,
        limit = 20
      } = req.query;

      // Only sellers and admins can access buyer search insights
      const userAccountType = req.user.accountType;
      if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
        return res.status(403).json({
          success: false,
          message: 'Only sellers can access buyer search insights'
        });
      }

      // Always filter to last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all insights with user info (only logged-in users)
      const insights = await db.BuyerSearchInsight.findAndCountAll({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo
          },
          user_id: {
            [Op.ne]: null // Only logged-in users
          }
        },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'profilePicture'],
            required: true // Only include users who exist
          }
          // Removed ProductCategory join - category_id now stores category name directly
        ],
        order: [['created_at', 'DESC']], // Newest searches first
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Map insights to flat list with user info (using backend field names)
      const insightsArray = insights.rows.map(insight => {
        return {
          id: `insight_${insight.id}`, // String format
          user_id: insight.user_id, // Backend field name (snake_case)
          fullName: insight.user?.fullName || null, // Backend field name (camelCase from UserTable)
          profilePicture: insight.user?.profilePicture || null, // Backend field name (camelCase from UserTable)
          search_term: insight.search_term, // Backend field name (snake_case)
          created_at: insight.created_at, // Backend field name (snake_case)
          category: insight.category_id || null, // category_id now stores category name directly
          subcategory: insight.subcategory || null
        };
      });

      // Calculate pagination
      const totalItems = insights.count;
      const totalPages = Math.ceil(totalItems / parseInt(limit));

      res.json({
        success: true,
        data: {
          insights: insightsArray,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: totalItems,
            items_per_page: parseInt(limit)
          }
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

  // Helper method to notify matching sellers about new buyer need - starts the dispatch routing loop
  async notifyMatchingSellers(buyerNeed, categoryName) {
    if (!categoryName) {
      return;
    }
    try {
      console.log(`📡 Starting batch dispatch matching for BuyerNeed ID: ${buyerNeed.id}`);
      await this.routeNextBatch(buyerNeed.id);
    } catch (error) {
      console.error(`⚠️ Error starting matching routing for BuyerNeed ${buyerNeed.id}:`, error);
    }
  }

  // Core router: dispatches the demand to the next 5 sorted/eligible sellers
  async routeNextBatch(buyerNeedId) {
    try {
      const buyerNeed = await db.BuyerNeed.findByPk(buyerNeedId);
      if (!buyerNeed || buyerNeed.status !== 'active' || buyerNeed.reach_exceeded) {
        return;
      }

      const categoryName = buyerNeed.category;
      if (!categoryName) return;

      console.log(`📡 [DEBUG routeNextBatch] Starting matching engine for BuyerNeed ID: ${buyerNeedId}`);
      console.log(`   - Title: "${buyerNeed.title}"`);
      console.log(`   - Category: "${categoryName}"`);
      console.log(`   - Location: Country = "${buyerNeed.country}", State = "${buyerNeed.state}"`);

      // Find sellers already routed in previous batches (to exclude them)
      const alreadyNotifiedMatches = await db.BuyerNeedMatch.findAll({
        where: { buyer_need_id: buyerNeed.id },
        attributes: ['seller_id']
      });
      const excludedSellerIds = alreadyNotifiedMatches.map(m => m.seller_id);
      
      // Exclude the buyer themselves
      excludedSellerIds.push(buyerNeed.buyer_id);
      console.log(`   - Excluded User IDs (previously notified + buyer):`, excludedSellerIds);

      // Query active, verified sellers matching the category
      const matchingSellers = await db.SellersTable.findAll({
        where: {
          verificationStatus: { [Op.in]: ['approved', 'active'] },
          userId: { [Op.notIn]: excludedSellerIds },
          [Op.or]: [
            db.sequelize.literal(`JSON_CONTAINS(selectedCategories, JSON_QUOTE('${categoryName}'))`),
            db.sequelize.literal(`selectedCategories LIKE '%${categoryName}%'`)
          ]
        },
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'email', 'accountStatus', 'currentPlanId']
          }
        ]
      });

      console.log(`   - Raw Matching Sellers found in DB: ${matchingSellers.length}`);
      matchingSellers.forEach(s => {
        console.log(`     * Seller: "${s.fullName}" (UserId: ${s.userId})`);
        console.log(`       - Verification Status: "${s.verificationStatus}"`);
        console.log(`       - Categories:`, s.selectedCategories);
        console.log(`       - User loaded: ${!!s.user}`);
      });

      // Load all active plans from database to verify limits dynamically
      const plans = await db.SubscriptionPlan.findAll({ where: { isActive: true } });
      const planMap = {};
      plans.forEach(plan => {
        planMap[plan.id] = plan;
        planMap[plan.name.toLowerCase().trim()] = plan; // Map both by ID and Name just to be safe!
      });

      const eligibleSellers = [];
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const seller of matchingSellers) {
        console.log(`\n   🔍 Evaluating eligibility for Seller: "${seller.fullName}" (UserId: ${seller.userId})`);
        const user = seller.user;
        if (!user) {
          console.log(`     ⚠️ Rejected: Seller has no associated user row in Users table!`);
          continue;
        }

        // Retrieve plan using user's currentPlanId
        console.log(`     - User currentPlanId: ${user.currentPlanId}`);
        const plan = user.currentPlanId ? planMap[user.currentPlanId] : null;
        
        // Default limit to 0 if they don't have a plan
        const dailyLimit = plan ? plan.maxDailyNotifications : 0;
        const planName = plan ? plan.name.toLowerCase().trim() : 'free';
        console.log(`     - Resolved Plan: name = "${planName}", maxDailyNotifications = ${dailyLimit}`);

        // 🚫 RESTRICTION: Wave, Drift, and Free plans receive 0 leads (maxDailyNotifications = 0)
        // Only plans with dailyLimit > 0 (Tide: 7, Surge: 15) are eligible
        if (dailyLimit <= 0) {
          console.log(`     🚫 Rejected: plan has daily limit <= 0. Not eligible to receive direct leads.`);
          continue;
        }

        // 📊 Enforce Daily Limits dynamically from the database
        const matchCountToday = await db.BuyerNeedMatch.count({
          where: {
            seller_id: user.id,
            created_at: { [Op.gt]: oneDayAgo }
          }
        });
        console.log(`     - Matching leads routed in past 24h: ${matchCountToday} (Limit: ${dailyLimit})`);

        if (matchCountToday >= dailyLimit) {
          console.log(`     🚫 Rejected: Daily limit reached for this user (${matchCountToday}/${dailyLimit})`);
          continue; // Skip seller since they hit their daily lead limit
        }

        // Calculate proximity sorting priority
        let locationScore = 3; // Global/Category fallback
        if (seller.country && buyerNeed.country && seller.country.toLowerCase().trim() === buyerNeed.country.toLowerCase().trim()) {
          if (seller.state && buyerNeed.state && seller.state.toLowerCase().trim() === buyerNeed.state.toLowerCase().trim()) {
            locationScore = 1; // Same Country + State (Best match)
          } else {
            locationScore = 2; // Same Country only (Fallback)
          }
        }
        console.log(`     ✅ Accepted: locationScore = ${locationScore}`);

        eligibleSellers.push({
          seller,
          planPriority: planName === 'surge' ? 1 : (planName === 'tide' ? 2 : 3), // Surge gets priority over Tide
          locationScore,
          rating: seller.rating || 0.0,
          trustScore: seller.trustScore || 0
        });
      }

      console.log(`\n📡 [DEBUG routeNextBatch] Total Eligible Sellers: ${eligibleSellers.length}`);

      // Sort: 1) Location closeness asc, 2) Plan priority asc, 3) Rating desc, 4) Trust score desc
      eligibleSellers.sort((a, b) => {
        if (a.locationScore !== b.locationScore) return a.locationScore - b.locationScore;
        if (a.planPriority !== b.planPriority) return a.planPriority - b.planPriority;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.trustScore - a.trustScore;
      });

      // Get next 5 candidates
      const sellersToNotify = eligibleSellers.slice(0, 5);
      if (sellersToNotify.length === 0) {
        console.log(`ℹ️ Out of matching eligible sellers for BuyerNeed ID: ${buyerNeed.id}`);
        return;
      }

      const nextBatchNumber = buyerNeed.current_batch;

      // Log matches as 'notified'
      const matchPromises = sellersToNotify.map(item => {
        return db.BuyerNeedMatch.create({
          buyerNeedId: buyerNeed.id,
          sellerId: item.seller.userId,
          batchNumber: nextBatchNumber,
          status: 'notified',
          notifiedAt: new Date()
        });
      });
      await Promise.all(matchPromises);

      // Increment batch parameters in demand record
      await buyerNeed.update({
        current_batch: nextBatchNumber + 1,
        batch_started_at: new Date()
      });

      // Dispatch push notifications to candidate batch
      const pushPromises = sellersToNotify.map(async (item) => {
        try {
          await createNotification(
            item.seller.userId,
            'New Product Demand Match',
            `A buyer in ${buyerNeed.state || 'your area'} is looking for "${buyerNeed.title}". Accept within 3 minutes!`,
            'info',
            'buyer_need_match',
            {
              type: 'buyer_need_match',
              relatedEntityId: buyerNeed.id,
              buyerNeedId: buyerNeed.id,
              buyerNeedTitle: buyerNeed.title,
              category: categoryName,
              expiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString()
            }
          );
        } catch (pushErr) {
          console.error(`Failed to send push alert to matching seller ${item.seller.userId}:`, pushErr.message);
        }
      });
      await Promise.all(pushPromises);
      console.log(`📡 Dispatched batch #${nextBatchNumber} of 5 sellers for BuyerNeed ID: ${buyerNeed.id}`);
    } catch (error) {
      console.error('Error executing routeNextBatch:', error);
    }
  }

  // Get active incoming requests routed to a seller (Tab 1)
  async getIncomingDemands(req, res) {
    try {
      const sellerId = req.user.id;

      // Find active matches
      const activeMatches = await db.BuyerNeedMatch.findAll({
        where: {
          seller_id: sellerId,
          status: 'notified'
        },
        include: [
          {
            model: db.BuyerNeed,
            as: 'buyerNeed',
            where: { status: 'active', reach_exceeded: false },
            include: [
              {
                model: db.UserTable,
                as: 'buyer',
                attributes: ['fullName', 'profilePicture']
              },
              {
                model: db.BuyerNeedMedia,
                as: 'media',
                attributes: ['mediaUrl', 'mediaType', 'thumbnailUrl']
              }
            ]
          }
        ],
        order: [['notified_at', 'DESC']]
      });

      const formattedIncoming = [];
      const now = new Date();

      for (const match of activeMatches) {
        const notifiedTime = new Date(match.notifiedAt);
        const expiresTime = new Date(notifiedTime.getTime() + 3 * 60 * 1000); // 3 minutes timeout
        const secondsRemaining = Math.max(0, Math.floor((expiresTime - now) / 1000));

        if (secondsRemaining <= 0) {
          // Auto-expire match state on reading if timer expired
          await match.update({ status: 'expired' });
          continue;
        }

        const demand = match.buyerNeed;
        formattedIncoming.push({
          matchId: match.id,
          id: demand.id,
          title: demand.title,
          description: demand.description,
          category: demand.category,
          country: demand.country,
          state: demand.state,
          reachLimit: demand.reach_limit,
          currentReach: demand.current_reach,
          expiresAt: expiresTime.toISOString(),
          secondsRemaining,
          buyer: demand.buyer ? {
            fullName: demand.buyer.fullName,
            profilePicture: demand.buyer.profilePicture
          } : null,
          media: demand.media || []
        });
      }

      return res.status(200).json({
        success: true,
        data: formattedIncoming
      });
    } catch (error) {
      console.error('Error fetching incoming demands:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get accepted demands for a seller (Tab 2)
  async getAcceptedDemands(req, res) {
    try {
      const sellerId = req.user.id;

      const acceptedMatches = await db.BuyerNeedMatch.findAll({
        where: {
          seller_id: sellerId,
          status: 'accepted'
        },
        include: [
          {
            model: db.BuyerNeed,
            as: 'buyerNeed',
            include: [
              {
                model: db.UserTable,
                as: 'buyer',
                attributes: ['id', 'fullName', 'profilePicture']
              },
              {
                model: db.BuyerNeedMedia,
                as: 'media',
                attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder']
              }
            ]
          }
        ],
        order: [['updated_at', 'DESC']]
      });

      const formattedAccepted = acceptedMatches.map(match => {
        const demand = match.buyerNeed;
        return {
          matchId: match.id,
          id: demand.id,
          title: demand.title,
          category: demand.category,
          acceptedAt: match.updatedAt,
          buyer: demand.buyer ? {
            id: demand.buyer.id,
            fullName: demand.buyer.fullName,
            profilePicture: demand.buyer.profilePicture
          } : null,
          media: demand.media || []
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedAccepted
      });
    } catch (error) {
      console.error('Error fetching accepted demands:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Seller Accept Demand Action
  async acceptDemand(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const buyerNeedId = req.params.id;
      const sellerId = req.user.id;

      // 1. Fetch active match record
      const match = await db.BuyerNeedMatch.findOne({
        where: {
          buyer_need_id: buyerNeedId,
          seller_id: sellerId,
          status: 'notified'
        }
      });

      if (!match) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Lead request has expired or does not exist.'
        });
      }

      // Check timer expiration
      const notifiedTime = new Date(match.notifiedAt);
      const expiresTime = new Date(notifiedTime.getTime() + 3 * 60 * 1000);
      if (new Date() > expiresTime) {
        await match.update({ status: 'expired' }, { transaction });
        await transaction.commit();
        return res.status(400).json({
          success: false,
          message: 'Lead request expired (3-minute accept window passed).'
        });
      }

      // 2. Fetch and Lock BuyerNeed
      const buyerNeed = await db.BuyerNeed.findByPk(buyerNeedId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!buyerNeed || buyerNeed.status !== 'active') {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Buyer request is no longer active.'
        });
      }

      // 3. Verify reach limits
      if (buyerNeed.current_reach >= buyerNeed.reach_limit || buyerNeed.reach_exceeded) {
        await match.update({ status: 'expired' }, { transaction });
        await transaction.commit();
        return res.status(400).json({
          success: false,
          message: 'Sorry, this request has already been accepted by other sellers.'
        });
      }

      // 4. Update match status
      await match.update({ status: 'accepted' }, { transaction });

      // 5. Increment current_reach
      const newReach = buyerNeed.current_reach + 1;
      const isLimitExceeded = newReach >= buyerNeed.reach_limit;

      await buyerNeed.update({
        current_reach: newReach,
        reach_exceeded: isLimitExceeded,
        status: isLimitExceeded ? 'in_progress' : 'active'
      }, { transaction });

      // 6. Create compatible BuyerNeedResponse row (Preserves existing analytics & statistics)
      const bidResponse = await db.BuyerNeedResponse.create({
        buyer_need_id: buyerNeed.id,
        seller_id: sellerId,
        message: 'Accepted Lead request',
        offer_price: null,
        currency: 'USD',
        response_type: 'offer',
        contact_method: 'message',
        status: 'accepted'
      }, { transaction });

      // 7. Setup direct chat room conversation between buyer and seller (Sequelize-native matching)
      let conversation = null;
      try {
        const directParticipants = await db.ConversationParticipant.findAll({
          where: {
            userId: [buyerNeed.buyer_id, sellerId]
          },
          attributes: ['conversationId'],
          group: ['conversationId'],
          having: db.sequelize.literal('COUNT(DISTINCT userId) = 2'),
          transaction
        });

        if (directParticipants.length > 0) {
          const conversationIds = directParticipants.map(cp => cp.conversationId);
          conversation = await db.Conversation.findOne({
            where: {
              id: conversationIds,
              type: 'direct'
            },
            transaction
          });
        }

        if (!conversation) {
          conversation = await db.Conversation.create({ type: 'direct' }, { transaction });
          await db.ConversationParticipant.bulkCreate([
            { conversationId: conversation.id, userId: buyerNeed.buyer_id, role: 'member' },
            { conversationId: conversation.id, userId: sellerId, role: 'member' }
          ], { transaction });
          console.log(`💬 Created new direct conversation ID ${conversation.id} between buyer and seller`);
        } else {
          console.log(`💬 Found existing direct conversation ID ${conversation.id}`);
        }
      } catch (chatError) {
        console.error('⚠️ Failed to establish direct chat conversation, continuing without chat room:', chatError.message);
      }

      // Notify the buyer (demander) that a seller accepted their lead
      try {
        await createNotification(
          buyerNeed.buyer_id,
          'Product Demand Accepted',
          `A matching seller has accepted your demand. Tap to start chatting!`,
          'success',
          'buyer_need_match',
          {
            type: 'buyer_need_match',
            relatedEntityId: buyerNeed.id,
            buyerNeedId: buyerNeed.id,
            sellerId: sellerId,
            conversationId: conversation ? conversation.id : null
          }
        );
      } catch (notifyErr) {
        console.error('Error notifying buyer of accept:', notifyErr.message);
      }

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Demand request accepted successfully',
        conversationId: conversation ? conversation.id : null
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error accepting demand:', error);
      return res.status(500).json({
        success: false,
        message: 'Error accepting demand request',
        error: error.message
      });
    }
  }

  // Seller Decline Demand Action
  async declineDemand(req, res) {
    try {
      const buyerNeedId = req.params.id;
      const sellerId = req.user.id;

      const match = await db.BuyerNeedMatch.findOne({
        where: {
          buyer_need_id: buyerNeedId,
          seller_id: sellerId,
          status: 'notified'
        }
      });

      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Lead request not found or already processed.'
        });
      }

      // Update match status to declined
      await match.update({ status: 'declined' });

      // Check if all 5 sellers in the active batch have declined.
      // If yes, we fast-forward the timer and trigger the next batch immediately!
      const currentBatchNumber = match.batchNumber;
      
      const pendingSellersCount = await db.BuyerNeedMatch.count({
        where: {
          buyer_need_id: buyerNeedId,
          batch_number: currentBatchNumber,
          status: 'notified'
        }
      });

      if (pendingSellersCount === 0) {
        console.log(`⚡ All sellers in batch #${currentBatchNumber} declined/expired. Immediately routing next batch...`);
        // Trigger next batch asynchronously
        this.routeNextBatch(buyerNeedId).catch(err => {
          console.error('Error routing next batch on decline:', err);
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Demand request declined successfully'
      });
    } catch (error) {
      console.error('Error declining demand:', error);
      return res.status(500).json({
        success: false,
        message: 'Error declining demand request',
        error: error.message
      });
    }
  }
}

module.exports = new BuyerNeedController();
