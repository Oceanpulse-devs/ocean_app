const express = require('express')
const router = express.Router()
const {signup,login,forgotPassword,verifyResetCode} = require('../controllers/authcontroller')
const authMiddleware = require('../middleware/authMiddleware')
const generalfeed = require('../controllers/feedscontroller')



router.post('/api/signup', signup)
router.post('/api/signin', login)
router.post('/api/forgot-password',forgotPassword)
router.post('/api/verify-resetCode',verifyResetCode)
//feeds routes 
router.get('/api/gfeed',authMiddleware,generalfeed)
//......feeds


module.exports = router;




