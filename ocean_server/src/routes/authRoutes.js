const express = require('express')
const router = express.Router()
const multer = require('multer')
const {signup,login,forgotPassword,verifyResetCode,resetPassword,sellerRegistration,verifyEmail,resendVerificationEmail} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const updateRoleBasedOnVerification = require('../middleware/sellerVerficationstatusWare')
const updateVerificationStatusBasedOnDocuments = require('../middleware/sellerdocstatusWare')
const { currentUserprofile, getUserProfileById } = require('../controllers/profilecontroller')
const { updateProfile } = require('../controllers/profileUpdateController')

const passport = require('passport')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')

// Configure multer for profile picture uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  }
});


//auth routes
// OAuth routes - only register if environment variables are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
//google:
router.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }), (req, res) => {
        // Generate JWT token for the authenticated user
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.accountType },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Set JWT token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Redirect to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/auth/success?provider=google`);
    });
    
    // Google OAuth failure route
    router.get('/api/auth/google/failure', (req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/auth/failure?provider=google`);
    });
}



router.post('/api/signup', signup)
router.post('/api/login', login)
router.post('/api/verify-email', verifyEmail)
router.post('/api/resend-verification', resendVerificationEmail)
router.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/api/logout-all-devices', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all session keys for this user
        const sessionKeys = await redisClient.keys(`session:${userId}:*`);
        
        // Delete all sessions for this user
        if(sessionKeys.length > 0) {
            await redisClient.del(sessionKeys);
        }
        
        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out from all devices', error: error.message });
    }
});

router.get('/api/active-sessions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all session keys for this user
        const sessionKeys = await redisClient.keys(`session:${userId}:*`);
        
        // Get session details
        const sessions = [];
        for (const key of sessionKeys) {
            const sessionId = key.split(':')[2];
            const status = await redisClient.get(key);
            const ttl = await redisClient.ttl(key);
            
            sessions.push({
                sessionId,
                status,
                expiresIn: ttl > 0 ? ttl : 0
            });
        }
        
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ message: 'Error getting active sessions', error: error.message });
    }
});

// Get messaging token for messaging server
router.get('/api/messaging-token', authMiddleware, (req, res) => {
    try {
        // Get the token from the request cookies
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'No token found' });
        }
        
        // Return the token for the messaging server
        res.json({ 
            message: 'Messaging token retrieved successfully',
            token: token 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error getting messaging token', error: error.message });
    }
});
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
router.post('/api/reset-password',resetPassword)
router.post('/api/seller-registration', authMiddleware, upload.fields([
  { name: 'businessDocument', maxCount: 1 },
  { name: 'personalId', maxCount: 1 }
]), sellerRegistration)


//profile routes 
router.get('/api/profile', authMiddleware, currentUserprofile)
router.get('/api/users/:userId', authMiddleware, getUserProfileById)
// Public endpoint for messaging server to sync users
router.get('/api/user/:userId', getUserProfileById)
router.put('/api/profile', authMiddleware, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'coverPicture', maxCount: 1 }
]), updateProfile)



module.exports = router;




