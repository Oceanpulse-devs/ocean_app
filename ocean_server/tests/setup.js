/**
 * Test Setup File
 * 
 * This file sets up the test environment before running tests.
 * It configures the database, environment variables, and test utilities.
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'ocean_app_test_db';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.BCRYPT_ROUNDS = '10';

// Global test timeout
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Generate test JWT token
  generateToken: (payload) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  },

  // Generate test password hash
  hashPassword: async (password) => {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
  },

  // Generate test data
  generateTestData: (template, overrides = {}) => {
    return { ...template, ...overrides };
  },

  // Generate test user
  generateTestUser: (role = 'user', overrides = {}) => {
    const baseUser = {
      fullName: 'Test User',
      username: 'testuser',
      email: 'user@test.com',
      password: 'user123',
      role: role,
      isActive: true,
      emailVerified: true
    };
    return global.testUtils.generateTestData(baseUser, overrides);
  },

  // Generate test admin
  generateTestAdmin: (overrides = {}) => {
    return global.testUtils.generateTestUser('admin', {
      fullName: 'Test Admin',
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'admin123',
      ...overrides
    });
  },

  // Generate test seller
  generateTestSeller: (status = 'pending', overrides = {}) => {
    const baseSeller = {
      businessName: 'Test Business',
      contactEmail: 'seller@test.com',
      businessAddress: '123 Test Street',
      verificationStatus: status,
      isActive: true,
      country: 'US',
      state: 'CA',
      city: 'Test City'
    };
    return global.testUtils.generateTestData(baseSeller, overrides);
  },

  // Generate test post
  generateTestPost: (status = 'published', overrides = {}) => {
    const basePost = {
      content: 'Test post content',
      title: 'Test Post',
      status: status,
      contentType: 'text',
      isPublic: true
    };
    return global.testUtils.generateTestData(basePost, overrides);
  },

  // Generate test product
  generateTestProduct: (status = 'active', overrides = {}) => {
    const baseProduct = {
      title: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      status: status,
      condition: 'new',
      stock: 10
    };
    return global.testUtils.generateTestData(baseProduct, overrides);
  },

  // Generate test category
  generateTestCategory: (overrides = {}) => {
    const baseCategory = {
      name: 'Test Category',
      description: 'Test category description',
      isActive: true
    };
    return global.testUtils.generateTestData(baseCategory, overrides);
  },

  // Generate bulk test data
  generateBulkData: (template, count = 10, overrides = {}) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const item = global.testUtils.generateTestData(template, {
        ...overrides,
        name: `${template.name || template.title || template.fullName} ${i}`,
        email: `test${i}@example.com`,
        username: `testuser${i}`
      });
      data.push(item);
    }
    return data;
  },

  // Generate test query parameters
  generateQueryParams: (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 20,
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    };
    return { ...defaultParams, ...params };
  },

  // Generate test request body
  generateRequestBody: (template, overrides = {}) => {
    return global.testUtils.generateTestData(template, overrides);
  },

  // Generate test response expectation
  generateResponseExpectation: (success = true, data = null, message = null) => {
    const expectation = { success };
    if (data) expectation.data = data;
    if (message) expectation.message = message;
    return expectation;
  },

  // Generate test error expectation
  generateErrorExpectation: (statusCode = 400, message = 'Test error') => {
    return {
      status: statusCode,
      body: {
        success: false,
        message: message
      }
    };
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random email
  randomEmail: () => {
    return `test${global.testUtils.randomString(8)}@example.com`;
  },

  // Generate random username
  randomUsername: () => {
    return `testuser${global.testUtils.randomString(8)}`;
  }
};

// Global test constants
global.testConstants = {
  // Test timeouts
  timeouts: {
    test: 30000,
    setup: 60000,
    cleanup: 30000,
    request: 10000,
    db: 15000
  },

  // Test data limits
  limits: {
    maxUsers: 100,
    maxSellers: 50,
    maxPosts: 200,
    maxProducts: 150,
    maxCategories: 20
  },

  // Test performance thresholds
  performance: {
    dashboardLoadTime: 2000,
    userListLoadTime: 1500,
    analyticsLoadTime: 3000,
    reportGenerationTime: 5000,
    bulkOperationTime: 10000
  },

  // Test security payloads
  security: {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ],
    xssPayloads: [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')"
    ]
  }
};

// Global test database setup
global.testDb = {
  // Database connection for tests
  connection: null,

  // Initialize test database
  init: async () => {
    try {
      global.testDb.connection = new Sequelize({
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'ocean_app_test_db',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        logging: false, // Disable SQL logging in tests
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });

      await global.testDb.connection.authenticate();
      console.log('✅ Test database connected successfully');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
      throw error;
    }
  },

  // Close test database connection
  close: async () => {
    if (global.testDb.connection) {
      await global.testDb.connection.close();
      console.log('✅ Test database connection closed');
    }
  },

  // Clean up test data
  cleanup: async () => {
    if (global.testDb.connection) {
      try {
        // Clean up test data in reverse order of dependencies
        const tables = [
          'notifications',
          'comments',
          'posts',
          'products',
          'categories',
          'sellers',
          'users'
        ];

        for (const table of tables) {
          await global.testDb.connection.query(`DELETE FROM ${table} WHERE email LIKE '%@test.com' OR email LIKE '%@example.com'`);
        }

        console.log('✅ Test data cleaned up');
      } catch (error) {
        console.error('❌ Test data cleanup failed:', error);
        throw error;
      }
    }
  }
};

// Global test environment setup
beforeAll(async () => {
  try {
    console.log('🔧 Setting up test environment...');
    
    // Initialize test database
    await global.testDb.init();
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
});

// Global test environment cleanup
afterAll(async () => {
  try {
    console.log('🧹 Cleaning up test environment...');
    
    // Clean up test data
    await global.testDb.cleanup();
    
    // Close database connection
    await global.testDb.close();
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    throw error;
  }
});

// Global test cleanup after each test
afterEach(async () => {
  try {
    // Clean up test data after each test
    await global.testDb.cleanup();
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export test utilities for use in test files
module.exports = {
  testUtils: global.testUtils,
  testConstants: global.testConstants,
  testDb: global.testDb
};
