const express = require('express')
const router = express.Router()
const multer = require('multer')
const {signup,login,forgotPassword,verifyResetCode,resetPassword,sellerRegistration,verifyEmail,resendVerificationEmail,googleMobileAuth,deleteAccount} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const updateRoleBasedOnVerification = require('../middleware/sellerVerficationstatusWare')
const updateVerificationStatusBasedOnDocuments = require('../middleware/sellerdocstatusWare')
const { updateBusinessInfo } = require('../controllers/sellerBusinessController')
const { currentUserprofile, getUserProfileById } = require('../controllers/profilecontroller')
const { updateProfile } = require('../controllers/profileUpdateController')
const { registerFcmToken, unregisterFcmToken } = require('../controllers/fcmTokenController')

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
    
    // Google Mobile Authentication - for mobile apps using Google Sign-In SDK
    router.post('/api/auth/google/mobile', googleMobileAuth);
}

// Apple Mobile Authentication
const { appleMobileAuth } = require('../controllers/authcontroller');
router.post('/api/auth/apple/mobile', appleMobileAuth);



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

// FCM push notification token (register / unregister)
router.post('/api/fcm-token', authMiddleware, registerFcmToken);
router.delete('/api/fcm-token', authMiddleware, unregisterFcmToken);

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
router.delete('/api/account/delete', authMiddleware, deleteAccount)
router.post('/api/seller-registration', authMiddleware, upload.fields([
  { name: 'businessDocument', maxCount: 1 },
  { name: 'personalId', maxCount: 1 }
]), sellerRegistration)

// Inline seller business information update (from profile page)
router.put('/api/seller/business-info', authMiddleware, updateBusinessInfo)


// Middleware to conditionally apply multer only for multipart requests
const optionalMulter = (req, res, next) => {
  // Only use multer if the request is multipart/form-data
  // Check Content-Type header to determine if multer should process
  const contentType = req.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'coverPicture', maxCount: 1 }
    ])(req, res, next);
  }
  // For JSON requests, skip multer and proceed directly
  next();
};

//profile routes 
// Use router.route() to explicitly register both GET and PUT on the same path
router.route('/api/profile')
  .put(authMiddleware, optionalMulter, updateProfile)
  .get(authMiddleware, currentUserprofile)

router.get('/api/users/:userId', authMiddleware, getUserProfileById)
// Public endpoint for messaging server to sync users
router.get('/api/user/:userId', getUserProfileById)



module.exports = router;




