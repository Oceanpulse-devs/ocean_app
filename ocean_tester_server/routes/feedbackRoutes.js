const express = require('express');
const router = express.Router();
const passwordAuth = require('../middleware/passwordAuth');
const {
  submitFeedback,
  getAllFeedback,
  updateFeedback,
  getFeedbackStats,
  getFeedbackById
} = require('../controllers/feedbackController');

// Public route
router.post('/', submitFeedback);

// Protected routes (require password)
router.get('/', passwordAuth, getAllFeedback);
router.get('/stats', passwordAuth, getFeedbackStats);
router.get('/:id', passwordAuth, getFeedbackById);
router.patch('/:id', passwordAuth, updateFeedback);

module.exports = router;
