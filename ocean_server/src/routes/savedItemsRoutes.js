const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const savedItemsController = require('../controllers/savedItemsController');

/**
 * Unified Saved Items Routes
 * All item types (products, posts, auctions, swap deals, group buys, distress sales)
 * use the same endpoints
 */

// Toggle save/unsave an item (universal)
// Body: { itemType: 'product' | 'post' | 'auction' | 'swap_deal' | 'group_buy' | 'distress_sale', collectionName?: string }
router.post('/api/items/:itemId/save', authMiddleware, savedItemsController.toggleSaveItem);

// Get all saved items (with optional filters)
// Query params: page, limit, itemType, collectionName
router.get('/api/saved-items', authMiddleware, savedItemsController.getAllSavedItems);

// Delete a saved item by its saved record ID
router.delete('/api/saved-items/:savedItemId', authMiddleware, savedItemsController.deleteSavedItem);

// Check if an item is saved
// Query param: itemType (required)
router.get('/api/items/:itemId/is-saved', authMiddleware, savedItemsController.checkIfSaved);

module.exports = router;
