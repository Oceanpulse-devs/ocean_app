const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { UserTable, SellersTable, BuyerNeed, BuyerNeedResponse, BuyerNeedMedia } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

// Helper function to create a minimal valid PNG buffer for testing
const createTestImageBuffer = () => {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
};

describe('BuyerNeed Controller', () => {
  let testBuyer;
  let testSeller;
  let anotherSeller;
  let buyerToken;
  let sellerToken;
  let anotherSellerToken;
  let testSellerRecord;
  let anotherSellerRecord;

  // Setup before all tests
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Test1234', 10);

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

    // Create test seller user
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

    // Create another seller for response tests
    anotherSeller = await UserTable.create({
      fullName: 'Another Seller',
      email: `seller2${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'seller',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true,
      location: 'Abuja, Nigeria'
    });

    anotherSellerRecord = await SellersTable.create({
      userId: anotherSeller.id,
      fullName: anotherSeller.fullName,
      email: anotherSeller.email,
      phoneNumber: '+2341234567891',
      country: 'Nigeria',
      businessName: 'Another Business',
      businessAddress: '456 Another Street',
      verificationStatus: 'approved'
    });

    // Generate test tokens
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

    const anotherSellerSessionId = require('crypto').randomBytes(32).toString('hex');
    anotherSellerToken = jwt.sign(
      {
        id: anotherSeller.id,
        email: anotherSeller.email,
        role: anotherSeller.accountType,
        sessionId: anotherSellerSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${anotherSeller.id}:${anotherSellerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
  });

  // Cleanup after all tests
  afterAll(async () => {
    try {
      // Clean up buyer needs and responses
      await BuyerNeedResponse.destroy({ where: {} });
      await BuyerNeedMedia.destroy({ where: {} });
      await BuyerNeed.destroy({ where: {} });

      // Clean up test users
      await SellersTable.destroy({ where: { email: { [db.Sequelize.Op.like]: '%@test.com' } } });
      await UserTable.destroy({ where: { email: { [db.Sequelize.Op.like]: '%@test.com' } } });

      // Clean up Redis sessions
      const sessionKeys = await redisClient.keys('session:*');
      if (sessionKeys.length > 0) {
        await redisClient.del(sessionKeys);
      }

      await redisClient.quit();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('POST /api/buyer-needs/create', () => {
    it('should create buyer need successfully', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('content', 'Looking for iPhone 13 Pro Max')
        .field('reach_limit', '10')
        .field('category', 'Electronics')
        .attach('images', createTestImageBuffer(), 'test-image.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.caption).toBe('Looking for iPhone 13 Pro Max');
      expect(response.body.data.reach_limit).toBe(10);
      expect(response.body.data.category).toBe('Electronics');
    });

    it('should create buyer need with caption field', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('caption', 'Need laptop for programming')
        .field('reach_limit', '5')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Need laptop for programming');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .field('content', 'Test need')
        .expect(401);

      expect(response.body.message).toMatch(/authentication|token/i);
    });

    it('should require content or caption', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('reach_limit', '5')
        .expect(400);

      expect(response.body.message).toContain('Content/Caption is required');
    });

    it('should validate reach_limit range', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('content', 'Test need')
        .field('reach_limit', '100')
        .expect(400);

      expect(response.body.message).toMatch(/reach limit.*between 1 and 50/i);
    });

    it('should use default reach_limit of 5 if not provided', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('content', 'Need something')
        .expect(201);

      expect(response.body.data.reach_limit).toBe(5);
    });

    it('should handle multiple images', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('content', 'Need multiple items')
        .attach('images', createTestImageBuffer(), 'image1.png')
        .attach('images', createTestImageBuffer(), 'image2.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('media');
    });
  });

  describe('GET /api/buyer-needs/all', () => {
    let testNeed1, testNeed2;

    beforeEach(async () => {
      // Create test buyer needs
      testNeed1 = await BuyerNeed.create({
        title: 'Test Need 1',
        description: 'Looking for test item 1',
        buyer_id: testBuyer.id,
        category: 'Electronics',
        reach_limit: 5,
        status: 'active'
      });

      testNeed2 = await BuyerNeed.create({
        title: 'Test Need 2',
        description: 'Looking for test item 2',
        buyer_id: testBuyer.id,
        category: 'Fashion',
        reach_limit: 10,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: [testNeed1.id, testNeed2.id] } });
    });

    it('should return all buyer needs', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ category: 'Electronics' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(need => {
        expect(need.category).toBe('Electronics');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/buyer-needs/:id', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Single Test Need',
        description: 'Looking for single test item',
        buyer_id: testBuyer.id,
        category: 'Electronics',
        reach_limit: 5,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should return buyer need by ID', async () => {
      const response = await request(app)
        .get(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNeed.id);
      expect(response.body.data.caption).toBe('Looking for single test item');
    });

    it('should return 404 for non-existent buyer need', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/99999')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(404);

      expect(response.body.message).toMatch(/not found/i);
    });

    it('should increment views_count on view', async () => {
      await request(app)
        .get(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const updatedNeed = await BuyerNeed.findByPk(testNeed.id);
      expect(updatedNeed.views_count).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/buyer-needs/:id', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Updateable Need',
        description: 'Original description',
        buyer_id: testBuyer.id,
        category: 'Electronics',
        reach_limit: 5,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should update buyer need successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          content: 'Updated description',
          category: 'Fashion',
          reach_limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Updated description');
      expect(response.body.data.category).toBe('Fashion');
      expect(response.body.data.reach_limit).toBe(10);
    });

    it('should only allow buyer to update own need', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ content: 'Hacked' })
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });

    it('should not allow updating cancelled or fulfilled needs', async () => {
      await testNeed.update({ status: 'cancelled' });

      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ content: 'Update' })
        .expect(400);

      expect(response.body.message).toMatch(/cannot update/i);
    });
  });

  describe('DELETE /api/buyer-needs/:id', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Deletable Need',
        description: 'To be deleted',
        buyer_id: testBuyer.id,
        category: 'Electronics',
        reach_limit: 5,
        status: 'active'
      });
    });

    it('should delete buyer need successfully', async () => {
      const response = await request(app)
        .delete(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);

      const deletedNeed = await BuyerNeed.findByPk(testNeed.id);
      expect(deletedNeed).toBeNull();
    });

    it('should only allow buyer to delete own need', async () => {
      const response = await request(app)
        .delete(`/api/buyer-needs/${testNeed.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('PUT /api/buyer-needs/:id/cancel', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Cancellable Need',
        description: 'To be cancelled',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should cancel buyer need successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Found item elsewhere' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should only allow buyer to cancel own need', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}/cancel`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('PUT /api/buyer-needs/:id/fulfill', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Fulfillable Need',
        description: 'To be fulfilled',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should mark buyer need as fulfilled', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}/fulfill`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('fulfilled');
    });

    it('should only allow buyer to fulfill own need', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/${testNeed.id}/fulfill`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('GET /api/buyer-needs/user/me', () => {
    let testNeed1, testNeed2;

    beforeEach(async () => {
      testNeed1 = await BuyerNeed.create({
        title: 'My Need 1',
        description: 'My first need',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testNeed2 = await BuyerNeed.create({
        title: 'My Need 2',
        description: 'My second need',
        buyer_id: testBuyer.id,
        reach_limit: 10,
        status: 'fulfilled'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: [testNeed1.id, testNeed2.id] } });
    });

    it('should return current user buyer needs', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/user/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/user/me')
        .expect(401);

      expect(response.body.message).toMatch(/authentication|token/i);
    });
  });

  describe('GET /api/buyer-needs/stats/overview', () => {
    it('should return buyer need statistics', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/stats/overview')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalNeeds');
      expect(response.body.data).toHaveProperty('activeNeeds');
      expect(response.body.data).toHaveProperty('fulfilledNeeds');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/stats/overview')
        .expect(401);

      expect(response.body.message).toMatch(/authentication|token/i);
    });
  });

  describe('POST /api/buyer-needs/:id/increment-reach', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Reach Test Need',
        description: 'Test reach limit',
        buyer_id: testBuyer.id,
        reach_limit: 2,
        current_reach: 0,
        reach_exceeded: false,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should increment reach count', async () => {
      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/increment-reach`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.current_reach).toBe(1);
      expect(response.body.data.reach_exceeded).toBe(false);
    });

    it('should set reach_exceeded when limit reached', async () => {
      // Increment to limit
      await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/increment-reach`)
        .set('Authorization', `Bearer ${sellerToken}`);

      await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/increment-reach`)
        .set('Authorization', `Bearer ${anotherSellerToken}`);

      const updatedNeed = await BuyerNeed.findByPk(testNeed.id);
      expect(updatedNeed.current_reach).toBe(2);
      expect(updatedNeed.reach_exceeded).toBe(true);
    });
  });

  describe('GET /api/buyer-needs/:id/reach-status', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Reach Status Test',
        description: 'Test reach status',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        current_reach: 3,
        reach_exceeded: false,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should return reach status', async () => {
      const response = await request(app)
        .get(`/api/buyer-needs/${testNeed.id}/reach-status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reach_limit).toBe(5);
      expect(response.body.data.current_reach).toBe(3);
      expect(response.body.data.reach_exceeded).toBe(false);
      expect(response.body.data.remaining_reach).toBe(2);
    });
  });

  describe('POST /api/buyer-needs/search-insight/track', () => {
    it('should track failed search', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/search-insight/track')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          search_query: 'rare item',
          category: 'Electronics'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/tracked successfully/i);
    });

    it('should require search_query', async () => {
      const response = await request(app)
        .post('/api/buyer-needs/search-insight/track')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ category: 'Electronics' })
        .expect(400);

      expect(response.body.message).toMatch(/search query.*required/i);
    });
  });

  describe('GET /api/buyer-needs/search-insights', () => {
    it('should return buyer search insights', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/search-insights')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support category filter', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/search-insights')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ category: 'Electronics' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // Response Management Tests
  describe('POST /api/buyer-needs/:buyer_need_id/responses', () => {
    let testNeed;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Need for Response',
        description: 'Test response creation',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { buyer_need_id: testNeed.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should create response successfully', async () => {
      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          message: 'I have this item in stock',
          offer_price: 50000,
          currency: 'NGN',
          response_type: 'offer',
          delivery_time: '2-3 days',
          contact_method: 'message'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/response created successfully/i);
      expect(response.body.data.message).toBe('I have this item in stock');
      expect(parseFloat(response.body.data.offer_price)).toBe(50000);
    });

    it('should require message', async () => {
      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ offer_price: 50000 })
        .expect(400);

      expect(response.body.message).toMatch(/message.*required/i);
    });

    it('should not allow buyer to respond to own need', async () => {
      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          message: 'Test',
          contact_method: 'message'
        })
        .expect(400);

      expect(response.body.message).toMatch(/cannot respond to your own/i);
    });

    it('should not allow duplicate responses', async () => {
      // First response
      await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          message: 'First response',
          contact_method: 'message'
        });

      // Second response from same seller
      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          message: 'Second response',
          contact_method: 'message'
        })
        .expect(400);

      expect(response.body.message).toMatch(/already responded/i);
    });

    it('should not allow response to inactive need', async () => {
      await testNeed.update({ status: 'cancelled' });

      const response = await request(app)
        .post(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          message: 'Test',
          contact_method: 'message'
        })
        .expect(400);

      expect(response.body.message).toMatch(/cannot respond to inactive/i);
    });
  });

  describe('GET /api/buyer-needs/:buyer_need_id/responses', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Need with Responses',
        description: 'Has responses',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Test response',
        offer_price: 50000,
        currency: 'NGN',
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should return responses for buyer need', async () => {
      const response = await request(app)
        .get(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should only allow buyer to view responses', async () => {
      const response = await request(app)
        .get(`/api/buyer-needs/${testNeed.id}/responses`)
        .set('Authorization', `Bearer ${anotherSellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('PUT /api/buyer-needs/responses/:id/accept', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Acceptable Need',
        description: 'Response can be accepted',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Accept me',
        offer_price: 50000,
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should accept response successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');
    });

    it('should only allow buyer to accept response', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/accept`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('PUT /api/buyer-needs/responses/:id/reject', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Rejectable Need',
        description: 'Response can be rejected',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Reject me',
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should reject response successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/reject`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Price too high' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });
  });

  describe('PUT /api/buyer-needs/responses/:id/withdraw', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Withdrawable Need',
        description: 'Response can be withdrawn',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Withdraw me',
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should withdraw response successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/withdraw`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('withdrawn');
    });

    it('should only allow seller to withdraw own response', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/withdraw`)
        .set('Authorization', `Bearer ${anotherSellerToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/permission/i);
    });
  });

  describe('PUT /api/buyer-needs/responses/:id/read', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Readable Need',
        description: 'Response can be marked read',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Mark me as read',
        contact_method: 'message',
        is_read: false,
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should mark response as read', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/read`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });
  });

  describe('PUT /api/buyer-needs/responses/:id/feedback', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Feedback Need',
        description: 'Response can have feedback',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'Give feedback',
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should provide feedback successfully', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/feedback`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ feedback: 'positive' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.buyer_feedback).toBe('positive');
    });

    it('should validate feedback value', async () => {
      const response = await request(app)
        .put(`/api/buyer-needs/responses/${testResponse.id}/feedback`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ feedback: 'invalid' })
        .expect(400);

      expect(response.body.message).toMatch(/valid feedback/i);
    });
  });

  describe('GET /api/buyer-needs/seller/responses', () => {
    let testNeed, testResponse;

    beforeEach(async () => {
      testNeed = await BuyerNeed.create({
        title: 'Seller Response Need',
        description: 'For seller responses',
        buyer_id: testBuyer.id,
        reach_limit: 5,
        status: 'active'
      });

      testResponse = await BuyerNeedResponse.create({
        buyer_need_id: testNeed.id,
        seller_id: testSeller.id,
        message: 'My response',
        contact_method: 'message',
        status: 'pending'
      });
    });

    afterEach(async () => {
      await BuyerNeedResponse.destroy({ where: { id: testResponse.id } });
      await BuyerNeed.destroy({ where: { id: testNeed.id } });
    });

    it('should return seller own responses', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/seller/responses')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/buyer-needs/seller/responses')
        .expect(401);

      expect(response.body.message).toMatch(/authentication|token/i);
    });
  });
});
