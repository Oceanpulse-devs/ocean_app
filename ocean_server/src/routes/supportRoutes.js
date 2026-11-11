const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const SupportController = require('../controllers/supportController');

// Get Chatwoot support configuration & HMAC-SHA256 user identity hash
router.get('/config', authMiddleware, SupportController.getSupportConfig);
router.get('/chatwoot-config', authMiddleware, SupportController.getSupportConfig);

// Hosted live widget page (for instant testing & optional mobile WebView embedding)
router.get('/widget', SupportController.renderSupportWidget);

module.exports = router;
