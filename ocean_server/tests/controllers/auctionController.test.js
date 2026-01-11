const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { Auction, AuctionBid, AuctionWatcher, AuctionBuyNowRequest, SellersTable, UserTable, UserSubscription, SubscriptionPlan } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Auction Controller', () => {
  let testSeller;
  let testBuyer;
  let testAuction;
  let sellerToken;
  let buyerToken;
  let testSellerRecord;

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data - safely handle foreign key constraints
    try {
      const testUsers = await UserTable.findAll({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        },
        attributes: ['id']
      });

      if (testUsers && testUsers.length > 0) {
        const userIds = testUsers.map(u => u.id);
        
        // Delete auction-related data
        await AuctionBid.destroy({
          where: {
            bidderId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await AuctionWatcher.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await AuctionBuyNowRequest.destroy({
          where: {
            buyerId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        // Get seller IDs
        const sellers = await SellersTable.findAll({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          },
          attributes: ['id']
        });
        
        if (sellers && sellers.length > 0) {
          const sellerIds = sellers.map(s => s.id);
          await Auction.destroy({
            where: {
              sellerId: {
                [db.Sequelize.Op.in]: sellerIds
              }
            }
          });
        }
      }

      // Delete test users
      await UserTable.destroy({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Silently ignore if no test data exists
    }

    // Create test seller user
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    testSeller = await UserTable.create({
      fullName: 'Test Seller',
      email: `seller${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'seller',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true,
      location: 'Lagos, Nigeria'
    });

    // Create seller record
    testSellerRecord = await SellersTable.create({
      userId: testSeller.id,
      fullName: testSeller.fullName,
      email: testSeller.email,
      phoneNumber: '+2341234567890',
      country: 'Nigeria',
      businessName: 'Test Business',
      businessAddress: '123 Test Street',
      verificationStatus: 'approved'
    });

    // Create test buyer user
    testBuyer = await UserTable.create({
      fullName: 'Test Buyer',
      email: `buyer${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'buyer',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true,
      location: 'Lagos, Nigeria'
    });

    // Create active subscription for seller (required for creating auctions)
    const wavePlan = await SubscriptionPlan.findOne({
      where: { name: 'wave' }
    });

    if (wavePlan) {
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }

    // Create test auction
    const startTime = new Date();
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    testAuction = await Auction.create({
      sellerId: testSellerRecord.id,
      title: 'Test Auction Item',
      description: 'This is a test auction description',
      startingPrice: 1000,
      currentPrice: 1000,
      minimumBidIncrement: 100,
      startTime: startTime,
      endTime: endTime,
      category: 'Electronics',
      condition: 'new',
      location: 'Lagos, Nigeria',
      status: 'active'
    });

    // Generate test tokens
    const sellerSessionId = require('crypto').randomBytes(32).toString('hex');
    sellerToken = jwt.sign(
      {
        id: testSeller.id,
        email: testSeller.email,
        role: testSeller.accountType,
        sessionId: sellerSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testSeller.id}:${sellerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const buyerSessionId = require('crypto').randomBytes(32).toString('hex');
    buyerToken = jwt.sign(
      {
        id: testBuyer.id,
        email: testBuyer.email,
        role: testBuyer.accountType,
        sessionId: buyerSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testBuyer.id}:${buyerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
  });

  afterEach(async () => {
    // Cleanup after each test
    try {
      const testUsers = await UserTable.findAll({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        },
        attributes: ['id']
      });

      if (testUsers && testUsers.length > 0) {
        const userIds = testUsers.map(u => u.id);
        
        await AuctionBid.destroy({
          where: {
            bidderId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await AuctionWatcher.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await AuctionBuyNowRequest.destroy({
          where: {
            buyerId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        const sellers = await SellersTable.findAll({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          },
          attributes: ['id']
        });
        
        if (sellers && sellers.length > 0) {
          const sellerIds = sellers.map(s => s.id);
          await Auction.destroy({
            where: {
              sellerId: {
                [db.Sequelize.Op.in]: sellerIds
              }
            }
          });
        }
      }

      await UserTable.destroy({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/auctions', () => {
    it('should create auction successfully with valid data', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'New Test Auction')
        .field('description', 'Test auction description')
        .field('startingPrice', '2000')
        .field('startTime', startTime.toISOString())
        .field('endTime', endTime.toISOString())
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .field('minimumBidIncrement', '200')
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Auction created successfully');
      expect(response.body.data).toHaveProperty('auction');
      expect(response.body.data.auction).toHaveProperty('id');
      expect(response.body.data.auction.title).toBe('New Test Auction');
      expect(parseFloat(response.body.data.auction.startingPrice)).toBe(2000);

      // Verify auction was created in database
      const auction = await Auction.findByPk(response.body.data.auction.id);
      expect(auction).toBeTruthy();
      expect(auction.title).toBe('New Test Auction');
    });

    it('should accept startingBid field name (frontend compatibility)', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Auction with startingBid')
        .field('description', 'Test description')
        .field('startingBid', '1500') // Frontend field name
        .field('startTime', startTime.toISOString())
        .field('endTime', endTime.toISOString())
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .expect(201);

      expect(parseFloat(response.body.data.auction.startingPrice)).toBe(1500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auctions')
        .field('title', 'Test Auction')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject non-seller users', async () => {
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('title', 'Test Auction')
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
    });

    it('should reject unverified sellers', async () => {
      // Create unverified seller
      const unverifiedSeller = await UserTable.create({
        fullName: 'Unverified Seller',
        email: `unverified${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      await SellersTable.create({
        userId: unverifiedSeller.id,
        fullName: unverifiedSeller.fullName,
        email: unverifiedSeller.email,
        phoneNumber: '+2341234567891',
        country: 'Nigeria',
        businessName: 'Unverified Business',
        businessAddress: '456 Unverified Street',
        verificationStatus: 'pending'
      });

      const unverifiedSessionId = require('crypto').randomBytes(32).toString('hex');
      const unverifiedToken = jwt.sign(
        {
          id: unverifiedSeller.id,
          email: unverifiedSeller.email,
          role: unverifiedSeller.accountType,
          sessionId: unverifiedSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${unverifiedSeller.id}:${unverifiedSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .field('title', 'Test Auction')
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Auction')
        // Missing description, startingPrice, etc.
        .expect(400);

      expect(response.body.message).toContain('Missing required fields');
    });

    it('should validate starting price is greater than 0', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Auction')
        .field('description', 'Test description')
        .field('startingPrice', '0')
        .field('startTime', startTime.toISOString())
        .field('endTime', endTime.toISOString())
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('Starting price must be greater than 0');
    });

    it('should validate reserve price is greater than starting price', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Auction')
        .field('description', 'Test description')
        .field('startingPrice', '1000')
        .field('reservePrice', '500') // Less than starting price
        .field('startTime', startTime.toISOString())
        .field('endTime', endTime.toISOString())
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('Reserve price must be greater than starting price');
    });

    it('should validate end time is after start time', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() - 1000); // Before start time

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Auction')
        .field('description', 'Test description')
        .field('startingPrice', '1000')
        .field('startTime', startTime.toISOString())
        .field('endTime', endTime.toISOString())
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('End time must be after start time');
    });
  });

  describe('GET /api/auctions', () => {
    it('should return auctions without authentication', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ status: 'active', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // All returned auctions should be active
      response.body.data.forEach(auction => {
        expect(auction.status).toBe('active');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ category: 'Electronics', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ search: 'Test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ minPrice: 500, maxPrice: 2000, page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .query({ sortBy: 'endTime', sortOrder: 'ASC', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auction/:auctionId', () => {
    it('should return auction details', async () => {
      const response = await request(app)
        .get(`/api/auction/${testAuction.id}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('auction');
      expect(response.body.data.auction.id).toBe(testAuction.id);
      expect(response.body.data.auction.title).toBe(testAuction.title);
      expect(response.body.data.auction).toHaveProperty('seller');
    });

    it('should increment view count', async () => {
      const initialViews = testAuction.views || 0;
      
      await request(app)
        .get(`/api/auction/${testAuction.id}`)
        .expect(200);

      await testAuction.reload();
      expect(testAuction.views).toBeGreaterThan(initialViews);
    });

    it('should include isWatching status for authenticated users', async () => {
      // Watch the auction first
      const watcher = await AuctionWatcher.create({
        auctionId: testAuction.id,
        userId: testBuyer.id
      });
      
      // Verify watcher was created and persisted
      expect(watcher).toBeTruthy();
      expect(watcher.userId).toBe(testBuyer.id);
      expect(watcher.auctionId).toBe(testAuction.id);
      
      // Verify watcher exists in database
      const checkWatcher = await AuctionWatcher.findOne({
        where: { auctionId: testAuction.id, userId: testBuyer.id }
      });
      expect(checkWatcher).toBeTruthy();

      const response = await request(app)
        .get(`/api/auction/${testAuction.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      // Response wrapper wraps { auction, isWatching, ... } into { success, data: { auction, isWatching, ... } }
      expect(response.body.data).toHaveProperty('isWatching');
      expect(response.body.data.isWatching).toBe(true);
    });

    it('should return 404 for non-existent auction', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .get(`/api/auction/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/auction/:auctionId/bid', () => {
    it('should place bid successfully', async () => {
      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ bidAmount: 1100 })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('bid');
      expect(response.body.data.bid.bidAmount).toBe(1100);
      expect(response.body.data.bid.bidderId).toBe(testBuyer.id);

      // Verify bid was created
      const bid = await AuctionBid.findOne({
        where: { auctionId: testAuction.id, bidderId: testBuyer.id }
      });
      expect(bid).toBeTruthy();
      expect(parseFloat(bid.bidAmount)).toBe(1100);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/bid`)
        .send({ bidAmount: 1100 })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject bid lower than current price', async () => {
      // Clear any existing bids first to reset auction state
      await AuctionBid.destroy({ where: { auctionId: testAuction.id } });
      
      // Set current price to 1200 (higher than startingPrice of 1000)
      // This simulates an auction that already has a bid
      await testAuction.update({ 
        currentPrice: 1200, 
        minimumBidIncrement: 100,
        totalBids: 0,
        uniqueBidders: 0
      });
      
      // Reload to ensure values are persisted
      await testAuction.reload();
      
      // Verify the minimum bid would be 1300 (1200 + 100)
      const expectedMinBid = parseFloat(testAuction.currentPrice) + parseFloat(testAuction.minimumBidIncrement);
      expect(expectedMinBid).toBe(1300);

      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ bidAmount: 1100 }) // Less than minimum of 1300
        .expect(400);

      expect(response.body.message).toContain('Minimum bid amount is');
    });

    it('should reject bid that does not meet minimum increment', async () => {
      // Clear any existing bids first
      await AuctionBid.destroy({ where: { auctionId: testAuction.id } });
      
      // Reset currentPrice to startingPrice and set minimumBidIncrement to 200
      await testAuction.update({ 
        currentPrice: testAuction.startingPrice, // Reset to starting price
        minimumBidIncrement: 200, 
        totalBids: 0,
        uniqueBidders: 0
      });
      
      // Reload to ensure values are persisted
      await testAuction.reload();
      
      // Verify the minimum bid would be 1200 (1000 + 200)
      const currentPrice = parseFloat(testAuction.currentPrice);
      const minIncrement = parseFloat(testAuction.minimumBidIncrement);
      expect(currentPrice).toBe(1000); // Should be startingPrice
      expect(minIncrement).toBe(200);
      const expectedMinBid = currentPrice + minIncrement;
      expect(expectedMinBid).toBe(1200);

      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ bidAmount: 1100 }) // Only 100 increment, needs 200 (minimum is 1200)
        .expect(400);

      expect(response.body.message).toContain('Minimum bid amount is');
    });

    it('should prevent seller from bidding on own auction', async () => {
      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/bid`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ bidAmount: 1100 })
        .expect(400);

      expect(response.body.message).toContain('Sellers cannot bid on their own auctions');
    });

    it('should return 404 for non-existent auction', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/auction/${fakeId}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ bidAmount: 1100 })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/auction/:auctionId/watch', () => {
    it('should watch auction successfully', async () => {
      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/watch`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('isWatching', true);

      // Verify watcher was created
      const watcher = await AuctionWatcher.findOne({
        where: { auctionId: testAuction.id, userId: testBuyer.id }
      });
      expect(watcher).toBeTruthy();
    });

    it('should unwatch auction when already watching', async () => {
      // Watch first
      await AuctionWatcher.create({
        auctionId: testAuction.id,
        userId: testBuyer.id
      });

      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/watch`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.isWatching).toBe(false);

      // Verify watcher was removed
      const watcher = await AuctionWatcher.findOne({
        where: { auctionId: testAuction.id, userId: testBuyer.id }
      });
      expect(watcher).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/auction/${testAuction.id}/watch`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/user/auctions', () => {
    it('should return user auctions', async () => {
      const response = await request(app)
        .get('/api/user/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('auctions');
      expect(Array.isArray(response.body.data.auctions)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/user/auctions')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/user/bids', () => {
    beforeEach(async () => {
      // Create a bid for test buyer
      await AuctionBid.create({
        auctionId: testAuction.id,
        bidderId: testBuyer.id,
        bidAmount: 1100
      });
    });

    it('should return user bids', async () => {
      const response = await request(app)
        .get('/api/user/bids')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Response is wrapped by responseWrapper middleware
      expect(response.body.data).toHaveProperty('bids');
      expect(Array.isArray(response.body.data.bids)).toBe(true);
      expect(response.body.data.bids.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/user/bids')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/auction/:auctionId', () => {
    it('should update auction successfully', async () => {
      // Ensure times are in the future for validation
      const futureStartTime = new Date(Date.now() + 1000);
      const futureEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await request(app)
        .put(`/api/auction/${testAuction.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Updated Auction Title')
        .field('description', testAuction.description)
        .field('startingPrice', testAuction.startingPrice.toString())
        .field('startTime', futureStartTime.toISOString())
        .field('endTime', futureEndTime.toISOString())
        .field('category', testAuction.category)
        .field('condition', testAuction.condition)
        .field('location', testAuction.location)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // Response wrapper puts auction in data
      expect(response.body.data).toHaveProperty('auction');
      expect(response.body.data.auction.title).toBe('Updated Auction Title');

      // Verify update in database
      await testAuction.reload();
      expect(testAuction.title).toBe('Updated Auction Title');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/auction/${testAuction.id}`)
        .field('title', 'Updated Title')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow seller to update own auction', async () => {
      // Create another seller
      const otherSeller = await UserTable.create({
        fullName: 'Other Seller',
        email: `other${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      const otherSellerRecord = await SellersTable.create({
        userId: otherSeller.id,
        fullName: otherSeller.fullName,
        email: otherSeller.email,
        phoneNumber: '+2341234567891',
        country: 'Nigeria',
        businessName: 'Other Business',
        businessAddress: '456 Other Street',
        verificationStatus: 'approved'
      });

      const otherSessionId = require('crypto').randomBytes(32).toString('hex');
      const otherToken = jwt.sign(
        {
          id: otherSeller.id,
          email: otherSeller.email,
          role: otherSeller.accountType,
          sessionId: otherSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${otherSeller.id}:${otherSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .put(`/api/auction/${testAuction.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .field('title', 'Unauthorized Update')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/auction/:auctionId', () => {
    it('should cancel auction successfully', async () => {
      const response = await request(app)
        .delete(`/api/auction/${testAuction.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify auction was cancelled
      await testAuction.reload();
      expect(testAuction.status).toBe('cancelled');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/auction/${testAuction.id}`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow seller to cancel own auction', async () => {
      const response = await request(app)
        .delete(`/api/auction/${testAuction.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only sellers can cancel auctions');
    });
  });

  describe('GET /api/auction/:auctionId/bids', () => {
    beforeEach(async () => {
      // Create multiple bids
      await AuctionBid.create({
        auctionId: testAuction.id,
        bidderId: testBuyer.id,
        bidAmount: 1100
      });
    });

    it('should return auction bids', async () => {
      const response = await request(app)
        .get(`/api/auction/${testAuction.id}/bids`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('bids');
      expect(Array.isArray(response.body.data.bids)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/auction/${testAuction.id}/bids`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/auctions/trending', () => {
    it('should return trending auctions', async () => {
      const response = await request(app)
        .get('/api/auctions/trending')
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('auctions');
      expect(Array.isArray(response.body.data.auctions)).toBe(true);
    });
  });

  describe('GET /api/auctions/recommended', () => {
    it('should return recommended auctions for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auctions/recommended')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('auctions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auctions/recommended')
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });
});
