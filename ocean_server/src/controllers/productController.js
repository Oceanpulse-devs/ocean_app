const { Product, ProductCategory, SavedItem, Post, PostMedia, UserTable, SellersTable, UserFollows, ProductLike, Auction, SwapDeal, GroupBuy } = require('../../models');
const db = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const imageCompressionService = require('../services/imageCompressionService');
const { checkSubscriptionLimit, incrementUsage } = require('../middleware/subscriptionMiddleware');
const { productListingMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');
const { mapFullResponse, wrapProductsList } = require('../../utils/fieldMapper');
const PromotionHelperService = require('../services/promotionHelperService');
const RankingService = require('../services/rankingService');
const SpotlightService = require('../services/spotlightService');
const TopPlacementService = require('../services/topPlacementService');
const redisClient = require('../config/redisdb');
const { createNotification } = require('./notificationController');

// Helper function to map product field names for frontend
const mapProductResponse = (product) => {
  const mapped = product.toJSON ? product.toJSON() : { ...product };
  return {
    ...mapped,
    name: mapped.title,  // Map title → name for frontend
    arModel: mapped.arModel || null  // Include AR model URL
  };
};

// Get all products with search and filters
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            condition,
            location,
            sortBy = 'random',
            sortOrder = 'DESC',
            sellerId
        } = req.query;

        const currentUserId = req.user?.id;

        // Create cache key based on query parameters
        const cacheKey = `products:${page}:${limit}:${search || ''}:${category || ''}:${subcategory || ''}:${brand || ''}:${minPrice || ''}:${maxPrice || ''}:${condition || ''}:${location || ''}:${sortBy}:${currentUserId || 'guest'}`;
        
        // Try to get from Redis cache first
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const cachedData = JSON.parse(cached);
                return res.status(200).json(cachedData);
            }
        } catch (redisError) {
            console.error('Redis cache read failed:', redisError.message);
            // Continue with DB query if cache fails
        }

        // Use subscription-aware search service
        const searchResults = await SubscriptionAwareSearchService.searchProducts({
            query: search,
            category,
            subcategory,
            brand,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            condition,
            location,
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy
        }, currentUserId);

        // Map product field names for frontend (title → name)
        let mappedProducts = searchResults.products.map(mapProductResponse);

        // Include promotion fields and sort by promotion priority
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        // 🔒 Block Exclusion: Filter out products listed by blocked sellers
        if (currentUserId) {
            const { getBlockedUserIds } = require('../utils/userBlockHelper');
            const blockedUserIds = await getBlockedUserIds(currentUserId);
            if (blockedUserIds.length > 0) {
                mappedProducts = mappedProducts.filter(p => {
                    const sellerUserId = p.seller?.user?.id || p.seller?.userId;
                    return !sellerUserId || !blockedUserIds.includes(sellerUserId);
                });
            }
        }



        // Wrap products in proper structure {data: {products: [...], pagination: {...}}}
        const response = wrapProductsList({
            success: true,
            data: mappedProducts,
            pagination: searchResults.pagination,
            searchInfo: searchResults.searchInfo
        });
        
        // Cache in Redis (expire after 2 minutes)
        try {
            await redisClient.setEx(cacheKey, 120, JSON.stringify(response));
        } catch (redisError) {
            console.error('Redis cache write failed:', redisError.message);
        }
        
        res.status(200).json(response);

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: "Error retrieving products", error: error.message });
    }
};

// Get single product with engagement status
const getProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const currentUserId = req.user?.id;

        const product = await Product.findOne({
            where: { id: productId, status: 'active' },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'businessPhone', 'country', 'state', 'category', 'verificationStatus'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        }
                    ]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Increment view count (deduplicated for logged-in users - one view per user per product)
        // Composite primary key (productId, viewerId) prevents duplicate views from same user
        if (currentUserId && product.seller && currentUserId !== product.seller.userId) {
            // Use findOrCreate to ensure one view per user per product
            const [view, created] = await db.ProductView.findOrCreate({
                where: { productId: product.id, viewerId: currentUserId },
                defaults: { viewedAt: new Date() }
            });
            
            // Only increment view count if this is a new view (not a duplicate)
            if (created) {
                await product.increment('views');
            }
        } else if (!currentUserId) {
            // Anonymous users - cannot dedupe, always increment
            await product.increment('views');
        }

        // Note: Removed notification for product views - views should not trigger notifications

        const productData = product.toJSON();

        // Add engagement status for current user
        if (currentUserId) {
            const [userSaved, userLiked] = await Promise.all([
                SavedItem.findOne({ where: { itemId: productId, itemType: 'product', userId: currentUserId } }),
                ProductLike.findOne({ where: { productId, userId: currentUserId } })
            ]);

            // Check follow status separately to handle potential table/column issues gracefully
            let userFollow = null;
            try {
                userFollow = await UserFollows.findOne({ 
                    where: { 
                        userId: currentUserId, 
                        followsUserId: product.seller.userId 
                    } 
                });
            } catch (error) {
                // If UserFollows table has issues, just set isFollowing to false
                console.warn('Error checking follow status:', error.message);
                userFollow = null;
            }

            productData.isSaved = !!userSaved;
            productData.isFollowing = !!userFollow;
            productData.isLiked = !!userLiked;
        }

        // Map product field names for frontend (title → name)
        let mappedProductData = mapProductResponse(productData);

        // Include promotion fields
        mappedProductData = PromotionHelperService.includePromotionFields(mappedProductData);

        // Attach canonical sellerEntityId for frontend convenience
        if (mappedProductData?.seller?.id) {
            mappedProductData.sellerEntityId = mappedProductData.seller.id;
        }

        res.status(200).json({
            message: "Product retrieved successfully",
            data: mappedProductData
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: "Error retrieving product", error: error.message });
    }
};

// Create new product (SELLERS ONLY)
const createProduct = async (req, res) => {
    try {
        // Accept both 'name' (frontend) and 'title' (backend) for backward compatibility
        const {
            title,
            name,
            description,
            price,
            currency = 'USD',
            brand,
            category,
            subcategory,
            condition = 'good',
            location,
            images
        } = req.body;

        // Use 'title' or 'name' field (frontend sends 'name', backend expects 'title')
        const productTitle = title || name;

        const userId = req.user.id;

        // Check if user is a seller
        const seller = await SellersTable.findOne({
            where: { userId, verificationStatus: 'approved' }
        });

        if (!seller) {
            return res.status(403).json({ 
                message: "Only verified sellers can create products" 
            });
        }

        // Check subscription limits for product creation
        console.log('Checking subscription limits for user:', req.user.id);
        const subscriptionCheck = await checkSubscriptionLimit(req.user.id, 'listings');
        console.log('Subscription check result:', subscriptionCheck);
        
        if (!subscriptionCheck.allowed) {
            return res.status(403).json({
                message: subscriptionCheck.reason,
                upgradeRequired: true,
                currentPlan: subscriptionCheck.plan,
                suggestedPlan: subscriptionCheck.plan ? 'surge' : 'wave'
            });
        }

        // Validate and set location with fallback
        let productLocation = location?.trim();
        
        // DEBUG: Log received location
        console.log('📍 Location received from frontend:', {
            raw: location,
            trimmed: productLocation,
            isEmpty: !productLocation || productLocation.length === 0
        });
        
        // If location is empty or undefined, try to get from seller's profile
        if (!productLocation || productLocation.length === 0) {
            // Get seller's country/location as fallback
            const sellerInfo = await SellersTable.findOne({
                where: { userId, verificationStatus: 'approved' },
                attributes: ['country', 'businessAddress', 'businessName']
            });
            
            // Try seller's country, then business address, then default
            productLocation = sellerInfo?.country || 
                           (sellerInfo?.businessAddress ? sellerInfo.businessAddress.split(',')[0].trim() : null) || 
                           'Nigeria';
            
            console.log('⚠️ Location was empty/undefined, using fallback:', {
                sellerCountry: sellerInfo?.country,
                businessAddress: sellerInfo?.businessAddress,
                finalLocation: productLocation
            });
        }

        // Validate required fields (use productLocation instead of location)
        if (!productTitle || !description || !price || !category || !productLocation) {
            return res.status(400).json({
                message: "Title/Name, description, price, category, and location are required"
            });
        }

        // Validate price is greater than 0
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            return res.status(400).json({
                message: "Price must be greater than 0"
            });
        }

        // Accept any category from frontend without validation
        // Category is stored as-is from the seller's selected categories
        console.log('Product category from frontend:', category);

        // Validate images/files
        if (!req.files || !req.files.images || req.files.images.length === 0) {
            return res.status(400).json({
                message: "At least one product image is required"
            });
        }

        // Create product first
        const product = await Product.create({
            sellerId: seller.id,
            title: productTitle.trim(),
            description: description.trim(),
            price: parseFloat(price),
            currency,
            brand: brand?.trim(),
            category: category.trim(),
            subcategory: subcategory?.trim(),
            condition,
            location: productLocation, // Use the validated/fallback location
            images: [] // Will be populated with Cloudinary URLs
        });

        // Track subscription usage for product creation
        console.log('Incrementing usage for user:', userId, 'action: listings');
        const usageResult = await incrementUsage(userId, 'listings');
        console.log('Usage increment result:', usageResult);

        // DEBUG: Log what files we received
        console.log('📦 Files received:', {
            filesKeys: req.files ? Object.keys(req.files) : 'no files object',
            imagesCount: req.files?.images?.length || 0,
            arModelCount: req.files?.arModel?.length || 0,
            allFiles: req.files ? Object.keys(req.files) : []
        });

        // Upload images to Cloudinary
        const imageUrls = [];
        for (let i = 0; i < req.files.images.length; i++) {
            const file = req.files.images[i];
            try {
                // Compress image before upload if it's an image file
                let imageBuffer = file.buffer;
                if (file.mimetype.startsWith('image/')) {
                    imageBuffer = await imageCompressionService.compressProductImage(file.buffer);
                }
                
                const uploadResult = await cloudinaryService.uploadProductImage(imageBuffer, product.id);
                
                if (!uploadResult.success) {
                    console.error('Cloudinary upload failed:', uploadResult.error);
                    throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
                }
                
                imageUrls.push(uploadResult.url);
            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                throw error;
            }
        }

        // Upload AR model if provided (optional)
        let arModelUrl = null;
        
        // DEBUG: Add more detailed logging
        console.log('🔍 Checking for AR model:', {
            hasFiles: !!req.files,
            hasArModel: !!(req.files && req.files.arModel),
            arModelLength: req.files?.arModel?.length || 0,
            allFieldNames: req.files ? Object.keys(req.files) : []
        });
        
        if (req.files.arModel && req.files.arModel.length > 0) {
            const arFile = req.files.arModel[0];
            console.log('📤 Attempting to upload AR model:', {
                filename: arFile.originalname,
                mimetype: arFile.mimetype,
                size: arFile.size,
                fieldname: arFile.fieldname
            });
            
            try {
                const arUploadResult = await cloudinaryService.uploadARModel(arFile.buffer, product.id);
                
                console.log('☁️ Cloudinary AR upload result:', {
                    success: arUploadResult.success,
                    url: arUploadResult.url,
                    error: arUploadResult.error
                });
                
                if (!arUploadResult.success) {
                    console.error('AR model upload failed:', arUploadResult.error);
                    // Don't fail the product creation if AR upload fails
                    console.warn('Product created but AR model upload failed');
                } else {
                    arModelUrl = arUploadResult.url;
                    console.log('✅ AR model uploaded successfully:', arModelUrl);
                }
            } catch (error) {
                console.error('Error uploading AR model:', error);
                // Don't fail the product creation if AR upload fails
            }
        } else {
            console.log('⚠️ No AR model file found in request');
        }

        // Update product with image URLs and AR model URL
        await product.update({ 
            images: imageUrls,
            arModel: arModelUrl
        });

        // Get created product with associations
        const createdProduct = await Product.findByPk(product.id, {
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'businessEmail', 'country', 'state', 'category', 'verificationStatus'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        }
                    ]
                }
            ]
        });

        // Map product for frontend and add sellerEntityId/sellerMeta
        const mappedProduct = mapProductResponse(createdProduct.toJSON());
        
        // Attach sellerEntityId and sellerMeta
        if (mappedProduct?.seller?.id) {
            mappedProduct.sellerEntityId = mappedProduct.seller.id;
            mappedProduct.sellerMeta = {
                businessName: mappedProduct.seller.businessName || null,
                profilePicture: mappedProduct.seller.user?.profilePicture || null,
                businessEmail: mappedProduct.seller.businessEmail || null
            };
        }

        // Trigger background social auto-post if requested or default
        const { autoPostSocials, targetPlatforms, socialCaption } = req.body;
        if (autoPostSocials !== false && autoPostSocials !== 'false') {
            const socialAutoPostService = require('../services/socialAutoPostService');
            socialAutoPostService.triggerAutoPost({
                sellerId: seller.id,
                itemType: 'product',
                itemData: createdProduct,
                targetPlatforms,
                customCaption: socialCaption
            });
        }

        res.status(201).json({
            message: "Product created successfully",
            data: mappedProduct
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};

// Update product (SELLER OWNER ONLY)
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        const updateData = { ...req.body };

        // Check if user is a seller
        const seller = await SellersTable.findOne({
            where: { userId, verificationStatus: 'approved' }
        });

        if (!seller) {
            return res.status(403).json({ 
                message: "Only verified sellers can update products" 
            });
        }

        // Check if product exists and belongs to seller
        const product = await Product.findOne({
            where: { id: productId, sellerId: seller.id }
        });

        if (!product) {
            return res.status(404).json({ 
                message: "Product not found or you don't have permission to update it" 
            });
        }

        // Handle frontend field name transformation
        // name → title (for backward compatibility)
        if (updateData.name !== undefined && !updateData.title) {
            updateData.title = updateData.name;
            delete updateData.name;
        }

        // Process uploaded images if any
        if (req.files && req.files.images && req.files.images.length > 0) {
            const cloudinaryService = require('../services/cloudinaryService');
            const imageUrls = [];
            
            for (let i = 0; i < req.files.images.length; i++) {
                const file = req.files.images[i];
                try {
                    const uploadResult = await cloudinaryService.uploadProductImage(file.buffer, product.id);
                    
                    if (!uploadResult.success) {
                        console.error('Cloudinary upload failed:', uploadResult.error);
                        throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
                    }
                    
                    imageUrls.push(uploadResult.url);
                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    throw error;
                }
            }
            
            // Update images if new ones were uploaded
            if (imageUrls.length > 0) {
                updateData.images = imageUrls;
            }
        }

        // Process AR model upload if provided (optional, replaces existing)
        if (req.files && req.files.arModel && req.files.arModel.length > 0) {
            const arFile = req.files.arModel[0];
            try {
                const arUploadResult = await cloudinaryService.uploadARModel(arFile.buffer, product.id);
                
                if (!arUploadResult.success) {
                    console.error('AR model upload failed:', arUploadResult.error);
                    // Don't fail the product update if AR upload fails
                    console.warn('Product updated but AR model upload failed');
                } else {
                    updateData.arModel = arUploadResult.url;
                    console.log('✅ AR model uploaded successfully:', arUploadResult.url);
                }
            } catch (error) {
                console.error('Error uploading AR model:', error);
                // Don't fail the product update if AR upload fails
            }
        }

        // Update product
        await product.update(updateData);

        // Get updated product with associations
        const updatedProduct = await Product.findByPk(productId, {
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        }
                    ]
                }
            ]
        });

        res.status(200).json({
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};

// Delete product (SELLER OWNER ONLY)
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // Check if user is a seller
        const seller = await SellersTable.findOne({
            where: { userId, verificationStatus: 'approved' }
        });

        if (!seller) {
            return res.status(403).json({ 
                message: "Only verified sellers can delete products" 
            });
        }

        // Check if product exists and belongs to seller
        const product = await Product.findOne({
            where: { id: productId, sellerId: seller.id }
        });

        if (!product) {
            return res.status(404).json({ 
                message: "Product not found or you don't have permission to delete it" 
            });
        }

        // Soft delete by setting status to inactive
        await product.update({ status: 'inactive', isAvailable: false });

        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
};

// Toggle like/unlike product
const toggleLikeProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if already liked
        const existingLike = await ProductLike.findOne({
            where: { productId, userId }
        });

        if (existingLike) {
            // Unlike
            await existingLike.destroy();
            await product.decrement('likes');
            
            res.status(200).json({
                message: "Product unliked successfully",
                data: { isLiked: false }
            });
        } else {
            // Like
            await ProductLike.create({ productId, userId });
            await product.increment('likes');
            
            // Send notification to seller that their product was liked (if not liking own product)
            // Get seller user ID
            const seller = await SellersTable.findByPk(product.sellerId, {
                attributes: ['userId']
            });
            
            if (seller && seller.userId !== userId) {
                const liker = await UserTable.findByPk(userId, {
                    attributes: ['id', 'fullName', 'username', 'profilePicture']
                });

                await createNotification(
                    seller.userId,
                    'Product Liked',
                    `${liker.fullName || liker.username} liked your product "${product.title}"`,
                    'info',
                    'product_like',
                    {
                        type: 'product_like',
                        relatedEntityId: product.id,
                        senderId: userId,
                        productId: product.id,
                        title: product.title,
                        likerId: userId,
                        likerName: liker.fullName || liker.username,
                        likerUsername: liker.username,
                        productPrice: product.price,
                        productCategory: product.category,
                        likesCount: product.likes + 1
                    }
                );
            }
            
            res.status(200).json({
                message: "Product liked successfully",
                data: { isLiked: true }
            });
        }

    } catch (error) {
        console.error('Toggle like product error:', error);
        res.status(500).json({ message: "Error toggling like", error: error.message });
    }
};

// ============================================================================
// SAVED ITEMS SYSTEM MIGRATION NOTICE
// ============================================================================
// The old saved items methods (toggleSaveProduct, getSavedProducts, 
// deleteSavedProduct, getAllSavedItems) have been REMOVED and replaced with
// a unified saved items system in savedItemsController.js
//
// Old endpoints (REMOVED):
//   - POST /api/products/:productId/save
//   - GET /api/saved-products
//   - DELETE /api/saved-products/:savedItemId
//   - GET /api/saved-items
//
// New unified endpoints (USE THESE):
//   - POST /api/items/:itemId/save (Body: { itemType: 'product' | 'distress_sale' | ... })
//   - GET /api/saved-items (Works for all item types)
//   - DELETE /api/saved-items/:savedItemId (Works for all item types)
//
// See: ocean_server/src/controllers/savedItemsController.js
// See: ocean_server/src/routes/savedItemsRoutes.js
// ============================================================================

// [OLD METHODS REMOVED - See migration notice above]
// Methods removed: toggleSaveProduct, getSavedProducts, deleteSavedProduct, getAllSavedItems

// Get product categories (Universal Categories System)
const getCategories = async (req, res) => {
    try {
        const { type = 'all' } = req.query; // 'all', 'system', 'custom'
        
        // Build where clause based on type
        let whereClause = { isActive: true };
        
        if (type === 'system') {
            whereClause.isCustom = false;
        } else if (type === 'custom') {
            whereClause.isCustom = true;
        }
        // 'all' includes both system and custom categories

        // Get categories from database
        const categories = await ProductCategory.findAll({
            where: whereClause,
            include: [
                {
                    model: ProductCategory,
                    as: 'subcategories',
                    where: { isActive: true },
                    required: false
                },
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName'],
                    required: false
                }
            ],
            order: [
                ['isCustom', 'ASC'], // System categories first
                ['sortOrder', 'ASC'], 
                ['name', 'ASC']
            ]
        });

        // Format categories for frontend
        const formattedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            isCustom: category.isCustom,
            usageCount: category.usageCount,
            creator: category.creator ? {
                id: category.creator.id,
                username: category.creator.username,
                fullName: category.creator.fullName
            } : null,
            subcategories: category.subcategories ? category.subcategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description,
                icon: sub.icon,
                isCustom: sub.isCustom,
                usageCount: sub.usageCount
            })) : []
        }));

        res.status(200).json({
            message: "Categories retrieved successfully",
            data: formattedCategories,
            meta: {
                total: categories.length,
                systemCategories: categories.filter(c => !c.isCustom).length,
                customCategories: categories.filter(c => c.isCustom).length
            }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            message: "Error retrieving categories", 
            error: error.message 
        });
    }
};

// Create custom category
const createCustomCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "Name and description are required"
            });
        }

        // Check if category name already exists
        const existingCategory = await ProductCategory.findOne({
            where: { name: name.trim() }
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists"
            });
        }

        // Create custom category
        const customCategory = await ProductCategory.create({
            name: name.trim(),
            description: description.trim(),
            icon: icon || '📦',
            isCustom: true,
            createdBy: userId,
            usageCount: 0,
            isActive: true,
            sortOrder: 999 // Custom categories at the end
        });

        // Include creator information
        const categoryWithCreator = await ProductCategory.findByPk(customCategory.id, {
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Custom category created successfully",
            data: {
                id: categoryWithCreator.id,
                name: categoryWithCreator.name,
                description: categoryWithCreator.description,
                icon: categoryWithCreator.icon,
                isCustom: categoryWithCreator.isCustom,
                usageCount: categoryWithCreator.usageCount,
                creator: {
                    id: categoryWithCreator.creator.id,
                    username: categoryWithCreator.creator.username,
                    fullName: categoryWithCreator.creator.fullName
                }
            }
        });

    } catch (error) {
        console.error('Create custom category error:', error);
        res.status(500).json({
            success: false,
            message: "Error creating custom category",
            error: error.message
        });
    }
};

// Get user's custom categories
const getCustomCategories = async (req, res) => {
    try {
        const userId = req.user.id;

        const customCategories = await ProductCategory.findAll({
            where: {
                isCustom: true,
                createdBy: userId,
                isActive: true
            },
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName']
                }
            ],
            order: [['name', 'ASC']]
        });

        const formattedCategories = customCategories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            usageCount: category.usageCount,
            createdAt: category.createdAt,
            creator: {
                id: category.creator.id,
                username: category.creator.username,
                fullName: category.creator.fullName
            }
        }));

        res.status(200).json({
            success: true,
            message: "Custom categories retrieved successfully",
            data: formattedCategories,
            meta: {
                total: customCategories.length
            }
        });

    } catch (error) {
        console.error('Get custom categories error:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving custom categories",
            error: error.message
        });
    }
};

// Update category usage count (called when products are created/updated)
const updateCategoryUsage = async (categoryName, increment = true) => {
    try {
        const category = await ProductCategory.findOne({
            where: { name: categoryName }
        });

        if (category) {
            const newUsageCount = increment 
                ? category.usageCount + 1 
                : Math.max(0, category.usageCount - 1);
            
            await category.update({ usageCount: newUsageCount });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Update category usage error:', error);
        return false;
    }
};

// Search categories with advanced filtering
const searchCategories = async (req, res) => {
    try {
        const { 
            q, // search query
            type = 'all', // 'all', 'system', 'custom'
            sortBy = 'usageCount', // 'usageCount', 'name', 'createdAt'
            sortOrder = 'DESC', // 'ASC', 'DESC'
            limit = 20,
            minUsage = 0,
            maxUsage = null
        } = req.query;

        // Build where clause
        let whereClause = { isActive: true };

        // Type filter
        if (type === 'system') {
            whereClause.isCustom = false;
        } else if (type === 'custom') {
            whereClause.isCustom = true;
        }

        // Search query
        if (q) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${q}%` } },
                { description: { [Op.like]: `%${q}%` } }
            ];
        }

        // Usage range filter
        if (minUsage || maxUsage) {
            whereClause.usageCount = {};
            if (minUsage) whereClause.usageCount[Op.gte] = parseInt(minUsage);
            if (maxUsage) whereClause.usageCount[Op.lte] = parseInt(maxUsage);
        }

        // Build order clause
        let orderClause = [];
        if (sortBy === 'usageCount') {
            orderClause.push(['usageCount', sortOrder]);
        } else if (sortBy === 'name') {
            orderClause.push(['name', sortOrder]);
        } else if (sortBy === 'createdAt') {
            orderClause.push(['createdAt', sortOrder]);
        }
        orderClause.push(['name', 'ASC']); // Secondary sort by name

        const categories = await ProductCategory.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName'],
                    required: false
                }
            ],
            order: orderClause,
            limit: parseInt(limit),
            offset: 0
        });

        const formattedCategories = categories.rows.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            isCustom: category.isCustom,
            usageCount: category.usageCount,
            createdAt: category.createdAt,
            creator: category.creator ? {
                id: category.creator.id,
                username: category.creator.username,
                fullName: category.creator.fullName
            } : null
        }));

        res.status(200).json({
            success: true,
            message: "Categories search completed",
            data: formattedCategories,
            meta: {
                total: categories.count,
                returned: formattedCategories.length,
                searchQuery: q,
                filters: {
                    type,
                    sortBy,
                    sortOrder,
                    minUsage,
                    maxUsage
                }
            }
        });

    } catch (error) {
        console.error('Search categories error:', error);
        res.status(500).json({
            success: false,
            message: "Error searching categories",
            error: error.message
        });
    }
};

// Get category analytics and trending data
const getCategoryAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query; // '7d', '30d', '90d', 'all'

        // Calculate date range
        let dateFilter = {};
        if (period !== 'all') {
            const days = parseInt(period.replace('d', ''));
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { createdAt: { [Op.gte]: startDate } };
        }

        // Get top categories by usage
        const topCategories = await ProductCategory.findAll({
            where: { 
                isActive: true,
                ...dateFilter
            },
            order: [['usageCount', 'DESC']],
            limit: 10,
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName'],
                    required: false
                }
            ]
        });

        // Get category distribution
        const categoryStats = await ProductCategory.findAll({
            where: { isActive: true },
            attributes: [
                'isCustom',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('usageCount')), 'totalUsage']
            ],
            group: ['isCustom'],
            raw: true
        });

        // Get recent custom categories
        const recentCustomCategories = await ProductCategory.findAll({
            where: { 
                isCustom: true,
                isActive: true,
                ...dateFilter
            },
            order: [['createdAt', 'DESC']],
            limit: 5,
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName']
                }
            ]
        });

        // Calculate growth metrics
        const totalCategories = await ProductCategory.count({ where: { isActive: true } });
        const systemCategories = await ProductCategory.count({ where: { isCustom: false, isActive: true } });
        const customCategories = await ProductCategory.count({ where: { isCustom: true, isActive: true } });

        res.status(200).json({
            success: true,
            message: "Category analytics retrieved successfully",
            data: {
                topCategories: topCategories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    usageCount: cat.usageCount,
                    isCustom: cat.isCustom,
                    creator: cat.creator ? {
                        username: cat.creator.username,
                        fullName: cat.creator.fullName
                    } : null
                })),
                distribution: {
                    total: totalCategories,
                    system: systemCategories,
                    custom: customCategories,
                    customPercentage: totalCategories > 0 ? Math.round((customCategories / totalCategories) * 100) : 0
                },
                recentCustom: recentCustomCategories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    usageCount: cat.usageCount,
                    createdAt: cat.createdAt,
                    creator: {
                        username: cat.creator.username,
                        fullName: cat.creator.fullName
                    }
                })),
                period,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get category analytics error:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving category analytics",
            error: error.message
        });
    }
};

// Get trending categories (most used in recent period)
const getTrendingCategories = async (req, res) => {
    try {
        const { period = '7d', limit = 10 } = req.query;

        // Calculate date range
        const days = parseInt(period.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get trending categories (most used in recent period)
        const trendingCategories = await ProductCategory.findAll({
            where: { 
                isActive: true,
                usageCount: { [Op.gt]: 0 },
                updatedAt: { [Op.gte]: startDate }
            },
            order: [['usageCount', 'DESC']],
            limit: parseInt(limit),
            include: [
                {
                    model: UserTable,
                    as: 'creator',
                    attributes: ['id', 'username', 'fullName'],
                    required: false
                }
            ]
        });

        const formattedTrending = trendingCategories.map(category => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            usageCount: category.usageCount,
            isCustom: category.isCustom,
            trend: 'up', // Could be calculated based on usage change over time
            creator: category.creator ? {
                username: category.creator.username,
                fullName: category.creator.fullName
            } : null
        }));

        res.status(200).json({
            success: true,
            message: "Trending categories retrieved successfully",
            data: formattedTrending,
            meta: {
                period,
                limit: parseInt(limit),
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get trending categories error:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving trending categories",
            error: error.message
        });
    }
};

// Delete custom category (only by creator)
const deleteCustomCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user.id;

        // Find the category
        const category = await ProductCategory.findByPk(categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if it's a custom category
        if (!category.isCustom) {
            return res.status(403).json({
                success: false,
                message: "Cannot delete system categories"
            });
        }

        // Check if user is the creator
        if (category.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete categories you created"
            });
        }

        // Check if category is being used
        if (category.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category that is currently being used. Please contact support if you need to remove this category."
            });
        }

        // Soft delete (set isActive to false)
        await category.update({ isActive: false });

        res.status(200).json({
            success: true,
            message: "Custom category deleted successfully"
        });

    } catch (error) {
        console.error('Delete custom category error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting custom category",
            error: error.message
        });
    }
};

// Get seller's products
const getSellerProducts = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Check if seller exists
        const seller = await SellersTable.findByPk(sellerId, {
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                }
            ]
        });

        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        const products = await Product.findAndCountAll({
            where: { 
                sellerId, 
                status: 'active', 
                isAvailable: true 
            },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        }
                    ]
                }
            ],
            order: [[Sequelize.fn('RAND')]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Add engagement status for current user
        let productsWithEngagement = await Promise.all(
            products.rows.map(async (product) => {
                const productData = product.toJSON();
                
                if (currentUserId) {
                    const [userSaved, userFollow] = await Promise.all([
                        SavedItem.findOne({ where: { itemId: product.id, itemType: 'product', userId: currentUserId } }),
                        UserFollows.findOne({ 
                            where: { 
                                userId: currentUserId, 
                                followsUserId: seller.userId 
                            } 
                        })
                    ]);

                    productData.isSaved = !!userSaved;
                    productData.isFollowing = !!userFollow;
                }

                return productData;
            })
        );

        // Include promotion fields and sort by promotion priority
        productsWithEngagement = PromotionHelperService.processItemsForResponse(productsWithEngagement);

        res.status(200).json({
            message: "Seller products retrieved successfully",
            data: {
                seller,
                products: productsWithEngagement,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(products.count / limit),
                    totalProducts: products.count,
                    hasNextPage: offset + limit < products.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ message: "Error retrieving seller products", error: error.message });
    }
};

// Get products by user ID or seller ID (for visiting profiles)
const getUserProducts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        let actualUserId = userId; // Will be set to User ID if sellerId is provided
        let seller = await SellersTable.findOne({
            where: { userId: userId },
            include: [{
                model: UserTable,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
            }]
        });

        // If not found by userId, try as Seller Table ID
        if (!seller) {
            seller = await SellersTable.findByPk(userId, {
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                }]
            });
            if (seller) {
                actualUserId = seller.userId;
            }
        }

        if (!seller) {
            return res.status(404).json({ message: "User is not a seller or not found" });
        }

        const products = await Product.findAndCountAll({
            where: { 
                sellerId: seller.id, 
                status: 'active', 
                isAvailable: true 
            },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                    include: [{
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Add engagement status for current user
        let productsWithEngagement = await Promise.all(
            products.rows.map(async (product) => {
                const productData = product.toJSON();
                
                if (currentUserId) {
                    const [userSaved, userLike] = await Promise.all([
                        SavedItem.findOne({ where: { itemId: product.id, itemType: 'product', userId: currentUserId } }),
                        ProductLike.findOne({ where: { productId: product.id, userId: currentUserId } })
                    ]);

                    productData.isSaved = !!userSaved;
                    productData.isLiked = !!userLike;
                }

                return productData;
            })
        );

        // Include promotion fields and sort by promotion priority
        productsWithEngagement = PromotionHelperService.processItemsForResponse(productsWithEngagement);

        res.status(200).json({
            message: "User products retrieved successfully",
            data: {
                products: productsWithEngagement,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(products.count / limit),
                    totalProducts: products.count,
                    hasNextPage: offset + limit < products.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user products error:', error);
        res.status(500).json({ message: "Error retrieving user products", error: error.message });
    }
};

// Get current user's products
const getMyProducts = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Find the seller record for this user
        const seller = await SellersTable.findOne({
            where: { userId: currentUserId }
        });

        if (!seller) {
            return res.status(404).json({
                message: "Seller profile not found. Please complete seller verification first."
            });
        }

        const products = await Product.findAndCountAll({
            where: { 
                sellerId: seller.id
            },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format products for frontend
        let formattedProducts = products.rows.map((product) => {
            const productData = product.toJSON();
            
            return {
                id: productData.id,
                name: productData.title,
                price: productData.price,
                originalPrice: productData.originalPrice,
                brand: productData.brand,
                location: productData.location,
                status: productData.status,
                views: productData.views || 0,
                likes: productData.likes || 0,
                image: productData.images && productData.images.length > 0 ? productData.images[0] : '📦',
                isDistress: productData.isDistressSale || false,
                createdAt: productData.createdAt ? 
                    new Date(productData.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    }) : 'Recently',
                currency: productData.currency || 'NGN',
                condition: productData.condition,
                description: productData.description,
                images: productData.images || [],
                urgencyLevel: productData.urgencyLevel,
                discountPercentage: productData.discountPercentage
            };
        });

        // Include promotion fields and sort by promotion priority
        formattedProducts = PromotionHelperService.processItemsForResponse(formattedProducts);

        res.status(200).json({
            message: "My products retrieved successfully",
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(products.count / limit),
                    totalProducts: products.count,
                    hasNextPage: offset + limit < products.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({ message: "Error retrieving products", error: error.message });
    }
};

// Get all saved items (products + posts with actual items extracted)
const getAllSavedItems = async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        // Get saved products
        const savedProducts = await SavedProduct.findAndCountAll({
            where: { userId },
            include: [
                {
                    model: Product,
                    as: 'product',
                    where: { status: 'active', isAvailable: true },
                    include: [
                        {
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                            include: [
                                {
                                    model: UserTable,
                                    as: 'user',
                                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                                }
                            ]
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Get saved posts - include contentType and sourceId
        const savedPosts = await SavedPost.findAndCountAll({
            where: { userId },
            include: [
                {
                    model: Post,
                    as: 'post',
                    where: { status: 'active' },
                    attributes: ['id', 'userId', 'contentType', 'sourceId', 'sourceTable', 'content', 'productName', 'status', 'createdAt'], // Include userId for UserTable association, contentType, sourceId, sourceTable
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                        },
                        {
                            model: PostMedia,
                            as: 'media',
                            attributes: ['id', 'mediaUrl', 'mediaType']
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Format saved products for frontend
        const formattedProducts = savedProducts.rows.map((savedItem) => {
            const product = savedItem.product;
            const seller = product.seller;
            
            // Determine if it's a distress sale
            const itemType = product.isDistressSale ? 'distress_sale' : 'product';
            
            return {
                id: product.id, // Actual Product ID (for navigation)
                savedItemId: savedItem.getDataValue('id'), // SavedProduct ID (for deletion)
                productId: product.id, // Actual Product ID (for navigation) - kept for clarity
                type: itemType,
                sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedProduct's ID (deprecated, use savedItemId)
                name: product.title,
                price: `${product.currency || 'NGN'} ${product.price}`,
                originalPrice: product.originalPrice ? `${product.currency || 'NGN'} ${product.originalPrice}` : null,
                condition: product.condition,
                category: product.category,
                location: product.location,
                seller: {
                    id: seller.user.id,
                    name: seller.user.fullName || seller.businessName,
                    avatar: seller.user.profilePicture || '👤',
                    verified: seller.user.accountStatus === 'verified',
                    rating: 4.5 // TODO: Add rating to UserTable model
                },
                images: product.images || ['📦'],
                description: product.description,
                likes: product.likes || 0,
                timeAgo: getTimeAgo(savedItem.createdAt),
                isLiked: false, // TODO: Check if user liked this product
                isSaved: true,
                savedDate: savedItem.createdAt.toISOString().split('T')[0]
            };
        });

        // Extract actual items from saved posts
        const extractedItems = await Promise.all(savedPosts.rows.map(async (savedItem) => {
            const post = savedItem.post;
            const contentType = post.contentType;
            const sourceId = post.sourceId;
            const sourceTable = post.sourceTable;
            
            // If no contentType or sourceId, treat as general post
            if (!contentType || !sourceId || contentType === 'post') {
            const user = post.user;
            const media = post.media || [];
            let mediaUrls = media.map(m => m.mediaUrl).filter(url => url);
                
            if (mediaUrls.length === 0) {
                const directMedia = await PostMedia.findAll({
                    where: { postId: post.id },
                    attributes: ['mediaUrl', 'mediaType'],
                    order: [['mediaOrder', 'ASC']]
                });
                mediaUrls = directMedia.map(m => m.mediaUrl).filter(url => url);
            }
            
            return {
                    id: post.id, // Actual Post ID (for navigation)
                    savedItemId: savedItem.getDataValue('id'), // SavedPost ID (for deletion)
                    type: 'post',
                    sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedPost's ID (deprecated, use savedItemId)
                    postId: post.id, // Actual Post ID (for navigation)
                    name: post.productName || (post.content ? post.content.substring(0, 50) : 'Post'),
                    price: null,
                originalPrice: null,
                    condition: null,
                    category: null,
                    location: null,
                seller: {
                        id: user.id,
                    name: user.fullName,
                    avatar: user.profilePicture || '👤',
                    verified: user.accountStatus === 'verified',
                    rating: 4.5
                    },
                    images: mediaUrls.length > 0 ? mediaUrls : ['📱'],
                description: post.content,
                    likes: 0,
                timeAgo: getTimeAgo(savedItem.createdAt),
                    isLiked: false,
                isSaved: true,
                savedDate: savedItem.createdAt.toISOString().split('T')[0]
            };
            }
            
            // Fetch actual item based on contentType
            let actualItem = null;
            let itemType = contentType;
            
            try {
                if (contentType === 'auction' && sourceId) {
                    actualItem = await Auction.findByPk(sourceId, {
                        include: [
                            {
                                model: SellersTable,
                                as: 'seller',
                                attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                                include: [
                                    {
                                        model: UserTable,
                                        as: 'user',
                                        attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                                    }
                                ]
                            }
                        ]
                    });
                    if (!actualItem) return null;
                } else if (contentType === 'swap_deal' && sourceId) {
                    actualItem = await SwapDeal.findByPk(sourceId, {
                        include: [
                            {
                                model: UserTable,
                                as: 'seller',
                                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                            }
                        ]
                    });
                    if (!actualItem) return null;
                } else if (contentType === 'group_buy' && sourceId) {
                    actualItem = await GroupBuy.findByPk(sourceId, {
                        include: [
                            {
                                model: UserTable,
                                as: 'creator',
                                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                            }
                        ]
                    });
                    if (!actualItem) return null;
                } else if ((contentType === 'product' || contentType === 'distress_sale') && sourceId) {
                    actualItem = await Product.findByPk(sourceId, {
                        include: [
                            {
                                model: SellersTable,
                                as: 'seller',
                                attributes: ['id', 'userId', 'businessName', 'businessAddress', 'country', 'state', 'category', 'verificationStatus'],
                                include: [
                                    {
                                        model: UserTable,
                                        as: 'user',
                                        attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                                    }
                                ]
                            }
                        ]
                    });
                    if (!actualItem) return null;
                    itemType = actualItem.isDistressSale ? 'distress_sale' : 'product';
                } else {
                    // Unknown contentType, skip
                    return null;
                }
            } catch (error) {
                console.error(`Error fetching ${contentType} with ID ${sourceId}:`, error);
                return null; // Skip items that can't be fetched
            }
            
            // Format the extracted item based on type
            if (contentType === 'auction') {
                const auction = actualItem;
                const seller = auction.seller;
                
                return {
                    id: auction.id, // Use auction ID, not post ID
                    type: 'auction',
                    sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedPost's ID
                    postId: post.id, // Keep post ID for reference
                    name: auction.title,
                    price: `${auction.currency || 'NGN'} ${auction.currentPrice || auction.startingPrice}`,
                    originalPrice: auction.reservePrice ? `${auction.currency || 'NGN'} ${auction.reservePrice}` : null,
                    condition: auction.condition || null,
                    category: auction.category,
                    location: auction.location,
                    seller: {
                        id: seller.user.id,
                        name: seller.user.fullName || seller.businessName,
                        avatar: seller.user.profilePicture || '👤',
                        verified: seller.user.accountStatus === 'verified',
                        rating: 4.5
                    },
                    images: auction.images || ['🔨'],
                    description: auction.description,
                    likes: 0, // Auctions don't have likes in the same way
                    timeAgo: getTimeAgo(savedItem.createdAt),
                    isLiked: false,
                    isSaved: true,
                    savedDate: savedItem.createdAt.toISOString().split('T')[0],
                    // Additional auction-specific fields
                    startTime: auction.startTime,
                    endTime: auction.endTime,
                    currentBid: auction.currentPrice || auction.startingPrice
                };
            } else if (contentType === 'swap_deal') {
                const swapDeal = actualItem;
                const seller = swapDeal.seller;
                
                // Parse images if it's a JSON string, otherwise use as-is
                let images = [];
                if (swapDeal.images) {
                    if (typeof swapDeal.images === 'string') {
                        try {
                            images = JSON.parse(swapDeal.images);
                        } catch (e) {
                            images = [];
                        }
                    } else if (Array.isArray(swapDeal.images)) {
                        images = swapDeal.images;
                    }
                }
                
                return {
                    id: swapDeal.id, // Actual Swap Deal ID (for navigation)
                    savedItemId: savedItem.getDataValue('id'), // SavedPost ID (for deletion)
                    swapDealId: swapDeal.id, // Actual Swap Deal ID (for navigation) - kept for clarity
                    type: 'swap_deal',
                    sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedPost's ID (deprecated, use savedItemId)
                    postId: post.id, // Keep post ID for reference
                    name: swapDeal.title,
                    price: null, // Swap deals don't have prices
                    originalPrice: null,
                    condition: swapDeal.itemCondition || null,
                    category: swapDeal.category,
                    location: swapDeal.location,
                    seller: {
                        id: seller.id,
                        name: seller.fullName,
                        avatar: seller.profilePicture || '👤',
                        verified: seller.accountStatus === 'verified',
                        rating: 4.5
                    },
                    images: images,
                    description: swapDeal.description,
                    likes: 0,
                    timeAgo: getTimeAgo(savedItem.createdAt),
                    isLiked: false,
                    isSaved: true,
                    savedDate: savedItem.createdAt.toISOString().split('T')[0]
                };
            } else if (contentType === 'group_buy') {
                const groupBuy = actualItem;
                const creator = groupBuy.creator;
                
                // Parse product_image if it's a JSON string, otherwise use as-is
                let images = [];
                if (groupBuy.product_image) {
                    if (typeof groupBuy.product_image === 'string') {
                        try {
                            images = JSON.parse(groupBuy.product_image);
                        } catch (e) {
                            images = [];
                        }
                    } else if (Array.isArray(groupBuy.product_image)) {
                        images = groupBuy.product_image;
                    }
                }
                
                return {
                    id: groupBuy.id, // Use group buy ID, not post ID
                    type: 'group_buy',
                    sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedPost's ID
                    postId: post.id, // Keep post ID for reference
                    name: groupBuy.title || groupBuy.product_name, // Use title or product_name
                    price: `NGN ${groupBuy.group_price}`, // Use group_price (not pricePerUnit)
                    originalPrice: groupBuy.original_price ? `NGN ${groupBuy.original_price}` : null, // Use original_price (not originalPrice)
                    condition: null,
                    category: groupBuy.category,
                    location: groupBuy.location,
                    seller: {
                        id: creator.id,
                        name: creator.fullName,
                        avatar: creator.profilePicture || '👤',
                        verified: creator.accountStatus === 'verified',
                        rating: 4.5
                    },
                    images: images.length > 0 ? images : ['👥'], // Use parsed product_image
                    description: groupBuy.description,
                    likes: 0,
                    timeAgo: getTimeAgo(savedItem.createdAt),
                    isLiked: false,
                    isSaved: true,
                    savedDate: savedItem.createdAt.toISOString().split('T')[0]
                };
            } else if (contentType === 'product' || contentType === 'distress_sale') {
                const product = actualItem;
                const seller = product.seller;
                const itemType = product.isDistressSale ? 'distress_sale' : 'product';
                
                return {
                    id: product.id, // Actual Product ID (for navigation)
                    savedItemId: savedItem.getDataValue('id'), // SavedPost ID (for deletion)
                    productId: product.id, // Actual Product ID (for navigation) - kept for clarity
                    type: itemType,
                    sourceId: savedItem.getDataValue('id'), // Save reference ID - explicitly get SavedPost's ID (deprecated, use savedItemId)
                    postId: post.id, // Keep post ID for reference
                    name: product.title,
                    price: `${product.currency || 'NGN'} ${product.price}`,
                    originalPrice: product.originalPrice ? `${product.currency || 'NGN'} ${product.originalPrice}` : null,
                    condition: product.condition,
                    category: product.category,
                    location: product.location,
                    seller: {
                        id: seller.user.id,
                        name: seller.user.fullName || seller.businessName,
                        avatar: seller.user.profilePicture || '👤',
                        verified: seller.user.accountStatus === 'verified',
                        rating: 4.5
                    },
                    images: product.images || ['📦'],
                    description: product.description,
                    likes: product.likes || 0,
                    timeAgo: getTimeAgo(savedItem.createdAt),
                    isLiked: false,
                    isSaved: true,
                    savedDate: savedItem.createdAt.toISOString().split('T')[0]
                };
            }
            
            return null;
        }));

        // Filter out null items (failed fetches)
        const validExtractedItems = extractedItems.filter(item => item !== null);

        // Combine all saved items
        const allSavedItems = [...formattedProducts, ...validExtractedItems]
            .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));

        // Apply category filter if specified
        const filteredItems = category && category !== 'All' 
            ? allSavedItems.filter(item => {
                if (category === 'Feed Posts') return item.type === 'post';
                return item.category === category || item.type === category;
            })
            : allSavedItems;

        res.status(200).json({
            message: "All saved items retrieved successfully",
            data: {
                savedItems: filteredItems,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredItems.length / limit),
                    totalItems: filteredItems.length,
                    hasNextPage: offset + limit < filteredItems.length,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all saved items error:', error);
        res.status(500).json({ message: "Error retrieving saved items", error: error.message });
    }
};

// Helper functions for extracting data from post content
const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const extractPriceFromContent = (content) => {
    const priceMatch = content.match(/₦[\d,]+/);
    return priceMatch ? priceMatch[0] : null;
};

const extractBudgetFromContent = (content) => {
    const budgetMatch = content.match(/₦[\d,]+.*?₦[\d,]+/);
    return budgetMatch ? budgetMatch[0] : null;
};

const extractConditionFromContent = (content) => {
    const conditions = ['Brand New', 'Like New', 'Good', 'Used', 'Fair'];
    return conditions.find(condition => 
        content.toLowerCase().includes(condition.toLowerCase())
    ) || 'Good';
};

const extractCategoryFromContent = (content) => {
    const categories = ['Electronics', 'Fashion', 'Automotive', 'Home', 'Sports'];
    return categories.find(category => 
        content.toLowerCase().includes(category.toLowerCase())
    ) || 'General';
};

const extractLocationFromContent = (content) => {
    const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];
    return locations.find(location => 
        content.toLowerCase().includes(location.toLowerCase())
    ) || 'Nigeria';
};

// Get trending products
const getTrendingProducts = async (req, res) => {
    try {
        const { category = null, limit = 20, offset = 0 } = req.query;
        const currentUserId = req.user?.id;

        // Get user location if available
        let buyerLocation = null;
        if (currentUserId) {
            const user = await UserTable.findByPk(currentUserId, {
                attributes: ['location']
            });
            buyerLocation = user?.location || null;
        }

        // Get trending products using ranking service
        const products = await RankingService.getTrendingItems('product', {
            category,
            limit: parseInt(limit),
            offset: parseInt(offset),
            buyerLocation
        });

        // Map product field names and include promotion fields
        let mappedProducts = products.map(mapProductResponse);
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        res.status(200).json({
            message: "Trending products retrieved successfully",
            data: {
                products: mappedProducts,
                pagination: {
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    limit: parseInt(limit),
                    totalProducts: mappedProducts.length,
                    hasNextPage: mappedProducts.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get trending products error:', error);
        res.status(500).json({ message: "Error retrieving trending products", error: error.message });
    }
};

// Get recommended products
const getRecommendedProducts = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ message: "Authentication required for recommendations" });
        }

        // Get recommended products using ranking service
        const products = await RankingService.getRecommendedItems(currentUserId, 'product', {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Map product field names and include promotion fields
        let mappedProducts = products.map(mapProductResponse);
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        res.status(200).json({
            message: "Recommended products retrieved successfully",
            data: {
                products: mappedProducts,
                pagination: {
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    limit: parseInt(limit),
                    totalProducts: mappedProducts.length,
                    hasNextPage: mappedProducts.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get recommended products error:', error);
        res.status(500).json({ message: "Error retrieving recommended products", error: error.message });
    }
};

// Get similar products
const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        // Get similar products using ranking service
        const products = await RankingService.getSimilarItems('product', productId, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Map product field names and include promotion fields
        let mappedProducts = products.map(mapProductResponse);
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        res.status(200).json({
            message: "Similar products retrieved successfully",
            data: {
                products: mappedProducts,
                pagination: {
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    limit: parseInt(limit),
                    totalProducts: mappedProducts.length,
                    hasNextPage: mappedProducts.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get similar products error:', error);
        res.status(500).json({ message: "Error retrieving similar products", error: error.message });
    }
};

// Get spotlight products
const getSpotlightProducts = async (req, res) => {
    try {
        const { slotType = 'homepage', category = null, limit = 20, offset = 0 } = req.query;

        // Get spotlight slots
        const spotlightSlots = await SpotlightService.getSpotlightsBySlotType(slotType, {
            category,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Extract product IDs from spotlight slots
        // Use camelCase for Sequelize model attributes (not snake_case database columns)
        const productIds = spotlightSlots
            .filter(slot => (slot.itemType || slot.item_type) === 'product' || (slot.itemType || slot.item_type) === 'distress_sale')
            .map(slot => slot.itemId || slot.item_id);

        if (productIds.length === 0) {
            return res.status(200).json({
                message: "Spotlight products retrieved successfully",
                data: {
                    products: [],
                    pagination: {
                        currentPage: 1,
                        limit: parseInt(limit),
                        totalProducts: 0,
                        hasNextPage: false
                    }
                }
            });
        }

        // Get products
        const products = await Product.findAll({
            where: {
                id: { [Op.in]: productIds },
                status: 'active',
                isAvailable: true,
                // Exclude expired distress sales
                [Op.or]: [
                    { isDistressSale: false },  // Regular products (no expiry)
                    { isDistressSale: null },   // Regular products (no distress flag)
                    { 
                        // Distress sales that haven't expired
                        isDistressSale: true,
                        distressExpiryDate: {
                            [Op.or]: [
                                { [Op.gte]: new Date() },
                                { [Op.is]: null }
                            ]
                        }
                    }
                ]
            },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'country', 'state'],
                    include: [{
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
                    }]
                }
            ]
        });

        console.log(`[Spotlight] Found ${spotlightSlots.length} slots, extracted ${productIds.length} product IDs:`, productIds);
        console.log(`[Spotlight] Found ${products.length} products matching filters`);

        // If no products found, try without status/isAvailable filters to debug
        if (products.length === 0 && productIds.length > 0) {
            const allProducts = await Product.findAll({
                where: { id: { [Op.in]: productIds } },
                attributes: ['id', 'status', 'isAvailable', 'title']
            });
            console.log(`[Spotlight] Products without filters:`, allProducts.map(p => ({ id: p.id, status: p.status, isAvailable: p.isAvailable, title: p.title })));
        }

        // Sort products to match spotlight slot order
        const sortedProducts = productIds
            .map(id => products.find(p => p.id === id))
            .filter(p => p !== undefined);

        // Map product field names and include promotion fields
        let mappedProducts = sortedProducts.map(mapProductResponse);
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        res.status(200).json({
            message: "Spotlight products retrieved successfully",
            data: {
                products: mappedProducts,
                pagination: {
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    limit: parseInt(limit),
                    totalProducts: mappedProducts.length,
                    hasNextPage: mappedProducts.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get spotlight products error:', error);
        res.status(500).json({ message: "Error retrieving spotlight products", error: error.message });
    }
};

// Get top placement products
const getTopPlacementProducts = async (req, res) => {
    try {
        const { category = null, placementType = null, limit = 20, offset = 0 } = req.query;

        // Get top placements
        const placements = await TopPlacementService.getTopPlacementsByType('product', {
            category,
            placementType,
            limit: parseInt(limit) + parseInt(offset) // Get more to handle offset
        });

        // Apply offset
        const paginatedPlacements = placements.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Extract product IDs from placements
        // Use camelCase for Sequelize model attributes (not snake_case database columns)
        const productIds = paginatedPlacements.map(placement => placement.itemId || placement.item_id);

        if (productIds.length === 0) {
            return res.status(200).json({
                message: "Top placement products retrieved successfully",
                data: {
                    products: [],
                    pagination: {
                        currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                        limit: parseInt(limit),
                        totalProducts: 0,
                        hasNextPage: false
                    }
                }
            });
        }

        // Get products
        const products = await Product.findAll({
            where: {
                id: { [Op.in]: productIds },
                status: 'active',
                isAvailable: true,
                // Exclude expired distress sales
                [Op.or]: [
                    { isDistressSale: false },  // Regular products (no expiry)
                    { isDistressSale: null },   // Regular products (no distress flag)
                    { 
                        // Distress sales that haven't expired
                        isDistressSale: true,
                        distressExpiryDate: {
                            [Op.or]: [
                                { [Op.gte]: new Date() },
                                { [Op.is]: null }
                            ]
                        }
                    }
                ]
            },
            include: [
                {
                    model: SellersTable,
                    as: 'seller',
                    attributes: ['id', 'userId', 'businessName', 'country', 'state'],
                    include: [{
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
                    }]
                }
            ]
        });

        console.log(`[Top Placement] Found ${placements.length} placements, extracted ${productIds.length} product IDs:`, productIds);
        console.log(`[Top Placement] Found ${products.length} products matching filters`);

        // If no products found, try without status/isAvailable filters to debug
        if (products.length === 0 && productIds.length > 0) {
            const allProducts = await Product.findAll({
                where: { id: { [Op.in]: productIds } },
                attributes: ['id', 'status', 'isAvailable', 'title']
            });
            console.log(`[Top Placement] Products without filters:`, allProducts.map(p => ({ id: p.id, status: p.status, isAvailable: p.isAvailable, title: p.title })));
        }

        // Sort products to match placement order
        const sortedProducts = productIds
            .map(id => products.find(p => p.id === id))
            .filter(p => p !== undefined);

        // Map product field names and include promotion fields
        let mappedProducts = sortedProducts.map(mapProductResponse);
        mappedProducts = PromotionHelperService.processItemsForResponse(mappedProducts);

        res.status(200).json({
            message: "Top placement products retrieved successfully",
            data: {
                products: mappedProducts,
                pagination: {
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    limit: parseInt(limit),
                    totalProducts: placements.length,
                    hasNextPage: parseInt(offset) + parseInt(limit) < placements.length
                }
            }
        });
    } catch (error) {
        console.error('Get top placement products error:', error);
        res.status(500).json({ message: "Error retrieving top placement products", error: error.message });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleLikeProduct,
    // toggleSaveProduct, getSavedProducts, deleteSavedProduct - REMOVED (see savedItemsController)
    getCategories,
    createCustomCategory,
    getCustomCategories,
    deleteCustomCategory,
    updateCategoryUsage,
    searchCategories,
    getCategoryAnalytics,
    getTrendingCategories,
    getSellerProducts,
    getUserProducts,
    getMyProducts,
    // getAllSavedItems - REMOVED (see savedItemsController)
    getTrendingProducts,
    getRecommendedProducts,
    getSimilarProducts,
    getSpotlightProducts,
    getTopPlacementProducts
}; 