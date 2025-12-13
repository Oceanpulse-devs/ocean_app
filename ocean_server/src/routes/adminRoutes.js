const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const sellerManagementController = require('../controllers/sellerManagementController');
const userManagementController = require('../controllers/userManagementController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const systemAdminController = require('../controllers/systemAdminController');
const securityModerationController = require('../controllers/securityModerationController');
const contentAdminController = require('../controllers/contentAdminController');
const ReportController = require('../controllers/reportController');
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Apply admin middleware to all routes
router.use(adminMiddleware);

// System Maintenance Routes
router.post('/maintenance/schedule', adminController.sendMaintenanceNotification);
router.post('/maintenance/complete', adminController.sendMaintenanceCompletionNotification);
router.post('/maintenance/emergency', adminController.sendEmergencyMaintenanceNotification);

// Feature Update Routes
router.post('/feature-update', adminController.sendFeatureUpdateNotification);

// App Update Routes
router.post('/app-update', adminController.sendAppUpdateNotification);

// Security Alert Routes
router.post('/security-alert', adminController.sendSecurityAlertNotification);

// System Health Routes
router.get('/system-health', adminController.getSystemHealth);

// ==================== SELLER MANAGEMENT ROUTES ====================

// Seller Operations
router.get('/sellers', sellerManagementController.getAllSellers);
router.get('/sellers/pending', sellerManagementController.getPendingSellers);
router.get('/sellers/search', sellerManagementController.searchSellers);
router.get('/sellers/stats', sellerManagementController.getSellerStats);
router.get('/sellers/top', sellerManagementController.getTopSellers);
router.get('/sellers/:id', sellerManagementController.getSellerById);

// Seller Actions
router.put('/sellers/:id/approve', sellerManagementController.approveSeller);
router.put('/sellers/:id/reject', sellerManagementController.rejectSeller);
router.put('/sellers/:id/suspend', sellerManagementController.suspendSeller);
router.put('/sellers/:id/activate', sellerManagementController.activateSeller);
router.delete('/sellers/:id', sellerManagementController.deleteSeller);

// ==================== USER MANAGEMENT ROUTES ====================

// User Operations
router.get('/users', userManagementController.getAllUsers);
router.get('/users/search', userManagementController.searchUsers);
router.get('/users/stats', userManagementController.getUserStats);
router.get('/users/:id', userManagementController.getUserById);
router.get('/users/:id/activity', userManagementController.getUserActivity);

// User Actions
router.put('/users/:id/suspend', userManagementController.suspendUser);
router.put('/users/:id/activate', userManagementController.activateUser);
router.put('/users/:id/ban', userManagementController.banUser);
router.put('/users/:id/unban', userManagementController.unbanUser);
router.delete('/users/:id', userManagementController.deleteUser);

// ==================== ANALYTICS & REPORTING ROUTES ====================

// Dashboard & Analytics
router.get('/dashboard', adminAnalyticsController.getDashboardData.bind(adminAnalyticsController));
router.get('/analytics', adminAnalyticsController.getPlatformAnalytics.bind(adminAnalyticsController));
router.get('/stats', adminAnalyticsController.getPlatformStats.bind(adminAnalyticsController));
router.post('/reports', adminAnalyticsController.generateReports.bind(adminAnalyticsController));
router.get('/activity', adminAnalyticsController.getSystemActivity.bind(adminAnalyticsController));
router.get('/performance', adminAnalyticsController.getPerformanceMetrics.bind(adminAnalyticsController));

// ==================== FINANCE MANAGEMENT ROUTES ====================

// Finance Operations
router.get('/finances/summary', financeController.getFinancialSummary.bind(financeController));
router.get('/finances/transactions', financeController.getTransactions.bind(financeController));
router.get('/finances/revenue-breakdown', financeController.getRevenueBreakdown.bind(financeController));

// ==================== SYSTEM ADMINISTRATION ROUTES ====================

// System Configuration
router.get('/config', systemAdminController.getSystemConfig.bind(systemAdminController));
router.put('/config', systemAdminController.updateSystemConfig.bind(systemAdminController));
router.get('/logs', systemAdminController.getSystemLogs.bind(systemAdminController));
router.get('/health', systemAdminController.getSystemHealth.bind(systemAdminController));
router.post('/cache/clear', systemAdminController.clearSystemCache.bind(systemAdminController));
router.post('/services/restart', systemAdminController.restartSystemServices.bind(systemAdminController));

// Backup Management
router.get('/backups', systemAdminController.getBackupManagement.bind(systemAdminController));
router.post('/backups/create', systemAdminController.createBackup.bind(systemAdminController));
router.post('/backups/:backupId/restore', systemAdminController.restoreBackup.bind(systemAdminController));
router.delete('/backups/:backupId', systemAdminController.deleteBackup.bind(systemAdminController));

// ==================== SECURITY & MODERATION ROUTES ====================

// Security Monitoring
router.get('/security/alerts', securityModerationController.getSecurityAlerts.bind(securityModerationController));
router.get('/security/activities', securityModerationController.getSuspiciousActivities.bind(securityModerationController));
router.get('/security/stats', securityModerationController.getSecurityStats.bind(securityModerationController));
router.post('/security/users/:userId/block', securityModerationController.blockSuspiciousUser.bind(securityModerationController));

// Content Moderation
router.get('/moderation/queue', securityModerationController.getModerationQueue.bind(securityModerationController));
router.put('/moderation/:id/approve', securityModerationController.approveContent.bind(securityModerationController));
router.put('/moderation/:id/reject', securityModerationController.rejectContent.bind(securityModerationController));
router.get('/moderation/flagged', securityModerationController.getFlaggedContent.bind(securityModerationController));
router.put('/moderation/flags/:id/resolve', securityModerationController.resolveFlag.bind(securityModerationController));

// ==================== CONTENT MANAGEMENT ROUTES ====================

// Post Management
router.get('/content/posts', contentAdminController.getAllPosts.bind(contentAdminController));
router.get('/content/posts/:id', contentAdminController.getPostById.bind(contentAdminController));
router.put('/content/posts/:id/status', contentAdminController.updatePostStatus.bind(contentAdminController));
router.delete('/content/posts/:id', contentAdminController.deletePost.bind(contentAdminController));
router.post('/content/posts/bulk-update', contentAdminController.bulkUpdatePosts.bind(contentAdminController));

// Product Management
router.get('/content/products', contentAdminController.getAllProducts.bind(contentAdminController));
router.get('/content/products/:id', contentAdminController.getProductById.bind(contentAdminController));
router.put('/content/products/:id/status', contentAdminController.updateProductStatus.bind(contentAdminController));

// Category Management
router.get('/content/categories', contentAdminController.getAllCategories.bind(contentAdminController));
router.post('/content/categories', contentAdminController.createCategory.bind(contentAdminController));
router.put('/content/categories/:id', contentAdminController.updateCategory.bind(contentAdminController));
router.delete('/content/categories/:id', contentAdminController.deleteCategory.bind(contentAdminController));

// Content Statistics
router.get('/content/stats', contentAdminController.getContentStats.bind(contentAdminController));

// ==================== USER REPORTS MANAGEMENT ROUTES ====================

// Report Management
router.get('/reports/list', ReportController.getAllReports);
router.get('/reports/stats', ReportController.getReportStats);
router.get('/reports/:id', ReportController.getReport);
router.put('/reports/:id/status', ReportController.updateReportStatus);
router.post('/reports/:id/resolve', ReportController.resolveReport);

module.exports = router; 