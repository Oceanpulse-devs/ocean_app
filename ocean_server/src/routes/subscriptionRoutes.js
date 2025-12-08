const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Subscription Routes
 * 
 * All subscription-related API endpoints with proper authentication
 * and subscription middleware integration
 */

// =============================================
// SUBSCRIPTION MANAGEMENT ROUTES
// =============================================

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 * Public endpoint - no authentication required
 */
router.get('/plans', SubscriptionController.getAvailablePlans);

/**
 * GET /api/subscriptions/current
 * Get user's current subscription status
 * Requires authentication
 */
router.get('/current', authMiddleware, SubscriptionController.getCurrentSubscription);

/**
 * POST /api/subscriptions/subscribe
 * Subscribe to a plan
 * Requires authentication
 */
router.post('/subscribe', authMiddleware, SubscriptionController.subscribeToPlan);

/**
 * POST /api/subscriptions/change-plan
 * Change subscription plan (upgrade/downgrade)
 * Requires authentication
 */
router.post('/change-plan', authMiddleware, SubscriptionController.changePlan);

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 * Requires authentication
 */
router.post('/cancel', authMiddleware, SubscriptionController.cancelSubscription);

/**
 * POST /api/subscriptions/verify-payment
 * Verify payment and update subscription status
 * Body: { paymentReference, paymentMethod }
 * Requires authentication
 */
router.post('/verify-payment', authMiddleware, SubscriptionController.verifyPayment);

// =============================================
// USAGE & ANALYTICS ROUTES
// =============================================

/**
 * GET /api/subscriptions/usage
 * Get user's usage statistics
 * Query params: days (default: 7)
 * Requires authentication
 */
router.get('/usage', authMiddleware, SubscriptionController.getUsageStats);

/**
 * GET /api/subscriptions/check/:actionType
 * Check if user can perform specific action
 * Action types: listings, group_buys, swap_deals, auctions, distress_sales, dms, notifications, ar_products, promotional_boosts
 * Requires authentication
 */
router.get('/check/:actionType', authMiddleware, SubscriptionController.checkActionEligibility);

/**
 * GET /api/subscriptions/analytics
 * Get subscription analytics
 * Query params: days (default: 30)
 * Requires authentication
 */
router.get('/analytics', authMiddleware, SubscriptionController.getSubscriptionAnalytics);

// =============================================
// PROMOTIONAL BOOSTS ROUTES
// =============================================

/**
 * POST /api/subscriptions/boosts
 * Create promotional boost
 * Body: { boostType, targetId, durationHours?, reason? }
 * Requires authentication
 */
router.post('/boosts', authMiddleware, SubscriptionController.createPromotionalBoost);

/**
 * GET /api/subscriptions/boosts
 * Get user's promotional boosts
 * Query params: status (default: active)
 * Requires authentication
 */
router.get('/boosts', authMiddleware, SubscriptionController.getPromotionalBoosts);

// =============================================
// PAYMENT PROCESSING ROUTES
// =============================================

/**
 * POST /api/subscriptions/confirm-payment
 * Manual payment confirmation (for development/admin use)
 * Body: { paymentReference }
 * Requires authentication
 */
router.post('/confirm-payment', authMiddleware, SubscriptionController.confirmPayment);

// =============================================
// WEBHOOK ROUTES
// =============================================

/**
 * POST /api/subscriptions/webhooks/paystack
 * Handle payment webhook from Paystack
 * No authentication required (uses webhook signature verification)
 */
router.post('/webhooks/paystack', SubscriptionController.handlePaymentWebhook);

/**
 * GET /api/subscriptions/webhooks/paystack
 * Test endpoint to verify webhook URL is accessible
 * No authentication required
 */
    router.get('/webhooks/paystack', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Paystack webhook endpoint is accessible on port 5000',
            timestamp: new Date().toISOString()
        });
    });

/**
 * GET /api/subscriptions/test-paystack
 * Test Paystack integration with real test transaction
 * No authentication required
 */
router.get('/test-paystack', async (req, res) => {
  try {
    // Use Paystack's test transaction reference
    const testReference = 'test_reference_123456789';
    
    console.log('Testing Paystack integration with reference:', testReference);
    
    // This will test the Paystack API connection
    const { PaymentProvider } = require('../providers/PaymentProvider');
    const result = await PaymentProvider.verifyPayment(testReference);
    
    res.json({
      success: true,
      message: 'Paystack integration test completed',
      data: {
        testReference,
        paystackResult: result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Paystack test error:', error);
    res.status(500).json({
      success: false,
      message: 'Paystack test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/subscriptions/debug-subscriptions
 * Debug endpoint to show all subscriptions for a user
 * Requires authentication
 */
router.get('/debug-subscriptions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Debug: Getting all subscriptions for user:', userId);
    
    const { UserSubscription, SubscriptionPlan } = require('../../models');
    
    const allSubscriptions = await UserSubscription.findAll({
      where: { userId: userId },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      order: [['created_at', 'DESC']]
    });
    
    const activeSubscriptions = await UserSubscription.findAll({
      where: { 
        userId: userId,
        status: 'active',
        endDate: { [require('sequelize').Op.gt]: new Date() }
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      message: 'Debug subscription data',
      data: {
        userId,
        allSubscriptions: allSubscriptions.map(sub => ({
          id: sub.id,
          userId: sub.userId,
          planId: sub.planId,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          planName: sub.plan?.name,
          createdAt: sub.created_at
        })),
        activeSubscriptions: activeSubscriptions.map(sub => ({
          id: sub.id,
          userId: sub.userId,
          planId: sub.planId,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          planName: sub.plan?.name,
          createdAt: sub.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Debug subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting debug subscription data',
      error: error.message
    });
  }
});

/**
 * POST /api/subscriptions/cancel-all-active
 * Test endpoint to cancel all active subscriptions for a user
 * Requires authentication
 */
router.post('/cancel-all-active', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Cancelling all active subscriptions for user:', userId);
    
    const { UserSubscription } = require('../../models');
    
    const result = await UserSubscription.update({
      status: 'cancelled',
      cancellationReason: 'Manual cancellation for testing',
      cancelledAt: new Date()
    }, {
      where: { 
        userId: userId,
        status: 'active'
      }
    });
    
    res.json({
      success: true,
      message: 'All active subscriptions cancelled successfully',
      data: {
        userId,
        cancelledCount: result[0] // Number of affected rows
      }
    });
  } catch (error) {
    console.error('Cancel all active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel active subscriptions',
      error: error.message
    });
  }
});

/**
 * GET /api/subscriptions/callback/paystack
 * Handle payment callback from Paystack (mobile app redirect)
 * No authentication required
 */
router.get('/callback/paystack', SubscriptionController.handlePaymentCallback);

/**
 * POST /api/subscriptions/webhooks/flutterwave
 * Handle payment webhook from Flutterwave
 * No authentication required (uses webhook signature verification)
 */
router.post('/webhooks/flutterwave', SubscriptionController.handleFlutterwaveWebhook);

/**
 * GET /api/subscriptions/webhooks/flutterwave
 * Test endpoint to verify webhook URL is accessible
 * No authentication required
 */
router.get('/webhooks/flutterwave', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Flutterwave webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/subscriptions/callback/flutterwave
 * Handle payment callback from Flutterwave (redirect after payment)
 * No authentication required
 */
router.get('/callback/flutterwave', SubscriptionController.handleFlutterwaveCallback);

// =============================================
// ADMIN ROUTES (Future Implementation)
// =============================================

/**
 * GET /api/admin/subscriptions
 * Get all subscriptions (admin only)
 * TODO: Implement admin middleware
 */
// router.get('/admin/subscriptions', adminMiddleware, SubscriptionController.getAllSubscriptions);

/**
 * GET /api/admin/subscriptions/stats
 * Get subscription statistics (admin only)
 * TODO: Implement admin middleware
 */
// router.get('/admin/subscriptions/stats', adminMiddleware, SubscriptionController.getSubscriptionStats);

/**
 * POST /api/admin/subscriptions/:id/activate
 * Manually activate subscription (admin only)
 * TODO: Implement admin middleware
 */
// router.post('/admin/subscriptions/:id/activate', adminMiddleware, SubscriptionController.activateSubscription);

/**
 * POST /api/admin/subscriptions/:id/deactivate
 * Manually deactivate subscription (admin only)
 * TODO: Implement admin middleware
 */
// router.post('/admin/subscriptions/:id/deactivate', adminMiddleware, SubscriptionController.deactivateSubscription);

module.exports = router;
