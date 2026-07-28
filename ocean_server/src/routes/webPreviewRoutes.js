const express = require('express');
const router = express.Router();
const webPreviewController = require('../controllers/webPreviewController');

// Dynamic OpenGraph preview routes for social media sharing (WhatsApp, Twitter, Facebook, Telegram)
router.get('/products/:id', webPreviewController.getProductPreview);
router.get('/distress-sales/:id', webPreviewController.getDistressSalePreview);
router.get('/auctions/:id', webPreviewController.getAuctionPreview);

// Generic fallbacks for deep-linked paths when opened via web browser / bots
router.get('/feed', webPreviewController.getGenericPreview);
router.get('/feed/:id', webPreviewController.getGenericPreview);
router.get('/videos', webPreviewController.getGenericPreview);
router.get('/videos/:id', webPreviewController.getGenericPreview);
router.get('/swap-deals/:id', webPreviewController.getGenericPreview);
router.get('/bulk-purchase-:id', webPreviewController.getGenericPreview);
router.get('/posts/:id', webPreviewController.getGenericPreview);

module.exports = router;
