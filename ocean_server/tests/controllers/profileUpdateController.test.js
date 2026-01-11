const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { UserTable } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

describe('Profile Update Controller', () => {
  let testUser;
  let testToken;

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data - safely handle foreign key constraints
    try {
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

    // Create test user
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
      bio: 'Original bio'
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
    await redisClient.set(`session:${testUser.id}:${sessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
  });

  afterEach(async () => {
    // Cleanup after each test
    try {
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

  describe('PUT /api/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'Updated Name',
        bio: 'Updated bio',
        location: 'Abuja, Nigeria',
        website: 'https://example.com'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body).toHaveProperty('profileInfo');
      expect(response.body.profileInfo).toHaveProperty('fullName', 'Updated Name');
      expect(response.body.profileInfo).toHaveProperty('bio', 'Updated bio');
      expect(response.body.profileInfo).toHaveProperty('location', 'Abuja, Nigeria');
      expect(response.body.profileInfo).toHaveProperty('website', 'https://example.com');
    });

    it('should update only provided fields', async () => {
      const updateData = {
        bio: 'New bio only'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('bio', 'New bio only');
      expect(response.body.profileInfo).toHaveProperty('fullName', testUser.fullName); // Should remain unchanged
    });

    it('should update username if provided', async () => {
      const updateData = {
        username: 'newusername'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('username', 'newusername');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({ fullName: 'Test' })
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should return default values for optional fields', async () => {
      const updateData = {
        fullName: 'Test User'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('profilePicture');
      expect(response.body.profileInfo).toHaveProperty('coverPicture');
      expect(response.body.profileInfo).toHaveProperty('bio');
      expect(response.body.profileInfo).toHaveProperty('location');
    });

    it('should handle empty string values', async () => {
      const updateData = {
        bio: '',
        location: ''
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('bio');
      expect(response.body.profileInfo).toHaveProperty('location');
    });

    it('should return updated profile info with correct structure', async () => {
      const updateData = {
        fullName: 'Test Name',
        bio: 'Test bio',
        location: 'Test location'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('id', testUser.id);
      expect(response.body.profileInfo).toHaveProperty('fullName');
      expect(response.body.profileInfo).toHaveProperty('email');
      expect(response.body.profileInfo).toHaveProperty('username');
      expect(response.body.profileInfo).toHaveProperty('role');
      expect(response.body.profileInfo).toHaveProperty('profilePicture');
      expect(response.body.profileInfo).toHaveProperty('coverPicture');
      expect(response.body.profileInfo).toHaveProperty('bio');
      expect(response.body.profileInfo).toHaveProperty('location');
      expect(response.body.profileInfo).toHaveProperty('website');
    });

    it('should persist changes to database', async () => {
      const updateData = {
        fullName: 'Persisted Name',
        bio: 'Persisted bio'
      };

      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      // Verify in database
      const updatedUser = await UserTable.findByPk(testUser.id);
      expect(updatedUser.fullName).toBe('Persisted Name');
      expect(updatedUser.bio).toBe('Persisted bio');
    });

    it('should handle profile picture update with base64 data', async () => {
      // Note: This test assumes Cloudinary is mocked or configured for testing
      const updateData = {
        profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('profilePicture');
      // The profile picture should be updated (either to a URL or remain as default)
    });

    it('should handle cover picture update with base64 data', async () => {
      const updateData = {
        coverPicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profileInfo).toHaveProperty('coverPicture');
    });
  });
});

