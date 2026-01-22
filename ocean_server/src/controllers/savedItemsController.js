const db = require('../../models');
const { SavedItem, Product, Post, Auction, SwapDeal, GroupBuy, SellersTable, UserTable, PostMedia } = db;
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');

// Helper function to get the appropriate model based on item type
const getModelByType = (itemType) => {
  switch(itemType) {
    case 'product':
    case 'distress_sale':
      return Product;
    case 'post':
      return Post;
    case 'auction':
      return Auction;
    case 'swap_deal':
      return SwapDeal;
    case 'group_buy':
      return GroupBuy;
    default:
      return null;
  }
};

// Helper function to validate item exists and get it
const validateAndGetItem = async (itemId, itemType) => {
  const model = getModelByType(itemType);
  if (!model) {
    return { exists: false, item: null, error: 'Invalid item type' };
  }
  
  try {
    const item = await model.findByPk(itemId);
    if (!item) {
      return { exists: false, item: null, error: `${itemType} not found` };
    }
    
    // Additional validation for products (check if distress sale matches)
    if (itemType === 'distress_sale' && !item.isDistressSale) {
      return { exists: false, item: null, error: 'Item is not a distress sale' };
    }
    if (itemType === 'product' && item.isDistressSale) {
      return { exists: false, item: null, error: 'Item is a distress sale, use type: distress_sale' };
    }
    
    return { exists: true, item, error: null };
  } catch (error) {
    return { exists: false, item: null, error: error.message };
  }
};

// Helper function to increment/decrement save count
const updateSaveCount = async (itemId, itemType, increment = true) => {
  const model = getModelByType(itemType);
  if (!model) return;
  
  try {
    if (increment) {
      await model.increment('savedCount', { where: { id: itemId } });
    } else {
      await model.decrement('savedCount', { where: { id: itemId } });
    }
  } catch (error) {
    console.error(`Error updating save count for ${itemType}:`, error);
  }
};

// Helper function for time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
};

/**
 * Toggle save/unsave an item (universal for all item types)
 * POST /api/items/:itemId/save
 * Body: { itemType: 'product' | 'post' | 'auction' | 'swap_deal' | 'group_buy' | 'distress_sale', collectionName?: string }
 */
const toggleSaveItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType, collectionName } = req.body;
    const userId = req.user.id;
    
    // Validate itemType
    if (!itemType) {
      return res.status(400).json({
        success: false,
        message: 'itemType is required in request body'
      });
    }
    
    const validTypes = ['product', 'post', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid itemType. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Validate item exists
    const { exists, item, error } = await validateAndGetItem(itemId, itemType);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: error || 'Item not found'
      });
    }
    
    // Check if already saved
    const existingSave = await SavedItem.findOne({
      where: { userId, itemType, itemId }
    });
    
    if (existingSave) {
      // UNSAVE
      await existingSave.destroy();
      await updateSaveCount(itemId, itemType, false);
      
      return res.status(200).json({
        success: true,
        message: `${itemType} unsaved successfully`,
        data: { isSaved: false }
      });
    } else {
      // SAVE
      await SavedItem.create({
        userId,
        itemType,
        itemId,
        collectionName: collectionName || 'Favorites'
      });
      
      await updateSaveCount(itemId, itemType, true);
      
      // Send notification to item owner (if not saving own item)
      try {
        let ownerId = null;
        
        if (itemType === 'product' || itemType === 'distress_sale') {
          const seller = await SellersTable.findByPk(item.sellerId, {
            attributes: ['userId']
          });
          ownerId = seller?.userId;
        } else if (itemType === 'post') {
          ownerId = item.userId;
        } else if (itemType === 'auction') {
          ownerId = item.sellerId; // Auctions have sellerId as user ID
        } else if (itemType === 'swap_deal') {
          ownerId = item.sellerId; // Swap deals have sellerId
        } else if (itemType === 'group_buy') {
          ownerId = item.creator_id; // Group buys have creator_id
        }
        
        if (ownerId && ownerId !== userId) {
          const saver = await UserTable.findByPk(userId, {
            attributes: ['id', 'fullName', 'username', 'profilePicture']
          });
          
          const itemName = item.title || item.productName || item.name || 'item';
          
          await createNotification(
            ownerId,
            'Item Saved',
            `${saver.fullName || saver.username} saved your ${itemType}: "${itemName}"`,
            'info',
            'item_saved',
            {
              itemId,
              itemType,
              itemName,
              saverId: userId,
              saverName: saver.fullName || saver.username,
              collectionName: collectionName || 'Favorites'
            }
          );
        }
      } catch (notifError) {
        console.error('Error sending save notification:', notifError);
        // Don't fail the save operation if notification fails
      }
      
      return res.status(200).json({
        success: true,
        message: `${itemType} saved successfully`,
        data: { isSaved: true }
      });
    }
  } catch (error) {
    console.error('Toggle save error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error toggling save',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a saved item
 * DELETE /api/saved-items/:savedItemId
 */
const deleteSavedItem = async (req, res) => {
  try {
    const { savedItemId } = req.params;
    const userId = req.user.id;
    
    const savedItem = await SavedItem.findOne({
      where: { id: savedItemId, userId }
    });
    
    if (!savedItem) {
      return res.status(404).json({
        success: false,
        message: 'Saved item not found'
      });
    }
    
    const { itemId, itemType } = savedItem;
    
    await savedItem.destroy();
    await updateSaveCount(itemId, itemType, false);
    
    return res.status(200).json({
      success: true,
      message: 'Saved item removed successfully',
      data: { isSaved: false }
    });
  } catch (error) {
    console.error('Delete saved item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing saved item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all saved items for current user (unified)
 * GET /api/saved-items?page=1&limit=20&itemType=product&collectionName=Favorites
 */
const getAllSavedItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, itemType, collectionName } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    // Build where clause
    let whereClause = { userId };
    if (itemType) {
      whereClause.itemType = itemType;
    }
    if (collectionName) {
      whereClause.collectionName = collectionName;
    }
    
    // Get saved items
    const savedItems = await SavedItem.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Fetch full item details for each saved item
    const formattedItems = await Promise.all(
      savedItems.rows.map(async (savedItem) => {
        const { itemId, itemType } = savedItem;
        
        try {
          const { exists, item } = await validateAndGetItem(itemId, itemType);
          if (!exists || !item) return null; // Skip if item no longer exists
          
          // Format based on item type
          let formattedItem = {
            id: item.id, // Use id for navigation (not itemId)
            savedItemId: savedItem.id,
            type: itemType,
            isSaved: true,
            savedDate: savedItem.created_at.toISOString().split('T')[0],
            timeAgo: getTimeAgo(savedItem.created_at)
          };
          
          // Add type-specific fields
          if (itemType === 'product' || itemType === 'distress_sale') {
            const seller = await SellersTable.findByPk(item.sellerId, {
              include: [{
                model: UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
              }]
            });
            
            formattedItem = {
              ...formattedItem,
              name: item.title, // Use name instead of title
              price: `${item.currency || 'NGN'} ${item.price}`, // Format price as string
              images: item.images || [],
              description: item.description,
              condition: item.condition,
              category: item.category,
              location: item.location,
              seller: seller ? {
                id: seller.user.id,
                name: seller.user.fullName || seller.businessName,
                avatar: seller.user.profilePicture,
                verified: seller.user.accountStatus === 'verified'
              } : null
            };
          } else if (itemType === 'post') {
            const user = await UserTable.findByPk(item.userId, {
              attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
            });
            
            const media = await PostMedia.findAll({
              where: { postId: item.id },
              attributes: ['mediaUrl', 'mediaType'],
              order: [['mediaOrder', 'ASC']]
            });
            
            formattedItem = {
              ...formattedItem,
              name: item.productName || (item.content ? item.content.substring(0, 50) : 'Post'), // Use name
              price: null,
              images: media.map(m => m.mediaUrl),
              description: item.content,
              seller: user ? {
                id: user.id,
                name: user.fullName,
                avatar: user.profilePicture,
                verified: user.accountStatus === 'verified'
              } : null
            };
          } else if (itemType === 'auction') {
            const seller = await SellersTable.findOne({
              where: { userId: item.sellerId },
              include: [{
                model: UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
              }]
            });
            
            formattedItem = {
              ...formattedItem,
              name: item.title, // Use name instead of title
              price: `${item.currency || 'NGN'} ${item.currentPrice || item.startingPrice}`, // Format price as string
              images: item.images || [],
              description: item.description,
              condition: item.condition || null,
              category: item.category,
              location: item.location,
              startTime: item.startTime,
              endTime: item.endTime,
              seller: seller ? {
                id: seller.user.id,
                name: seller.user.fullName || seller.businessName,
                avatar: seller.user.profilePicture,
                verified: seller.user.accountStatus === 'verified'
              } : null
            };
          } else if (itemType === 'swap_deal') {
            const seller = await UserTable.findByPk(item.sellerId, {
              attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
            });
            
            // Parse images if it's a JSON string
            let images = [];
            if (item.images) {
              if (typeof item.images === 'string') {
                try {
                  images = JSON.parse(item.images);
                } catch (e) {
                  images = [];
                }
              } else if (Array.isArray(item.images)) {
                images = item.images;
              }
            }
            
            formattedItem = {
              ...formattedItem,
              name: item.title, // Use name instead of title
              price: null, // Swap deals don't have prices
              images: images,
              description: item.description,
              condition: item.itemCondition || null,
              category: item.category,
              location: item.location,
              productToSwap: item.productToSwap,
              preferredItems: item.preferredItems,
              seller: seller ? {
                id: seller.id,
                name: seller.fullName,
                avatar: seller.profilePicture,
                verified: seller.accountStatus === 'verified'
              } : null
            };
          } else if (itemType === 'group_buy') {
            const seller = await UserTable.findByPk(item.creator_id, {
              attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
            });
            
            // Parse images if it's a JSON string
            let images = [];
            if (item.product_image) {
              if (typeof item.product_image === 'string') {
                try {
                  images = JSON.parse(item.product_image);
                } catch (e) {
                  images = [];
                }
              } else if (Array.isArray(item.product_image)) {
                images = item.product_image;
              }
            }
            
            formattedItem = {
              ...formattedItem,
              name: item.title || item.product_name, // Use name instead of title
              price: `NGN ${item.group_price}`, // Format price as string
              images: images,
              description: item.description,
              condition: null,
              category: item.category,
              location: item.location,
              seller: seller ? { // Use seller instead of creator
                id: seller.id,
                name: seller.fullName,
                avatar: seller.profilePicture,
                verified: seller.accountStatus === 'verified'
              } : null
            };
          }
          
          return formattedItem;
        } catch (error) {
          console.error(`Error fetching ${itemType} ${itemId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null items (deleted/not found)
    const validItems = formattedItems.filter(item => item !== null);
    
    return res.status(200).json({
      success: true,
      message: 'Saved items retrieved successfully',
      data: {
        savedItems: validItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(savedItems.count / limit),
          totalItems: savedItems.count,
          hasNextPage: offset + limit < savedItems.count,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get saved items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving saved items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if an item is saved by current user
 * GET /api/items/:itemId/is-saved?itemType=product
 */
const checkIfSaved = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType } = req.query;
    const userId = req.user.id;
    
    if (!itemType) {
      return res.status(400).json({
        success: false,
        message: 'itemType query parameter is required'
      });
    }
    
    const savedItem = await SavedItem.findOne({
      where: { userId, itemType, itemId }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        isSaved: !!savedItem,
        savedItemId: savedItem?.id || null
      }
    });
  } catch (error) {
    console.error('Check if saved error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking save status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  toggleSaveItem,
  deleteSavedItem,
  getAllSavedItems,
  checkIfSaved
};
