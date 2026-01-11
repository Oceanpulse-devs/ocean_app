const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { Product, ProductCategory, SavedProduct, ProductLike, UserTable, SellersTable, UserSubscription, SubscriptionPlan } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../src/config/redisdb');

// Helper function to create a minimal valid PNG buffer for testing
const createTestImageBuffer = () => {
  // Minimal 1x1 PNG image (67 bytes)
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
  ]);
};

describe('Product Controller', () => {
  let testSeller;
  let testBuyer;
  let testProduct;
  let sellerToken;
  let buyerToken;
  let testSellerRecord;
  let testCategory;

  // Setup before all tests
  beforeAll(async () => {
    // Create or find test category
    [testCategory] = await ProductCategory.findOrCreate({
      where: { name: 'Electronics' },
      defaults: {
        description: 'Electronics category for testing',
        icon: 'electronics-icon'
      }
    });
  });

  // Clean up and setup before each test
  beforeEach(async () => {
    // Clean up test data
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
        
        await SavedProduct.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await ProductLike.destroy({
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
      // Silently ignore if no test data exists
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

    // Create seller record
    testSellerRecord = await SellersTable.create({
      userId: testSeller.id,
      fullName: testSeller.fullName,
      email: testSeller.email,
      phoneNumber: '+2341234567890',
      country: 'Nigeria',
      businessName: 'Test Business',
      businessAddress: '123 Test Street',
      verificationStatus: 'approved'
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
      location: 'Lagos, Nigeria'
    });

    // Create active subscription for seller
    const wavePlan = await SubscriptionPlan.findOne({
      where: { name: 'wave' }
    });

    if (wavePlan) {
      await UserSubscription.create({
        userId: testSeller.id,
        planId: wavePlan.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Create test product
    testProduct = await Product.create({
      sellerId: testSellerRecord.id,
      title: 'Test Product',
      description: 'This is a test product description',
      price: 5000,
      category: 'Electronics',
      condition: 'new',
      location: 'Lagos, Nigeria',
      status: 'active',
      isAvailable: true
    });

    // Generate test tokens
    const sellerSessionId = require('crypto').randomBytes(32).toString('hex');
    sellerToken = jwt.sign(
      {
        id: testSeller.id,
        email: testSeller.email,
        role: testSeller.accountType,
        sessionId: sellerSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testSeller.id}:${sellerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

    const buyerSessionId = require('crypto').randomBytes(32).toString('hex');
    buyerToken = jwt.sign(
      {
        id: testBuyer.id,
        email: testBuyer.email,
        role: testBuyer.accountType,
        sessionId: buyerSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await redisClient.set(`session:${testBuyer.id}:${buyerSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });
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
        
        await SavedProduct.destroy({
          where: {
            userId: {
              [db.Sequelize.Op.in]: userIds
            }
          }
        });
        
        await ProductLike.destroy({
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

  describe('POST /api/products', () => {
    it('should create product successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'New Test Product')
        .field('description', 'Test product description')
        .field('price', '3000')
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .attach('images', createTestImageBuffer(), 'test-image.png')
        .expect(201);

      expect(response.body).toHaveProperty('message');
      // ResponseWrapper extracts nested data: { success, message, data: productObject }
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('New Test Product');
      expect(parseFloat(response.body.data.price)).toBe(3000);

      // Verify product was created in database
      const product = await Product.findByPk(response.body.data.id);
      expect(product).toBeTruthy();
      expect(product.title).toBe('New Test Product');
    });

    it('should accept name field (frontend compatibility)', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('name', 'Product with name field') // Frontend field name
        .field('description', 'Test description')
        .field('price', '2500')
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .attach('images', createTestImageBuffer(), 'test-image.png')
        .expect(201);

      // ResponseWrapper extracts nested data: { success, message, data: productObject }
      expect(response.body.data.title).toBe('Product with name field');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .field('title', 'Test Product')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should reject non-seller users', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('title', 'Test Product')
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Product')
        // Missing description, price, etc.
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should validate price is greater than 0', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Test Product')
        .field('description', 'Test description')
        .field('price', '0')
        .field('category', 'Electronics')
        .field('condition', 'new')
        .field('location', 'Lagos, Nigeria')
        .attach('images', createTestImageBuffer(), 'test-image.png')
        .expect(400);

      expect(response.body.message).toContain('Price must be greater than 0');
    });
  });

  describe('GET /api/products', () => {
    it('should return products without authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('itemsPerPage', 5);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Electronics', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: 'Test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 1000, maxPrice: 10000, page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by condition', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ condition: 'new', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by location', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ location: 'Lagos', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/product/:productId', () => {
    it('should return product details', async () => {
      const response = await request(app)
        .get(`/api/product/${testProduct.id}`)
        .expect(200);

      // ResponseWrapper extracts nested data: { success, message, data: productObject }
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(testProduct.id);
      expect(response.body.data.title).toBe(testProduct.title);
      expect(response.body.data).toHaveProperty('seller');
    });

    it('should increment view count', async () => {
      const initialViews = testProduct.views || 0;
      
      await request(app)
        .get(`/api/product/${testProduct.id}`)
        .expect(200);

      await testProduct.reload();
      expect(testProduct.views).toBeGreaterThan(initialViews);
    });

    it('should include isLiked and isSaved status for authenticated users', async () => {
      // Like and save the product
      await ProductLike.create({
        productId: testProduct.id,
        userId: testBuyer.id
      });

      await SavedProduct.create({
        productId: testProduct.id,
        userId: testBuyer.id
      });

      const response = await request(app)
        .get(`/api/product/${testProduct.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      // ResponseWrapper extracts nested data: { success, message, data: productObject }
      expect(response.body.data).toHaveProperty('isLiked', true);
      expect(response.body.data).toHaveProperty('isSaved', true);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = require('crypto').randomUUID();
      const response = await request(app)
        .get(`/api/product/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/products/:productId', () => {
    it('should update product successfully', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('title', 'Updated Product Title')
        .field('description', testProduct.description)
        .field('price', testProduct.price.toString())
        .field('category', testProduct.category)
        .field('condition', testProduct.condition)
        .field('location', testProduct.location)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // ResponseWrapper extracts nested data: { success, message, data: productObject }
      expect(response.body.data.title).toBe('Updated Product Title');

      // Verify update in database
      await testProduct.reload();
      expect(testProduct.title).toBe('Updated Product Title');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .field('title', 'Updated Title')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow seller to update own product', async () => {
      // Create another seller
      const otherSeller = await UserTable.create({
        fullName: 'Other Seller',
        email: `other${Date.now()}@test.com`,
        password: await bcrypt.hash('Test1234', 10),
        accountType: 'seller',
        accountStatus: 'active',
        emailVerified: true,
        agreeTerms: true
      });

      const otherSellerRecord = await SellersTable.create({
        userId: otherSeller.id,
        fullName: otherSeller.fullName,
        email: otherSeller.email,
        phoneNumber: '+2341234567891',
        country: 'Nigeria',
        businessName: 'Other Business',
        businessAddress: '456 Other Street',
        verificationStatus: 'approved'
      });

      const otherSessionId = require('crypto').randomBytes(32).toString('hex');
      const otherToken = jwt.sign(
        {
          id: otherSeller.id,
          email: otherSeller.email,
          role: otherSeller.accountType,
          sessionId: otherSessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      await redisClient.set(`session:${otherSeller.id}:${otherSessionId}`, 'active', { EX: 7 * 24 * 60 * 60 });

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .field('title', 'Unauthorized Update')
        .expect(404); // Controller returns 404 when product not found or no permission

      expect(response.body.message).toMatch(/not found|permission/i);
    });
  });

  describe('DELETE /api/products/:productId', () => {
    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify product was soft deleted (status changed)
      await testProduct.reload();
      expect(testProduct.status).toBe('inactive');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should only allow seller to delete own product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only verified sellers');
    });
  });

  describe('POST /api/products/:productId/like', () => {
    it('should like product successfully', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.id}/like`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // Response is double-wrapped by responseWrapper: { success, data: { message, data: { isLiked } } }
      expect(response.body.data.data).toHaveProperty('isLiked', true);

      // Verify like was created
      const like = await ProductLike.findOne({
        where: { productId: testProduct.id, userId: testBuyer.id }
      });
      expect(like).toBeTruthy();
    });

    it('should unlike product when already liked', async () => {
      // Like first
      await ProductLike.create({
        productId: testProduct.id,
        userId: testBuyer.id
      });

      const response = await request(app)
        .post(`/api/products/${testProduct.id}/like`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.data.isLiked).toBe(false);

      // Verify like was removed
      const like = await ProductLike.findOne({
        where: { productId: testProduct.id, userId: testBuyer.id }
      });
      expect(like).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.id}/like`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /api/products/:productId/save', () => {
    it('should save product successfully', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.id}/save`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // ResponseWrapper double-wraps: { success, message, data: { message, data: { isSaved } } }
      expect(response.body.data.data).toHaveProperty('isSaved', true);

      // Verify save was created
      const savedProduct = await SavedProduct.findOne({
        where: { productId: testProduct.id, userId: testBuyer.id }
      });
      expect(savedProduct).toBeTruthy();
    });

    it('should unsave product when already saved', async () => {
      // Save first
      await SavedProduct.create({
        productId: testProduct.id,
        userId: testBuyer.id
      });

      const response = await request(app)
        .post(`/api/products/${testProduct.id}/save`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.data.isSaved).toBe(false);

      // Verify save was removed
      const savedProduct = await SavedProduct.findOne({
        where: { productId: testProduct.id, userId: testBuyer.id }
      });
      expect(savedProduct).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.id}/save`)
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/saved-products', () => {
    beforeEach(async () => {
      // Create saved product
      await SavedProduct.create({
        productId: testProduct.id,
        userId: testBuyer.id
      });
    });

    it('should return saved products for authenticated user', async () => {
      const response = await request(app)
        .get('/api/saved-products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('savedProducts');
      expect(Array.isArray(response.body.data.savedProducts)).toBe(true);
      expect(response.body.data.savedProducts.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/saved-products')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/saved-products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/my-products', () => {
    it('should return seller products', async () => {
      const response = await request(app)
        .get('/api/my-products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/my-products')
        .expect(401);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/categories', () => {
    it('should return categories without authentication', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      // ResponseWrapper default wraps: { success, message, data: { message, data: array, meta } }
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ search: 'Electronics' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/products/trending', () => {
    it('should return trending products', async () => {
      const response = await request(app)
        .get('/api/products/trending')
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('GET /api/products/recommended', () => {
    it('should return recommended products for authenticated user', async () => {
      const response = await request(app)
        .get('/api/products/recommended')
        .set('Authorization', `Bearer ${buyerToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/products/recommended')
        .query({ limit: 10, offset: 0 })
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/product/:productId/similar', () => {
    it('should return similar products', async () => {
      const response = await request(app)
        .get(`/api/product/${testProduct.id}/similar`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });
});
