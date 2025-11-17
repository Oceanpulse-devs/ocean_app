const request = require('supertest');
const app = require('../../server');
const db = require('../../models');
const { UserTable, SellersTable, UserFollows, Post, Product, Auction, GroupBuy, SwapDeal } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Profile Controller', () => {
  let testUser;
  let testSeller;
  let testBuyer;
  let testToken;
  let sellerToken;
  let buyerToken;

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data - safely handle foreign key constraints
    try {
      // Get test user IDs first
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
        
        // Delete follows for test users
        await UserFollows.destroy({
          where: {
            [db.Sequelize.Op.or]: [
              { userId: { [db.Sequelize.Op.in]: userIds } },
              { followsUserId: { [db.Sequelize.Op.in]: userIds } }
            ]
          }
        });
        
        // Delete posts for test users
        await Post.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        // Delete products for test users (via seller)
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
          await Product.destroy({
            where: {
              sellerId: {
                [db.Sequelize.Op.in]: sellerIds
              }
            }
          });
        }
      }

      // Delete test users (after deleting related records)
      await UserTable.destroy({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Silently ignore if no test data exists - this is expected on first run
    }

    // Create test regular user
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    testUser = await UserTable.create({
      fullName: 'Test User',
      email: `user${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'buyer',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true,
      location: 'Lagos, Nigeria',
      bio: 'Test user bio'
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
      location: 'Lagos, Nigeria',
      bio: 'Test seller bio'
    });

    // Create seller record
    const sellerRecord = await SellersTable.create({
      userId: testSeller.id,
      fullName: testSeller.fullName,
      email: testSeller.email,
      phoneNumber: '+2341234567890',
      country: 'Nigeria',
      businessName: 'Test Business',
      businessAddress: '123 Test Street',
      verificationStatus: 'approved',
      category: 'Electronics'
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
      location: 'Abuja, Nigeria'
    });

    // Generate test tokens
    const sessionId1 = require('crypto').randomBytes(32).toString('hex');
    testToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        role: testUser.accountType,
        sessionId: sessionId1
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testUser.id}:${sessionId1}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const sessionId2 = require('crypto').randomBytes(32).toString('hex');
    sellerToken = jwt.sign(
      {
        id: testSeller.id,
        email: testSeller.email,
        role: testSeller.accountType,
        sessionId: sessionId2
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testSeller.id}:${sessionId2}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const sessionId3 = require('crypto').randomBytes(32).toString('hex');
    buyerToken = jwt.sign(
      {
        id: testBuyer.id,
        email: testBuyer.email,
        role: testBuyer.accountType,
        sessionId: sessionId3
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testBuyer.id}:${sessionId3}`, 'active', { EX: 7 * 24 * 60 * 60 });
  });

  afterEach(async () => {
    // Cleanup after each test - safely handle foreign key constraints
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
        
        await UserFollows.destroy({
          where: {
            [db.Sequelize.Op.or]: [
              { userId: { [db.Sequelize.Op.in]: userIds } },
              { followsUserId: { [db.Sequelize.Op.in]: userIds } }
            ]
          }
        });
        
        await Post.destroy({
          where: {
            userId: {
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
          await Product.destroy({
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

  describe('GET /api/profile', () => {
    it('should return current user profile for buyer', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('fullName', testUser.fullName);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('followersCount');
      expect(response.body.user).toHaveProperty('followingCount');
      expect(response.body.user).toHaveProperty('postsCount');
      expect(response.body.user).toHaveProperty('profilePicture');
      expect(response.body.user).toHaveProperty('bio');
      expect(response.body.user).toHaveProperty('location');
    });

    it('should return current user profile for seller with seller data', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testSeller.id);
      expect(response.body.user).toHaveProperty('fullName', testSeller.fullName);
      expect(response.body.user).toHaveProperty('productsCount');
      expect(response.body.user).toHaveProperty('featuredProducts');
      expect(Array.isArray(response.body.user.featuredProducts)).toBe(true);
      expect(response.body.user).toHaveProperty('auctionsCount');
      expect(response.body.user).toHaveProperty('bulkPurchaseCount');
      expect(response.body.user).toHaveProperty('distressSalesCount');
      expect(response.body.user).toHaveProperty('swapDealsCount');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should include joinDate and lastActive formatted correctly', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('joinDate');
      expect(response.body.user.joinDate).toMatch(/^Joined/);
      expect(response.body.user).toHaveProperty('lastActive');
    });

    it('should return correct follower and following counts', async () => {
      // Create some follow relationships
      await UserFollows.create({
        userId: testBuyer.id,
        followsUserId: testUser.id
      });
      await UserFollows.create({
        userId: testUser.id,
        followsUserId: testBuyer.id
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.user.followersCount).toBe(1);
      expect(response.body.user.followingCount).toBe(1);
    });
  });

  describe('GET /api/users/:userId', () => {
    it('should return user profile by user ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testUser.id);
      expect(response.body.data).toHaveProperty('fullName', testUser.fullName);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('followersCount');
      expect(response.body.data).toHaveProperty('followingCount');
      expect(response.body.data).toHaveProperty('postsCount');
    });

    it('should return user profile by seller ID', async () => {
      const seller = await SellersTable.findOne({ where: { userId: testSeller.id } });
      
      const response = await request(app)
        .get(`/api/users/${seller.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testSeller.id);
      expect(response.body.data).toHaveProperty('fullName', testSeller.fullName);
    });

    it('should include isFollowing status when viewing other user profile', async () => {
      // Create follow relationship
      await UserFollows.create({
        userId: testUser.id,
        followsUserId: testBuyer.id
      });

      const response = await request(app)
        .get(`/api/users/${testBuyer.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('isFollowing', true);
    });

    it('should return isFollowing false when not following', async () => {
      const response = await request(app)
        .get(`/api/users/${testBuyer.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('isFollowing', false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should include seller-specific data for seller profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('productsCount');
      expect(response.body.data).toHaveProperty('businessName');
      expect(response.body.data).toHaveProperty('verificationStatus');
    });

    it('should not include seller data for buyer profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${testBuyer.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('productsCount');
      expect(response.body.data).not.toHaveProperty('businessName');
    });
  });
});

