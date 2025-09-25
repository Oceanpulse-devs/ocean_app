const { Auction, AuctionBid, AuctionWatcher, SellersTable, UserTable, Notification, ProductCategory } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const { auctionCreationMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');

// Simple notification function to avoid circular dependency
const createAuctionNotification = async (userId, title, message, type = 'auction', category = 'system') => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      category,
      isRead: false,
      isEmailSent: false
    });
    console.log(`📧 Auction notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error creating auction notification:', error);
  }
};

// Create a new auction (Sellers only)
const createAuction = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is a seller
    const seller = await SellersTable.findOne({
      where: { userId: userId, verificationStatus: 'approved' }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only verified sellers can create auctions'
      });
    }

    // Check subscription limits for auction creation
    const subscriptionCheck = await checkSubscriptionLimit(req.user.id, 'auctions');
    
    if (!subscriptionCheck.allowed) {
      return res.status(403).json({
        message: subscriptionCheck.reason,
        upgradeRequired: true,
        currentPlan: subscriptionCheck.plan,
        suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
      });
    }

    // Check if user's plan allows creating auctions
    const featureCheck = await checkFeatureAccess(req.user.id, 'canCreateAuctions');
    
    if (!featureCheck.allowed) {
      return res.status(403).json({
        message: featureCheck.reason,
        upgradeRequired: true,
        currentPlan: featureCheck.plan,
        suggestedPlan: 'wave'
      });
    }

    const {
      title,
      description,
      startingPrice,
      reservePrice,
      minimumBidIncrement,
      startTime,
      endTime,
      category,
      subcategory,
      condition,
      location,
      images,
      autoExtend,
      autoExtendMinutes,
      tags,
      shippingInfo,
      returnPolicy
    } = req.body;

    // Validation
    if (!title || !description || !startingPrice || !startTime || !endTime || !category || !condition || !location) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Process uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const cloudinaryService = require('../services/cloudinaryService');
      console.log(`Processing ${req.files.length} uploaded images`);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const uploadResult = await cloudinaryService.uploadFile(
            file.buffer,
            `ocean-app/auctions/${seller.id}/${Date.now()}-${i}`,
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
    }

    // Use uploaded images or fallback to provided images
    const finalImages = imageUrls.length > 0 ? imageUrls : (images || []);

    // Validate category
    let categoryRecord;
    // Try to find by UUID first
    if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      categoryRecord = await ProductCategory.findByPk(category);
    } else {
      // Try to find by name (for backward compatibility)
      categoryRecord = await ProductCategory.findOne({ where: { name: category } });
    }
    
    if (!categoryRecord) {
      return res.status(400).json({
        message: 'Invalid category. Please select a valid category from the list.'
      });
    }
    
    // Update category usage count
    await categoryRecord.update({ usageCount: categoryRecord.usageCount + 1 });

    if (parseFloat(startingPrice) <= 0) {
      return res.status(400).json({
        message: 'Starting price must be greater than 0'
      });
    }

    if (reservePrice && parseFloat(reservePrice) <= parseFloat(startingPrice)) {
      return res.status(400).json({
        message: 'Reserve price must be greater than starting price'
      });
    }

    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({
        message: 'Start time must be in the future'
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        message: 'End time must be after start time'
      });
    }

    const auction = await Auction.create({
      sellerId: seller.id,
      title,
      description,
      startingPrice,
      currentPrice: startingPrice,
      reservePrice,
      minimumBidIncrement: minimumBidIncrement || 1.00,
      startTime,
      endTime,
      category,
      subcategory,
      condition,
      location,
      images: finalImages,
      autoExtend: autoExtend || false,
      autoExtendMinutes: autoExtendMinutes || 5,
      tags: tags || [],
      shippingInfo: shippingInfo || {},
      returnPolicy
    });

    // Track subscription usage for auction creation
    await incrementUsage(userId, 'auctions');

    res.status(201).json({
      message: 'Auction created successfully',
      auction
    });

  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({
      message: 'Error creating auction',
      error: error.message
    });
  }
};

// Get all auctions with filters
const getAuctions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'active',
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      sortBy = 'endTime',
      sortOrder = 'ASC'
    } = req.query;

    const currentUserId = req.user?.id;

    // Use subscription-aware search service
    const searchResults = await SubscriptionAwareSearchService.searchAuctions({
      query: search,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      condition,
      location,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    }, currentUserId);

    res.status(200).json({
      success: true,
      data: searchResults.auctions,
      pagination: searchResults.pagination
    });

  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ message: "Error retrieving auctions", error: error.message });
  }
};

// Get single auction by ID
const getAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user?.id;

    const auction = await Auction.findByPk(auctionId, {
      include: [
        {
          model: AuctionBid,
          as: 'bids',
          include: [
            {
              model: UserTable,
              as: 'bidder',
              attributes: ['id', 'fullName']
            }
          ],
          order: [['bidAmount', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    // Increment views
    await auction.increment('views');

    // Check if user is watching this auction
    let isWatching = false;
    if (userId) {
      const watcher = await AuctionWatcher.findOne({
        where: { auctionId, userId }
      });
      isWatching = !!watcher;
    }

    // Check if user has placed a bid
    let userBid = null;
    if (userId) {
      userBid = await AuctionBid.findOne({
        where: { auctionId, bidderId: userId },
        order: [['bidAmount', 'DESC']]
      });
    }

    res.json({
      auction,
      isWatching,
      userBid
    });

  } catch (error) {
    console.error('Error retrieving auction:', error);
    res.status(500).json({
      message: 'Error retrieving auction',
      error: error.message
    });
  }
};

// Place a bid on an auction
const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { bidAmount, isAutoBid, maxAutoBidAmount } = req.body;
    const userId = req.user.id;

    // Validate auction exists and is active
    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({
        message: 'Auction is not active'
      });
    }

    if (new Date() < new Date(auction.startTime)) {
      return res.status(400).json({
        message: 'Auction has not started yet'
      });
    }

    if (new Date() > new Date(auction.endTime)) {
      return res.status(400).json({
        message: 'Auction has ended'
      });
    }

    // Check if user is the seller
    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (seller && seller.id === auction.sellerId) {
      return res.status(400).json({
        message: 'Sellers cannot bid on their own auctions'
      });
    }

    // Validate bid amount
    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({
        message: 'Invalid bid amount'
      });
    }

    const minimumBid = auction.currentPrice + auction.minimumBidIncrement;
    if (bidAmount < minimumBid) {
      return res.status(400).json({
        message: `Minimum bid amount is ${minimumBid}`
      });
    }

    // Check if user already has a higher bid
    const existingBid = await AuctionBid.findOne({
      where: { auctionId, bidderId: userId },
      order: [['bidAmount', 'DESC']]
    });

    if (existingBid && existingBid.bidAmount >= bidAmount) {
      return res.status(400).json({
        message: 'You already have a higher or equal bid'
      });
    }

    // Create the bid
    const bid = await AuctionBid.create({
      auctionId,
      bidderId: userId,
      bidAmount,
      isAutoBid: isAutoBid || false,
      maxAutoBidAmount: maxAutoBidAmount || null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update auction current price and bid count
    await auction.update({
      currentPrice: bidAmount,
      totalBids: auction.totalBids + 1
    });

    // Update unique bidders count
    const uniqueBidders = await AuctionBid.count({
      where: { auctionId },
      distinct: true,
      col: 'bidderId'
    });

    await auction.update({ uniqueBidders });

    // Check if reserve is met
    if (auction.reservePrice && bidAmount >= auction.reservePrice && !auction.isReserveMet) {
      await auction.update({ isReserveMet: true });
    }

    // Update previous winning bid status
    await AuctionBid.update(
      { status: 'outbid' },
      {
        where: {
          auctionId,
          id: { [Op.ne]: bid.id },
          status: 'active'
        }
      }
    );

    // Set this bid as winning
    await bid.update({ isWinningBid: true, status: 'active' });

    // Notify other bidders they were outbid
    const outbidBidders = await AuctionBid.findAll({
      where: {
        auctionId,
        bidderId: { [Op.ne]: userId },
        status: 'outbid'
      },
      include: [
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }
      ]
    });

    // Notify other bidders they were outbid
    for (const outbidBid of outbidBidders) {
      await createAuctionNotification(
        outbidBid.bidderId,
        'You were outbid!',
        `Someone outbid you on "${auction.title}". Current price: ${bidAmount}`,
        'auction',
        'outbid'
      );
    }

    res.json({
      message: 'Bid placed successfully',
      bid,
      currentPrice: bidAmount
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      message: 'Error placing bid',
      error: error.message
    });
  }
};

// Get user's auctions (for sellers)
const getUserAuctions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only sellers can view their auctions'
      });
    }

    const whereClause = { sellerId: seller.id };
    if (status) {
      whereClause.status = status;
    }

    const auctions = await Auction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AuctionBid,
          as: 'bids',
          attributes: ['id', 'bidAmount', 'createdAt'],
          order: [['bidAmount', 'DESC']],
          limit: 1
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      auctions: auctions.rows,
      total: auctions.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(auctions.count / limit)
    });

  } catch (error) {
    console.error('Error retrieving user auctions:', error);
    res.status(500).json({
      message: 'Error retrieving user auctions',
      error: error.message
    });
  }
};

// Get user's bids (for buyers)
const getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const whereClause = { bidderId: userId };
    if (status) {
      whereClause.status = status;
    }

    const bids = await AuctionBid.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Auction,
          as: 'auction',
          include: [
            {
              model: UserTable,
              as: 'seller',
              attributes: ['id', 'fullName', 'profilePicture']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      bids: bids.rows,
      total: bids.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(bids.count / limit)
    });

  } catch (error) {
    console.error('Error retrieving user bids:', error);
    res.status(500).json({
      message: 'Error retrieving user bids',
      error: error.message
    });
  }
};

// Watch/Unwatch an auction
const toggleWatchAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    const existingWatcher = await AuctionWatcher.findOne({
      where: { auctionId, userId }
    });

    if (existingWatcher) {
      await existingWatcher.destroy();
      res.json({
        message: 'Auction unwatched',
        isWatching: false
      });
    } else {
      await AuctionWatcher.create({
        auctionId,
        userId
      });
      res.json({
        message: 'Auction watched',
        isWatching: true
      });
    }

  } catch (error) {
    console.error('Error toggling auction watch:', error);
    res.status(500).json({
      message: 'Error toggling auction watch',
      error: error.message
    });
  }
};

// Update auction (Seller only)
const updateAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const seller = await SellersTable.findOne({
      where: { userId: userId, verificationStatus: 'approved' }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only verified sellers can update auctions'
      });
    }

    const auction = await Auction.findOne({
      where: { id: auctionId, sellerId: seller.id }
    });

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found or you do not have permission to update it'
      });
    }

    // Prevent updates if auction has bids
    if (auction.totalBids > 0) {
      return res.status(400).json({
        message: 'Cannot update auction that has bids'
      });
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
            `ocean-app/auctions/${seller.id}/${Date.now()}-${i}`,
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

    // Validate price fields if provided
    if (updateData.startingPrice && parseFloat(updateData.startingPrice) <= 0) {
      return res.status(400).json({
        message: 'Starting price must be greater than 0'
      });
    }

    if (updateData.reservePrice && updateData.startingPrice && 
        parseFloat(updateData.reservePrice) <= parseFloat(updateData.startingPrice)) {
      return res.status(400).json({
        message: 'Reserve price must be greater than starting price'
      });
    }

    // Validate buyNowPrice if provided
    if (updateData.buyNowPrice && parseFloat(updateData.buyNowPrice) <= 0) {
      return res.status(400).json({
        message: 'Buy now price must be greater than 0'
      });
    }

    // Validate time fields if provided
    if (updateData.startTime && new Date(updateData.startTime) <= new Date()) {
      return res.status(400).json({
        message: 'Start time must be in the future'
      });
    }

    if (updateData.endTime && updateData.startTime && 
        new Date(updateData.endTime) <= new Date(updateData.startTime)) {
      return res.status(400).json({
        message: 'End time must be after start time'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.sellerId;
    delete updateData.currentPrice;
    delete updateData.totalBids;
    delete updateData.uniqueBidders;
    delete updateData.winnerId;
    delete updateData.winningBidAmount;

    await auction.update(updateData);

    res.json({
      message: 'Auction updated successfully',
      auction
    });

  } catch (error) {
    console.error('Error updating auction:', error);
    res.status(500).json({
      message: 'Error updating auction',
      error: error.message
    });
  }
};

// Cancel auction (Seller only)
const cancelAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only sellers can cancel auctions'
      });
    }

    const auction = await Auction.findOne({
      where: { id: auctionId, sellerId: seller.id }
    });

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found or you do not have permission to cancel it'
      });
    }

    if (auction.status === 'ended' || auction.status === 'sold') {
      return res.status(400).json({
        message: 'Cannot cancel ended or sold auction'
      });
    }

    await auction.update({ status: 'cancelled' });

    // Notify bidders about cancellation
    const bidders = await AuctionBid.findAll({
      where: { auctionId },
      include: [
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }
      ]
    });

    // Notify bidders about cancellation
    for (const bid of bidders) {
      await createAuctionNotification(
        bid.bidderId,
        'Auction Cancelled',
        `The auction "${auction.title}" has been cancelled by the seller.`,
        'auction',
        'cancelled'
      );
    }

    res.json({
      message: 'Auction cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling auction:', error);
    res.status(500).json({
      message: 'Error cancelling auction',
      error: error.message
    });
  }
};

// Get auction categories
const getAuctionCategories = async (req, res) => {
  try {
    const categories = await Auction.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
    });

    res.json({
      categories: categories.map(cat => ({
        name: cat.category,
        count: parseInt(cat.dataValues.count)
      }))
    });

  } catch (error) {
    console.error('Error retrieving auction categories:', error);
    res.status(500).json({
      message: 'Error retrieving auction categories',
      error: error.message
    });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuction,
  placeBid,
  getUserAuctions,
  getUserBids,
  toggleWatchAuction,
  updateAuction,
  cancelAuction,
  getAuctionCategories
}; 