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
const adminDataController = require('../controllers/adminDataController');
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
router.post('/maintenance/schedule', (req, res) => adminController.sendMaintenanceNotification(req, res));
router.post('/maintenance/complete', (req, res) => adminController.sendMaintenanceCompletionNotification(req, res));
router.post('/maintenance/emergency', (req, res) => adminController.sendEmergencyMaintenanceNotification(req, res));

// Feature Update Routes
router.post('/feature-update', (req, res) => adminController.sendFeatureUpdateNotification(req, res));

// App Update Routes
router.post('/app-update', (req, res) => adminController.sendAppUpdateNotification(req, res));

// Security Alert Routes
router.post('/security-alert', (req, res) => adminController.sendSecurityAlertNotification(req, res));

// System Health Routes
router.get('/system-health', (req, res) => adminController.getSystemHealth(req, res));

// ==================== SELLER MANAGEMENT ROUTES ====================

// Seller Operations
router.get('/sellers', (req, res) => sellerManagementController.getAllSellers(req, res));
router.get('/sellers/pending', (req, res) => sellerManagementController.getPendingSellers(req, res));
router.get('/sellers/search', (req, res) => sellerManagementController.searchSellers(req, res));
router.get('/sellers/stats', (req, res) => sellerManagementController.getSellerStats(req, res));
router.get('/sellers/top', (req, res) => sellerManagementController.getTopSellers(req, res));
router.get('/sellers/:id', (req, res) => sellerManagementController.getSellerById(req, res));

// Seller Actions
router.put('/sellers/:id/approve', (req, res) => sellerManagementController.approveSeller(req, res));
router.put('/sellers/:id/reject', (req, res) => sellerManagementController.rejectSeller(req, res));
router.put('/sellers/:id/suspend', (req, res) => sellerManagementController.suspendSeller(req, res));
router.put('/sellers/:id/activate', (req, res) => sellerManagementController.activateSeller(req, res));
router.delete('/sellers/:id', (req, res) => sellerManagementController.deleteSeller(req, res));

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
router.get('/reports/list', (req, res) => ReportController.getAllReports(req, res));
router.get('/reports/stats', (req, res) => ReportController.getReportStats(req, res));
router.get('/reports/:id', (req, res) => ReportController.getReport(req, res));
router.put('/reports/:id/status', (req, res) => ReportController.updateReportStatus(req, res));
router.post('/reports/:id/resolve', (req, res) => ReportController.resolveReport(req, res));

// ==================== ADMIN DATA EXPORT ROUTES ====================
// All stored data per entity (no status/expiry filters); optional ?page=1&limit=100 (max 500)
router.get('/data/buyer-needs', adminDataController.getAllBuyerNeedsData.bind(adminDataController));
router.get('/data/products', adminDataController.getAllProductsData.bind(adminDataController));
router.get('/data/distress-sales', adminDataController.getAllDistressSalesData.bind(adminDataController));
router.get('/data/swap-deals', adminDataController.getAllSwapDealsData.bind(adminDataController));
router.get('/data/auctions', adminDataController.getAllAuctionsData.bind(adminDataController));
router.get('/data/group-buys', adminDataController.getAllGroupBuysData.bind(adminDataController));

module.exports = router; 