const express = require('express');
const router = express.Router();
const passwordAuth = require('../middleware/passwordAuth');
const {
  registerSeller,
  registerBuyer,
  getAllSellers,
  getAllBuyers,
  selectTester,
  updateTester,
  getTesterStats
} = require('../controllers/testerController');

// Public routes
router.post('/sellers/register', registerSeller);
router.post('/buyers/register', registerBuyer);

// Protected routes (require password)
router.get('/sellers', passwordAuth, getAllSellers);
router.get('/buyers', passwordAuth, getAllBuyers);
router.post('/:id/select', passwordAuth, selectTester);
router.patch('/:id', passwordAuth, updateTester);
router.get('/stats', passwordAuth, getTesterStats);

module.exports = router;
