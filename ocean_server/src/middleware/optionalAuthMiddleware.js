const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const redisClient = require('../config/redisdb');

/**
 * Optional authentication middleware
 * - Doesn't block requests if no token
 * - Sets req.user if valid token is provided
 * - Allows anonymous access
 */
const optionalAuthMiddleware = async (req, res, next) => {
  // Try to get token from Authorization header first (for Flutter Web)
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7); // Remove 'Bearer ' prefix
  } else {
    // Fallback to cookie (for web browsers)
    token = req.cookies?.token;
  }

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  // If token found, try to verify it
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session is still valid (for logout from all devices)
    if (decoded.sessionId) {
      const sessionKey = `session:${decoded.id}:${decoded.sessionId}`;
      const sessionStatus = await redisClient.get(sessionKey);
      
      if (sessionStatus && sessionStatus === 'active') {
        req.user = decoded;
        console.log('✅ Optional auth: User authenticated:', decoded.id);
      }
      // If session invalid, just continue without req.user (don't block)
    } else {
      req.user = decoded;
      console.log('✅ Optional auth: User authenticated:', decoded.id);
    }
    
    next();
  } catch (error) {
    // Token invalid or expired - just continue without req.user (don't block)
    console.log('⚠️ Optional auth: Invalid token, continuing as anonymous');
    next();
  }
};

module.exports = optionalAuthMiddleware;

