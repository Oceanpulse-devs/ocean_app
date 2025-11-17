const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const auctionController = require('../controllers/auctionController');

// Configure multer for file uploads (supports both images and AR models)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit to accommodate AR models
  fileFilter: function (req, file, cb) {
    // Validate based on field name
    if (file.fieldname === 'images') {
      // For images, check if it's an image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for auction images'), false);
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

// Public routes (no authentication required)
router.get('/api/auctions', auctionController.getAuctions);
router.get('/api/auctions/categories', auctionController.getAuctionCategories);
router.get('/api/users/:userId/auctions', auctionController.getUserAuctionsById);
router.get('/api/auction/:auctionId', auctionController.getAuction);

// Protected routes (authentication required)
router.post('/api/auctions', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), auctionController.createAuction);
router.post('/api/auction/:auctionId/bid', authMiddleware, auctionController.placeBid);
router.post('/api/auction/:auctionId/watch', authMiddleware, auctionController.toggleWatchAuction);
router.put('/api/auction/:auctionId', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), auctionController.updateAuction);
router.delete('/api/auction/:auctionId', authMiddleware, auctionController.cancelAuction);

// User-specific routes (must be before /api/user/:userId route in authRoutes)
router.get('/api/user/auctions', authMiddleware, auctionController.getUserAuctions);
router.get('/api/user/bids', authMiddleware, auctionController.getUserBids);

module.exports = router; 