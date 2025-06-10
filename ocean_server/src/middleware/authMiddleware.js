const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
       return res.status(401).json({message:"Access denied. token not found!"})
    }
    //if found decoding info in token and setting it to user
    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        req.user = decoded;
        next()

    } catch (error) {
        res.status(403).json({message:"Invalid or expired token."})
    }
}

module.exports = authMiddleware;