const express = require('express')
const router = express.Router()
const {signup,login,forgotPassword,verifyResetCode,sellerRegistration} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const updateRoleBasedOnVerification = require('../middleware/sellerVerficationstatusWare')
const updateVerificationStatusBasedOnDocuments = require('../middleware/sellerdocstatusWare')
const currentUserprofile = require('../controllers/profilecontroller')



router.post('/api/signup', signup)
router.post('/api/signin', login)
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
router.post('/api/seller-registration', authMiddleware,sellerRegistration)
//profile routes 
router.get('/api/gfeed',authMiddleware,updateVerificationStatusBasedOnDocuments,updateRoleBasedOnVerification,currentUserprofile)
//......profile


module.exports = router;




