const express = require('express');
const router = express.Router();
const requestRoomController = require('../controllers/requestRoomController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. Seller expresses interest in a search insight demand
router.post('/api/buyer-needs/search-insight/:id/express-interest', authMiddleware, (req, res) => requestRoomController.expressInterest(req, res));

// 2. Fetch seller's daily Express Interest slots quota status (3 max/day)
router.get('/api/sellers/daily-slots', authMiddleware, (req, res) => requestRoomController.getSellerDailySlots(req, res));

// 3. Fetch temporary request room details
router.get('/api/request-rooms/:roomId', authMiddleware, (req, res) => requestRoomController.getRequestRoomDetails(req, res));

// 4. Buyer selects a seller from the request room to initiate a 1-on-1 direct conversation
router.post('/api/request-rooms/:roomId/select-seller', authMiddleware, (req, res) => requestRoomController.selectSeller(req, res));

module.exports = router;
