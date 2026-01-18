const express = require('express');
const router = express.Router();
const multer = require('multer');
const groupBuyController = require('../controllers/groupBuyController');
const authMiddleware = require('../middleware/authMiddleware');

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
        cb(new Error('Only image files are allowed for group buy images'), false);
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

// Group Buy CRUD operations (auth middleware applied individually)
router.post('/create', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), (req, res) => groupBuyController.createGroupBuy(req, res));

// Apply authentication middleware to remaining routes
router.use(authMiddleware);
router.get('/all', (req, res) => groupBuyController.getAllGroupBuys(req, res));
router.get('/trending', (req, res) => groupBuyController.getTrendingGroupBuys(req, res));
router.get('/recommended', (req, res) => groupBuyController.getRecommendedGroupBuys(req, res));
router.get('/spotlight', (req, res) => groupBuyController.getSpotlightGroupBuys(req, res));
router.get('/top-placement', (req, res) => groupBuyController.getTopPlacementGroupBuys(req, res));
router.get('/by-conversation/:conversationId', (req, res) => groupBuyController.getGroupBuyByConversationId(req, res));
router.get('/:id', (req, res) => groupBuyController.getGroupBuyById(req, res));
router.get('/:id/similar', (req, res) => groupBuyController.getSimilarGroupBuys(req, res));
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), (req, res) => groupBuyController.updateGroupBuy(req, res));
router.delete('/:id', (req, res) => groupBuyController.deleteGroupBuy(req, res));
router.patch('/:id/deadline', (req, res) => groupBuyController.extendGroupBuyDeadline(req, res));

// Group Buy participation
router.post('/:id/join', (req, res) => groupBuyController.joinGroupBuy(req, res));
router.delete('/:id/leave', (req, res) => groupBuyController.leaveGroupBuy(req, res));
router.get('/:id/participants', (req, res) => groupBuyController.getParticipants(req, res));

// User-specific group buys
router.get('/user/me', (req, res) => groupBuyController.getUserGroupBuys(req, res));

// Admin/creator operations
router.put('/:id/successful', (req, res) => groupBuyController.markGroupBuySuccessful(req, res));
router.post('/:id/cancel', (req, res) => groupBuyController.cancelGroupBuy(req, res));
router.patch('/:groupBuyId/participants/:participantId/status', (req, res) => groupBuyController.updateParticipantStatus(req, res));

// Statistics
router.get('/stats/overview', (req, res) => groupBuyController.getGroupBuyStats(req, res));

module.exports = router;
