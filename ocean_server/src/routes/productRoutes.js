const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Public routes (no authentication required)
router.get('/api/products', productController.getProducts);
router.get('/api/categories', productController.getCategories);
router.get('/api/products/seller/:sellerId', productController.getSellerProducts);
router.get('/api/product/:productId', productController.getProduct);

// Protected routes (authentication required)
router.post('/api/products', authMiddleware, productController.createProduct);
router.put('/api/products/:productId', authMiddleware, productController.updateProduct);
router.delete('/api/products/:productId', authMiddleware, productController.deleteProduct);
router.post('/api/products/:productId/save', authMiddleware, productController.toggleSaveProduct);
router.get('/api/saved-products', authMiddleware, productController.getSavedProducts);
router.get('/api/saved-items', authMiddleware, productController.getAllSavedItems);
router.get('/api/my-products', authMiddleware, productController.getMyProducts);
router.get('/api/categories', productController.getCategories);



module.exports = router; 