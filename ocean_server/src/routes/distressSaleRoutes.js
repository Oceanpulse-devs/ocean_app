const express = require('express');
const router = express.Router();
const multer = require('multer');
const distressSaleController = require('../controllers/distressSaleController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for distress sale images'), false);
    }
  }
});

// Public routes (no authentication required)
router.get('/all', distressSaleController.getAllDistressSales);
router.get('/stats', distressSaleController.getDistressSaleStats);
router.get('/:id', distressSaleController.getDistressSaleById);

// Protected routes (authentication required)
router.post('/create', authMiddleware, upload.array('images', 10), distressSaleController.createDistressSale);
router.put('/:id', authMiddleware, upload.array('images', 10), distressSaleController.updateDistressSale);
router.delete('/:id', authMiddleware, distressSaleController.deleteDistressSale);
router.put('/:id/convert', authMiddleware, distressSaleController.convertToDistressSale);

module.exports = router;
