const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')
const logger = require('../utils/logger')

const authMiddleware = async (req,res,next)=>{
    // Only log in development to reduce Railway log rate limiting
    logger.debug('🔐 Auth middleware called for:', req.method, req.path);
    
    // Try to get token from Authorization header first (for Flutter Web)
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
        token = token.substring(7); // Remove 'Bearer ' prefix
    } else {
        // Fallback to cookie (for web browsers)
        token = req.cookies.token;
    }
    
    if(!token){
       return res.status(401).json({message:"Access denied. Token not found!"})
    }
    
    //if found decoding info in token and setting it to user
    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        logger.debug('✅ Token verified successfully. User ID:', decoded.id);
        
        // Check if session is still valid (for logout from all devices)
        if(decoded.sessionId) {
            const sessionKey = `session:${decoded.id}:${decoded.sessionId}`;
            const sessionStatus = await redisClient.get(sessionKey);
            
            if(!sessionStatus || sessionStatus !== 'active') {
                logger.warn('❌ Session expired or invalid for user:', decoded.id);
                return res.status(401).json({message:"Session expired. Please login again."})
            }
        }
        
        req.user = decoded;
        next()

    } catch (error) {
        logger.error('❌ Token verification failed:', error.message);
        res.status(403).json({message:"Invalid or expired token."})
    }
}

module.exports = authMiddleware;