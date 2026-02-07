const express = require('express');
const router = express.Router();
const { sendPush } = require('../controllers/internalController');

/**
 * Middleware: verify internal API token (shared with message server).
 * Protects internal endpoints from unauthorized access.
 */
const internalApiTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const expected = process.env.INTERNAL_API_TOKEN;

  if (!expected) {
    console.warn('INTERNAL_API_TOKEN not set - internal send-push disabled');
    return res.status(503).json({ success: false, message: 'Internal API not configured' });
  }

  if (token !== expected) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

router.post('/api/internal/send-push', internalApiTokenMiddleware, sendPush);

module.exports = router;
