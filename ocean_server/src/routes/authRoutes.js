const express = require('express')
const router = express.Router()
const {signup,login,forgotPassword,verifyResetCode,sellerRegistration} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const updateRoleBasedOnVerification = require('../middleware/sellerVerficationstatusWare')
const updateVerificationStatusBasedOnDocuments = require('../middleware/sellerdocstatusWare')
const currentUserprofile = require('../controllers/profilecontroller')
const {createFeed, getRandomFeed,getFeedsByRegion,searchFeed,getFeedById,editFeedById,deleteFeed,getFeedsByPostersId} = require('../controllers/feedcontroller')



router.post('/api/signup', signup)
router.post('/api/signin', login)
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
router.post('/api/seller-registration', authMiddleware,sellerRegistration)
//profile routes 
router.get('/api/profile',authMiddleware,updateVerificationStatusBasedOnDocuments,updateRoleBasedOnVerification,currentUserprofile)
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




