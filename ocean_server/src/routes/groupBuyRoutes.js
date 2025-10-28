const express = require('express');
const router = express.Router();
const multer = require('multer');
const groupBuyController = require('../controllers/groupBuyController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for product images'), false);
    }
  }
});

// Group Buy CRUD operations (auth middleware applied individually)
router.post('/create', authMiddleware, upload.array('images', 10), groupBuyController.createGroupBuy);

// Apply authentication middleware to remaining routes
router.use(authMiddleware);
router.get('/all', groupBuyController.getAllGroupBuys);
router.get('/:id', groupBuyController.getGroupBuyById);
router.put('/:id', groupBuyController.updateGroupBuy);
router.delete('/:id', groupBuyController.deleteGroupBuy);

// Group Buy participation
router.post('/:id/join', groupBuyController.joinGroupBuy);
router.delete('/:id/leave', groupBuyController.leaveGroupBuy);

// User-specific group buys
router.get('/user/me', groupBuyController.getUserGroupBuys);

// Admin/creator operations
router.put('/:id/successful', groupBuyController.markGroupBuySuccessful);

// Statistics
router.get('/stats/overview', groupBuyController.getGroupBuyStats);

module.exports = router;
