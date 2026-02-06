const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Notification routes
router.get('/api/notifications', authMiddleware, getUserNotifications);
router.get('/api/notifications/unread-count', authMiddleware, getUnreadCount);
router.put('/api/notifications/mark-read', authMiddleware, markNotificationsAsRead);
router.put('/api/notifications/mark-all-read', authMiddleware, markAllNotificationsAsRead);
router.put('/api/notifications/:notificationId/read', authMiddleware, markNotificationAsRead);
router.delete('/api/notifications/:notificationId', authMiddleware, deleteNotification);

module.exports = router; 