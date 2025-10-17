const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')

const authMiddleware = async (req,res,next)=>{
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token');
    
    // Try to get token from Authorization header first (for Flutter Web)
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
        token = token.substring(7); // Remove 'Bearer ' prefix
    } else {
        // Fallback to cookie (for web browsers)
        token = req.cookies.token;
    }
    
    console.log('Token found:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if(!token){
       return res.status(401).json({message:"Access denied. Token not found!"})
    }
    
    //if found decoding info in token and setting it to user
    try {
        console.log('🔓 Attempting to verify token...');
        const decoded = jwt.verify(token,JWT_SECRET);
        console.log('✅ Token verified successfully. User ID:', decoded.id);
        
        // Check if session is still valid (for logout from all devices)
        if(decoded.sessionId) {
            console.log('🔍 Checking session validity...');
            const sessionKey = `session:${decoded.id}:${decoded.sessionId}`;
            const sessionStatus = await redisClient.get(sessionKey);
            
            console.log('Session status:', sessionStatus);
            
            if(!sessionStatus || sessionStatus !== 'active') {
                console.log('❌ Session expired or invalid');
                return res.status(401).json({message:"Session expired. Please login again."})
            }
            console.log('✅ Session is valid');
        }
        
        req.user = decoded;
        console.log('✅ User set in request. Proceeding to next middleware...');
        next()

    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        res.status(403).json({message:"Invalid or expired token."})
    }
}

module.exports = authMiddleware;