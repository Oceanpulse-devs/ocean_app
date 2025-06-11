const express = require('express')
const router = express.Router()
const {signup,login,forgotPassword,verifyResetCode,sellerRegistration} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const currentUserprofile = require('../controllers/profilecontroller')



router.post('/api/signup', signup)
router.post('/api/signin', login)
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
router.post('/api/seller-registration', authMiddleware,sellerRegistration)
//feeds routes 
router.get('/api/gfeed',authMiddleware,currentUserprofile)
//......feeds


module.exports = router;




