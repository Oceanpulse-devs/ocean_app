const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const advancedNotificationController = require('../controllers/advancedNotificationController');
const userNotificationPreferenceController = require('../controllers/userNotificationPreferenceController');
const notificationTemplateController = require('../controllers/notificationTemplateController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ========================================
// ADVANCED NOTIFICATIONS ROUTES
// ========================================

// Create a new notification
router.post('/create', advancedNotificationController.createNotification);

// Get user notifications with filtering and pagination
router.get('/user/:userId', advancedNotificationController.getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', advancedNotificationController.markAsRead);

// Mark multiple notifications as read
router.put('/mark-multiple-read', advancedNotificationController.markMultipleAsRead);

// Delete notification
router.delete('/:notificationId', advancedNotificationController.deleteNotification);

// Get notification statistics
router.get('/stats/:userId', advancedNotificationController.getNotificationStats);

// Create notification from template
router.post('/from-template', advancedNotificationController.createFromTemplate);

// Bulk create notifications (for system-wide announcements)
router.post('/bulk-create', advancedNotificationController.bulkCreateNotifications);

// ========================================
// USER NOTIFICATION PREFERENCES ROUTES
// ========================================

// Get user notification preferences
router.get('/preferences/:userId', userNotificationPreferenceController.getUserPreferences);

// Create or update user notification preference
router.put('/preferences/:userId', userNotificationPreferenceController.upsertUserPreference);

// Update multiple preferences at once
router.put('/preferences/:userId/bulk', userNotificationPreferenceController.updateMultiplePreferences);

// Delete user notification preference
router.delete('/preferences/:userId/:notificationType', userNotificationPreferenceController.deleteUserPreference);

// Get default notification preferences for a user
router.get('/preferences/:userId/defaults', userNotificationPreferenceController.getDefaultPreferences);

// Initialize user with default notification preferences
router.post('/preferences/:userId/initialize', userNotificationPreferenceController.initializeUserPreferences);

// Get notification preferences summary
router.get('/preferences/:userId/summary', userNotificationPreferenceController.getPreferencesSummary);

// ========================================
// NOTIFICATION TEMPLATES ROUTES
// ========================================

// Create a new notification template
router.post('/templates', notificationTemplateController.createTemplate);

// Get all notification templates with filtering
router.get('/templates', notificationTemplateController.getAllTemplates);

// Get template by ID
router.get('/templates/:templateId', notificationTemplateController.getTemplateById);

// Update notification template
router.put('/templates/:templateId', notificationTemplateController.updateTemplate);

// Create new version of template
router.post('/templates/:templateId/version', notificationTemplateController.createTemplateVersion);

// Delete notification template
router.delete('/templates/:templateId', notificationTemplateController.deleteTemplate);

// Get template versions
router.get('/templates/versions/:templateName', notificationTemplateController.getTemplateVersions);

// Activate template version
router.put('/templates/:templateId/activate', notificationTemplateController.activateTemplateVersion);

// Get template statistics
router.get('/templates/stats', notificationTemplateController.getTemplateStats);

module.exports = router;
