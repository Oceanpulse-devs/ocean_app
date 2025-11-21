const db = require('../../models');
const { Auction, AuctionBid, AuctionWatcher, AuctionBuyNowRequest, SellersTable, UserTable, Notification } = db;
const { Op, Sequelize, fn, col, where } = require('sequelize');
const { checkSubscriptionLimit, incrementUsage, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const { auctionCreationMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');
const { mapResponseFields, mapArrayFields } = require('../../utils/fieldMapper');
const axios = require('axios');
const { emitToAuction, emitToUser, emitToSeller } = require('../socket/auctionSocketHandler');

// Helper function to map auction field names for frontend
const mapAuctionResponse = (auction) => {
  const mapped = auction.toJSON ? auction.toJSON() : { ...auction };
  return {
    ...mapped,
    startingBid: mapped.startingPrice,
    currentBid: mapped.currentPrice
  };
};

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
      startingBid,  // Accept frontend field name
      reservePrice,
      buyNowPrice,
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

    // Use frontend field name if provided, otherwise use backend field name
    const finalStartingPrice = startingBid || startingPrice;

    // Validation
    if (!title || !description || !finalStartingPrice || !startTime || !endTime || !category || !condition || !location) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Process uploaded images
    let imageUrls = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      const cloudinaryService = require('../services/cloudinaryService');
      console.log(`Processing ${req.files.images.length} uploaded images`);
      
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
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

    // Store category as provided by user (no validation needed)
    console.log('📝 Category provided by user:', category);

    if (parseFloat(finalStartingPrice) <= 0) {
      return res.status(400).json({
        message: 'Starting price must be greater than 0'
      });
    }

    if (reservePrice && parseFloat(reservePrice) <= parseFloat(finalStartingPrice)) {
      return res.status(400).json({
        message: 'Reserve price must be greater than starting price'
      });
    }

    // Validate buyNowPrice if provided
    if (buyNowPrice) {
      if (parseFloat(buyNowPrice) <= parseFloat(finalStartingPrice)) {
        return res.status(400).json({
          message: 'Buy Now price must be greater than starting price'
        });
      }
      if (reservePrice && parseFloat(buyNowPrice) < parseFloat(reservePrice)) {
        return res.status(400).json({
          message: 'Buy Now price must be greater than or equal to reserve price'
        });
      }
    }

    // Allow auctions to start immediately (within 1 minute tolerance)
    const now = new Date();
    const startTimeDate = new Date(startTime);
    const timeDiff = startTimeDate.getTime() - now.getTime();
    
    if (timeDiff < -60000) { // More than 1 minute in the past
      return res.status(400).json({
        message: 'Start time cannot be more than 1 minute in the past'
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
      startingPrice: finalStartingPrice,  // Use transformed value
      currentPrice: finalStartingPrice,
      reservePrice,
      buyNowPrice: buyNowPrice || null,
      buyNowEnabled: buyNowPrice ? true : false,
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

    // Upload AR model if provided (optional)
    let arModelUrl = null;
    if (req.files && req.files.arModel && req.files.arModel.length > 0) {
      const arFile = req.files.arModel[0];
      console.log('📤 Attempting to upload AR model for auction:', {
        filename: arFile.originalname,
        mimetype: arFile.mimetype,
        size: arFile.size
      });
      
      try {
        const cloudinaryService = require('../services/cloudinaryService');
        const arUploadResult = await cloudinaryService.uploadAuctionARModel(arFile.buffer, auction.id);
        
        if (!arUploadResult.success) {
          console.error('AR model upload failed:', arUploadResult.error);
          console.warn('Auction created but AR model upload failed');
        } else {
          arModelUrl = arUploadResult.url;
          console.log('✅ AR model uploaded successfully:', arModelUrl);
          // Update auction with AR model URL
          await auction.update({ arModel: arModelUrl });
        }
      } catch (error) {
        console.error('Error uploading AR model:', error);
        // Don't fail the auction creation if AR upload fails
      }
    }

    // Track subscription usage for auction creation
    await incrementUsage(userId, 'auctions');

    // Fetch auction with seller associations for complete response
    const createdAuction = await Auction.findByPk(auction.id, {
      include: [
        {
          model: SellersTable,
          as: 'seller',
          attributes: ['id', 'userId', 'businessName', 'businessEmail'],
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'profilePicture']
            }
          ]
        }
      ]
    });

    // Map auction response and add sellerEntityId/sellerMeta
    const mappedAuction = mapAuctionResponse(createdAuction);
    if (mappedAuction?.seller?.id) {
      mappedAuction.sellerEntityId = mappedAuction.seller.id;
      mappedAuction.sellerMeta = {
        businessName: mappedAuction.seller.businessName || null,
        profilePicture: mappedAuction.seller.user?.profilePicture || null,
        businessEmail: mappedAuction.seller.businessEmail || null
      };
    }

    res.status(201).json({
      message: 'Auction created successfully',
      auction: mappedAuction
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
      subcategory,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      sortBy = 'endTime',
      sortOrder = 'ASC'
    } = req.query;

    console.log('🔍 GET AUCTIONS: Fetching auctions...');
    console.log('   Status:', status);
    console.log('   Category:', category);
    console.log('   Subcategory:', subcategory);
    console.log('   Search:', search);
    console.log('   Page:', page);
    console.log('   Limit:', limit);

    // Build where clause
    const whereClause = {};
    
    // Handle status filter - default to show active auctions (drafts are now rare)
    if (status === 'active') {
      whereClause.status = 'active';
    } else if (status) {
      whereClause.status = status;
    } else {
      // Default: show active auctions (new auctions are created as active)
      whereClause.status = 'active';
    }
    
    // Build array of additional conditions
    const additionalConditions = [];
    
    // Search filter - matches title or description
    if (search) {
      additionalConditions.push({
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      });
    }
    
    // Category filter - case-insensitive matching
    if (category) {
      additionalConditions.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('Auction.category')),
          { [Op.like]: `%${category.trim().toLowerCase()}%` }
        )
      );
    }
    
    // Subcategory filter - case-insensitive matching
    if (subcategory) {
      additionalConditions.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('Auction.subcategory')),
          { [Op.like]: `%${subcategory.trim().toLowerCase()}%` }
        )
      );
    }
    
    // Optional filters (for future use)
    if (condition) {
      additionalConditions.push({ condition });
    }
    if (location) {
      additionalConditions.push({ location: { [Op.like]: `%${location}%` } });
    }
    if (minPrice) {
      additionalConditions.push({ currentPrice: { [Op.gte]: parseFloat(minPrice) } });
    }
    if (maxPrice) {
      const priceCondition = { currentPrice: { [Op.lte]: parseFloat(maxPrice) } };
      // If minPrice also exists, merge conditions
      if (minPrice) {
        const existingPriceIndex = additionalConditions.findIndex(c => c.currentPrice && c.currentPrice[Op.gte]);
        if (existingPriceIndex >= 0) {
          additionalConditions[existingPriceIndex].currentPrice = {
            [Op.gte]: parseFloat(minPrice),
            [Op.lte]: parseFloat(maxPrice)
          };
        } else {
          additionalConditions.push(priceCondition);
        }
      } else {
        additionalConditions.push(priceCondition);
      }
    }
    
    // Combine all conditions
    if (additionalConditions.length > 0) {
      whereClause[Op.and] = additionalConditions;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build order clause
    const orderClause = [];
    if (sortBy === 'endTime') {
      orderClause.push(['endTime', sortOrder.toUpperCase()]);
    } else if (sortBy === 'currentPrice') {
      orderClause.push(['currentPrice', sortOrder.toUpperCase()]);
    } else if (sortBy === 'createdAt') {
      orderClause.push(['createdAt', sortOrder.toUpperCase()]);
    } else {
      orderClause.push(['endTime', 'ASC']); // Default
    }

    console.log('   Where clause:', JSON.stringify(whereClause, null, 2));
    console.log('   Order clause:', orderClause);

    // Simple query with seller information included
    const { count, rows: auctions } = await Auction.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: SellersTable,
          as: 'seller',
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'username', 'fullName', 'email', 'profilePicture']
            }
          ]
        }
      ]
    });

    console.log('✅ GET AUCTIONS: Found', count, 'auctions');

    // Map auction field names for frontend compatibility
    const mappedAuctions = auctions.map(mapAuctionResponse);

    res.status(200).json({
      success: true,
      data: mappedAuctions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving auctions", 
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
          model: SellersTable,
          as: 'seller',
          include: [
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'username', 'fullName', 'email', 'profilePicture']
            }
          ]
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
        }
      ]
    });

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    // Increment views (deduplicated for logged-in users)
    if (userId && userId !== auction.seller?.userId) {
      const [view, created] = await db.AuctionView.findOrCreate({
        where: { auctionId: auction.id, viewerId: userId },
        defaults: { viewedAt: new Date() }
      });
      if (created) {
        await auction.increment('views');
      }
    } else if (!userId) {
      await auction.increment('views');
    }

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

    // Check if user has a pending Buy Now request
    let userBuyNowRequest = null;
    if (userId) {
      userBuyNowRequest = await AuctionBuyNowRequest.findOne({
        where: {
          auctionId: auctionId,
          buyerId: userId,
          status: 'pending'
        }
      });
    }

    // Map auction field names for frontend compatibility
    const mappedAuction = mapAuctionResponse(auction);

    // Attach canonical sellerEntityId for frontend convenience
    if (auction?.seller?.id) {
      mappedAuction.sellerEntityId = auction.seller.id;
    }

    res.json({
      auction: mappedAuction,
      isWatching,
      userBid,
      userBuyNowRequest: userBuyNowRequest ? {
        id: userBuyNowRequest.id,
        status: userBuyNowRequest.status,
        buyNowPrice: parseFloat(userBuyNowRequest.buyNowPrice),
        createdAt: userBuyNowRequest.createdAt
      } : null
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

    // Process auto-bids for outbid users (before auto-extend)
    const AutoBidService = require('../services/autoBidService');
    let finalPrice = bidAmount;
    try {
      const autoBidResult = await AutoBidService.processAutoBids(
        auctionId,
        bidAmount,
        auction.minimumBidIncrement,
        auction.title
      );
      
      if (autoBidResult.bidsPlaced > 0) {
        // Reload auction to get updated price
        await auction.reload();
        finalPrice = parseFloat(auction.currentPrice);
        console.log(`🤖 Auto-bids processed: ${autoBidResult.bidsPlaced} bids placed, final price: ₦${finalPrice.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error processing auto-bids:', error);
      // Don't fail the manual bid if auto-bid processing fails
    }

    // Auto-extend logic (after setting winning bid and processing auto-bids)
    if (auction.autoExtend && auction.status === 'active') {
      const now = new Date();
      const endTime = new Date(auction.endTime);
      const timeUntilEnd = endTime - now;
      const extendThreshold = auction.autoExtendMinutes * 60 * 1000; // Convert to milliseconds
      
      // If bid placed within auto-extend threshold, extend the auction
      if (timeUntilEnd > 0 && timeUntilEnd <= extendThreshold) {
        const newEndTime = new Date(now.getTime() + extendThreshold);
        await auction.update({ endTime: newEndTime });
        
        // Notify watchers about extension
        const watchers = await AuctionWatcher.findAll({
          where: { auctionId },
          include: [{
            model: UserTable,
            as: 'user',
            attributes: ['id']
          }]
        });
        
        for (const watcher of watchers) {
          await createAuctionNotification(
            watcher.userId,
            'Auction Extended!',
            `The auction "${auction.title}" has been extended by ${auction.autoExtendMinutes} minutes due to a last-minute bid.`,
            'auction',
            'extension'
          );
        }
        
        console.log(`⏰ Auction ${auctionId} extended by ${auction.autoExtendMinutes} minutes`);
      }
    }

    // Notify other bidders they were outbid (excluding auto-bidders who will be processed)
    // Reload auction to get final price after auto-bids
    await auction.reload();
    const currentAuctionPrice = parseFloat(auction.currentPrice);
    
    const outbidBidders = await AuctionBid.findAll({
      where: {
        auctionId,
        bidderId: { [Op.ne]: userId },
        status: 'outbid',
        [Op.or]: [
          { isAutoBid: false },
          { isAutoBid: null },
          // Exclude auto-bidders who can still bid (maxAutoBidAmount >= currentPrice + increment)
          {
            isAutoBid: true,
            maxAutoBidAmount: {
              [Op.lt]: currentAuctionPrice + auction.minimumBidIncrement
            }
          }
        ]
      },
      include: [
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }
      ]
    });

    // Notify other bidders they were outbid (only non-auto-bidders or exhausted auto-bidders)
    for (const outbidBid of outbidBidders) {
      await createAuctionNotification(
        outbidBid.bidderId,
        'You were outbid!',
        `Someone outbid you on "${auction.title}". Current price: ₦${currentAuctionPrice.toFixed(2)}`,
        'auction',
        'outbid'
      );
    }

    // Emit socket events for real-time updates
    try {
      // Emit bid placed event to auction room
      emitToAuction(auctionId, 'auction:bid_placed', {
        auctionId,
        bid: {
          id: bid.id,
          bidderId: userId,
          bidAmount: currentAuctionPrice,
          isAutoBid: bid.isAutoBid || false,
          createdAt: bid.createdAt
        },
        currentPrice: currentAuctionPrice,
        totalBids: auction.totalBids,
        uniqueBidders: auction.uniqueBidders,
        isReserveMet: auction.isReserveMet
      });

      // Emit price update
      emitToAuction(auctionId, 'auction:price_updated', {
        auctionId,
        currentPrice: currentAuctionPrice,
        totalBids: auction.totalBids,
        uniqueBidders: auction.uniqueBidders
      });

      // If auction was extended, emit extension event
      if (auction.autoExtend && auction.status === 'active') {
        const now = new Date();
        const endTime = new Date(auction.endTime);
        const timeUntilEnd = endTime - now;
        const extendThreshold = auction.autoExtendMinutes * 60 * 1000;
        if (timeUntilEnd > 0 && timeUntilEnd <= extendThreshold) {
          emitToAuction(auctionId, 'auction:extended', {
            auctionId,
            newEndTime: auction.endTime,
            extendedBy: auction.autoExtendMinutes
          });
        }
      }
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
      // Don't fail the bid if socket emission fails
    }

    res.json({
      message: 'Bid placed successfully',
      bid,
      currentPrice: currentAuctionPrice,
      autoBidsProcessed: finalPrice > bidAmount
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

// Get auctions by user ID or seller ID (for visiting profiles)
const getUserAuctionsById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Try to find seller by userId first
    let seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    // If not found, try as Seller Table ID
    if (!seller) {
      seller = await SellersTable.findByPk(userId);
    }

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'User is not a seller or not found'
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
          model: SellersTable,
          as: 'seller',
          attributes: ['id', 'businessName', 'verificationStatus'],
          include: [{
            model: UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'profilePicture']
          }]
        },
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
      offset: offset
    });

    // Map auction field names for frontend
    const mappedAuctions = auctions.rows.map(auction => mapAuctionResponse(auction));

    res.json({
      success: true,
      data: {
        auctions: mappedAuctions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(auctions.count / limit),
          totalAuctions: auctions.count,
          hasNextPage: offset + limit < auctions.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving user auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user auctions',
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
    const updateData = { ...req.body };

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

    // Prevent updates if auction has bids, EXCEPT for status updates to 'sold'
    // This allows sellers to mark auctions as sold even when there are bids
    if (auction.totalBids > 0 && (!updateData.status || updateData.status !== 'sold')) {
      return res.status(400).json({
        message: 'Cannot update auction that has bids (except to mark as sold)'
      });
    }

    // Handle frontend field name transformation
    // startingBid → startingPrice
    if (updateData.startingBid !== undefined) {
      updateData.startingPrice = updateData.startingBid;
      delete updateData.startingBid;
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

    // Process AR model upload if provided (optional, replaces existing)
    if (req.files && req.files.arModel && req.files.arModel.length > 0) {
      const arFile = req.files.arModel[0];
      console.log('📤 Attempting to upload AR model for auction update:', {
        filename: arFile.originalname,
        mimetype: arFile.mimetype,
        size: arFile.size
      });
      
      try {
        const cloudinaryService = require('../services/cloudinaryService');
        const arUploadResult = await cloudinaryService.uploadAuctionARModel(arFile.buffer, auction.id);
        
        if (!arUploadResult.success) {
          console.error('AR model upload failed:', arUploadResult.error);
          console.warn('Auction updated but AR model upload failed');
        } else {
          updateData.arModel = arUploadResult.url;
          console.log('✅ AR model uploaded successfully:', arUploadResult.url);
        }
      } catch (error) {
        console.error('Error uploading AR model:', error);
        // Don't fail the auction update if AR upload fails
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

    const previousStatus = auction.status;
    await auction.update(updateData);

    // Reload auction to get updated values
    await auction.reload();

    // Emit socket events if status changed to 'sold'
    if (updateData.status === 'sold' && previousStatus !== 'sold') {
      try {
        // Notify all bidders that auction was marked as sold
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

        // Notify bidders
        for (const bid of bidders) {
          await createAuctionNotification(
            bid.bidderId,
            'Auction Sold',
            `The auction "${auction.title}" has been marked as sold by the seller.`,
            'auction',
            'sold'
          );
        }

        // Emit to auction room
        emitToAuction(auctionId, 'auction:status_changed', {
          auctionId,
          status: 'sold',
          previousStatus: previousStatus,
          reason: 'seller_marked_sold'
        });

        // Emit sold event
        emitToAuction(auctionId, 'auction:sold', {
          auctionId,
          auction: {
            id: auction.id,
            title: auction.title,
            status: 'sold'
          }
        });
      } catch (socketError) {
        console.error('Error emitting socket events:', socketError);
      }
    }

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

    // Emit socket events
    try {
      // Emit to auction room
      emitToAuction(auctionId, 'auction:status_changed', {
        auctionId,
        status: 'cancelled',
        previousStatus: auction.status,
        reason: 'seller_cancelled'
      });

      // Emit cancellation event
      emitToAuction(auctionId, 'auction:cancelled', {
        auctionId,
        auction: {
          id: auction.id,
          title: auction.title,
          status: 'cancelled'
        }
      });
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
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

// Helper function to create DM for auction buy now purchase
const createAuctionBuyNowDM = async (sellerId, buyerId, auction, buyNowPrice) => {
  try {
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    messageServerUrl = messageServerUrl.replace(/\/$/, '');
    
    // Get auction image
    const auctionImage = auction.images && Array.isArray(auction.images) && auction.images.length > 0
      ? auction.images[0]
      : null;

    // Build metadata for conversation
    const metadata = {
      productId: auction.id,
      productName: auction.title,
      productImage: auctionImage,
      productType: 'auction',
      auctionWin: {
        auctionId: auction.id,
        auctionTitle: auction.title,
        winningBidAmount: buyNowPrice,
        currency: 'NGN',
        endedAt: auction.endTime,
        purchaseMethod: 'buy_now'
      }
    };

    // Create conversation via message server
    const response = await axios.post(
      `${messageServerUrl}/api/conversations`,
      {
        type: 'direct',
        participants: [sellerId, buyerId],
        metadata: metadata
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );

    const conversationId = response.data.conversationId || response.data.id || response.data.data?.id;

    // Send system message
    if (conversationId) {
      await axios.post(
        `${messageServerUrl}/api/messages`,
        {
          conversationId,
          content: `✅ Purchase successful! You purchased "${auction.title}" via Buy Now for ₦${buyNowPrice}. Let's coordinate the details!`,
          type: 'system',
          senderId: sellerId,
          referenceType: 'auction',
          referenceId: auction.id,
          referenceTitle: auction.title,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ Created DM between seller ${sellerId} and buyer ${buyerId} for Buy Now purchase on auction ${auction.id}`);
    }

    return conversationId;
  } catch (error) {
    console.error('Error creating auction buy now DM:', error.message);
    // Don't fail the buy now if DM creation fails
    return null;
  }
};

// Helper function to create DM for auction winner
const createAuctionWinnerDM = async (sellerId, winnerId, auction, winningBidAmount) => {
  try {
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    messageServerUrl = messageServerUrl.replace(/\/$/, '');
    
    // Get auction image
    const auctionImage = auction.images && Array.isArray(auction.images) && auction.images.length > 0
      ? auction.images[0]
      : null;

    // Build metadata for conversation
    const metadata = {
      productId: auction.id,
      productName: auction.title,
      productImage: auctionImage,
      productType: 'auction',
      auctionWin: {
        auctionId: auction.id,
        auctionTitle: auction.title,
        winningBidAmount: winningBidAmount,
        currency: 'NGN',
        endedAt: auction.endTime,
      }
    };

    // Create conversation via message server
    const response = await axios.post(
      `${messageServerUrl}/api/conversations`,
      {
        type: 'direct',
        participants: [sellerId, winnerId],
        metadata: metadata
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );

    const conversationId = response.data.conversationId || response.data.id || response.data.data?.id;

    // Send system message
    if (conversationId) {
      await axios.post(
        `${messageServerUrl}/api/messages`,
        {
          conversationId,
          content: `🎉 Congratulations! You won the auction "${auction.title}" with a winning bid of ₦${winningBidAmount}. Let's coordinate the details!`,
          type: 'system',
          senderId: sellerId,
          referenceType: 'auction',
          referenceId: auction.id,
          referenceTitle: auction.title,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ Created DM between seller ${sellerId} and winner ${winnerId} for auction ${auction.id}`);
    }

    return conversationId;
  } catch (error) {
    console.error('Error creating auction winner DM:', error.message);
    // Don't fail the auction ending if DM creation fails
    return null;
  }
};

// Select winner for ended auction (Seller only)
const selectWinner = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { bidId } = req.body;
    const userId = req.user.id;

    if (!bidId) {
      return res.status(400).json({
        message: 'bidId is required'
      });
    }

    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        message: 'Only sellers can select winners'
      });
    }

    const auction = await Auction.findOne({
      where: { id: auctionId, sellerId: seller.id },
      include: [{
        model: SellersTable,
        as: 'seller',
        include: [{
          model: UserTable,
          as: 'user',
          attributes: ['id', 'fullName']
        }]
      }]
    });

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found or you do not have permission'
      });
    }

    if (auction.status !== 'ended') {
      return res.status(400).json({
        message: 'Can only select winner for ended auctions'
      });
    }

    if (auction.winnerId) {
      return res.status(400).json({
        message: 'Winner has already been selected for this auction'
      });
    }

    const bid = await AuctionBid.findOne({
      where: {
        id: bidId,
        auctionId: auctionId
      },
      include: [{
        model: UserTable,
        as: 'bidder',
        attributes: ['id', 'fullName']
      }]
    });

    if (!bid) {
      return res.status(404).json({
        message: 'Bid not found or does not belong to this auction'
      });
    }

    // Update auction with winner
    await auction.update({
      winnerId: bid.bidderId,
      winningBidAmount: bid.bidAmount
    });

    // Update bid status
    await bid.update({ status: 'won', isWinningBid: true });

    // Update other bids to outbid
    await AuctionBid.update(
      { status: 'outbid' },
      {
        where: {
          auctionId: auctionId,
          id: { [Op.ne]: bidId }
        }
      }
    );

    // Create DM between seller and winner
    if (auction.seller && auction.seller.user) {
      await createAuctionWinnerDM(
        auction.seller.user.id,
        bid.bidderId,
        auction,
        bid.bidAmount
      );
    }

    // Emit socket events
    try {
      // Emit to auction room
      emitToAuction(auctionId, 'auction:winner_selected', {
        auctionId,
        winner: {
          id: bid.bidderId,
          name: bid.bidder.fullName,
          bidAmount: bid.bidAmount
        },
        auction: {
          id: auction.id,
          title: auction.title,
          status: 'ended'
        }
      });

      // Emit to winner
      emitToUser(bid.bidderId, 'auction:winner_selected', {
        auctionId,
        winner: {
          id: bid.bidderId,
          bidAmount: bid.bidAmount
        },
        auction: {
          id: auction.id,
          title: auction.title
        }
      });
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
    }

    res.json({
      message: 'Winner selected successfully',
      winner: {
        id: bid.bidderId,
        name: bid.bidder.fullName,
        bidAmount: bid.bidAmount
      }
    });

  } catch (error) {
    console.error('Error selecting winner:', error);
    res.status(500).json({
      message: 'Error selecting winner',
      error: error.message
    });
  }
};

// Get all bids for an auction (paginated)
const getAuctionBids = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'amount', 
      sortOrder = 'desc',
      status,
      isAutoBid
    } = req.query;

    // Validate auction exists
    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Validate sort options
    const validSortBy = ['amount', 'time'];
    const validSortOrder = ['asc', 'desc'];
    const sortByField = validSortBy.includes(sortBy) ? sortBy : 'amount';
    const sortOrderValue = validSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build where clause
    const whereClause = { auctionId };
    if (status) {
      whereClause.status = status;
    }
    if (isAutoBid !== undefined) {
      whereClause.isAutoBid = isAutoBid === 'true';
    }

    // Determine sort field
    const orderField = sortByField === 'amount' ? 'bidAmount' : 'createdAt';

    // Get bids with pagination
    const bids = await AuctionBid.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName', 'username', 'profilePicture']
        }
      ],
      order: [[orderField, sortOrderValue]],
      limit: limitNum,
      offset: offset
    });

    // Format response
    const formattedBids = bids.rows.map(bid => ({
      id: bid.id,
      bidAmount: parseFloat(bid.bidAmount),
      isAutoBid: bid.isAutoBid || false,
      maxAutoBidAmount: bid.maxAutoBidAmount ? parseFloat(bid.maxAutoBidAmount) : null,
      status: bid.status,
      isWinningBid: bid.isWinningBid || false,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
      bidder: {
        id: bid.bidder?.id,
        fullName: bid.bidder?.fullName,
        username: bid.bidder?.username,
        profilePicture: bid.bidder?.profilePicture
      }
    }));

    res.json({
      success: true,
      data: {
        bids: formattedBids,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(bids.count / limitNum),
          totalBids: bids.count,
          limit: limitNum,
          hasNextPage: offset + limitNum < bids.count,
          hasPrevPage: pageNum > 1
        },
        auction: {
          id: auction.id,
          title: auction.title,
          currentPrice: parseFloat(auction.currentPrice),
          totalBids: auction.totalBids
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving auction bids:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving auction bids',
      error: error.message
    });
  }
};

// Retract a bid (User can retract their own bid within time limit)
const retractBid = async (req, res) => {
  try {
    const { auctionId, bidId } = req.params;
    const userId = req.user.id;

    // Configuration: Time limit for bid retraction (5 minutes in milliseconds)
    const RETRACTION_TIME_LIMIT = 5 * 60 * 1000; // 5 minutes

    // Find the bid
    const bid = await AuctionBid.findOne({
      where: {
        id: bidId,
        auctionId: auctionId
      },
      include: [
        {
          model: Auction,
          as: 'auction',
          attributes: ['id', 'title', 'status', 'startTime', 'endTime', 'startingPrice', 'currentPrice', 'reservePrice', 'isReserveMet', 'totalBids']
        },
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Validate user owns the bid
    if (bid.bidderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only retract your own bids'
      });
    }

    // Validate bid status (only active bids can be retracted)
    if (bid.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot retract a bid with status: ${bid.status}`
      });
    }

    // Validate time limit (5 minutes from bid creation)
    const now = new Date();
    const bidAge = now - new Date(bid.createdAt);
    if (bidAge > RETRACTION_TIME_LIMIT) {
      const minutesElapsed = Math.floor(bidAge / 60000);
      return res.status(400).json({
        success: false,
        message: `Bid retraction time limit exceeded. Bid was placed ${minutesElapsed} minutes ago. Retraction is only allowed within 5 minutes.`
      });
    }

    // Validate auction is still active
    const auction = bid.auction;
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot retract bid from an auction with status: ${auction.status}`
      });
    }

    // Validate auction hasn't ended
    if (new Date(auction.endTime) < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot retract bid from an ended auction'
      });
    }

    // Check if this is the winning bid
    if (bid.isWinningBid) {
      return res.status(400).json({
        success: false,
        message: 'Cannot retract the current winning bid'
      });
    }

    // Mark bid as cancelled
    await bid.update({
      status: 'cancelled',
      isWinningBid: false
    });

    // Decrement total bids count
    const newTotalBids = Math.max(0, auction.totalBids - 1);
    await auction.update({ totalBids: newTotalBids });

    // Recalculate unique bidders count (excluding cancelled bids)
    const uniqueBidders = await AuctionBid.count({
      where: {
        auctionId: auctionId,
        status: { [Op.ne]: 'cancelled' }
      },
      distinct: true,
      col: 'bidderId'
    });
    await auction.update({ uniqueBidders });

    // Find the new highest active bid (if any)
    const nextHighestBid = await AuctionBid.findOne({
      where: {
        auctionId: auctionId,
        status: 'active',
        id: { [Op.ne]: bidId }
      },
      include: [
        {
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }
      ],
      order: [['bidAmount', 'DESC']]
    });

    let newCurrentPrice = parseFloat(auction.startingPrice);
    let newWinningBid = null;
    let priceChanged = false;

    if (nextHighestBid) {
      // Update to next highest bid
      newCurrentPrice = parseFloat(nextHighestBid.bidAmount);
      
      // Mark next highest bid as winning
      await nextHighestBid.update({
        isWinningBid: true,
        status: 'active'
      });

      // Update other bids that were outbid by this one
      await AuctionBid.update(
        { status: 'outbid', isWinningBid: false },
        {
          where: {
            auctionId: auctionId,
            id: { [Op.ne]: nextHighestBid.id },
            bidAmount: { [Op.lt]: nextHighestBid.bidAmount },
            status: 'active'
          }
        }
      );

      newWinningBid = {
        id: nextHighestBid.id,
        bidAmount: parseFloat(nextHighestBid.bidAmount),
        bidder: {
          id: nextHighestBid.bidder?.id,
          fullName: nextHighestBid.bidder?.fullName
        }
      };

      priceChanged = parseFloat(auction.currentPrice) !== newCurrentPrice;
    } else {
      // No other bids, reset to starting price
      // Update all other bids to outbid status (shouldn't happen, but safety check)
      await AuctionBid.update(
        { status: 'outbid', isWinningBid: false },
        {
          where: {
            auctionId: auctionId,
            id: { [Op.ne]: bidId },
            status: 'active'
          }
        }
      );

      priceChanged = parseFloat(auction.currentPrice) !== newCurrentPrice;
    }

    // Update auction current price
    await auction.update({ currentPrice: newCurrentPrice });

    // Check reserve price status
    if (auction.reservePrice) {
      const isReserveMet = newCurrentPrice >= parseFloat(auction.reservePrice);
      if (auction.isReserveMet !== isReserveMet) {
        await auction.update({ isReserveMet: isReserveMet });
      }
    }

    // Reload auction to get updated values
    await auction.reload();

    // Notify the user who retracted the bid
    await createAuctionNotification(
      userId,
      'Bid Retracted',
      `Your bid of ₦${parseFloat(bid.bidAmount).toFixed(2)} on "${auction.title}" has been successfully retracted.`,
      'auction',
      'bid_retracted'
    );

    // If price changed, notify affected bidders
    if (priceChanged && nextHighestBid) {
      // Notify bidders who were previously outbid but might now be back in contention
      const previouslyOutbidBidders = await AuctionBid.findAll({
        where: {
          auctionId: auctionId,
          bidderId: { [Op.ne]: userId },
          status: 'outbid',
          bidAmount: {
            [Op.gte]: newCurrentPrice
          }
        },
        include: [
          {
            model: UserTable,
            as: 'bidder',
            attributes: ['id', 'fullName']
          }
        ]
      });

      for (const outbidBid of previouslyOutbidBidders) {
        await createAuctionNotification(
          outbidBid.bidderId,
          'Auction Price Updated',
          `The current price of "${auction.title}" has changed to ₦${newCurrentPrice.toFixed(2)}.`,
          'auction',
          'price_update'
        );
      }

      // Notify the new winning bidder if they weren't already winning
      if (nextHighestBid.bidderId !== userId) {
        await createAuctionNotification(
          nextHighestBid.bidderId,
          'You\'re Now Winning!',
          `You are now the highest bidder on "${auction.title}" with a bid of ₦${newCurrentPrice.toFixed(2)}.`,
          'auction',
          'winning_bid'
        );
      }
    }

    // Emit socket events
    try {
      // Emit bid retracted event
      emitToAuction(auctionId, 'auction:bid_retracted', {
        auctionId,
        retractedBid: {
          id: bid.id,
          bidAmount: parseFloat(bid.bidAmount)
        },
        auction: {
          id: auction.id,
          currentPrice: newCurrentPrice,
          totalBids: newTotalBids,
          uniqueBidders: uniqueBidders
        },
        newWinningBid: newWinningBid ? {
          id: newWinningBid.id,
          bidderId: newWinningBid.bidderId,
          bidAmount: parseFloat(newWinningBid.bidAmount)
        } : null
      });

      // Emit price update if price changed
      if (priceChanged) {
        emitToAuction(auctionId, 'auction:price_updated', {
          auctionId,
          currentPrice: newCurrentPrice,
          totalBids: newTotalBids,
          uniqueBidders: uniqueBidders
        });
      }
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
    }

    res.json({
      success: true,
      message: 'Bid retracted successfully',
      data: {
        retractedBid: {
          id: bid.id,
          bidAmount: parseFloat(bid.bidAmount),
          status: 'cancelled'
        },
        auction: {
          id: auction.id,
          currentPrice: newCurrentPrice,
          totalBids: newTotalBids,
          uniqueBidders: uniqueBidders
        },
        newWinningBid: newWinningBid
      }
    });

  } catch (error) {
    console.error('Error retracting bid:', error);
    res.status(500).json({
      success: false,
      message: 'Error retracting bid',
      error: error.message
    });
  }
};

// Buy Now - Create a request to purchase auction item at fixed price (requires seller approval)
const buyNow = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { message } = req.body; // Optional message from buyer
    const userId = req.user.id;

    // Find auction with seller info
    const auction = await Auction.findOne({
      where: { id: auctionId },
      include: [
        {
          model: SellersTable,
          as: 'seller',
          include: [{
            model: UserTable,
            as: 'user',
            attributes: ['id', 'fullName']
          }]
        }
      ]
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Validate auction is active
    if (auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot create Buy Now request for auction with status: ${auction.status}`
      });
    }

    // Validate auction hasn't ended
    const now = new Date();
    if (new Date(auction.endTime) < now) {
      return res.status(400).json({
        success: false,
        message: 'Auction has already ended'
      });
    }

    // Validate Buy Now price is set
    if (!auction.buyNowPrice || !auction.buyNowEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Buy Now is not available for this auction'
      });
    }

    // Validate user is not the seller
    if (auction.seller && auction.seller.user && auction.seller.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Sellers cannot create Buy Now requests for their own auctions'
      });
    }

    // Check if user already has a pending request for this auction
    const existingRequest = await AuctionBuyNowRequest.findOne({
      where: {
        auctionId: auctionId,
        buyerId: userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending Buy Now request for this auction'
      });
    }

    // Use database transaction to prevent race conditions
    const transaction = await require('../../models').sequelize.transaction();

    try {
      // Reload auction within transaction to get latest state
      const currentAuction = await Auction.findByPk(auctionId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      // Double-check status hasn't changed
      if (currentAuction.status !== 'active') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Auction is no longer available for Buy Now requests'
        });
      }

      // Create Buy Now request
      const buyNowRequest = await AuctionBuyNowRequest.create({
        auctionId: auctionId,
        buyerId: userId,
        buyNowPrice: parseFloat(currentAuction.buyNowPrice),
        status: 'pending',
        message: message || null
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Notify seller of new Buy Now request
      if (auction.seller && auction.seller.user) {
        await createAuctionNotification(
          auction.seller.user.id,
          'New Buy Now Request',
          `A buyer has requested to purchase "${auction.title}" via Buy Now for ₦${parseFloat(auction.buyNowPrice).toFixed(2)}. Review the request in your auction management.`,
          'auction',
          'buy_now_request'
        );
      }

      // Notify buyer that request was created
      await createAuctionNotification(
        userId,
        'Buy Now Request Sent',
        `Your Buy Now request for "${auction.title}" has been sent to the seller. You'll be notified when they respond.`,
        'auction',
        'buy_now_request_sent'
      );

      // Emit socket events
      try {
        // Emit to seller
        if (auction.seller && auction.seller.id) {
          emitToSeller(auction.seller.id, 'auction:buy_now_request_created', {
            auctionId,
            request: {
              id: buyNowRequest.id,
              buyerId: userId,
              buyNowPrice: parseFloat(buyNowRequest.buyNowPrice),
              message: buyNowRequest.message,
              createdAt: buyNowRequest.createdAt
            },
            auction: {
              id: auction.id,
              title: auction.title
            }
          });
        }

        // Emit to buyer
        emitToUser(userId, 'auction:buy_now_request_created', {
          auctionId,
          request: {
            id: buyNowRequest.id,
            status: 'pending',
            buyNowPrice: parseFloat(buyNowRequest.buyNowPrice),
            createdAt: buyNowRequest.createdAt
          }
        });
      } catch (socketError) {
        console.error('Error emitting socket events:', socketError);
      }

      res.json({
        success: true,
        message: 'Buy Now request created successfully. Waiting for seller approval.',
        data: {
          request: {
            id: buyNowRequest.id,
            auctionId: auction.id,
            buyNowPrice: parseFloat(buyNowRequest.buyNowPrice),
            status: 'pending',
            createdAt: buyNowRequest.createdAt
          },
          auction: {
            id: auction.id,
            title: auction.title
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating Buy Now request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Buy Now request',
      error: error.message
    });
  }
};

// Accept Buy Now Request - Seller accepts the request and closes the auction
const acceptBuyNowRequest = async (req, res) => {
  try {
    const { auctionId, requestId } = req.params;
    const userId = req.user.id;

    // Find seller
    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can accept Buy Now requests'
      });
    }

    // Find the request with auction and buyer info
    const buyNowRequest = await AuctionBuyNowRequest.findOne({
      where: {
        id: requestId,
        auctionId: auctionId,
        status: 'pending'
      },
      include: [
        {
          model: Auction,
          as: 'auction',
          where: { sellerId: seller.id },
          include: [{
            model: SellersTable,
            as: 'seller',
            include: [{
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName']
            }]
          }]
        },
        {
          model: UserTable,
          as: 'buyer',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!buyNowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Buy Now request not found, already processed, or you do not have permission'
      });
    }

    const auction = buyNowRequest.auction;
    const buyerId = buyNowRequest.buyerId;
    const buyNowPrice = parseFloat(buyNowRequest.buyNowPrice);

    // Use database transaction to prevent race conditions
    const transaction = await require('../../models').sequelize.transaction();

    try {
      // Reload auction within transaction to get latest state
      const currentAuction = await Auction.findByPk(auctionId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      // Double-check auction is still active
      if (currentAuction.status !== 'active') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Auction is no longer active'
        });
      }

      // Update request status to accepted
      await buyNowRequest.update({
        status: 'accepted'
      }, { transaction });

      // Reject all other pending requests for this auction
      await AuctionBuyNowRequest.update(
        {
          status: 'rejected'
        },
        {
          where: {
            auctionId: auctionId,
            id: { [Op.ne]: requestId },
            status: 'pending'
          },
          transaction
        }
      );

      // Update auction to sold status
      const now = new Date();
      await currentAuction.update({
        status: 'sold',
        endTime: now,
        buyerId: buyerId,
        boughtAt: now,
        winningBidAmount: buyNowPrice,
        winnerId: buyerId
      }, { transaction });

      // Cancel all active bids
      await AuctionBid.update(
        {
          status: 'cancelled',
          isWinningBid: false
        },
        {
          where: {
            auctionId: auctionId,
            status: { [Op.ne]: 'cancelled' }
          },
          transaction
        }
      );

      // Commit transaction
      await transaction.commit();

      // Reload auction to get updated values
      await auction.reload();

      // Create DM between seller and buyer
      let conversationId = null;
      if (auction.seller && auction.seller.user) {
        conversationId = await createAuctionBuyNowDM(
          auction.seller.user.id,
          buyerId,
          auction,
          buyNowPrice
        );
      }

      // Notify buyer that request was accepted
      await createAuctionNotification(
        buyerId,
        'Buy Now Request Accepted!',
        `Your Buy Now request for "${auction.title}" has been accepted! The auction is now closed. Check your messages to coordinate details.`,
        'auction',
        'buy_now_accepted'
      );

      // Notify seller
      if (auction.seller && auction.seller.user) {
        await createAuctionNotification(
          auction.seller.user.id,
          'Buy Now Request Accepted',
          `You accepted a Buy Now request for "${auction.title}" at ₦${buyNowPrice.toFixed(2)}. The auction is now closed.`,
          'auction',
          'buy_now_accepted'
        );
      }

      // Notify all bidders that auction ended via Buy Now
      const bidders = await AuctionBid.findAll({
        where: {
          auctionId: auctionId,
          bidderId: { [Op.ne]: buyerId }
        },
        include: [{
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }]
      });

      for (const bid of bidders) {
        await createAuctionNotification(
          bid.bidderId,
          'Auction Ended - Item Purchased',
          `The auction "${auction.title}" ended as the item was purchased via Buy Now.`,
          'auction',
          'buy_now_ended'
        );
      }

      // Emit socket events
      try {
        // Emit to auction room (status changed to sold)
        emitToAuction(auctionId, 'auction:status_changed', {
          auctionId,
          status: 'sold',
          previousStatus: 'active',
          reason: 'buy_now_accepted'
        });

        // Emit Buy Now accepted event
        emitToAuction(auctionId, 'auction:buy_now_request_accepted', {
          auctionId,
          request: {
            id: buyNowRequest.id,
            buyerId: buyerId,
            buyNowPrice: buyNowPrice
          },
          auction: {
            id: auction.id,
            title: auction.title,
            status: 'sold',
            endTime: now
          }
        });

        // Emit to buyer
        emitToUser(buyerId, 'auction:buy_now_request_accepted', {
          auctionId,
          request: {
            id: buyNowRequest.id,
            status: 'accepted'
          },
          auction: {
            id: auction.id,
            title: auction.title
          }
        });

        // Emit to seller
        if (auction.seller && auction.seller.id) {
          emitToSeller(auction.seller.id, 'auction:buy_now_request_accepted', {
            auctionId,
            request: {
              id: buyNowRequest.id,
              buyerId: buyerId
            }
          });
        }
      } catch (socketError) {
        console.error('Error emitting socket events:', socketError);
      }

      res.json({
        success: true,
        message: 'Buy Now request accepted. Auction closed successfully.',
        data: {
          request: {
            id: buyNowRequest.id,
            status: 'accepted'
          },
          auction: {
            id: auction.id,
            title: auction.title,
            status: 'sold',
            buyNowPrice: buyNowPrice,
            boughtAt: now
          },
          buyer: {
            id: buyerId,
            fullName: buyNowRequest.buyer?.fullName
          },
          conversationId: conversationId,
          conversationCreated: conversationId !== null
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error accepting Buy Now request:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting Buy Now request',
      error: error.message
    });
  }
};

// Reject Buy Now Request - Seller rejects the request
const rejectBuyNowRequest = async (req, res) => {
  try {
    const { auctionId, requestId } = req.params;
    const userId = req.user.id;

    // Find seller
    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can reject Buy Now requests'
      });
    }

    // Find the request with auction and buyer info
    const buyNowRequest = await AuctionBuyNowRequest.findOne({
      where: {
        id: requestId,
        auctionId: auctionId,
        status: 'pending'
      },
      include: [
        {
          model: Auction,
          as: 'auction',
          where: { sellerId: seller.id }
        },
        {
          model: UserTable,
          as: 'buyer',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!buyNowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Buy Now request not found, already processed, or you do not have permission'
      });
    }

    // Update request status to rejected
    await buyNowRequest.update({
      status: 'rejected'
    });

    // Notify buyer that request was rejected
    await createAuctionNotification(
      buyNowRequest.buyerId,
      'Buy Now Request Rejected',
      `Your Buy Now request for "${buyNowRequest.auction.title}" has been rejected by the seller. The auction continues.`,
      'auction',
      'buy_now_rejected'
    );

    // Notify seller
    await createAuctionNotification(
      userId,
      'Buy Now Request Rejected',
      `You rejected a Buy Now request for "${buyNowRequest.auction.title}". The auction continues.`,
      'auction',
      'buy_now_rejected'
    );

    // Emit socket events
    try {
      // Emit to buyer
      emitToUser(buyNowRequest.buyerId, 'auction:buy_now_request_rejected', {
        auctionId,
        request: {
          id: buyNowRequest.id,
          status: 'rejected'
        },
        auction: {
          id: buyNowRequest.auction.id,
          title: buyNowRequest.auction.title
        }
      });

      // Emit to seller
      if (seller) {
        emitToSeller(seller.id, 'auction:buy_now_request_rejected', {
          auctionId,
          request: {
            id: buyNowRequest.id,
            buyerId: buyNowRequest.buyerId
          }
        });
      }
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
    }

    res.json({
      success: true,
      message: 'Buy Now request rejected successfully',
      data: {
        request: {
          id: buyNowRequest.id,
          status: 'rejected'
        },
        auction: {
          id: buyNowRequest.auction.id,
          title: buyNowRequest.auction.title
        }
      }
    });

  } catch (error) {
    console.error('Error rejecting Buy Now request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting Buy Now request',
      error: error.message
    });
  }
};

// Get Buy Now Requests for an auction (Seller only)
const getBuyNowRequests = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;
    const { status } = req.query; // Optional filter: 'pending', 'accepted', 'rejected'

    // Find seller
    const seller = await SellersTable.findOne({
      where: { userId: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can view Buy Now requests'
      });
    }

    // Verify seller owns the auction
    const auction = await Auction.findOne({
      where: {
        id: auctionId,
        sellerId: seller.id
      }
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found or you do not have permission'
      });
    }

    // Build where clause
    const whereClause = { auctionId: auctionId };
    if (status) {
      whereClause.status = status;
    }

    // Get all requests for this auction
    const requests = await AuctionBuyNowRequest.findAll({
      where: whereClause,
      include: [
        {
          model: UserTable,
          as: 'buyer',
          attributes: ['id', 'fullName', 'username', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format response
    const formattedRequests = requests.map(request => ({
      id: request.id,
      buyNowPrice: parseFloat(request.buyNowPrice),
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      buyer: {
        id: request.buyer?.id,
        fullName: request.buyer?.fullName,
        username: request.buyer?.username,
        profilePicture: request.buyer?.profilePicture
      }
    }));

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      }
    });

  } catch (error) {
    console.error('Error retrieving Buy Now requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving Buy Now requests',
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
  getAuctionCategories,
  getUserAuctionsById,
  selectWinner,
  getAuctionBids,
  retractBid,
  buyNow,
  acceptBuyNowRequest,
  rejectBuyNowRequest,
  getBuyNowRequests
}; 