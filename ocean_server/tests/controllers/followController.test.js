const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { UserTable, UserFollows, SellersTable, Notification } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Follow Controller', () => {
  let testUser1;
  let testUser2;
  let testUser3;
  let testToken1;
  let testToken2;
  let testToken3;

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
        
        await UserFollows.destroy({
          where: {
            [db.Sequelize.Op.or]: [
              { userId: { [db.Sequelize.Op.in]: userIds } },
              { followsUserId: { [db.Sequelize.Op.in]: userIds } }
            ]
          }
        });
        
        await Notification.destroy({
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

    // Create test users
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    
    testUser1 = await UserTable.create({
      fullName: 'Test User 1',
      email: `user1${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'buyer',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true
    });

    testUser2 = await UserTable.create({
      fullName: 'Test User 2',
      email: `user2${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'seller',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true
    });

    testUser3 = await UserTable.create({
      fullName: 'Test User 3',
      email: `user3${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'buyer',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true
    });

    // Generate test tokens
    const sessionId1 = require('crypto').randomBytes(32).toString('hex');
    testToken1 = jwt.sign(
      {
        id: testUser1.id,
        email: testUser1.email,
        role: testUser1.accountType,
        sessionId: sessionId1
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testUser1.id}:${sessionId1}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const sessionId2 = require('crypto').randomBytes(32).toString('hex');
    testToken2 = jwt.sign(
      {
        id: testUser2.id,
        email: testUser2.email,
        role: testUser2.accountType,
        sessionId: sessionId2
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testUser2.id}:${sessionId2}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const sessionId3 = require('crypto').randomBytes(32).toString('hex');
    testToken3 = jwt.sign(
      {
        id: testUser3.id,
        email: testUser3.email,
        role: testUser3.accountType,
        sessionId: sessionId3
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testUser3.id}:${sessionId3}`, 'active', { EX: 7 * 24 * 60 * 60 });
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
        
        await UserFollows.destroy({
          where: {
            [db.Sequelize.Op.or]: [
              { userId: { [db.Sequelize.Op.in]: userIds } },
              { followsUserId: { [db.Sequelize.Op.in]: userIds } }
            ]
          }
        });
        
        await Notification.destroy({
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

  describe('POST /api/follow', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser2.id })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Successfully followed user');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.followerId).toBe(testUser1.id);
      expect(response.body.data.targetUserId).toBe(testUser2.id);
      expect(response.body.data.followedAt).toBeDefined();

      // Verify in database
      const follow = await UserFollows.findOne({
        where: {
          userId: testUser1.id,
          followsUserId: testUser2.id
        }
      });
      expect(follow).not.toBeNull();
    });

    it('should create a notification when following a user', async () => {
      await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser2.id })
        .expect(201);

      const notification = await Notification.findOne({
        where: {
          userId: testUser2.id,
          category: 'follow'
        }
      });
      expect(notification).not.toBeNull();
      expect(notification.title).toBe('New Follower!');
    });

    it('should return 400 if targetUserId is missing', async () => {
      const response = await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Target user ID is required');
    });

    it('should return 400 if trying to follow self', async () => {
      const response = await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser1.id })
        .expect(400);

      expect(response.body.message).toContain('cannot follow yourself');
    });

    it('should return 404 if target user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: fakeId })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 if already following the user', async () => {
      // Create follow relationship first
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });

      const response = await request(app)
        .post('/api/follow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser2.id })
        .expect(400);

      expect(response.body.message).toContain('already following');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/follow')
        .send({ targetUserId: testUser2.id })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/unfollow', () => {
    beforeEach(async () => {
      // Create follow relationship
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .post('/api/unfollow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser2.id })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Successfully unfollowed user');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.followerId).toBe(testUser1.id);
      expect(response.body.data.targetUserId).toBe(testUser2.id);
      expect(response.body.data.unfollowedAt).toBeDefined();

      // Verify in database
      const follow = await UserFollows.findOne({
        where: {
          userId: testUser1.id,
          followsUserId: testUser2.id
        }
      });
      expect(follow).toBeNull();
    });

    it('should return 400 if targetUserId is missing', async () => {
      const response = await request(app)
        .post('/api/unfollow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Target user ID is required');
    });

    it('should return 400 if trying to unfollow self', async () => {
      const response = await request(app)
        .post('/api/unfollow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser1.id })
        .expect(400);

      expect(response.body.message).toContain('cannot unfollow yourself');
    });

    it('should return 400 if not following the user', async () => {
      const response = await request(app)
        .post('/api/unfollow')
        .set('Authorization', `Bearer ${testToken1}`)
        .send({ targetUserId: testUser3.id })
        .expect(400);

      expect(response.body.message).toContain('not following');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/unfollow')
        .send({ targetUserId: testUser2.id })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/users/:userId/followers', () => {
    beforeEach(async () => {
      // Create follow relationships
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });
      await UserFollows.create({
        userId: testUser3.id,
        followsUserId: testUser2.id
      });
    });

    it('should return followers list', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/followers`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Followers retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('followers');
      expect(Array.isArray(response.body.data.followers)).toBe(true);
      expect(response.body.data.followers.length).toBe(2);
      expect(response.body.data).toHaveProperty('totalFollowers', 2);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should include follower details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/followers`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      const follower = response.body.data.followers[0];
      expect(follower).toHaveProperty('id');
      expect(follower).toHaveProperty('name');
      expect(follower).toHaveProperty('username');
      expect(follower).toHaveProperty('avatar');
      expect(follower).toHaveProperty('lastActive');
      expect(follower).toHaveProperty('isFollowing');
      expect(follower).toHaveProperty('accountType');
      expect(follower).toHaveProperty('accountStatus');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/followers?page=1&limit=1`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body.data.followers.length).toBe(1);
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('hasNextPage');
      expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
    });

    it('should return 404 if user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/followers`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/followers`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/users/:userId/following', () => {
    beforeEach(async () => {
      // Create follow relationships
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser3.id
      });
    });

    it('should return following list', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/following`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Following list retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('following');
      expect(Array.isArray(response.body.data.following)).toBe(true);
      expect(response.body.data.following.length).toBe(2);
      expect(response.body.data).toHaveProperty('totalFollowing', 2);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should include following user details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/following`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      const following = response.body.data.following[0];
      expect(following).toHaveProperty('id');
      expect(following).toHaveProperty('name');
      expect(following).toHaveProperty('username');
      expect(following).toHaveProperty('avatar');
      expect(following).toHaveProperty('lastActive');
      expect(following).toHaveProperty('category');
      expect(following).toHaveProperty('accountType');
      expect(following).toHaveProperty('accountStatus');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/following?page=1&limit=1`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body.data.following.length).toBe(1);
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should return 404 if user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/following`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/users/:targetUserId/follow-status', () => {
    it('should return follow status as false when not following', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/follow-status`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Follow status retrieved successfully');
      expect(response.body.data.isFollowing).toBe(false);
      expect(response.body.data.followedAt).toBeNull();
    });

    it('should return follow status as true when following', async () => {
      // Create follow relationship
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });

      const response = await request(app)
        .get(`/api/users/${testUser2.id}/follow-status`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body.data.isFollowing).toBe(true);
      expect(response.body.data.followedAt).toBeDefined();
    });

    it('should return 404 if target user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/follow-status`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/follow-status`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/users/:userId/follow-stats', () => {
    beforeEach(async () => {
      // Create follow relationships
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });
      await UserFollows.create({
        userId: testUser3.id,
        followsUserId: testUser2.id
      });
      await UserFollows.create({
        userId: testUser2.id,
        followsUserId: testUser1.id
      });
    });

    it('should return follow statistics', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/follow-stats`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Follow statistics retrieved successfully');
      expect(response.body.data.userId).toBe(testUser2.id);
      expect(response.body.data.followerCount).toBe(2);
      expect(response.body.data.followingCount).toBe(1);
    });

    it('should return 404 if user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/follow-stats`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2.id}/follow-stats`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/users/:userId/mutual-followers', () => {
    beforeEach(async () => {
      // Create mutual follow relationships
      // testUser1 follows testUser2, testUser2 follows testUser1 (mutual)
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser2.id
      });
      await UserFollows.create({
        userId: testUser2.id,
        followsUserId: testUser1.id
      });
      // testUser1 follows testUser3, but testUser3 doesn't follow back (not mutual)
      await UserFollows.create({
        userId: testUser1.id,
        followsUserId: testUser3.id
      });
    });

    it('should return mutual followers', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/mutual-followers`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Mutual followers retrieved successfully');
      expect(response.body.data).toHaveProperty('mutualFollowers');
      expect(Array.isArray(response.body.data.mutualFollowers)).toBe(true);
      expect(response.body.data.mutualFollowers.length).toBe(1);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/mutual-followers?page=1&limit=10`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalMutualFollowers');
    });

    it('should return 404 if user does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/mutual-followers`)
        .set('Authorization', `Bearer ${testToken1}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.id}/mutual-followers`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });
});

