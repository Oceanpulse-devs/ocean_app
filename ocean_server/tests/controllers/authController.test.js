const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { UserTable } = require('../../models');
const redisClient = require('../../src/config/redisdb');
const bcrypt = require('bcrypt');

describe('Authentication Controller', () => {
  let testUser;
  let testUserData;

  // Clean up before each test
  beforeEach(async () => {
    // Clean up test users - safely handle foreign key constraints
    try {
      await UserTable.destroy({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Ignore cleanup errors - may occur due to foreign key constraints
    }

    // Clean up Redis test data
    try {
      const keys = await redisClient.keys('reset:*');
      const lockoutKeys = await redisClient.keys('lockout:*');
      const sessionKeys = await redisClient.keys('session:*');
      const verificationKeys = await redisClient.keys('email_verification:*');
      
      if (keys.length > 0) await redisClient.del(keys);
      if (lockoutKeys.length > 0) await redisClient.del(lockoutKeys);
      if (sessionKeys.length > 0) await redisClient.del(sessionKeys);
      if (verificationKeys.length > 0) await redisClient.del(verificationKeys);
    } catch (error) {
      // Ignore Redis cleanup errors
    }

    // Create test user data
    testUserData = {
      fullName: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'Test1234',
      confirmPassword: 'Test1234',
      agreeTerms: true
    };
  });

  afterEach(async () => {
    // Cleanup after each test - safely handle foreign key constraints
    try {
      await UserTable.destroy({
        where: {
          email: {
            [db.Sequelize.Op.like]: '%@test.com'
          }
        }
      });
    } catch (error) {
      // Ignore cleanup errors - may occur due to foreign key constraints
    }
  });

  describe('POST /api/signup', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send(testUserData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(testUserData.email.toLowerCase());
      expect(response.body.data.user.emailVerified).toBe(false);
      expect(response.body.requiresVerification).toBe(true);

      // Verify user was created in database
      const user = await UserTable.findOne({ where: { email: testUserData.email.toLowerCase() } });
      expect(user).toBeTruthy();
      expect(user.fullName).toBe(testUserData.fullName.trim());
    });

    it('should reject signup with missing required fields', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          fullName: testUserData.fullName,
          email: testUserData.email
          // Missing password and confirmPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required fields');
    });

    it('should reject signup with invalid email', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          ...testUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should reject signup with weak password', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          ...testUserData,
          password: 'weak',
          confirmPassword: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should reject signup when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          ...testUserData,
          password: 'Test1234',
          confirmPassword: 'Different1234'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('do not match');
    });

    it('should reject signup when user already exists', async () => {
      // Create user first
      await request(app)
        .post('/api/signup')
        .send(testUserData)
        .expect(201);

      // Try to create again
      const response = await request(app)
        .post('/api/signup')
        .send(testUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject signup without agreeing to terms', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          ...testUserData,
          agreeTerms: false
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('terms and conditions');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a verified active user for login tests
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: hashedPassword,
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'Test1234'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      
      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('token'))).toBe(true);
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          password: 'Test1234'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and password are required');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'invalid-email',
          password: 'Test1234'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test1234'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login for unverified email', async () => {
      const unverifiedUser = await UserTable.create({
        fullName: 'Unverified User',
        email: `unverified${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'pending',
        emailVerified: false,
        agreeTerms: true
      });

      const response = await request(app)
        .post('/api/login')
        .send({
          email: unverifiedUser.email,
          password: 'Test1234'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('verify your email');
      expect(response.body.requiresVerification).toBe(true);
    });

    it('should lock account after 5 failed login attempts', async () => {
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123'
          });
      }

      // 6th attempt should be locked
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('locked');
    });
  });

  describe('POST /api/forgot-password', () => {
    beforeEach(async () => {
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });
    });

    it('should send reset code for valid email', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');

      // Verify reset code stored in Redis
      const resetCode = await redisClient.get(`reset:${testUser.email.toLowerCase()}`);
      expect(resetCode).toBeTruthy();
      expect(resetCode.length).toBe(5); // 5-digit code
    });

    it('should reject request with missing email', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');
    });

    it('should reject request with invalid email format', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({
          email: 'nonexistent@test.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No user found');
    });

    it('should reject request for inactive account', async () => {
      const inactiveUser = await UserTable.create({
        fullName: 'Inactive User',
        email: `inactive${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'suspended',
        emailVerified: true,
        agreeTerms: true
      });

      const response = await request(app)
        .post('/api/forgot-password')
        .send({
          email: inactiveUser.email
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not active');
    });
  });

  describe('POST /api/verify-resetCode', () => {
    beforeEach(async () => {
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      // Set reset code in Redis
      await redisClient.set(`reset:${testUser.email.toLowerCase()}`, '12345', { EX: 600 });
    });

    it('should verify valid reset code', async () => {
      const response = await request(app)
        .post('/api/verify-resetCode')
        .send({
          email: testUser.email,
          resetCode: '12345'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP verified');
    });

    it('should accept "otp" field name as well', async () => {
      const response = await request(app)
        .post('/api/verify-resetCode')
        .send({
          email: testUser.email,
          otp: '12345'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP verified');
    });

    it('should reject invalid reset code', async () => {
      const response = await request(app)
        .post('/api/verify-resetCode')
        .send({
          email: testUser.email,
          resetCode: '99999'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid reset code');
    });

    it('should reject expired reset code', async () => {
      // Wait for code to expire (or manually delete)
      await redisClient.del(`reset:${testUser.email.toLowerCase()}`);

      const response = await request(app)
        .post('/api/verify-resetCode')
        .send({
          email: testUser.email,
          resetCode: '12345'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should reject invalid reset code format', async () => {
      const response = await request(app)
        .post('/api/verify-resetCode')
        .send({
          email: testUser.email,
          resetCode: '123' // Not 5 digits
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('5 digits');
    });
  });

  describe('POST /api/reset-password', () => {
    beforeEach(async () => {
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: await bcrypt.hash('OldPassword123', 10),
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      // Set reset code in Redis
      await redisClient.set(`reset:${testUser.email.toLowerCase()}`, '12345', { EX: 600 });
    });

    it('should reset password successfully', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          email: testUser.email,
          resetCode: '12345',
          newPassword: 'NewPassword123',
          confirmNewPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');

      // Verify password was changed
      const updatedUser = await UserTable.findByPk(testUser.id);
      const passwordMatch = await bcrypt.compare('NewPassword123', updatedUser.password);
      expect(passwordMatch).toBe(true);

      // Verify reset code was deleted
      const resetCode = await redisClient.get(`reset:${testUser.email.toLowerCase()}`);
      expect(resetCode).toBeNull();
    });

    it('should reject when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          email: testUser.email,
          resetCode: '12345',
          newPassword: 'NewPassword123',
          confirmNewPassword: 'DifferentPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('do not match');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          email: testUser.email,
          resetCode: '12345',
          newPassword: 'weak',
          confirmNewPassword: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should reject invalid reset code', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          email: testUser.email,
          resetCode: '99999',
          newPassword: 'NewPassword123',
          confirmNewPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid reset code');
    });
  });

  describe('POST /api/verify-email', () => {
    beforeEach(async () => {
      const emailVerificationToken = 'test-verification-token';
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'pending',
        emailVerified: false,
        emailVerificationToken: emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        agreeTerms: true
      });

      // Cache token in Redis
      await redisClient.setEx(
        `email_verification:${emailVerificationToken}`,
        86400,
        JSON.stringify({
          userId: testUser.id,
          email: testUser.email,
          fullName: testUser.fullName
        })
      );
    });

    it('should verify email successfully', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({
          token: 'test-verification-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.user.emailVerified).toBe(true);
      expect(response.body.user.accountStatus).toBe('active');

      // Verify user was updated in database
      const updatedUser = await UserTable.findByPk(testUser.id);
      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.accountStatus).toBe('active');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token is required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({
          token: 'invalid-token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject already verified email', async () => {
      // Verify email first
      await testUser.update({
        emailVerified: true,
        accountStatus: 'active'
      });

      const response = await request(app)
        .post('/api/verify-email')
        .send({
          token: 'test-verification-token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already verified');
    });
  });

  describe('POST /api/resend-verification', () => {
    beforeEach(async () => {
      testUser = await UserTable.create({
        fullName: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountStatus: 'pending',
        emailVerified: false,
        agreeTerms: true
      });
    });

    it('should resend verification email successfully', async () => {
      const response = await request(app)
        .post('/api/resend-verification')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');
      expect(response.body.data).toHaveProperty('resendCount');
      expect(response.body.data).toHaveProperty('remainingAttempts');

      // Verify new token was created
      const updatedUser = await UserTable.findByPk(testUser.id);
      expect(updatedUser.emailVerificationToken).toBeTruthy();
    });

    it('should reject for already verified email', async () => {
      await testUser.update({
        emailVerified: true
      });

      const response = await request(app)
        .post('/api/resend-verification')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already verified');
    });

    it('should reject for non-existent email', async () => {
      const response = await request(app)
        .post('/api/resend-verification')
        .send({
          email: 'nonexistent@test.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should enforce rate limiting after 5 attempts', async () => {
      // Make 5 resend attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/resend-verification')
          .send({
            email: testUser.email
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/resend-verification')
        .send({
          email: testUser.email
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many resend attempts');
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
      
      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        expect(cookies.some(cookie => cookie.includes('token=;'))).toBe(true);
      }
    });
  });
});

