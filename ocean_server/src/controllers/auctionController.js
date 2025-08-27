const { Auction, AuctionBid, AuctionWatcher, SellersTable, UserTable, Notification } = require('../../models');
const { Op, Sequelize } = require('sequelize');

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
      where: { userId: userId, verificationStatus: 'active' }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only verified sellers can create auctions'
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

    if (startingPrice <= 0) {
      return res.status(400).json({
        message: 'Starting price must be greater than 0'
      });
    }

    if (reservePrice && reservePrice <= startingPrice) {
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
      images: images || [],
      autoExtend: autoExtend || false,
      autoExtendMinutes: autoExtendMinutes || 5,
      tags: tags || [],
      shippingInfo: shippingInfo || {},
      returnPolicy
    });

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
      status,
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      sortBy = 'endTime',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Status filter
    if (status) {
      whereClause.status = status;
    } else {
      // Default: show active and upcoming auctions
      whereClause.status = ['active', 'draft'];
    }

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.currentPrice = {};
      if (minPrice) whereClause.currentPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.currentPrice[Op.lte] = parseFloat(maxPrice);
    }

    // Condition filter
    if (condition) {
      whereClause.condition = condition;
    }

    // Location filter
    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } }
      ];
    }

    const auctions = await Auction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserTable,
          as: 'seller',
          attributes: ['id', 'fullName', 'email', 'profilePicture', 'location']
        },
        {
          model: AuctionBid,
          as: 'bids',
          attributes: ['id', 'bidAmount', 'createdAt'],
          order: [['bidAmount', 'DESC']],
          limit: 1
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      auctions: auctions.rows,
      total: auctions.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(auctions.count / limit)
    });

  } catch (error) {
    console.error('Error retrieving auctions:', error);
    res.status(500).json({
      message: 'Error retrieving auctions',
      error: error.message
    });
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
          model: UserTable,
          as: 'seller',
          attributes: ['id', 'fullName', 'email', 'profilePicture', 'location']
        },
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
        },
        {
          model: UserTable,
          as: 'winner',
          attributes: ['id', 'fullName', 'email']
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
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only sellers can update auctions'
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