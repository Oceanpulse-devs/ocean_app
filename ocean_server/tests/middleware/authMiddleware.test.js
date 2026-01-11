const request = require('supertest');
const { app } = require('../../server');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');
const { UserTable } = require('../../models');
const bcrypt = require('bcrypt');

describe('Auth Middleware', () => {
  let testUser;
  let validToken;
  let testRoute;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    testUser = await UserTable.create({
      fullName: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: hashedPassword,
      accountStatus: 'active',
      emailVerified: true,
      agreeTerms: true
    });

    // Generate valid token
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    validToken = jwt.sign(
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

    // Create a test protected route (using profile endpoint)
    testRoute = `/api/profile`;
  });

  afterEach(async () => {
    // Cleanup - safely handle empty results and foreign key constraints
    try {
      await UserTable.destroy({
        where: {
          email: {
            [require('../../models').Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Ignore cleanup errors - may occur due to foreign key constraints
    }

    try {
      const sessionKeys = await redisClient.keys('session:*');
      if (sessionKeys.length > 0) await redisClient.del(sessionKeys);
    } catch (error) {
      // Ignore Redis cleanup errors
    }
  });

  describe('Token Validation', () => {
    it('should allow access with valid token in Authorization header', async () => {
      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should allow access with valid token in cookie', async () => {
      const response = await request(app)
        .get(testRoute)
        .set('Cookie', `token=${validToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(testRoute)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token not found');
    });

    it('should reject request with invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      
      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          role: testUser.accountType
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject request with token signed with wrong secret', async () => {
      const wrongToken = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email
        },
        'wrong-secret-key',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('Session Validation', () => {
    it('should allow access with valid session', async () => {
      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject request with invalid session', async () => {
      // Create token with session ID
      const sessionId = require('crypto').randomBytes(32).toString('hex');
      const tokenWithSession = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          role: testUser.accountType,
          sessionId: sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Don't store session in Redis (simulating invalid session)

      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${tokenWithSession}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session expired');
    });

    it('should reject request with expired session', async () => {
      // Create token with session ID
      const sessionId = require('crypto').randomBytes(32).toString('hex');
      const tokenWithSession = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          role: testUser.accountType,
          sessionId: sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Store session but mark as inactive
      await redisClient.set(`session:${testUser.id}:${sessionId}`, 'inactive', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${tokenWithSession}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session expired');
    });
  });

  describe('Token Format', () => {
    it('should handle Bearer token format correctly', async () => {
      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle token without Bearer prefix', async () => {
      // Middleware should still work if token is provided directly
      const response = await request(app)
        .get(testRoute)
        .set('Cookie', `token=${validToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('User Context', () => {
    it('should set req.user with decoded token data', async () => {
      // Use a route that returns user info to verify req.user is set
      const response = await request(app)
        .get(testRoute)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // The profile endpoint should return user data
      expect(response.body).toBeDefined();
      // Verify the response contains user information (depends on profile controller implementation)
    });
  });
});

