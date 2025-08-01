const jwt = require('jsonwebtoken');
const { UserTable } = require('../../models');

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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await UserTable.findByPk(decoded.id);
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