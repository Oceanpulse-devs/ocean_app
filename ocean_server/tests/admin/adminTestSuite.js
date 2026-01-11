const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const jwt = require('jsonwebtoken');

class AdminTestSuite {
  constructor() {
    this.baseUrl = '/api/admin';
    this.adminToken = null;
    this.testAdmin = null;
    this.testUser = null;
    this.testSeller = null;
    this.testPost = null;
    this.testProduct = null;
    this.testCategory = null;
  }

  // Setup test environment
  async setup() {
    try {
      console.log('🔧 Setting up admin test environment...');
      
      // Create test admin user
      this.testAdmin = await this.createTestAdmin();
      this.adminToken = await this.generateAdminToken();
      
      // Create test data
      await this.createTestData();
      
      console.log('✅ Admin test environment setup complete');
    } catch (error) {
      console.error('❌ Admin test setup failed:', error);
      throw error;
    }
  }

  // Cleanup test environment
  async cleanup() {
    try {
      console.log('🧹 Cleaning up admin test environment...');
      
      // Clean up test data
      await this.cleanupTestData();
      
      console.log('✅ Admin test cleanup complete');
    } catch (error) {
      console.error('❌ Admin test cleanup failed:', error);
      throw error;
    }
  }

  // Run all admin tests
  async runAllTests() {
    const results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };

    const testSuites = [
      { name: 'Authentication Tests', tests: this.getAuthenticationTests() },
      { name: 'User Management Tests', tests: this.getUserManagementTests() },
      { name: 'Seller Management Tests', tests: this.getSellerManagementTests() },
      { name: 'Analytics Tests', tests: this.getAnalyticsTests() },
      { name: 'System Administration Tests', tests: this.getSystemAdminTests() },
      { name: 'Security & Moderation Tests', tests: this.getSecurityModerationTests() },
      { name: 'Content Management Tests', tests: this.getContentManagementTests() }
    ];

    for (const suite of testSuites) {
      console.log(`\n🧪 Running ${suite.name}...`);
      
      for (const test of suite.tests) {
        results.total++;
        try {
          await test.function.call(this);
          results.passed++;
          results.tests.push({ name: test.name, status: 'PASSED', suite: suite.name });
          console.log(`  ✅ ${test.name}`);
        } catch (error) {
          results.failed++;
          results.tests.push({ 
            name: test.name, 
            status: 'FAILED', 
            suite: suite.name, 
            error: error.message 
          });
          console.log(`  ❌ ${test.name}: ${error.message}`);
        }
      }
    }

    return results;
  }

  // Authentication Tests
  getAuthenticationTests() {
    return [
      {
        name: 'Admin Login',
        function: async function() {
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: this.testAdmin.email,
              password: 'admin123'
            });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
          if (!response.body.success) {
            throw new Error('Login should succeed');
          }
        }
      },
      {
        name: 'Admin Access to Protected Route',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/dashboard`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Non-Admin Access Denied',
        function: async function() {
          const userToken = await this.generateUserToken();
          const response = await request(app)
            .get(`${this.baseUrl}/dashboard`)
            .set('Authorization', `Bearer ${userToken}`);
          
          if (response.status !== 403) {
            throw new Error(`Expected 403, got ${response.status}`);
          }
        }
      }
    ];
  }

  // User Management Tests
  getUserManagementTests() {
    return [
      {
        name: 'Get All Users',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/users`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
          if (!response.body.success) {
            throw new Error('Should return success');
          }
        }
      },
      {
        name: 'Get User by ID',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/users/${this.testUser.id}`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Suspend User',
        function: async function() {
          const response = await request(app)
            .put(`${this.baseUrl}/users/${this.testUser.id}/suspend`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({ reason: 'Test suspension' });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Activate User',
        function: async function() {
          const response = await request(app)
            .put(`${this.baseUrl}/users/${this.testUser.id}/activate`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // Seller Management Tests
  getSellerManagementTests() {
    return [
      {
        name: 'Get All Sellers',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/sellers`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Pending Sellers',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/sellers/pending`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Approve Seller',
        function: async function() {
          const response = await request(app)
            .put(`${this.baseUrl}/sellers/${this.testSeller.id}/approve`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({ notes: 'Test approval' });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Suspend Seller',
        function: async function() {
          const response = await request(app)
            .put(`${this.baseUrl}/sellers/${this.testSeller.id}/suspend`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({ reason: 'Test suspension' });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // Analytics Tests
  getAnalyticsTests() {
    return [
      {
        name: 'Get Dashboard Data',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/dashboard`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Platform Analytics',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/analytics`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Platform Stats',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/stats`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Generate Reports',
        function: async function() {
          const response = await request(app)
            .post(`${this.baseUrl}/reports`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({
              type: 'user_activity',
              period: '30d',
              format: 'json'
            });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // System Administration Tests
  getSystemAdminTests() {
    return [
      {
        name: 'Get System Configuration',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/config`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get System Health',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/health`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get System Logs',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/logs`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Clear System Cache',
        function: async function() {
          const response = await request(app)
            .post(`${this.baseUrl}/cache/clear`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({ cacheType: 'all' });
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // Security & Moderation Tests
  getSecurityModerationTests() {
    return [
      {
        name: 'Get Security Alerts',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/security/alerts`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Moderation Queue',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/moderation/queue`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Flagged Content',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/moderation/flagged`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Security Statistics',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/security/stats`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // Content Management Tests
  getContentManagementTests() {
    return [
      {
        name: 'Get All Posts',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/content/posts`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get All Products',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/content/products`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get All Categories',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/content/categories`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      },
      {
        name: 'Create Category',
        function: async function() {
          const response = await request(app)
            .post(`${this.baseUrl}/content/categories`)
            .set('Authorization', `Bearer ${this.adminToken}`)
            .send({
              name: 'Test Category',
              description: 'Test category description',
              isActive: true
            });
          
          if (response.status !== 201) {
            throw new Error(`Expected 201, got ${response.status}`);
          }
        }
      },
      {
        name: 'Get Content Statistics',
        function: async function() {
          const response = await request(app)
            .get(`${this.baseUrl}/content/stats`)
            .set('Authorization', `Bearer ${this.adminToken}`);
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
        }
      }
    ];
  }

  // Helper methods
  async createTestAdmin() {
    const admin = await db.UserTable.create({
      fullName: 'Test Admin',
      username: 'testadmin',
      email: 'admin@test.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    return admin;
  }

  async createTestData() {
    // Create test user
    this.testUser = await db.UserTable.create({
      fullName: 'Test User',
      username: 'testuser',
      email: 'user@test.com',
      password: await bcrypt.hash('user123', 12),
      role: 'user',
      isActive: true,
      emailVerified: true
    });

    // Create test seller
    this.testSeller = await db.SellersTable.create({
      businessName: 'Test Business',
      contactEmail: 'seller@test.com',
      businessAddress: '123 Test St',
      verificationStatus: 'pending',
      isActive: true
    });

    // Create test category
    this.testCategory = await db.Category.create({
      name: 'Test Category',
      description: 'Test category for admin tests',
      isActive: true
    });

    // Create test post
    this.testPost = await db.Post.create({
      content: 'Test post content',
      userId: this.testUser.id,
      categoryId: this.testCategory.id,
      status: 'published',
      contentType: 'text'
    });

    // Create test product
    this.testProduct = await db.Product.create({
      title: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      sellerId: this.testSeller.id,
      categoryId: this.testCategory.id,
      status: 'active'
    });
  }

  async cleanupTestData() {
    // Clean up in reverse order of creation
    if (this.testProduct) await this.testProduct.destroy();
    if (this.testPost) await this.testPost.destroy();
    if (this.testCategory) await this.testCategory.destroy();
    if (this.testSeller) await this.testSeller.destroy();
    if (this.testUser) await this.testUser.destroy();
    if (this.testAdmin) await this.testAdmin.destroy();
  }

  async generateAdminToken() {
    return jwt.sign(
      { 
        id: this.testAdmin.id, 
        role: 'admin',
        email: this.testAdmin.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  async generateUserToken() {
    return jwt.sign(
      { 
        id: this.testUser.id, 
        role: 'user',
        email: this.testUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
}

module.exports = AdminTestSuite;
