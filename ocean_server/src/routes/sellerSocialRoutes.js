const express = require('express');
const router = express.Router();
const sellerSocialController = require('../controllers/sellerSocialController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Zernio Webhook endpoints (no authentication middleware)
router.get('/callback', sellerSocialController.handleOAuthCallback);
router.post('/webhooks/zernio', sellerSocialController.handleZernioWebhook);
router.get('/webhooks/zernio', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zernio webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

// Authenticated seller social routes
router.get('/settings', authMiddleware, sellerSocialController.getSocialSettings);
router.post('/connect-url', authMiddleware, sellerSocialController.getConnectUrl);
router.put('/settings', authMiddleware, sellerSocialController.updateSocialSettings);
router.delete('/accounts/:accountId', authMiddleware, sellerSocialController.disconnectAccount);
router.get('/logs', authMiddleware, sellerSocialController.getAutoPostLogs);

module.exports = router;
