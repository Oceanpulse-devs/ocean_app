const { Product, ProductCategory, SavedProduct, SavedPost, Post, UserTable, SellersTable, UserFollows } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');

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

        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Build where clause
        let whereClause = {
            status: 'active',
            isAvailable: true
        };

        // Search functionality
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filters
        if (category) whereClause.category = category;
        if (subcategory) whereClause.subcategory = subcategory;
        if (brand) whereClause.brand = brand;
        if (condition) whereClause.condition = condition;
        if (location) whereClause.location = { [Op.like]: `%${location}%` };
        if (sellerId) whereClause.sellerId = sellerId;

        // Price range filter
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
        }

        // Sort options
        let orderClause = [[sortBy, sortOrder]];
        if (sortBy === 'price') {
            orderClause = [['price', sortOrder]];
        } else if (sortBy === 'views') {
            orderClause = [['views', sortOrder]];
        } else if (sortBy === 'saves') {
            orderClause = [['saves', sortOrder]];
        } else if (sortBy === 'random') {
            orderClause = [[Sequelize.fn('RAND')]];
        } else {
            orderClause = [['createdAt', sortOrder]];
        }

        const products = await Product.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                }
            ],
            order: orderClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        // Add engagement status for current user
        const productsWithEngagement = await Promise.all(
            products.rows.map(async (product) => {
                const productData = product.toJSON();
                
                if (currentUserId) {
                    // Check if user saved the product
                    const userSaved = await SavedProduct.findOne({
                        where: { productId: product.id, userId: currentUserId }
                    });
                    productData.isSaved = !!userSaved;

                    // Check if user is following the seller
                    const userFollow = await UserFollows.findOne({
                        where: { 
                            userId: currentUserId, 
                            followsUserId: product.sellerId 
                        }
                    });
                    productData.isFollowing = !!userFollow;
                }

                return productData;
            })
        );

        res.status(200).json({
            message: "Products retrieved successfully",
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
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Increment view count
        await product.increment('views');

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

        res.status(200).json({
            message: "Product retrieved successfully",
            data: productData
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: "Error retrieving product", error: error.message });
    }
};

// Create new product (SELLERS ONLY)
const createProduct = async (req, res) => {
    try {
        const {
            title,
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

        const userId = req.user.id;

        // Check if user is a seller
        const seller = await SellersTable.findOne({
            where: { userId, verificationStatus: 'active' }
        });

        if (!seller) {
            return res.status(403).json({ 
                message: "Only verified sellers can create products" 
            });
        }

        // Validate required fields
        if (!title || !description || !price || !category || !location) {
            return res.status(400).json({
                message: "Title, description, price, category, and location are required"
            });
        }

        // Validate images/files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one product image is required"
            });
        }

        // Create product first
        const product = await Product.create({
            sellerId: seller.id,
            title: title.trim(),
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
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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
        const updateData = req.body;

        // Check if user is a seller
        const seller = await SellersTable.findOne({
            where: { userId, verificationStatus: 'active' }
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

        // Update product
        await product.update(updateData);

        // Get updated product with associations
        const updatedProduct = await Product.findByPk(productId, {
            include: [
                {
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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
            where: { userId, verificationStatus: 'active' }
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
        const { collectionName = 'Favorites' } = req.body;
        const userId = req.user.id;

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
                            model: UserTable,
                            as: 'seller',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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

// Get product categories
const getCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll({
            where: { isActive: true, parentId: null },
            include: [
                {
                    model: ProductCategory,
                    as: 'subcategories',
                    where: { isActive: true },
                    required: false
                }
            ],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });

        // Format categories for frontend
        const formattedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            subcategories: category.subcategories ? category.subcategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description,
                icon: sub.icon
            })) : []
        }));

        res.status(200).json({
            message: "Categories retrieved successfully",
            data: formattedCategories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: "Error retrieving categories", error: error.message });
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
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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

        const products = await Product.findAndCountAll({
            where: { 
                sellerId: currentUserId
            },
            include: [
                {
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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
                            model: UserTable,
                            as: 'seller',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
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
        const formattedPosts = savedPosts.rows.map((savedItem) => {
            const post = savedItem.post;
            const user = post.user;
            
            // Determine if it's a buyer or seller post based on content
            const isBuyerPost = post.content.toLowerCase().includes('looking for') || 
                               post.content.toLowerCase().includes('want to buy') ||
                               post.content.toLowerCase().includes('need');
            
            return {
                id: savedItem.id,
                type: 'feed-post',
                postType: isBuyerPost ? 'buyer' : 'seller',
                name: post.title,
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
                images: ['📱'], // TODO: Get actual post images
                description: post.content,
                likes: post.likesCount || 0,
                timeAgo: getTimeAgo(savedItem.createdAt),
                isLiked: false, // TODO: Check if user liked this post
                isSaved: true,
                savedDate: savedItem.createdAt.toISOString().split('T')[0]
            };
        });

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
    getSellerProducts,
    getMyProducts,
    getAllSavedItems
}; 