const express = require('express');
const router = express.Router();
const {
    approveSeller,
    rejectSeller,
    getPendingSellers,
    getAllSellers,
    getSellerById,
    toggleSellerStatus,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    getAdminStats
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes for seller management
router.get('/api/admin/pending-sellers', authMiddleware, getPendingSellers);
router.get('/api/admin/sellers', authMiddleware, getAllSellers);
router.get('/api/admin/sellers/:sellerId', authMiddleware, getSellerById);
router.post('/api/admin/approve-seller', authMiddleware, approveSeller);
router.post('/api/admin/reject-seller', authMiddleware, rejectSeller);
router.post('/api/admin/toggle-seller-status', authMiddleware, toggleSellerStatus);

// Admin routes for user management
router.get('/api/admin/users', authMiddleware, getAllUsers);
router.get('/api/admin/users/:userId', authMiddleware, getUserById);
router.post('/api/admin/toggle-user-status', authMiddleware, toggleUserStatus);

router.get('/api/admin/stats', authMiddleware, getAdminStats);

module.exports = router; 