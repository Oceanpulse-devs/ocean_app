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
router.post('/create', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), groupBuyController.createGroupBuy);

// Apply authentication middleware to remaining routes
router.use(authMiddleware);
router.get('/all', groupBuyController.getAllGroupBuys);
router.get('/trending', groupBuyController.getTrendingGroupBuys);
router.get('/recommended', groupBuyController.getRecommendedGroupBuys);
router.get('/spotlight', groupBuyController.getSpotlightGroupBuys);
router.get('/top-placement', groupBuyController.getTopPlacementGroupBuys);
router.get('/by-conversation/:conversationId', groupBuyController.getGroupBuyByConversationId);
router.get('/:id', groupBuyController.getGroupBuyById);
router.get('/:id/similar', groupBuyController.getSimilarGroupBuys);
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), groupBuyController.updateGroupBuy);
router.delete('/:id', groupBuyController.deleteGroupBuy);
router.patch('/:id/deadline', groupBuyController.extendGroupBuyDeadline);

// Group Buy participation
router.post('/:id/join', groupBuyController.joinGroupBuy);
router.delete('/:id/leave', groupBuyController.leaveGroupBuy);
router.get('/:id/participants', groupBuyController.getParticipants);

// User-specific group buys
router.get('/user/me', groupBuyController.getUserGroupBuys);

// Admin/creator operations
router.put('/:id/successful', groupBuyController.markGroupBuySuccessful);
router.post('/:id/cancel', groupBuyController.cancelGroupBuy);
router.patch('/:groupBuyId/participants/:participantId/status', groupBuyController.updateParticipantStatus);

// Statistics
router.get('/stats/overview', groupBuyController.getGroupBuyStats);

module.exports = router;
