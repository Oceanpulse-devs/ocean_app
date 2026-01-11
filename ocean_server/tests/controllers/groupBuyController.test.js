const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { GroupBuy, GroupBuyParticipant, UserTable, SellersTable, UserSubscription, SubscriptionPlan } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Group Buy Controller', () => {
  let testSeller;
  let testBuyer;
  let testGroupBuy;
  let sellerToken;
  let buyerToken;
  let testSellerRecord;

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data
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
        
        await GroupBuyParticipant.destroy({
          where: {
            user_id: {
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
          await GroupBuy.destroy({
            where: {
              creator_id: {
                [db.Sequelize.Op.in]: userIds
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

    // Create active subscription for seller
    const wavePlan = await SubscriptionPlan.findOne({
      where: { name: 'wave' }
    });

    if (wavePlan) {
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Create test group buy
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    testGroupBuy = await GroupBuy.create({
      creator_id: testSeller.id,
      title: 'Test Group Buy',
      description: 'This is a test group buy description',
      category: 'Electronics',
      product_name: 'Test Product',
      original_price: 10000,
      group_price: 8000,
      min_buyers: 5,
      max_buyers: 20,
      location: 'Lagos, Nigeria',
      deadline: deadline,
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
        
        await GroupBuyParticipant.destroy({
          where: {
            user_id: {
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
          await GroupBuy.destroy({
            where: {
              creator_id: {
                [db.Sequelize.Op.in]: userIds
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

  describe('POST /api/group-buys/create', () => {
    it('should create group buy successfully with valid data', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'New Test Group Buy')
        .field('description', 'Test group buy description')
        .field('category', 'Electronics')
        .field('product_name', 'Test Product')
        .field('original_price', '12000')
        .field('group_price', '9000')
        .field('min_buyers', '5')
        .field('max_buyers', '20')
        .field('deadline', deadline.toISOString())
        .field('location', 'Lagos, Nigeria')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('New Test Group Buy');
      expect(response.body.data.group_price).toBe(9000);

      // Verify group buy was created in database
      const groupBuy = await GroupBuy.findByPk(response.body.data.id);
      expect(groupBuy).toBeTruthy();
      expect(groupBuy.title).toBe('New Test Group Buy');
    });

    it('should accept pricePerUnit and endDate field names (frontend compatibility)', async () => {
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Group Buy with frontend fields')
        .field('description', 'Test description')
        .field('category', 'Electronics')
        .field('product_name', 'Test Product')
        .field('original_price', '10000')
        .field('pricePerUnit', '7500') // Frontend field name
        .field('min_buyers', '5')
        .field('endDate', endDate.toISOString()) // Frontend field name
        .field('location', 'Lagos, Nigeria')
        .expect(201);

      expect(response.body.data.group_price).toBe(7500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/group-buys/create')
        .field('title', 'Test Group Buy')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Group Buy')
        // Missing description, category, etc.
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should validate group price is less than original price', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Group Buy')
        .field('description', 'Test description')
        .field('category', 'Electronics')
        .field('product_name', 'Test Product')
        .field('original_price', '10000')
        .field('group_price', '12000') // Greater than original
        .field('min_buyers', '5')
        .field('deadline', deadline.toISOString())
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('Group price must be less than original price');
    });

    it('should validate deadline is in the future', async () => {
      const pastDeadline = new Date(Date.now() - 1000);

      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Group Buy')
        .field('description', 'Test description')
        .field('category', 'Electronics')
        .field('product_name', 'Test Product')
        .field('original_price', '10000')
        .field('group_price', '8000')
        .field('min_buyers', '5')
        .field('deadline', pastDeadline.toISOString())
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('Deadline must be in the future');
    });

    it('should validate min_buyers is at least 2', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/group-buys/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Group Buy')
        .field('description', 'Test description')
        .field('category', 'Electronics')
        .field('product_name', 'Test Product')
        .field('original_price', '10000')
        .field('group_price', '8000')
        .field('min_buyers', '1') // Less than 2
        .field('deadline', deadline.toISOString())
        .field('location', 'Lagos, Nigeria')
        .expect(400);

      expect(response.body.message).toContain('Minimum buyers must be at least 2');
    });
  });

  describe('GET /api/group-buys/all', () => {
    it('should return group buys with authentication', async () => {
      const response = await request(app)
        .get('/api/group-buys/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/group-buys/all')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/group-buys/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/group-buys/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ category: 'Electronics', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/group-buys/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ search: 'Test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/group-buys/:id', () => {
    it('should return group buy details', async () => {
      const response = await request(app)
        .get(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testGroupBuy.id);
      expect(response.body.data.title).toBe(testGroupBuy.title);
      expect(response.body.data).toHaveProperty('creator');
    });

    it('should increment view count', async () => {
      const initialViews = testGroupBuy.views_count || 0;
      
      await request(app)
        .get(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      await testGroupBuy.reload();
      expect(testGroupBuy.views_count).toBeGreaterThan(initialViews);
    });

    it('should include participants', async () => {
      // Create a participant
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });

      const response = await request(app)
        .get(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('participants');
      expect(Array.isArray(response.body.data.participants)).toBe(true);
    });

    it('should return 404 for non-existent group buy', async () => {
      const fakeId = 999999;
      const response = await request(app)
        .get(`/api/group-buys/${fakeId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/group-buys/:id/join', () => {
    it('should join group buy successfully', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('joined group buy');
      expect(response.body.data).toHaveProperty('participant');

      // Verify participant was created
      const participant = await GroupBuyParticipant.findOne({
        where: { group_buy_id: testGroupBuy.id, user_id: testBuyer.id }
      });
      expect(participant).toBeTruthy();
      expect(participant.quantity).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .send({ quantity: 1 })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should prevent creator from joining own group buy', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body.message).toContain('cannot join your own group buy');
    });

    it('should reject joining closed group buy', async () => {
      await testGroupBuy.update({ status: 'cancelled' });

      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body.message).toContain('not open for joining');
    });

    it('should reject joining expired group buy', async () => {
      await testGroupBuy.update({ deadline: new Date(Date.now() - 1000) });

      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body.message).toContain('deadline has passed');
    });

    it('should reject duplicate join', async () => {
      // Join first
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });

      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body.message).toContain('already a participant');
    });

    it('should validate quantity is positive integer', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body.message).toContain('Quantity must be a positive integer');
    });

    it('should check quantity_unit limit if set', async () => {
      await testGroupBuy.update({ quantity_unit: 10, remaining_units: 5 });

      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 10 }) // More than remaining units
        .expect(400);

      expect(response.body.message).toContain('Not enough units available');
    });
  });

  describe('DELETE /api/group-buys/:id/leave', () => {
    beforeEach(async () => {
      // Create participant
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });
      await testGroupBuy.increment('current_buyers');
    });

    it('should leave group buy successfully', async () => {
      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}/leave`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('left group buy');

      // Verify participant was removed
      const participant = await GroupBuyParticipant.findOne({
        where: { group_buy_id: testGroupBuy.id, user_id: testBuyer.id }
      });
      expect(participant).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}/leave`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject leaving if not a participant', async () => {
      // Remove participant first
      await GroupBuyParticipant.destroy({
        where: { group_buy_id: testGroupBuy.id, user_id: testBuyer.id }
      });

      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}/leave`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(404);

      expect(response.body.message).toContain('not a participant');
    });

    it('should only allow leaving pending group buys', async () => {
      await testGroupBuy.update({ status: 'active' });

      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}/leave`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);

      expect(response.body.message).toContain('no longer pending');
    });
  });

  describe('GET /api/group-buys/:id/participants', () => {
    beforeEach(async () => {
      // Create participants
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });
    });

    it('should return participants list', async () => {
      const response = await request(app)
        .get(`/api/group-buys/${testGroupBuy.id}/participants`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('participants');
      expect(Array.isArray(response.body.data.participants)).toBe(true);
      expect(response.body.data.participants.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/group-buys/${testGroupBuy.id}/participants`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/group-buys/user/me', () => {
    it('should return user group buys', async () => {
      const response = await request(app)
        .get('/api/group-buys/user/me')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ type: 'created' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by type (created, participated, all)', async () => {
      // Test 'created' type
      const createdResponse = await request(app)
        .get('/api/group-buys/user/me')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ type: 'created' })
        .expect(200);

      expect(createdResponse.body.success).toBe(true);

      // Test 'participated' type
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });

      const participatedResponse = await request(app)
        .get('/api/group-buys/user/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ type: 'participated' })
        .expect(200);

      expect(participatedResponse.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/group-buys/user/me')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/group-buys/:id', () => {
    it('should update group buy successfully', async () => {
      const response = await request(app)
        .put(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Updated Group Buy Title')
        .field('description', testGroupBuy.description)
        .field('category', testGroupBuy.category)
        .field('product_name', testGroupBuy.product_name)
        .field('original_price', testGroupBuy.original_price.toString())
        .field('group_price', testGroupBuy.group_price.toString())
        .field('min_buyers', testGroupBuy.min_buyers.toString())
        .field('deadline', testGroupBuy.deadline.toISOString())
        .field('location', testGroupBuy.location)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data.title).toBe('Updated Group Buy Title');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/group-buys/${testGroupBuy.id}`)
        .field('title', 'Updated Title')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow creator to update', async () => {
      const response = await request(app)
        .put(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('title', 'Unauthorized Update')
        .expect(403);

      expect(response.body.message).toContain('Only the creator can update');
    });
  });

  describe('DELETE /api/group-buys/:id', () => {
    it('should delete group buy without participants', async () => {
      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify group buy was deleted
      const groupBuy = await GroupBuy.findByPk(testGroupBuy.id);
      expect(groupBuy).toBeNull();
    });

    it('should reject deletion with participants', async () => {
      // Create participant
      await GroupBuyParticipant.create({
        group_buy_id: testGroupBuy.id,
        user_id: testBuyer.id,
        quantity: 1,
        total_amount: testGroupBuy.group_price
      });

      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);

      expect(response.body.message).toContain('Cannot delete group buy with participants');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow creator to delete', async () => {
      const response = await request(app)
        .delete(`/api/group-buys/${testGroupBuy.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only the creator can delete');
    });
  });

  describe('POST /api/group-buys/:id/cancel', () => {
    it('should cancel group buy successfully', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/cancel`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ reason: 'Test cancellation reason' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');

      // Verify group buy was cancelled
      await testGroupBuy.reload();
      expect(testGroupBuy.status).toBe('cancelled');
    });

    it('should require cancellation reason', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/cancel`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Cancellation reason is required');
    });

    it('should only allow creator to cancel', async () => {
      const response = await request(app)
        .post(`/api/group-buys/${testGroupBuy.id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Test reason' })
        .expect(403);

      expect(response.body.message).toContain('Only the creator can cancel');
    });
  });

  describe('GET /api/group-buys/trending', () => {
    it('should return trending group buys', async () => {
      const response = await request(app)
        .get('/api/group-buys/trending')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('groupBuys');
      expect(Array.isArray(response.body.data.groupBuys)).toBe(true);
    });
  });

  describe('GET /api/group-buys/recommended', () => {
    it('should return recommended group buys for authenticated user', async () => {
      const response = await request(app)
        .get('/api/group-buys/recommended')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('groupBuys');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/group-buys/recommended')
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });
});
