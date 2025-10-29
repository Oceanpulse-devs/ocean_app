const jwt = require('jsonwebtoken');
const { UserReference } = require('../../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if this is an internal service token (for service-to-service calls)
    if (token === process.env.INTERNAL_API_TOKEN) {
      // Set a special flag for internal calls
      req.user = {
        id: null, // Not a real user, internal service call
        isInternal: true
      };
      return next();
    }

    // Verify token as JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await UserReference.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid token. User not found.'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        message: 'Account is not active.'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accountType: user.accountType,
      accountStatus: user.accountStatus
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Internal server error.'
    });
  }
};

module.exports = authMiddleware; 