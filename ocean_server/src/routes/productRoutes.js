const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const productController = require('../controllers/productController');

// Single multer config that handles both images and AR models
const uploadProductFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Use higher limit (50MB) to accommodate both
  fileFilter: function (req, file, cb) {
    // Validate based on field name
    if (file.fieldname === 'images') {
      // For images, check if it's an image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for product images'), false);
      }
    } else if (file.fieldname === 'arModel') {
      // For AR models, check if it's GLB/GLTF
      const allowedMimes = [
        'model/gltf-binary', // GLB
        'model/gltf+json',    // GLTF
        'application/octet-stream' // Sometimes GLB files have this MIME type
      ];
      const allowedExtensions = ['.glb', '.gltf'];
      const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
        cb(null, true);
      } else {
        cb(new Error('Only GLB/GLTF files are allowed for AR models'), false);
      }
    } else {
      cb(new Error('Invalid field name. Only "images" and "arModel" are allowed'), false);
    }
  }
});

// Public routes (optional authentication - will set req.user if token provided)
router.get('/api/products', optionalAuthMiddleware, productController.getProducts);
router.get('/api/products/trending', optionalAuthMiddleware, productController.getTrendingProducts);
router.get('/api/products/recommended', optionalAuthMiddleware, productController.getRecommendedProducts);
router.get('/api/products/spotlight', optionalAuthMiddleware, productController.getSpotlightProducts);
router.get('/api/products/top-placement', optionalAuthMiddleware, productController.getTopPlacementProducts);
router.get('/api/categories', productController.getCategories);
router.get('/api/products/seller/:sellerId', productController.getSellerProducts);
router.get('/api/users/:userId/products', productController.getUserProducts);
router.get('/api/product/:productId', productController.getProduct);
router.get('/api/product/:productId/similar', optionalAuthMiddleware, productController.getSimilarProducts);

// System categories route (public)
router.get('/api/categories/system', (req, res) => {
    // Add type=system query parameter and call getCategories
    req.query.type = 'system';
    productController.getCategories(req, res);
});

// Protected routes (authentication required)
router.post('/api/products', 
  authMiddleware, 
  uploadProductFiles.fields([
    { name: 'images', maxCount: 10 },
    { name: 'arModel', maxCount: 1 }
  ]), 
  productController.createProduct
);

router.put('/api/products/:productId', 
  authMiddleware, 
  uploadProductFiles.fields([
    { name: 'images', maxCount: 10 },
    { name: 'arModel', maxCount: 1 }
  ]), 
  productController.updateProduct
);
router.delete('/api/products/:productId', authMiddleware, productController.deleteProduct);
router.post('/api/products/:productId/like', authMiddleware, productController.toggleLikeProduct);
router.post('/api/products/:productId/save', authMiddleware, productController.toggleSaveProduct);
router.get('/api/saved-products', authMiddleware, productController.getSavedProducts);
router.delete('/api/saved-products/:savedItemId', authMiddleware, productController.deleteSavedProduct);
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