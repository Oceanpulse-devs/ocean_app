const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const productController = require('../controllers/productController');

// Configure multer for product images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for product images'), false);
    }
  }
});

// Configure multer for AR model files (GLB)
const uploadAR = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for GLB files
  fileFilter: function (req, file, cb) {
    // Accept GLB files and other 3D model formats
    const allowedMimes = [
      'model/gltf-binary', // GLB
      'model/gltf+json',    // GLTF
      'application/octet-stream' // Sometimes GLB files have this MIME type
    ];
    
    // Also check file extension as fallback
    const allowedExtensions = ['.glb', '.gltf'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only GLB/GLTF files are allowed for AR models'), false);
    }
  }
});

// Public routes (optional authentication - will set req.user if token provided)
router.get('/api/products', optionalAuthMiddleware, productController.getProducts);
router.get('/api/categories', productController.getCategories);
router.get('/api/products/seller/:sellerId', productController.getSellerProducts);
router.get('/api/users/:userId/products', productController.getUserProducts);
router.get('/api/product/:productId', productController.getProduct);

// System categories route (public)
router.get('/api/categories/system', (req, res) => {
    // Add type=system query parameter and call getCategories
    req.query.type = 'system';
    productController.getCategories(req, res);
});

// Protected routes (authentication required)
router.post('/api/products', authMiddleware, upload.array('images', 10), uploadAR.single('arModel'), productController.createProduct);
router.put('/api/products/:productId', authMiddleware, upload.array('images', 10), uploadAR.single('arModel'), productController.updateProduct);
router.delete('/api/products/:productId', authMiddleware, productController.deleteProduct);
router.post('/api/products/:productId/like', authMiddleware, productController.toggleLikeProduct);
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