const express = require('express');
const router = express.Router();
const multer = require('multer');
const swapDealController = require('../controllers/swapDealController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Configure Multer for file uploads (supports images, videos, and AR models)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (for videos and AR models)
    files: 10 // Max 10 files for proposal images
  },
  fileFilter: (req, file, cb) => {
    console.log(`Processing file: ${file.fieldname} - ${file.originalname} (${file.mimetype})`);
    // Validate based on field name
    if (file.fieldname === 'images') {
      // For images, accept images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error(`Only image and video files are allowed for images field! Received: ${file.mimetype}`), false);
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
      // For other fields (like proposal images), accept images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error(`Only image and video files are allowed! Received: ${file.mimetype}`), false);
      }
    }
  }
});

// Error handling middleware for Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer Error:', err);
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      error: err.code
    });
  }
  next(err);
};

// Swap Deal CRUD operations
router.post('/create', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), handleMulterError, swapDealController.createSwapDeal);
router.get('/all', swapDealController.getAllSwapDeals);
router.get('/trending', swapDealController.getTrendingSwapDeals);
router.get('/recommended', swapDealController.getRecommendedSwapDeals);
router.get('/spotlight', swapDealController.getSpotlightSwapDeals);
router.get('/top-placement', swapDealController.getTopPlacementSwapDeals);
router.get('/:id', swapDealController.getSwapDealById);
router.get('/:id/similar', swapDealController.getSimilarSwapDeals);
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), handleMulterError, swapDealController.updateSwapDeal);
router.put('/:id/cancel', swapDealController.cancelSwapDeal);

// Swap Proposal operations
router.post('/:swapDealId/propose', upload.any(), handleMulterError, swapDealController.proposeSwap);
router.put('/proposals/:proposalId/accept', swapDealController.acceptProposal);
router.put('/proposals/:proposalId/reject', swapDealController.rejectProposal);

// User-specific operations
router.get('/user/my-deals', swapDealController.getUserSwapDeals);
router.get('/user/my-proposals', swapDealController.getUserProposals);

// Statistics
router.get('/stats/overview', swapDealController.getSwapDealStats);

module.exports = router;
