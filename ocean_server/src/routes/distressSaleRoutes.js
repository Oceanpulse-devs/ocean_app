const express = require('express');
const router = express.Router();
const multer = require('multer');
const distressSaleController = require('../controllers/distressSaleController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');

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
        cb(new Error('Only image files are allowed for distress sale images'), false);
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
router.get('/all', distressSaleController.getAllDistressSales);
router.get('/trending', distressSaleController.getTrendingDistressSales);
router.get('/recommended', optionalAuthMiddleware, distressSaleController.getRecommendedDistressSales);
router.get('/spotlight', distressSaleController.getSpotlightDistressSales);
router.get('/top-placement', distressSaleController.getTopPlacementDistressSales);
router.get('/stats', distressSaleController.getDistressSaleStats);
router.get('/:id', distressSaleController.getDistressSaleById);
router.get('/:id/similar', distressSaleController.getSimilarDistressSales);

// Protected routes (authentication required)
router.post('/create', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), distressSaleController.createDistressSale);
router.put('/:id', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'arModel', maxCount: 1 }]), distressSaleController.updateDistressSale);
router.delete('/:id', authMiddleware, distressSaleController.deleteDistressSale);
router.put('/:id/convert', authMiddleware, distressSaleController.convertToDistressSale);

module.exports = router;
