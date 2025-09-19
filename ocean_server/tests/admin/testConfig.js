/**
 * Admin Test Configuration
 * 
 * This file contains configuration settings for the admin test suite.
 * It includes test data, environment settings, and test utilities.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TestConfig = {
  // Test Environment Settings
  environment: {
    NODE_ENV: 'test',
    DB_NAME: 'ocean_app_test_db',
    JWT_SECRET: 'test_jwt_secret_key',
    BCRYPT_ROUNDS: 10, // Faster for tests
    RATE_LIMIT_DISABLED: true // Disable rate limiting in tests
  },

  // Test Data Templates
  testData: {
    admin: {
      fullName: 'Test Admin',
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      emailVerified: true
    },

    user: {
      fullName: 'Test User',
      username: 'testuser',
      email: 'user@test.com',
      password: 'user123',
      role: 'user',
      isActive: true,
      emailVerified: true
    },

    seller: {
      businessName: 'Test Business',
      contactEmail: 'seller@test.com',
      businessAddress: '123 Test Street, Test City, TC 12345',
      businessPhone: '+1234567890',
      businessType: 'retail',
      verificationStatus: 'pending',
      isActive: true,
      country: 'US',
      state: 'CA',
      city: 'Test City'
    },

    category: {
      name: 'Test Category',
      description: 'Test category for admin tests',
      icon: 'test-icon',
      color: '#007bff',
      isActive: true
    },

    post: {
      content: 'This is a test post content for admin testing purposes.',
      title: 'Test Post Title',
      status: 'published',
      contentType: 'text',
      isPublic: true
    },

    product: {
      title: 'Test Product',
      description: 'This is a test product description for admin testing.',
      price: 99.99,
      currency: 'USD',
      status: 'active',
      condition: 'new',
      stock: 10,
      sku: 'TEST-001'
    }
  },

  // Test Scenarios
  scenarios: {
    // User Management Scenarios
    userManagement: {
      suspendUser: {
        reason: 'Test suspension for admin testing',
        duration: 7
      },
      banUser: {
        reason: 'Test ban for admin testing',
        duration: 30
      },
      activateUser: {
        reason: 'Test activation for admin testing'
      }
    },

    // Seller Management Scenarios
    sellerManagement: {
      approveSeller: {
        notes: 'Test approval - all documents verified',
        verificationNotes: 'Business license and tax ID verified'
      },
      rejectSeller: {
        reason: 'Incomplete documentation',
        notes: 'Please resubmit with complete business license and tax ID'
      },
      suspendSeller: {
        reason: 'Policy violation',
        duration: 14,
        notes: 'Test suspension for policy violation'
      }
    },

    // Content Management Scenarios
    contentManagement: {
      approvePost: {
        approvalNotes: 'Test post approved by admin',
        adminAction: 'approved'
      },
      rejectPost: {
        rejectionReason: 'Inappropriate content',
        rejectionNotes: 'Content violates community guidelines',
        adminAction: 'rejected'
      },
      archivePost: {
        reason: 'Test archiving',
        adminNotes: 'Post archived for testing purposes'
      },
      deletePost: {
        reason: 'Test deletion',
        permanent: false,
        adminNotes: 'Post deleted for testing purposes'
      }
    },

    // System Administration Scenarios
    systemAdmin: {
      updateConfig: {
        security: {
          bcryptRounds: 12,
          rateLimitMax: 150
        },
        upload: {
          maxFileSize: 10485760 // 10MB
        }
      },
      createBackup: {
        type: 'full',
        description: 'Test backup creation',
        compression: true
      },
      clearCache: {
        cacheType: 'all',
        reason: 'Test cache clearing'
      }
    },

    // Security & Moderation Scenarios
    securityModeration: {
      blockUser: {
        reason: 'Suspicious activity detected',
        duration: 30,
        blockType: 'account'
      },
      resolveFlag: {
        resolution: 'dismissed',
        resolutionNotes: 'Flag reviewed and dismissed as invalid'
      },
      approveContent: {
        approvalNotes: 'Content reviewed and approved',
        adminAction: 'approved'
      },
      rejectContent: {
        rejectionReason: 'Policy violation',
        rejectionNotes: 'Content violates platform policies'
      }
    }
  },

  // Performance Test Thresholds
  performance: {
    thresholds: {
      dashboardLoadTime: 2000, // 2 seconds
      userListLoadTime: 1500,  // 1.5 seconds
      analyticsLoadTime: 3000, // 3 seconds
      reportGenerationTime: 5000, // 5 seconds
      bulkOperationTime: 10000 // 10 seconds
    },
    concurrency: {
      maxConcurrentUsers: 10,
      maxConcurrentRequests: 50
    }
  },

  // Security Test Cases
  security: {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' UNION SELECT * FROM users --"
    ],
    xssPayloads: [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>"
    ],
    invalidTokens: [
      'invalid_token',
      'expired_token',
      'malformed_token',
      'token_without_signature'
    ]
  },

  // Test Utilities
  utilities: {
    // Generate test JWT token
    generateToken: (payload, secret = TestConfig.environment.JWT_SECRET) => {
      return jwt.sign(payload, secret, { expiresIn: '1h' });
    },

    // Generate test password hash
    hashPassword: async (password) => {
      return await bcrypt.hash(password, TestConfig.environment.BCRYPT_ROUNDS);
    },

    // Generate test data with overrides
    generateTestData: (template, overrides = {}) => {
      return { ...template, ...overrides };
    },

    // Generate test user with specific role
    generateTestUser: (role = 'user', overrides = {}) => {
      const baseUser = { ...TestConfig.testData.user };
      if (role === 'admin') {
        Object.assign(baseUser, TestConfig.testData.admin);
      }
      return TestConfig.utilities.generateTestData(baseUser, overrides);
    },

    // Generate test seller with specific status
    generateTestSeller: (status = 'pending', overrides = {}) => {
      const baseSeller = { ...TestConfig.testData.seller };
      baseSeller.verificationStatus = status;
      return TestConfig.utilities.generateTestData(baseSeller, overrides);
    },

    // Generate test post with specific status
    generateTestPost: (status = 'published', overrides = {}) => {
      const basePost = { ...TestConfig.testData.post };
      basePost.status = status;
      return TestConfig.utilities.generateTestData(basePost, overrides);
    },

    // Generate test product with specific status
    generateTestProduct: (status = 'active', overrides = {}) => {
      const baseProduct = { ...TestConfig.testData.product };
      baseProduct.status = status;
      return TestConfig.utilities.generateTestData(baseProduct, overrides);
    },

    // Generate test category
    generateTestCategory: (overrides = {}) => {
      return TestConfig.utilities.generateTestData(TestConfig.testData.category, overrides);
    },

    // Generate bulk test data
    generateBulkData: (template, count = 10, overrides = {}) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        const item = TestConfig.utilities.generateTestData(template, {
          ...overrides,
          id: `test-${template.constructor.name.toLowerCase()}-${i}`,
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
      return TestConfig.utilities.generateTestData(template, overrides);
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
    }
  },

  // Test Database Configuration
  database: {
    // Test database connection settings
    connection: {
      host: 'localhost',
      port: 3306,
      database: 'ocean_app_test_db',
      username: 'test_user',
      password: 'test_password',
      dialect: 'mysql',
      logging: false, // Disable SQL logging in tests
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },

    // Test data cleanup settings
    cleanup: {
      // Tables to clean up after tests
      tables: [
        'users',
        'sellers',
        'posts',
        'products',
        'categories',
        'comments',
        'notifications',
        'admin_actions'
      ],
      // Whether to truncate or delete
      method: 'truncate', // 'truncate' or 'delete'
      // Whether to reset auto-increment
      resetAutoIncrement: true
    }
  },

  // Test Reporting Configuration
  reporting: {
    // Test report formats
    formats: ['json', 'html', 'xml'],
    
    // Test report types
    types: [
      'user_activity',
      'seller_performance',
      'product_analytics',
      'financial_summary',
      'system_health'
    ],

    // Test report periods
    periods: ['7d', '30d', '90d'],

    // Test report options
    options: {
      includeCharts: true,
      includeDetails: true,
      includeSummary: true,
      format: 'json'
    }
  },

  // Test Timeouts
  timeouts: {
    // Test execution timeouts
    testTimeout: 30000, // 30 seconds
    setupTimeout: 60000, // 60 seconds
    cleanupTimeout: 30000, // 30 seconds
    
    // API request timeouts
    requestTimeout: 10000, // 10 seconds
    bulkOperationTimeout: 30000, // 30 seconds
    
    // Database operation timeouts
    dbTimeout: 15000, // 15 seconds
    migrationTimeout: 120000 // 2 minutes
  },

  // Test Coverage Configuration
  coverage: {
    // Minimum coverage thresholds
    thresholds: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    
    // Files to include in coverage
    include: [
      'src/controllers/adminController.js',
      'src/controllers/sellerManagementController.js',
      'src/controllers/userManagementController.js',
      'src/controllers/adminAnalyticsController.js',
      'src/controllers/systemAdminController.js',
      'src/controllers/securityModerationController.js',
      'src/controllers/contentAdminController.js'
    ],
    
    // Files to exclude from coverage
    exclude: [
      'src/controllers/index.js',
      'src/routes/adminRoutes.js',
      'tests/**/*',
      'docs/**/*'
    ]
  }
};

module.exports = TestConfig;
