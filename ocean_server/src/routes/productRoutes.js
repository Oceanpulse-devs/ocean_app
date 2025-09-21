const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for product images'), false);
    }
  }
});

// Public routes (no authentication required)
router.get('/api/products', productController.getProducts);
router.get('/api/categories', productController.getCategories);
router.get('/api/products/seller/:sellerId', productController.getSellerProducts);
router.get('/api/product/:productId', productController.getProduct);

// System categories route (public)
router.get('/api/categories/system', (req, res) => {
    // Add type=system query parameter and call getCategories
    req.query.type = 'system';
    productController.getCategories(req, res);
});

// Protected routes (authentication required)
router.post('/api/products', authMiddleware, upload.array('images', 10), productController.createProduct);
router.put('/api/products/:productId', authMiddleware, productController.updateProduct);
router.delete('/api/products/:productId', authMiddleware, productController.deleteProduct);
router.post('/api/products/:productId/save', authMiddleware, productController.toggleSaveProduct);
router.get('/api/saved-products', authMiddleware, productController.getSavedProducts);
router.get('/api/saved-items', authMiddleware, productController.getAllSavedItems);
router.get('/api/my-products', authMiddleware, productController.getMyProducts);

// Category management routes (authentication required)
router.post('/api/categories/custom', authMiddleware, productController.createCustomCategory);
router.get('/api/categories/custom', authMiddleware, productController.getCustomCategories);
router.delete('/api/categories/custom/:categoryId', authMiddleware, productController.deleteCustomCategory);

// Category search and analytics routes (public)
router.get('/api/categories/search', productController.searchCategories);
router.get('/api/categories/analytics', productController.getCategoryAnalytics);
router.get('/api/categories/trending', productController.getTrendingCategories);



module.exports = router; 