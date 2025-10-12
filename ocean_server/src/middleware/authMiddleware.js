const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')

const authMiddleware = async (req,res,next)=>{
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
        
        // Check if session is still valid (for logout from all devices)
        if(decoded.sessionId) {
            const sessionKey = `session:${decoded.id}:${decoded.sessionId}`;
            const sessionStatus = await redisClient.get(sessionKey);
            
            if(!sessionStatus || sessionStatus !== 'active') {
                return res.status(401).json({message:"Session expired. Please login again."})
            }
        }
        
        req.user = decoded;
        next()

    } catch (error) {
        res.status(403).json({message:"Invalid or expired token."})
    }
}

module.exports = authMiddleware;