const jwt = require('jsonwebtoken');
const { UserReference } = require('../../models');

const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await UserReference.findByPk(decoded.id);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (user.accountStatus !== 'active') {
      return next(new Error('Authentication error: Account not active'));
    }

    // Add user info to socket
    socket.userId = user.id;
    socket.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accountType: user.accountType,
      profilePicture: user.profilePicture
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    console.error('Socket auth middleware error:', error);
    next(new Error('Authentication error: Internal server error'));
  }
};

module.exports = socketAuthMiddleware; 