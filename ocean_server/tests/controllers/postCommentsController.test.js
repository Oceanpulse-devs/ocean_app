const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { Post, PostComment, UserTable } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Post Comments Controller', () => {
  let testUser;
  let testPost;
  let testComment;
  let testToken;

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

    // Create test user
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    testUser = await UserTable.create({
      fullName: 'Test User',
      email: `user${Date.now()}@test.com`,
      password: hashedPassword,
      accountType: 'seller',
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true
    });

    // Create test post
    testPost = await Post.create({
      userId: testUser.id,
      content: 'This is a test post for comments',
      postType: 'general',
      contentType: 'post',
      productName: 'Test Post',
      status: 'active',
      feedVisible: true,
      userRegion: 'Lagos',
      userCountry: 'Nigeria'
    });

    // Create test comment
    testComment = await PostComment.create({
      postId: testPost.id,
      userId: testUser.id,
      content: 'This is a test comment',
      status: 'active'
    });

    // Generate test token
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    testToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        role: testUser.accountType,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session in Redis
    await redisClient.set(`session:${testUser.id}:${sessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
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

  describe('POST /api/posts/:postId/comments', () => {
    it('should create a top-level comment', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: 'This is a new comment' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('This is a new comment');
      expect(response.body.data).toHaveProperty('user');

      // Verify comment was created in database
      const comment = await PostComment.findByPk(response.body.data.id);
      expect(comment).toBeTruthy();
      expect(comment.content).toBe('This is a new comment');
      expect(comment.parentCommentId).toBeNull();
    });

    it('should create a reply comment', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ 
          content: 'This is a reply',
          parentCommentId: testComment.id
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('This is a reply');

      // Verify reply was created
      const reply = await PostComment.findByPk(response.body.data.id);
      expect(reply).toBeTruthy();
      expect(reply.parentCommentId).toBe(testComment.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .send({ content: 'Test comment' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token not found');
    });

    it('should require content field', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Comment content is required');
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Comment content is required');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: 'Test comment' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for invalid parent comment', async () => {
      const fakeParentId = require('crypto').randomUUID();
      const response = await request(app)
        .post(`/api/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ 
          content: 'Reply comment',
          parentCommentId: fakeParentId
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Parent comment not found');
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    beforeEach(async () => {
      // Create multiple comments
      await PostComment.create({
        postId: testPost.id,
        userId: testUser.id,
        content: 'Comment 1',
        status: 'active'
      });
      await PostComment.create({
        postId: testPost.id,
        userId: testUser.id,
        content: 'Comment 2',
        status: 'active'
      });
    });

    it('should return post comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('comments');
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments.length).toBeGreaterThan(0);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return only top-level comments', async () => {
      // Create a reply comment
      await PostComment.create({
        postId: testPost.id,
        userId: testUser.id,
        content: 'This is a reply',
        parentCommentId: testComment.id,
        status: 'active'
      });

      const response = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Should not include reply comments in top-level list
      const replyComment = response.body.data.comments.find(c => c.content === 'This is a reply');
      expect(replyComment).toBeUndefined();
    });

    it('should include user info in comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.comments[0]).toHaveProperty('user');
      expect(response.body.data.comments[0].user).toHaveProperty('id');
      expect(response.body.data.comments[0].user).toHaveProperty('fullName');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}/comments`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('itemsPerPage', 5);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .get(`/api/posts/${fakeId}/comments`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return empty array for post with no comments', async () => {
      // Create a new post without comments
      const newPost = await Post.create({
        userId: testUser.id,
        content: 'Post without comments',
        postType: 'general',
        contentType: 'post',
        status: 'active',
        userRegion: 'Lagos',
        userCountry: 'Nigeria'
      });

      const response = await request(app)
        .get(`/api/posts/${newPost.id}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.comments).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
    });
  });

  describe('PUT /api/comments/:commentId', () => {
    it('should update own comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: 'Updated comment content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated comment content');

      // Verify comment was updated in database
      const updatedComment = await PostComment.findByPk(testComment.id);
      expect(updatedComment.content).toBe('Updated comment content');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .send({ content: 'Updated content' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require content field', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Comment content is required');
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Comment content is required');
    });

    it('should return 404 for non-existent comment', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .put(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: 'Updated content' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow comment owner to update', async () => {
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
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Unauthorized update' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('should delete own comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify comment was deleted (status changed to 'deleted')
      const deletedComment = await PostComment.findByPk(testComment.id);
      expect(deletedComment.status).toBe('deleted');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent comment', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow comment owner to delete', async () => {
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
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
});

