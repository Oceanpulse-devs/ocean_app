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
router.post('/create', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), handleMulterError, (req, res) => swapDealController.createSwapDeal(req, res));
router.get('/all', (req, res) => swapDealController.getAllSwapDeals(req, res));
router.get('/trending', (req, res) => swapDealController.getTrendingSwapDeals(req, res));
router.get('/recommended', (req, res) => swapDealController.getRecommendedSwapDeals(req, res));
router.get('/spotlight', (req, res) => swapDealController.getSpotlightSwapDeals(req, res));
router.get('/top-placement', (req, res) => swapDealController.getTopPlacementSwapDeals(req, res));
router.get('/:id', (req, res) => swapDealController.getSwapDealById(req, res));
router.get('/:id/similar', (req, res) => swapDealController.getSimilarSwapDeals(req, res));
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), handleMulterError, (req, res) => swapDealController.updateSwapDeal(req, res));
router.put('/:id/cancel', (req, res) => swapDealController.cancelSwapDeal(req, res));

// Swap Proposal operations
router.post('/:swapDealId/propose', upload.any(), handleMulterError, (req, res) => swapDealController.proposeSwap(req, res));
router.put('/proposals/:proposalId/accept', (req, res) => swapDealController.acceptProposal(req, res));
router.put('/proposals/:proposalId/reject', (req, res) => swapDealController.rejectProposal(req, res));

// User-specific operations
router.get('/user/my-deals', (req, res) => swapDealController.getUserSwapDeals(req, res));
router.get('/user/my-proposals', (req, res) => swapDealController.getUserProposals(req, res));

// Statistics
router.get('/stats/overview', (req, res) => swapDealController.getSwapDealStats(req, res));

module.exports = router;
