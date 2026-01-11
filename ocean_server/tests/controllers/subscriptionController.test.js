const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { UserTable, SellersTable, UserSubscription, SubscriptionPlan } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Subscription Controller', () => {
  let testSeller;
  let testBuyer;
  let sellerToken;
  let buyerToken;
  let testSellerRecord;
  let wavePlan;
  let tidePlan;

  // Setup before all tests
  beforeAll(async () => {
    // Get or create subscription plans
    [wavePlan] = await SubscriptionPlan.findOrCreate({
      where: { name: 'wave' },
      defaults: {
        display_name: 'Wave Plan',
        price: 5000,
        currency: 'NGN',
        billing_period: 'monthly',
        max_listings: 10,
        max_group_buys: 5,
        can_create_group_buy: true,
        isActive: true
      }
    });

    [tidePlan] = await SubscriptionPlan.findOrCreate({
      where: { name: 'tide' },
      defaults: {
        display_name: 'Tide Plan',
        price: 10000,
        currency: 'NGN',
        billing_period: 'monthly',
        max_listings: 50,
        max_group_buys: 20,
        can_create_group_buy: true,
        isActive: true
      }
    });
  });

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
        
        await UserSubscription.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
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
        
        await UserSubscription.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
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

  describe('GET /api/subscriptions/plans', () => {
    it('should return available plans without authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include plan details', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);

      const plan = response.body.data[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('displayName');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('currency');
      expect(plan).toHaveProperty('limits');
      expect(plan).toHaveProperty('capabilities');
    });

    it('should detect currency for authenticated users', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('currency');
      expect(['NGN', 'USD']).toContain(response.body.currency);
    });
  });

  describe('GET /api/subscriptions/current', () => {
    it('should return subscription status for user with subscription', async () => {
      // Create active subscription
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hasActiveSubscription', true);
      expect(response.body.data).toHaveProperty('plan');
      expect(response.body.data.plan).toHaveProperty('id', wavePlan.id);
    });

    it('should return free plan status for user without subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hasActiveSubscription', false);
      expect(response.body.data).toHaveProperty('status', 'free');
      expect(response.body.data).toHaveProperty('limits');
      expect(response.body.data).toHaveProperty('features');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/subscriptions/subscribe', () => {
    it('should create subscription successfully with valid plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          planId: 'wave',
          paymentMethod: 'flutterwave',
          actualPaymentMethod: 'card'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toHaveProperty('subscription');
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data.payment).toHaveProperty('reference');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .send({ planId: 'wave', paymentMethod: 'flutterwave' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject non-verified sellers', async () => {
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
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({ planId: 'wave', paymentMethod: 'flutterwave' })
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
      expect(response.body.requiresSellerVerification).toBe(true);
    });

    it('should require planId', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ paymentMethod: 'flutterwave' })
        .expect(400);

      expect(response.body.message).toContain('Plan ID is required');
    });

    it('should require paymentMethod', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: 'wave' })
        .expect(400);

      expect(response.body.message).toContain('Payment method is required');
    });

    it('should reject invalid payment method', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: 'wave', paymentMethod: 'invalid' })
        .expect(400);

      expect(response.body.message).toContain('Invalid payment method');
    });

    it('should reject non-existent plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: 'nonexistent', paymentMethod: 'flutterwave' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should prevent duplicate subscription to same plan', async () => {
      // Create active subscription first
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: 'wave', paymentMethod: 'flutterwave' })
        .expect(400);

      expect(response.body.message).toContain('already have an active subscription');
    });
  });

  describe('POST /api/subscriptions/verify-payment', () => {
    it('should verify payment successfully', async () => {
      // Create pending subscription first
      const subscription = await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'pending',
        paymentReference: 'test_reference_123',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/subscriptions/verify-payment')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          paymentReference: 'test_reference_123',
          paymentMethod: 'flutterwave'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.data).toHaveProperty('status', 'success');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/verify-payment')
        .send({ paymentReference: 'test_ref' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should require paymentReference', async () => {
      const response = await request(app)
        .post('/api/subscriptions/verify-payment')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Payment reference is required');
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    beforeEach(async () => {
      // Create active subscription
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should cancel subscription successfully', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');

      // Verify subscription was cancelled
      const subscription = await UserSubscription.findOne({
        where: { userId: testSeller.id, status: 'active' }
      });
      expect(subscription).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .send({ reason: 'Test' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should return error if no active subscription', async () => {
      // Cancel the subscription first
      await UserSubscription.update(
        { status: 'cancelled' },
        { where: { userId: testSeller.id } }
      );

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.message).toContain('No active subscription found');
    });
  });

  describe('GET /api/subscriptions/usage', () => {
    it('should return usage statistics', async () => {
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ days: 7 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('retrieved successfully');
      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should support days parameter', async () => {
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', 30);
    });
  });

  describe('GET /api/subscriptions/check/:actionType', () => {
    beforeEach(async () => {
      // Create active subscription
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should check action eligibility', async () => {
      const response = await request(app)
        .get('/api/subscriptions/check/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('allowed');
      expect(response.body.data).toHaveProperty('reason');
      expect(response.body.data).toHaveProperty('remaining');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/check/listings')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should check different action types', async () => {
      const actionTypes = ['listings', 'group_buys', 'auctions', 'swap_deals'];
      
      for (const actionType of actionTypes) {
        const response = await request(app)
          .get(`/api/subscriptions/check/${actionType}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('allowed');
      }
    });
  });

  describe('GET /api/subscriptions/analytics', () => {
    beforeEach(async () => {
      // Create active subscription
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should return subscription analytics', async () => {
      const response = await request(app)
        .get('/api/subscriptions/analytics')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('retrieved successfully');
      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/analytics')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/subscriptions/change-plan', () => {
    beforeEach(async () => {
      // Create active subscription with wave plan
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should initiate plan change', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-plan')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: 'tide' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Plan change initiated');
      expect(response.body.data).toHaveProperty('currentPlan');
      expect(response.body.data).toHaveProperty('targetPlan');
      expect(response.body.data).toHaveProperty('payment');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-plan')
        .send({ planId: 'tide' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should require planId', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-plan')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Plan ID is required');
    });

    it('should reject non-verified sellers', async () => {
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
        .post('/api/subscriptions/change-plan')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({ planId: 'tide' })
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
    });
  });

  describe('POST /api/subscriptions/boosts', () => {
    beforeEach(async () => {
      // Create active subscription
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should create promotional boost', async () => {
      const response = await request(app)
        .post('/api/subscriptions/boosts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          boostType: 'product',
          targetId: '123',
          durationHours: 24,
          reason: 'Test boost'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('boostType', 'product');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/boosts')
        .send({ boostType: 'product', targetId: '123' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should require boostType and targetId', async () => {
      const response = await request(app)
        .post('/api/subscriptions/boosts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ boostType: 'product' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/subscriptions/boosts', () => {
    it('should return promotional boosts', async () => {
      const response = await request(app)
        .get('/api/subscriptions/boosts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/boosts')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });
});
