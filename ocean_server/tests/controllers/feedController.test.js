const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { Post, PostMedia, PostLike, PostComment, SavedPost, UserTable, SellersTable, ProductCategory } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Feed Controller', () => {
  let testUser;
  let testSeller;
  let testPost;
  let testToken;
  let testCategory;

  // Setup before all tests
  beforeAll(async () => {
    // Create or find test category (safe for repeated test runs)
    [testCategory] = await ProductCategory.findOrCreate({
      where: { name: 'Test Category' },
      defaults: {
        description: 'Test category for posts',
        icon: 'test-icon'
      }
    });
  });

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data - safely handle empty results
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
        
        // Delete comments for test users
        await PostComment.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        // Delete likes for test users
        await PostLike.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        // Delete saved posts for test users
        await SavedPost.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
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

    // Create test regular user
    testUser = await UserTable.create({
      fullName: 'Test User',
      email: `user${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'buyer',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true,
      location: 'Lagos, Nigeria'
    });

    // Create test post
    testPost = await Post.create({
      userId: testSeller.id,
      content: 'This is a test post content',
      postType: 'general',
      contentType: 'post',
      productName: 'Test Post',
      location: 'Lagos, Nigeria',
      status: 'active',
      feedVisible: true,
      userRegion: 'Lagos',
      userCountry: 'Nigeria'
    });

    // Generate test token
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    testToken = jwt.sign(
      {
        id: testSeller.id,
        email: testSeller.email,
        role: testSeller.accountType,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session in Redis
    await redisClient.set(`session:${testSeller.id}:${sessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
  });

  afterEach(async () => {
    // Cleanup - safely handle empty results
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
        
        await PostComment.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await PostLike.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await SavedPost.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await Post.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
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
      // Ignore cleanup errors
    }
  });

  describe('GET /api/home-feed', () => {
    it('should return home feed for authenticated user', async () => {
      const response = await request(app)
        .get('/api/home-feed')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should allow unauthenticated access to home feed', async () => {
      const response = await request(app)
        .get('/api/home-feed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/home-feed')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/feed', () => {
    it('should return public feed without authentication', async () => {
      const response = await request(app)
        .get('/api/feed')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/feed')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should support region filtering', async () => {
      const response = await request(app)
        .get('/api/feed')
        .query({ page: 1, limit: 10, region: 'Lagos' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/posts/:postId', () => {
    it('should return single post details', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testPost.id);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should include engagement counts', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('likesCount');
      expect(response.body.data).toHaveProperty('commentsCount');
      expect(response.body.data).toHaveProperty('sharesCount');
    });
  });

  describe('GET /api/search', () => {
    it('should search posts by query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ page: 1, limit: 10 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query is required');
    });

    it('should support alternative "q" parameter', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/posts', () => {
    it('should create post with text content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', 'This is a new test post')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('This is a new test post');

      // Verify post was created in database
      const post = await Post.findByPk(response.body.data.id);
      expect(post).toBeTruthy();
      expect(post.content).toBe('This is a new test post');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .field('content', 'Test post')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token not found');
    });

    it('should require content field', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Content is required');
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', '   ')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Content is required');
    });

    it('should block buyers from creating posts', async () => {
      // Create buyer token
      const buyerSessionId = require('crypto').randomBytes(32).toString('hex');
      const buyerToken = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          role: testUser.accountType,
          sessionId: buyerSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${testUser.id}:${buyerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('content', 'Buyer trying to post')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Buyers cannot create posts');
    });

    it('should validate reach_limit range', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', 'Test post')
        .field('reach_limit', '100') // Invalid: > 50
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Reach limit must be a number between 1 and 50');
    });

    it('should validate category_id format', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', 'Test post')
        .field('category_id', 'invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Category ID must be a valid UUID');
    });
  });

  describe('PUT /api/posts/:postId', () => {
    it('should update post content', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', 'Updated post content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated post content');

      // Verify post was updated in database
      const updatedPost = await Post.findByPk(testPost.id);
      expect(updatedPost.content).toBe('Updated post content');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .field('content', 'Updated content')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .field('content', 'Updated content')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow post owner to update', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      const otherUser = await UserTable.create({
        fullName: 'Other User',
        email: `other${Date.now()}@test.com`,
        password: hashedPassword,
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      const otherSessionId = require('crypto').randomBytes(32).toString('hex');
      const otherToken = jwt.sign(
        {
          id: otherUser.id,
          email: otherUser.email,
          role: otherUser.accountType,
          sessionId: otherSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${otherUser.id}:${otherSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .put(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .field('content', 'Unauthorized update')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/posts/:postId', () => {
    it('should delete own post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify post was soft deleted (status set to inactive)
      const deletedPost = await Post.findByPk(testPost.id);
      expect(deletedPost).toBeTruthy();
      expect(deletedPost.status).toBe('inactive');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow post owner to delete', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      const otherUser = await UserTable.create({
        fullName: 'Other User',
        email: `other${Date.now()}@test.com`,
        password: hashedPassword,
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      const otherSessionId = require('crypto').randomBytes(32).toString('hex');
      const otherToken = jwt.sign(
        {
          id: otherUser.id,
          email: otherUser.email,
          role: otherUser.accountType,
          sessionId: otherSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${otherUser.id}:${otherSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .delete(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/posts/:postId/like', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isLiked', true);
      expect(response.body.message).toContain('liked successfully');

      // Verify like was created
      const like = await PostLike.findOne({
        where: { postId: testPost.id, userId: testSeller.id }
      });
      expect(like).toBeTruthy();
    });

    it('should unlike a post when already liked', async () => {
      // First like the post
      await PostLike.create({ postId: testPost.id, userId: testSeller.id });
      await testPost.increment('likesCount');

      const response = await request(app)
        .post(`/api/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isLiked', false);
      expect(response.body.message).toContain('unliked successfully');

      // Verify like was removed
      const like = await PostLike.findOne({
        where: { postId: testPost.id, userId: testSeller.id }
      });
      expect(like).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/posts/${fakeId}/like`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/posts/:postId/save', () => {
    it('should save a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/save`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isSaved', true);
      expect(response.body.message).toContain('saved successfully');

      // Verify save was created
      const savedPost = await SavedPost.findOne({
        where: { postId: testPost.id, userId: testSeller.id }
      });
      expect(savedPost).toBeTruthy();
    });

    it('should unsave a post when already saved', async () => {
      // First save the post
      await SavedPost.create({ postId: testPost.id, userId: testSeller.id });
      await testPost.increment('savedCount');

      const response = await request(app)
        .post(`/api/posts/${testPost.id}/save`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isSaved', false);
      expect(response.body.message).toContain('unsaved successfully');

      // Verify save was removed
      const savedPost = await SavedPost.findOne({
        where: { postId: testPost.id, userId: testSeller.id }
      });
      expect(savedPost).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/save`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/posts/${fakeId}/save`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/posts/:postId/share', () => {
    it('should share a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isShared', true);
      expect(response.body.data).toHaveProperty('sharesCount');
      expect(response.body.message).toContain('shared successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/share`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/posts/${fakeId}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/saved-posts', () => {
    beforeEach(async () => {
      // Create a saved post
      await SavedPost.create({
        postId: testPost.id,
        userId: testSeller.id,
        collectionName: 'General'
      });
    });

    it('should return saved posts for authenticated user', async () => {
      const response = await request(app)
        .get('/api/saved-posts')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('savedPosts');
      expect(Array.isArray(response.body.data.savedPosts)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/saved-posts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/saved-posts')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });
  });

  describe('DELETE /api/saved-posts/:savedItemId', () => {
    let savedPost;

    beforeEach(async () => {
      savedPost = await SavedPost.create({
        postId: testPost.id,
        userId: testSeller.id,
        collectionName: 'General'
      });
    });

    it('should delete saved post', async () => {
      const response = await request(app)
        .delete(`/api/saved-posts/${savedPost.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed successfully');

      // Verify saved post was deleted
      const deleted = await SavedPost.findByPk(savedPost.id);
      expect(deleted).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/saved-posts/${savedPost.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent saved post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .delete(`/api/saved-posts/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow owner to delete saved post', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      const otherUser = await UserTable.create({
        fullName: 'Other User',
        email: `other${Date.now()}@test.com`,
        password: hashedPassword,
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      const otherSessionId = require('crypto').randomBytes(32).toString('hex');
      const otherToken = jwt.sign(
        {
          id: otherUser.id,
          email: otherUser.email,
          role: otherUser.accountType,
          sessionId: otherSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${otherUser.id}:${otherSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .delete(`/api/saved-posts/${savedPost.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/users/:userId/posts', () => {
    it('should return user posts', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}/posts`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should return empty array for non-existent user', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .get(`/api/users/${fakeId}/posts`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toEqual([]);
      expect(response.body.data.totalPosts).toBe(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}/posts`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data).toHaveProperty('currentPage', 1);
      expect(response.body.data).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/users/:userId/liked-posts', () => {
    beforeEach(async () => {
      // Create a like
      await PostLike.create({
        postId: testPost.id,
        userId: testSeller.id
      });
    });

    it('should return user liked posts', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}/liked-posts`)
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}/liked-posts`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testSeller.id}/liked-posts`)
        .set('Authorization', `Bearer ${testToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });
  });
});

