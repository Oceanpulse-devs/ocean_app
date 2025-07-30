const express = require('express')
const router = express.Router()
const {signup,login,forgotPassword,verifyResetCode,resetPassword,sellerRegistration} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const updateRoleBasedOnVerification = require('../middleware/sellerVerficationstatusWare')
const updateVerificationStatusBasedOnDocuments = require('../middleware/sellerdocstatusWare')
const currentUserprofile = require('../controllers/profilecontroller')
const {createFeed, getRandomFeed,getFeedsByRegion,searchFeed,getFeedById,editFeedById,deleteFeed,getFeedsByPostersId} = require('../controllers/feedcontroller')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const redisClient = require('../config/redisdb')


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

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    //facebook:
    router.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
    router.get('/api/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/api/auth/facebook/failure' }), (req, res) => {
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
        res.redirect(`${process.env.CLIENT_URL}/auth/success?provider=facebook`);
    });
    
    // Facebook OAuth failure route
    router.get('/api/auth/facebook/failure', (req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/auth/failure?provider=facebook`);
    });
}

router.post('/api/signup', signup)
router.post('/api/signin', login)
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
        
        const activeSessions = sessionKeys.length;
        
        res.status(200).json({ 
            message: 'Active sessions retrieved successfully',
            activeSessions: activeSessions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving active sessions', error: error.message });
    }
});
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
router.post('/api/reset-password',resetPassword)
router.post('/api/seller-registration', authMiddleware,sellerRegistration)


//profile routes 
router.get('/api/profile', authMiddleware, currentUserprofile)
//......profile
//feed
router.post('/api/create-feed', authMiddleware, createFeed)
router.get('/api/get-feed',authMiddleware, getRandomFeed)
router.get('/api/get-feed/:region',authMiddleware,getFeedsByRegion)
router.get('/api/search-feed/:query',authMiddleware,searchFeed)
router.get('/api/get-detailedfeed/:feedId',authMiddleware,getFeedById)
router.put('/api/edit-feed/:feedId',authMiddleware,editFeedById)
router.delete('/api/delete-feed/:feedId',authMiddleware,deleteFeed)
router.get('/api/get-current-user-feeds',authMiddleware,getFeedsByPostersId)
//....feeds



module.exports = router;




