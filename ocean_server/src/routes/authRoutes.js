const express = require('express')
const router = express.Router()
const {signup,login} = require('../controllers/authcontroller')



router.post('/api/signup', signup)
router.post('/api/signin', login)


module.exports = router;




