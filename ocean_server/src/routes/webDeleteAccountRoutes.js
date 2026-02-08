const express = require('express');
const router = express.Router();
const webDeleteAccountController = require('../controllers/webDeleteAccountController');

// Public routes - no auth required (Google Play web deletion requirement)
router.get('/delete-account', webDeleteAccountController.getDeleteAccountForm);
router.post('/delete-account/request', webDeleteAccountController.postDeleteAccountRequest);
router.get('/delete-account/confirm', webDeleteAccountController.getDeleteAccountConfirm);

module.exports = router;
