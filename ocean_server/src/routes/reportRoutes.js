const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// Report routes (authenticated users)
router.post('/', authMiddleware, ReportController.createReport);
router.get('/', authMiddleware, ReportController.getMyReports);
router.get('/:id', authMiddleware, ReportController.getReport);

module.exports = router;

