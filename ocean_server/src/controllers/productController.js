const { Product, ProductCategory, SavedProduct, SavedPost, Post, PostMedia, UserTable, SellersTable, UserFollows, Notification } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const { checkSubscriptionLimit, incrementUsage } = require('../middleware/subscriptionMiddleware');
const { productListingMiddleware } = require('../middleware/featureMiddleware');
const SubscriptionAwareSearchService = require('../services/subscriptionAwareSearchService');
const { mapFullResponse, wrapProductsList } = require('../../utils/fieldMapper');

// Helper function to map product field names for frontend
const mapProductResponse = (product) => {
  const mapped = product.toJSON ? product.toJSON() : { ...product };
  return {
    ...mapped,
    name: mapped.title  // Map title → name for frontend
  };
};

// Helper function to create notifications
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null) => {
    try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            category,
            metadata
        });
        console.log(`📧 Product notification created for user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('Error creating product notification:', error);
    }
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
        const mappedProducts = searchResults.products.map(mapProductResponse);

        // Track failed search if no results found and search query exists
        if (mappedProducts.length === 0 && search && search.trim().length > 0) {
          try {
            const { BuyerSearchInsight } = require('../../models');
            const userAgent = req.headers['user-agent'] || '';
            let deviceType = null;
            if (userAgent.match(/mobile|android|iphone/i)) {
              deviceType = 'mobile';
            } else if (userAgent.match(/tablet|ipad/i)) {
              deviceType = 'tablet';
            } else if (userAgent.match(/desktop|windows|mac|linux/i)) {
              deviceType = 'desktop';
            }

            const searchFilters = {};
            if (minPrice) searchFilters.minPrice = minPrice;
            if (maxPrice) searchFilters.maxPrice = maxPrice;
            if (brand) searchFilters.brand = brand;
            if (condition) searchFilters.condition = condition;

            await BuyerSearchInsight.create({
              search_term: search.trim(),
              user_id: currentUserId || null,
              category_id: category || null,
              location: location || null,
              search_filters: Object.keys(searchFilters).length > 0 ? searchFilters : null,
              device_type: deviceType,
              ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null
            });
            
            console.log('✅ Tracked failed search:', search);
          } catch (trackingError) {
            console.error('Error tracking failed search:', trackingError);
            // Don't fail the request if tracking fails
          }
        }

        // Wrap products in proper structure {data: {products: [...], pagination: {...}}}
        const response = wrapProductsList({
            success: true,
            data: mappedProducts,
            pagination: searchResults.pagination,
            searchInfo: searchResults.searchInfo
        });
        
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

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Increment view count
        await product.increment('views');

        // Send notification to seller that their product was viewed (if not viewing own product)
        if (currentUserId && currentUserId !== product.sellerId) {
            const viewer = await UserTable.findByPk(currentUserId, {
                attributes: ['id', 'fullName', 'username', 'profilePicture']
            });

            await createNotification(
                product.sellerId,
                'Product Viewed',
                `${viewer.fullName || viewer.username} viewed your product "${product.title}"`,
                'info',
                'product_view',
                { 
                    productId: product.id,
                    title: product.title,
                    viewerId: currentUserId,
                    viewerName: viewer.fullName || viewer.username,
                    viewerUsername: viewer.username,
                    productPrice: product.price,
                    productCategory: product.category,
                    viewsCount: product.views + 1
                }
            );
        }

        const productData = product.toJSON();

        // Add engagement status for current user
        if (currentUserId) {
            const [userSaved, userFollow] = await Promise.all([
                SavedProduct.findOne({ where: { productId, userId: currentUserId } }),
                UserFollows.findOne({ 
                    where: { 
                        userId: currentUserId, 
                        followsUserId: product.sellerId 
                    } 
                })
            ]);

            productData.isSaved = !!userSaved;
            productData.isFollowing = !!userFollow;
        }

        // Map product field names for frontend (title → name)
        const mappedProductData = mapProductResponse(productData);

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

        // Validate required fields
        if (!productTitle || !description || !price || !category || !location) {
            return res.status(400).json({
                message: "Title/Name, description, price, category, and location are required"
            });
        }

        // Accept any category from frontend without validation
        // Category is stored as-is from the seller's selected categories
        console.log('Product category from frontend:', category);

        // Validate images/files
        if (!req.files || req.files.length === 0) {
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
            location: location.trim(),
            images: [] // Will be populated with Cloudinary URLs
        });

        // Track subscription usage for product creation
        console.log('Incrementing usage for user:', userId, 'action: listings');
        const usageResult = await incrementUsage(userId, 'listings');
        console.log('Usage increment result:', usageResult);

        // Upload images to Cloudinary
        const imageUrls = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
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

        // Update product with image URLs
        await product.update({ images: imageUrls });

        // Get created product with associations
        const createdProduct = await Product.findByPk(product.id, {
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

        res.status(201).json({
            message: "Product created successfully",
            data: createdProduct
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
        if (req.files && req.files.length > 0) {
            const cloudinaryService = require('../services/cloudinaryService');
            const imageUrls = [];
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
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

// Toggle save/unsave product
const toggleSaveProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        
        // Handle collectionName with proper defaults
        let collectionName = 'Favorites'; // Default collection name
        console.log('Request body:', req.body);
        console.log('Collection name from body:', req.body?.collectionName);
        
        if (req.body && req.body.collectionName) {
            collectionName = req.body.collectionName;
        }
        
        console.log('Final collection name:', collectionName);

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if already saved
        const existingSave = await SavedProduct.findOne({
            where: { productId, userId }
        });

        if (existingSave) {
            // Unsave
            await existingSave.destroy();
            await product.decrement('saves');
            
            res.status(200).json({
                message: "Product unsaved successfully",
                data: { isSaved: false }
            });
        } else {
            // Save
            await SavedProduct.create({ productId, userId, collectionName });
            await product.increment('saves');
            
            // Send notification to seller that their product was saved (if not saving own product)
            if (userId !== product.sellerId) {
                const saver = await UserTable.findByPk(userId, {
                    attributes: ['id', 'fullName', 'username', 'profilePicture']
                });

                await createNotification(
                    product.sellerId,
                    'Product Saved',
                    `${saver.fullName || saver.username} saved your product "${product.title}"`,
                    'info',
                    'product_save',
                    { 
                        productId: product.id,
                        title: product.title,
                        saverId: userId,
                        saverName: saver.fullName || saver.username,
                        saverUsername: saver.username,
                        collectionName: collectionName,
                        productPrice: product.price,
                        productCategory: product.category,
                        savesCount: product.saves + 1
                    }
                );
            }
            
            res.status(200).json({
                message: "Product saved successfully",
                data: { isSaved: true }
            });
        }

    } catch (error) {
        console.error('Toggle save product error:', error);
        res.status(500).json({ message: "Error toggling save", error: error.message });
    }
};

// Get user's saved products
const getSavedProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, collectionName } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        let whereClause = { userId };
        if (collectionName) {
            whereClause.collectionName = collectionName;
        }

        const savedProducts = await SavedProduct.findAndCountAll({
            where: whereClause,
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
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            message: "Saved products retrieved successfully",
            data: {
                savedProducts: savedProducts.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(savedProducts.count / limit),
                    totalSavedProducts: savedProducts.count,
                    hasNextPage: offset + limit < savedProducts.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get saved products error:', error);
        res.status(500).json({ message: "Error retrieving saved products", error: error.message });
    }
};

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
        const productsWithEngagement = await Promise.all(
            products.rows.map(async (product) => {
                const productData = product.toJSON();
                
                if (currentUserId) {
                    const [userSaved, userFollow] = await Promise.all([
                        SavedProduct.findOne({ where: { productId: product.id, userId: currentUserId } }),
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
        const formattedProducts = products.rows.map((product) => {
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

// Get all saved items (products + posts) for user
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

        // Get saved posts
        const savedPosts = await SavedPost.findAndCountAll({
            where: { userId },
            include: [
                {
                    model: Post,
                    as: 'post',
                    where: { status: 'active' },
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
            
            return {
                id: savedItem.id,
                type: 'product',
                name: product.title,
                price: `${product.currency || 'NGN'} ${product.price}`,
                originalPrice: product.originalPrice ? `${product.currency || 'NGN'} ${product.originalPrice}` : null,
                condition: product.condition,
                category: product.category,
                location: product.location,
                seller: {
                    name: seller.fullName,
                    avatar: seller.profilePicture || '👤',
                    verified: seller.accountStatus === 'verified',
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

        // Format saved posts for frontend
        const formattedPosts = await Promise.all(savedPosts.rows.map(async (savedItem) => {
            const post = savedItem.post;
            const user = post.user;
            const media = post.media || [];
            
            // Debug logging
            console.log(`Post ${post.id} has ${media.length} media items from association:`, media.map(m => m.mediaUrl));
            
            // If no media from association, try direct query
            let mediaUrls = media.map(m => m.mediaUrl).filter(url => url);
            if (mediaUrls.length === 0) {
                console.log(`No media from association, querying PostMedia directly for post ${post.id}`);
                const directMedia = await PostMedia.findAll({
                    where: { postId: post.id },
                    attributes: ['mediaUrl', 'mediaType'],
                    order: [['mediaOrder', 'ASC']]
                });
                mediaUrls = directMedia.map(m => m.mediaUrl).filter(url => url);
                console.log(`Direct query found ${mediaUrls.length} media URLs:`, mediaUrls);
            }
            
            // Determine if it's a buyer or seller post based on content
            const isBuyerPost = post.content.toLowerCase().includes('looking for') || 
                               post.content.toLowerCase().includes('want to buy') ||
                               post.content.toLowerCase().includes('need');
            
            return {
                id: savedItem.id,
                type: 'feed-post',
                postType: isBuyerPost ? 'buyer' : 'seller',
                name: post.title || 'Post',
                price: isBuyerPost ? null : extractPriceFromContent(post.content),
                budget: isBuyerPost ? extractBudgetFromContent(post.content) : null,
                originalPrice: null,
                condition: extractConditionFromContent(post.content),
                category: extractCategoryFromContent(post.content),
                location: extractLocationFromContent(post.content),
                seller: {
                    name: user.fullName,
                    avatar: user.profilePicture || '👤',
                    verified: user.accountStatus === 'verified',
                    rating: 4.5 // TODO: Add rating to UserTable model
                },
                buyer: isBuyerPost ? {
                    name: user.fullName,
                    avatar: user.profilePicture || '👤',
                    verified: user.accountStatus === 'verified',
                    rating: 4.5
                } : null,
                images: mediaUrls.length > 0 ? mediaUrls : ['📱'], // Use actual post images or fallback
                description: post.content,
                likes: post.likesCount || 0,
                timeAgo: getTimeAgo(savedItem.createdAt),
                isLiked: false, // TODO: Check if user liked this post
                isSaved: true,
                savedDate: savedItem.createdAt.toISOString().split('T')[0]
            };
        }));

        // Combine and sort by saved date
        const allSavedItems = [...formattedProducts, ...formattedPosts]
            .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));

        // Apply category filter if specified
        const filteredItems = category && category !== 'All' 
            ? allSavedItems.filter(item => {
                if (category === 'Feed Posts') return item.type === 'feed-post';
                return item.category === category;
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

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleSaveProduct,
    getSavedProducts,
    getCategories,
    createCustomCategory,
    getCustomCategories,
    deleteCustomCategory,
    updateCategoryUsage,
    searchCategories,
    getCategoryAnalytics,
    getTrendingCategories,
    getSellerProducts,
    getMyProducts,
    getAllSavedItems
}; 