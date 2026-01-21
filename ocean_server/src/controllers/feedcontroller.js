const { Post, PostMedia, PostLike, PostComment, PostShare, SavedItem, UserTable, SellersTable, UserFollows, ProductCategory, Notification } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const videoUploadService = require('../services/videoUploadService');
const imageCompressionService = require('../services/imageCompressionService');
const { mapNestedFields } = require('../../utils/fieldMapper');
const redisClient = require('../config/redisdb');

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
        // Removed verbose logging to reduce Railway log rate limiting
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Helper: Standardize user object across all post types
const standardizeUserObject = (postData) => {
    const displayName = postData.user?.seller?.businessName || postData.user?.fullName || 'Unknown User';
    const role = postData.user?.seller ? 'seller' : (postData.user?.accountType || 'user');
    
    // Format location as "City, Country" if both exist
    let location = null;
    if (postData.user?.city && postData.user?.country) {
        location = `${postData.user.city}, ${postData.user.country}`;
    } else if (postData.user?.location) {
        location = postData.user.location;
    }
    
    return {
        id: postData.user?.id || '',
        name: displayName,
        businessName: postData.user?.seller?.businessName || null,
        avatar: postData.user?.profilePicture || '👤',
        verified: postData.user?.accountStatus === 'verified' || postData.user?.seller?.verificationStatus === 'approved',
        role: role,
        location: location
    };
};

// Helper: Standardize media array format
const standardizeMediaArray = (mediaList, postId) => {
    if (!mediaList || !Array.isArray(mediaList) || mediaList.length === 0) {
        return [];
    }
    
    return mediaList.map((item, index) => {
        if (typeof item === 'string') {
            // Simple URL string
            return {
                id: `${postId}_media_${index}`,
                type: item.toLowerCase().includes('.mp4') || item.toLowerCase().includes('.mov') ? 'video' : 'image',
                url: item,
                thumbnailUrl: item,
                order: index
            };
        } else if (item && typeof item === 'object') {
            // Object with mediaUrl or url
            const url = item.url || item.mediaUrl || item.thumbnailUrl || '';
            const mediaType = item.type || item.mediaType || 'image';
            
            return {
                id: item.id || `${postId}_media_${index}`,
                type: mediaType.toLowerCase().includes('video') ? 'video' : 'image',
                url: url,
                thumbnailUrl: item.thumbnailUrl || url,
                order: typeof item.mediaOrder === 'number' ? item.mediaOrder : (typeof item.order === 'number' ? item.order : index)
            };
        }
        return null;
    }).filter(Boolean);
};

// Get home feed with stories and mixed posts
const getHomeFeed = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Create cache key based on query parameters (v2 for new standardized structure)
        const cacheKey = `homeFeed:v2:${page}:${limit}:${currentUserId || 'guest'}`;
        
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

        // Get stories (users with recent posts)
        const stories = await UserTable.findAll({
            include: [
                {
                    model: Post,
                    as: 'posts',
                    where: {
                        createdAt: {
                            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                        }
                    },
                    required: true,
                    attributes: ['id', 'createdAt']
                }
            ],
            attributes: ['id', 'fullName', 'profilePicture', 'accountStatus'],
            limit: 10
        });

        // Format stories for frontend
        const formattedStories = stories.map(story => ({
            id: story.id,
            user: {
                name: story.fullName,
                avatar: story.profilePicture || '👤',
                verified: story.accountStatus === 'verified'
            },
            hasStory: true,
            storyCount: story.posts.length,
            lastStoryTime: story.posts[0]?.createdAt || null, // ISO string format
            isViewed: false // TODO: Implement story viewing tracking
        }));

        // Get mixed feed posts (seller and buyer posts)
        const { SellersTable } = require('../../models');
        const posts = await Post.findAndCountAll({
            where: {
                status: 'active',
                feedVisible: true  // Only show posts that should appear in feed
            },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture', 'accountStatus', 'location'],
                    include: [{
                        model: SellersTable,
                        as: 'seller',
                        attributes: ['businessName', 'verificationStatus'],
                        required: false
                    }]
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                },
                {
                    model: PostLike,
                    as: 'likes',
                    attributes: ['id', 'userId']
                },
                {
                    model: PostComment,
                    as: 'comments',
                    attributes: ['id', 'userId', 'content', 'createdAt'],
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'profilePicture', 'accountStatus']
                        }
                    ],
                    limit: 3,
                    order: [['createdAt', 'DESC']]
                }
            ],
            order: [
                [Sequelize.fn('RAND')], // Random ordering for dynamic feed
                ['createdAt', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        // Format posts for frontend and filter out empty posts
        const formattedPosts = await Promise.all(
            posts.rows
                .filter(post => {
                    const postData = post.toJSON();
                    // Filter out posts with no content and no media
                    const hasContent = postData.content && postData.content.trim().length > 0;
                    const hasMedia = postData.media && postData.media.length > 0;
                    const hasProductName = postData.productName && postData.productName.trim().length > 0;
                    
                    // Keep post if it has at least content OR media OR productName
                    return hasContent || hasMedia || hasProductName;
                })
                .map(async (post) => {
                const postData = post.toJSON();
                
                // Determine post type and format accordingly
                let formattedPost;
                
                // Format based on content type for unified feed
                if (postData.contentType === 'product') {
                    // Try to get images from product table if available
                    let productImages = postData.media?.map(m => m.mediaUrl) || [];
                    
                    // If no images from media, try to get from feed metadata
                    if (productImages.length === 0 && postData.feedMetadata?.images) {
                        productImages = postData.feedMetadata.images;
                    }
                    
                    // If still no images, try to query the actual product
                    if (productImages.length === 0 && postData.sourceId) {
                        const { Product } = require('../../models');
                        try {
                            const actualProduct = await Product.findByPk(postData.sourceId);
                            if (actualProduct && actualProduct.images) {
                                productImages = actualProduct.images;
                            }
                        } catch (err) {
                            console.error('Error fetching product images:', err);
                        }
                    }
                    
                    // Product post format (STANDARDIZED V2)
                    formattedPost = {
                        id: postData.id,
                        type: 'product',
                        category: 'product',
                        contentType: 'product',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        
                        user: standardizeUserObject(postData),
                        
                        caption: '', // Empty for product posts per frontend requirement
                        
                        media: standardizeMediaArray(productImages, postData.id),
                        
                        likesCount: postData.likesCount || 0,
                        commentsCount: postData.commentsCount || 0,
                        sharesCount: postData.sharesCount || 0,
                        savesCount: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false, // Will be set below
                        isSaved: false, // Will be set below
                        
                        productId: postData.sourceId || postData.feedMetadata?.product_id || null,
                        
                        product: {
                            id: postData.sourceId || postData.feedMetadata?.product_id || null,
                            name: postData.productName || 'Product',
                            brand: postData.brand || null,
                            description: postData.content?.replace(/^New Product: /, '').trim() || postData.productName || '',
                            category: postData.feedMetadata?.category || null,
                            price: parseFloat(postData.price) || 0,
                            currencyCode: 'NGN',
                            images: productImages
                            // metadata removed per frontend requirement
                        }
                    };
                } else if (postData.contentType === 'auction') {
                    // Auction post format (STANDARDIZED V2)
                    const auctionImages = postData.media?.map(m => m.mediaUrl) || postData.feedMetadata?.images || [];
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'auction',
                        category: 'auction',
                        contentType: 'auction',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        
                        user: standardizeUserObject(postData),
                        
                        caption: '', // Empty for auction posts per frontend requirement
                        
                        media: standardizeMediaArray(auctionImages, postData.id),
                        
                        likesCount: postData.likesCount || 0,
                        commentsCount: postData.commentsCount || 0,
                        sharesCount: postData.sharesCount || 0,
                        savesCount: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false,
                        isSaved: false,
                        
                        auctionId: postData.sourceId || postData.feedMetadata?.auction_id || null,
                        
                        auction: {
                            id: postData.sourceId || postData.feedMetadata?.auction_id || null,
                            productName: postData.productName || 'Auction',
                            brand: postData.feedMetadata?.brand || postData.brand || null,
                            category: postData.feedMetadata?.category || null,
                            description: postData.content || '',
                            startingBid: parseFloat(postData.feedMetadata?.starting_price || postData.price) || 0,
                            currentBid: parseFloat(postData.feedMetadata?.current_price || postData.feedMetadata?.currentBid || postData.price) || 0,
                            currencyCode: 'NGN',
                            endTime: postData.feedMetadata?.end_time 
                                ? new Date(postData.feedMetadata.end_time).toISOString() 
                                : (postData.feedMetadata?.endTime ? new Date(postData.feedMetadata.endTime).toISOString() : null),
                            images: auctionImages
                            // metadata removed per frontend requirement
                        }
                    };
                } else if (postData.contentType === 'group_buy') {
                    // Group buy post format (STANDARDIZED V2)
                    const groupBuyId = postData.sourceId || postData.feedMetadata?.group_buy_id || null;
                    const groupBuyImages = postData.media?.map(m => m.mediaUrl) || postData.feedMetadata?.images || [];
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'group_buy',
                        category: 'group_buy',
                        contentType: 'group_buy',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        
                        user: standardizeUserObject(postData),
                        
                        caption: (postData.content || '')
                            .replace(/^Group Buy:\s*[^-]+-\s*/, '') // Remove "Group Buy: Title - " prefix
                            .trim(),
                        
                        media: standardizeMediaArray(groupBuyImages, postData.id),
                        
                        likesCount: postData.likesCount || 0,
                        commentsCount: postData.commentsCount || 0,
                        sharesCount: postData.sharesCount || 0,
                        savesCount: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false,
                        isSaved: false,
                        
                        bulkPurchaseId: groupBuyId,
                        
                        groupBuy: {
                            id: groupBuyId,
                            productName: postData.feedMetadata?.product_name || postData.productName || 'Group Buy',
                            brand: postData.feedMetadata?.brand || postData.brand || null,
                            category: postData.feedMetadata?.category || null,
                            description: postData.content || '',
                            pricePerUnit: parseFloat(postData.feedMetadata?.group_price || postData.price) || 0,
                            currencyCode: 'NGN',
                            minBuyers: parseInt(postData.feedMetadata?.min_buyers || postData.feedMetadata?.minBuyers) || 0,
                            maxBuyers: parseInt(postData.feedMetadata?.max_buyers || postData.feedMetadata?.maxBuyers) || 0,
                            currentBuyers: parseInt(postData.feedMetadata?.current_buyers || postData.feedMetadata?.currentBuyers) || 0,
                            deadline: postData.feedMetadata?.deadline 
                                ? new Date(postData.feedMetadata.deadline).toISOString()
                                : null,
                            images: groupBuyImages
                            // metadata removed per frontend requirement
                        }
                    };
                } else if (postData.contentType === 'swap_deal') {
                    // Swap deal post format (STANDARDIZED V2)
                    const swapDealId = postData.sourceId || 
                                      postData.feedMetadata?.swap_deal_id || 
                                      postData.feedMetadata?.swap_dealId || 
                                      null;
                    
                    // Get images from feedMetadata or media - PARSE JSON if stringified
                    let swapDealImages = [];
                    if (postData.feedMetadata?.images) {
                        // Check if images is a stringified JSON array
                        if (typeof postData.feedMetadata.images === 'string') {
                            try {
                                swapDealImages = JSON.parse(postData.feedMetadata.images);
                            } catch (e) {
                                console.error('Error parsing swap deal images:', e);
                                swapDealImages = [];
                            }
                        } else if (Array.isArray(postData.feedMetadata.images)) {
                            swapDealImages = postData.feedMetadata.images;
                        }
                    } else if (postData.media && postData.media.length > 0) {
                        swapDealImages = postData.media.map(m => m.mediaUrl);
                    }
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'swap_deal',
                        category: 'swap_deal',
                        contentType: 'swap_deal',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        
                        user: standardizeUserObject(postData),
                        
                        caption: (postData.content || '')
                            .replace(/^Swap Deal:\s*[^-]+-\s*/, '') // Remove "Swap Deal: Title - " prefix
                            .replace(/\nBrand:.*$/, '') // Remove "Brand: ..." suffix
                            .trim(),
                        
                        media: standardizeMediaArray(swapDealImages, postData.id),
                        
                        likesCount: postData.likesCount || 0,
                        commentsCount: postData.commentsCount || 0,
                        sharesCount: postData.sharesCount || 0,
                        savesCount: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false,
                        isSaved: false,
                        
                        swapDealId: swapDealId,
                        
                        swapDeal: {
                            id: swapDealId,
                            title: postData.productName || `Swap Deal: ${postData.feedMetadata?.product_to_swap || 'Product'}`,
                            myItem: {
                                name: postData.feedMetadata?.product_to_swap || postData.productName || '',
                                brand: postData.feedMetadata?.brand_to_swap || null,
                                category: postData.feedMetadata?.category_to_swap || null,
                                condition: postData.feedMetadata?.condition || null,
                                images: swapDealImages // Already parsed above
                            },
                            wantedItem: {
                                name: postData.feedMetadata?.preferred_items || '',
                                category: postData.feedMetadata?.preferred_swap_category || null
                            },
                            preferredSwapCategory: postData.feedMetadata?.preferred_swap_category || null,
                            status: postData.feedMetadata?.status || 'active'
                        }
                    };
                } else if (postData.contentType === 'product_demand') {
                    // Product Demand post format (STANDARDIZED V2)
                    const buyerNeedId = postData.sourceId || postData.feedMetadata?.buyer_need_id || null;
                    
                    // Get images from media or feedMetadata
                    let demandImages = [];
                    if (postData.media && postData.media.length > 0) {
                        demandImages = postData.media.map(m => m.mediaUrl);
                    } else if (postData.feedMetadata?.images) {
                        demandImages = postData.feedMetadata.images;
                    }
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'product_demand',
                        category: 'product_demand',
                        contentType: 'product_demand',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        
                        user: standardizeUserObject(postData),
                        
                        caption: (postData.content || `Product Demand: ${postData.feedMetadata?.title || postData.productName || 'Product'}`)
                            .replace(/^Product Demand:\s*/, '') // Remove "Product Demand: " prefix
                            .trim(),
                        
                        media: standardizeMediaArray(demandImages, postData.id),
                        
                        likesCount: postData.likesCount || 0,
                        commentsCount: postData.commentsCount || 0,
                        sharesCount: postData.sharesCount || 0,
                        savesCount: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false,
                        isSaved: false,
                        
                        demandPostId: buyerNeedId,
                        
                        buyerNeed: {
                            id: buyerNeedId,
                            title: postData.feedMetadata?.title || postData.productName || 'Product Demand',
                            description: postData.feedMetadata?.description || 
                                        (postData.content || '').replace(/^Product Demand:\s*/, '').trim() || '',
                            category: postData.feedMetadata?.category || null,
                            reachLimit: postData.feedMetadata?.reach_limit || 5,
                            currentReach: postData.feedMetadata?.current_reach || 0,
                            reachExceeded: postData.feedMetadata?.reach_exceeded || false,
                            expiresAt: postData.feedMetadata?.expires_at 
                                ? new Date(postData.feedMetadata.expires_at).toISOString()
                                : null,
                            status: postData.feedMetadata?.status || 'active',
                            isFeatured: postData.feedMetadata?.is_featured || false
                        }
                    };
                } else {
                    // Check if this is a distress sale disguised as general post
                    const isDistressSale = postData.content?.includes('Distress Sale:') || 
                                          postData.feedMetadata?.isDistressSale ||
                                          postData.feedMetadata?.is_distress_sale;
                    
                    if (isDistressSale && postData.sourceId) {
                        // Treat as product post (distress sale)
                        const productImages = postData.media?.map(m => m.mediaUrl) || postData.feedMetadata?.images || [];
                        
                        formattedPost = {
                            id: postData.id,
                            type: 'product',
                            category: 'product',
                            contentType: 'product',
                            createdAt: postData.createdAt,
                            updatedAt: postData.updatedAt,
                            
                            user: standardizeUserObject(postData),
                            
                            caption: '', // Empty for distress sale product posts per frontend requirement
                            
                            media: standardizeMediaArray(productImages, postData.id),
                            
                            likesCount: postData.likesCount || 0,
                            commentsCount: postData.commentsCount || 0,
                            sharesCount: postData.sharesCount || 0,
                            savesCount: postData.savedCount || 0,
                            timeAgo: getTimeAgo(postData.createdAt),
                            isLiked: false,
                            isSaved: false,
                            
                            productId: postData.sourceId || postData.feedMetadata?.product_id || null,
                            
                            product: {
                                id: postData.sourceId || postData.feedMetadata?.product_id || null,
                                name: postData.productName || postData.feedMetadata?.product_name || 'Product',
                                brand: postData.brand || postData.feedMetadata?.brand || null,
                                description: (postData.content || '')
                                    .replace(/^Distress Sale:\s*[^-]+-\s*/, '') // Remove "Distress Sale: Title - " prefix
                                    .trim(),
                                category: postData.feedMetadata?.category || null,
                                price: parseFloat(postData.price || postData.feedMetadata?.price) || 0,
                                currencyCode: 'NGN',
                                images: productImages,
                                isDistressSale: true,
                                urgencyLevel: postData.feedMetadata?.urgencyLevel || postData.feedMetadata?.urgency_level || 'high',
                                discountPercentage: postData.feedMetadata?.discountPercentage || postData.feedMetadata?.discount_percentage || null
                                // metadata removed per frontend requirement
                            }
                        };
                    } else {
                        // General post format (STANDARDIZED V2)
                        const postImages = postData.media?.map(m => m.mediaUrl) || [];
                        
                        formattedPost = {
                            id: postData.id,
                            type: 'general',
                            category: 'general',
                            contentType: 'post',
                            createdAt: postData.createdAt,
                            updatedAt: postData.updatedAt,
                            
                            user: standardizeUserObject(postData),
                            
                            caption: postData.content || '',
                            
                            media: standardizeMediaArray(postImages, postData.id),
                            
                            likesCount: postData.likesCount || 0,
                            commentsCount: postData.commentsCount || 0,
                            sharesCount: postData.sharesCount || 0,
                            savesCount: postData.savedCount || 0,
                            timeAgo: getTimeAgo(postData.createdAt),
                            isLiked: false,
                            isSaved: false
                        };
                    }
                }

                // Add user engagement status
                if (currentUserId) {
                    // Check if user liked the post
                    const userLike = await PostLike.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    formattedPost.isLiked = !!userLike;

                    // Check if user saved the post
                    const userSaved = await SavedItem.findOne({
                        where: { itemId: post.id, itemType: 'post', userId: currentUserId }
                    });
                    formattedPost.isSaved = !!userSaved;
                }

                return formattedPost;
            })
        );

        // Map pagination fields to match frontend expectations
        const pagination = {
            currentPage: parseInt(page),
            currentLimit: parseInt(limit),
            totalPosts: posts.count,
            hasNextPage: offset + limit < posts.count,
            hasPrevPage: page > 1
        };
        
        const frontendPagination = mapNestedFields(pagination, {
            currentPage: 'page',
            currentLimit: 'limit',
            totalPosts: 'totalCount',
            hasPrevPage: 'hasPreviousPage'
        });

        const responseData = {
            success: true,
            message: "Home feed retrieved successfully",
            data: {
                stories: formattedStories,
                posts: formattedPosts,
                pagination: frontendPagination
            }
        };

        // Cache the response in Redis for 2 minutes
        try {
            await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));
        } catch (redisError) {
            console.error('Redis cache write failed:', redisError.message);
            // Continue even if caching fails
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Get home feed error:', error);
        res.status(500).json({ message: "Error retrieving home feed", error: error.message });
    }
};

// Helper function to format time ago
const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return postDate.toLocaleDateString();
};

// Helper function to generate tags from content
const generateTagsFromContent = (content) => {
    if (!content) return ['general'];
    
    // Simple keyword extraction - remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    const words = content.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 5); // Take first 5 meaningful words
    
    // Add 'general' if no meaningful words found
    return words.length > 0 ? words : ['general'];
};

// Get feed with region filtering and random ordering
const getFeed = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            region, 
            country, 
            postType,
            search,
            userId 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Create cache key based on query parameters
        const cacheKey = `feed:${page}:${limit}:${region || ''}:${country || ''}:${postType || ''}:${search || ''}:${userId || ''}:${currentUserId || 'guest'}`;
        
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

        // Build where clause
        let whereClause = {
            status: 'active',
            feedVisible: true  // Only show posts that should appear in feed
        };

        // Region filtering
        if (region) {
            whereClause.userRegion = region;
        }
        if (country) {
            whereClause.userCountry = country;
        }
        if (postType) {
            whereClause.postType = postType;
        }
        
        // Content type filtering (for unified feed)
        if (req.query.contentType) {
            whereClause.contentType = req.query.contentType;
        }

        // Search functionality
        if (search) {
            whereClause[Op.or] = [
                { content: { [Op.like]: `%${search}%` } },
                { productName: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } },
                { tags: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get posts with random ordering to avoid repetition
        const posts = await Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus', 'location'],
                    include: [
                        {
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['businessName']
                        }
                    ]
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ],
            order: [
                ['feedPriority', 'DESC'], // Priority first (boosted items)
                [Sequelize.fn('RAND')], // Random ordering for same priority
                ['createdAt', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        // Add engagement status for current user and filter out empty posts
        const postsWithEngagement = await Promise.all(
            posts.rows
                .filter(post => {
                    const postData = post.toJSON();
                    // Filter out posts with no content and no media
                    const hasContent = postData.content && postData.content.trim().length > 0;
                    const hasMedia = postData.media && postData.media.length > 0;
                    const hasProductName = postData.productName && postData.productName.trim().length > 0;
                    
                    // Keep post if it has at least content OR media OR productName
                    return hasContent || hasMedia || hasProductName;
                })
                .map(async (post) => {
                const postData = post.toJSON();
                
                if (currentUserId) {
                    // Check if user liked the post
                    const userLike = await PostLike.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    postData.isLiked = !!userLike;

                    // Check if user saved the post
                    const userSaved = await SavedItem.findOne({
                        where: { itemId: post.id, itemType: 'post', userId: currentUserId }
                    });
                    postData.isSaved = !!userSaved;

                    // Check if user is following the post author
                    const userFollow = await UserFollows.findOne({
                        where: { 
                            userId: currentUserId, 
                            followsUserId: post.userId 
                        }
                    });
                    postData.isFollowing = !!userFollow;
                }

                return postData;
            })
        );

        // Map pagination fields to match frontend expectations
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(posts.count / limit),
            totalPosts: posts.count,
            hasNextPage: offset + limit < posts.count,
            hasPrevPage: page > 1
        };
        
        const frontendPagination = mapNestedFields(pagination, {
            currentPage: 'page',
            totalPosts: 'totalCount',
            hasPrevPage: 'hasPreviousPage'
        });

        const responseData = {
            success: true,
            message: "Feed retrieved successfully",
            data: {
                posts: postsWithEngagement,
                pagination: frontendPagination
            }
        };

        // Cache the response in Redis for 2 minutes
        try {
            await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));
        } catch (redisError) {
            console.error('Redis cache write failed:', redisError.message);
            // Continue even if caching fails
        }

        res.status(200).json(responseData);

  } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ message: "Error retrieving feed", error: error.message });
    }
};

// Create a new post (Simplified Social Media Style)
const createPost = async (req, res) => {
    try {
        console.log('Create post request body:', req.body);
        console.log('Create post request files:', req.files);
        
        // Parse form data - handle both multer parsed and raw FormData
        let formData = {};
        if (!req.files && req.body && req.body._parts) {
            console.log('Files not parsed by multer, handling manually');
            // Parse the _parts array to extract form data
            req.body._parts.forEach(part => {
                if (part[0] !== 'media') {
                    formData[part[0]] = part[1];
                }
            });
            console.log('Parsed form data:', formData);
        } else {
            formData = req.body || {};
        }
        
        // Extract only the fields the frontend actually uses
        const { 
            content, 
            reach_limit, 
            category_id  // Changed from 'category' to 'category_id' for proper UUID reference
        } = formData;
        const userId = req.user.id;
        const userAccountType = req.user.accountType || req.user.role;

        // Block buyers from creating posts - they should use buyer needs instead
        if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
            return res.status(403).json({ 
                success: false,
                message: "Buyers cannot create posts. Please use the Buyer Needs feature instead.",
                redirectTo: "/buyer-needs/create"
            });
        }

        // Validate required fields - only content is required now
        if (!content || (typeof content !== 'string') || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Content is required" 
            });
        }

        // Validate reach_limit if provided
        let parsedReachLimit = 5; // Default value
        if (reach_limit !== undefined && reach_limit !== null && reach_limit !== '') {
            parsedReachLimit = parseInt(reach_limit);
            if (isNaN(parsedReachLimit) || parsedReachLimit < 1 || parsedReachLimit > 50) {
                return res.status(400).json({ 
                    message: "Reach limit must be a number between 1 and 50" 
                });
            }
        }

        // Validate category_id if provided (should be a valid UUID)
        let validatedCategoryId = null;
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            // Basic UUID validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(category_id)) {
                return res.status(400).json({ 
                    message: "Category ID must be a valid UUID" 
                });
            }
            
            // Verify category exists in database
            const category = await ProductCategory.findByPk(category_id);
            if (!category) {
                return res.status(400).json({ 
                    message: "Category not found" 
                });
            }
            validatedCategoryId = category_id;
        }

        // Get user's region and country
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Auto-fill all database columns with smart defaults
        const autoFilledData = {
            userId,
            postType: 'general', // Always 'general' for social media style posts
            contentType: 'post', // This is a regular post, not auto-generated
            content: content.trim(),
            
            // Auto-generate productName from first few words of content
            productName: content.trim().split(' ').slice(0, 3).join(' ') || 'General Post',
            
            // Set defaults for product-related fields
            brand: null,
            price: null,
            currency: 'NGN',
            
            // Use user's location or default
            location: user.location || 'Lagos, Nigeria',
            
            // Auto-generate tags from content (simple keyword extraction)
            tags: generateTagsFromContent(content),
            
            // User location data
            userRegion: user.region || 'Lagos',
            userCountry: user.country || 'Nigeria',
            
            // Engagement counters
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            savedCount: 0,
            
            // Unified feed system fields
            autoGenerated: false,
            feedVisible: true,
            feedPriority: 0,
            
            // Status
            status: 'active'
        };

        // Create post with auto-filled data
        const post = await Post.create(autoFilledData);

        // Add media if provided (optional - pictures are always optional)
        if (req.files && req.files.length > 0) {
            const mediaPromises = req.files.map(async (file, index) => {
                try {
                    // Determine media type from file mimetype
                    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                    
                    let uploadResult;
                    if (mediaType === 'video') {
                        // Use unified video upload service (AWS S3 if configured, otherwise Cloudinary)
                        uploadResult = await videoUploadService.uploadVideo(
                            file.buffer,
                            `ocean-app/posts/${post.id}`,
                            {
                                mimetype: file.mimetype
                            }
                        );
                    } else {
                        // Images always use Cloudinary
                        uploadResult = await cloudinaryService.uploadPostMedia(file.buffer, post.id);
                    }
                    
                    if (!uploadResult.success) {
                        console.error('Upload failed:', uploadResult.error);
                        throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
                    }
                    
                    // Create PostMedia record with Cloudinary URLs
                    const mediaRecord = await PostMedia.create({
                        postId: post.id,
                        mediaType: mediaType,
                        mediaUrl: uploadResult.url,
                        thumbnailUrl: uploadResult.thumbnailUrl,
                        mediaOrder: index,
                        altText: file.originalname
                    });
                    
                    return mediaRecord;
                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    throw error;
                }
            });
            await Promise.all(mediaPromises);
        } else if (req.body._parts) {
            // Handle files from _parts array when multer fails
            const mediaParts = req.body._parts.filter(part => part[0] === 'media');
            
            if (mediaParts.length > 0) {
                // Process files from _parts array
                const mediaPromises = mediaParts.map(async (part, index) => {
                    try {
                        // Extract file data from the part
                        const fileData = part[1];
                        
                        // For now, we'll skip actual file processing since we can't easily extract the buffer
                        // This is a limitation of the current approach
                        return null;
                    } catch (error) {
                        console.error(`Error processing file ${index}:`, error);
                        return null;
                    }
                });
                
                await Promise.all(mediaPromises);
            }
        }

        // Get created post with associations
        const createdPost = await Post.findByPk(post.id, {
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ]
        });

        // Note: Auto-creating buyer needs from posts has been removed
        // Buyers should now create buyer needs directly instead of posts
        // Only sellers can create posts, and posts are for products/announcements

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: createdPost
        });

  } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: "Error creating post", error: error.message });
    }
};

// Get single post with engagement
const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const currentUserId = req.user?.id;

        const post = await Post.findOne({
            where: { id: postId, status: 'active' },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const postData = post.toJSON();

        // Add engagement status for current user
        if (currentUserId) {
            const [userLike, userSaved, userFollow] = await Promise.all([
                PostLike.findOne({ where: { postId, userId: currentUserId } }),
                SavedPost.findOne({ where: { postId, userId: currentUserId } }),
                UserFollows.findOne({ 
            where: {
                        userId: currentUserId, 
                        followsUserId: post.userId 
                    } 
                })
            ]);

            postData.isLiked = !!userLike;
            postData.isSaved = !!userSaved;
            postData.isFollowing = !!userFollow;
        }

        res.status(200).json({
            success: true,
            message: "Post retrieved successfully",
            data: postData
        });

    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: "Error retrieving post", error: error.message });
    }
};

// Like/Unlike a post
const toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Check if post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if already liked
        const existingLike = await PostLike.findOne({
            where: { postId, userId }
        });

        if (existingLike) {
            // Unlike
            await existingLike.destroy();
            await post.decrement('likesCount');
            
            res.status(200).json({
                success: true,
                message: "Post unliked successfully",
                data: { isLiked: false }
            });
        } else {
            // Like
            await PostLike.create({ postId, userId });
            await post.increment('likesCount');
            
            // Send notification to post owner (if not liking own post)
            if (post.userId !== userId) {
                const user = await UserTable.findByPk(userId, {
                    attributes: ['id', 'fullName', 'email', 'profilePicture']
                });
                
                await createNotification(
                    post.userId,
                    'Your Post Was Liked',
                    `${user.fullName} liked your post`,
                    'info',
                    'like',
                    { 
                        postId: post.id, 
                        likerId: userId,
                        likerName: user.fullName,
                        postPreview: post.content ? post.content.substring(0, 100) : 'Your post'
                    }
                );
            }
            
            res.status(200).json({
                success: true,
                message: "Post liked successfully",
                data: { isLiked: true }
            });
        }

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: "Error toggling like", error: error.message });
    }
};

// Save/Unsave a post
const toggleSave = async (req, res) => {
    try {
        const { postId } = req.params;
        const collectionName = req.body?.collectionName || 'General';
        const userId = req.user.id;

        // Check if post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if already saved
        const existingSave = await SavedPost.findOne({
            where: { postId, userId }
        });

        if (existingSave) {
            // Unsave
            await existingSave.destroy();
            await post.decrement('savedCount');
            
            res.status(200).json({
                success: true,
                message: "Post unsaved successfully",
                data: { isSaved: false }
            });
        } else {
            // Save
            await SavedPost.create({ postId, userId, collectionName });
            await post.increment('savedCount');
            
            res.status(200).json({
                success: true,
                message: "Post saved successfully",
                data: { isSaved: true }
            });
        }

    } catch (error) {
        console.error('Toggle save error:', error);
        res.status(500).json({ message: "Error toggling save", error: error.message });
    }
};

// Delete saved post by savedItemId
const deleteSavedPost = async (req, res) => {
    try {
        const { savedItemId } = req.params;
        const userId = req.user.id;

        console.log('Delete saved post request:', { savedItemId, userId });

        const savedPost = await SavedPost.findOne({
            where: { id: savedItemId, userId }
        });

        if (!savedPost) {
            console.log('SavedPost not found. Checking if it exists with different userId...');
            const anySavedPost = await SavedPost.findOne({
                where: { id: savedItemId }
            });
            console.log('SavedPost exists:', !!anySavedPost, anySavedPost ? { userId: anySavedPost.userId, currentUserId: userId } : 'N/A');
            
            return res.status(404).json({ 
                success: false,
                message: "Saved post not found" 
            });
        }

        const postId = savedPost.postId;
        await savedPost.destroy();
        await Post.decrement('savedCount', { where: { id: postId } });

        res.status(200).json({
            success: true,
            message: "Saved post removed successfully",
            data: { isSaved: false }
        });
    } catch (error) {
        console.error('Delete saved post error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error removing saved post", 
            error: error.message 
        });
    }
};

// ============================================================================
// SAVED ITEMS MIGRATION NOTICE
// ============================================================================
// Old save methods (toggleSave, getSavedPosts, deleteSavedPost) REMOVED
// Use unified system: ocean_server/src/controllers/savedItemsController.js
// New endpoint: POST /api/items/:itemId/save (Body: { itemType: 'post' })
// ============================================================================

// Share a post
const toggleShare = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Check if post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if already shared (to prevent duplicate shares)
        const existingShare = await PostShare.findOne({
            where: { postId, userId }
        });

        if (existingShare) {
            // Already shared - optionally remove the share record or just return success
            // For share functionality, we typically don't "unshare", so we just return
            res.status(200).json({
                success: true,
                message: "Post already shared",
                data: { 
                    isShared: true,
                    sharesCount: post.sharesCount || 0
                }
            });
        } else {
            // Share the post
            await PostShare.create({ postId, userId });
            await post.increment('sharesCount');
            
            // Get updated share count
            await post.reload();
            const updatedSharesCount = post.sharesCount || 0;
            
            // Send notification to post owner (if not sharing own post)
            if (post.userId !== userId) {
                const user = await UserTable.findByPk(userId, {
                    attributes: ['id', 'fullName', 'email', 'profilePicture']
                });
                
                await createNotification(
                    post.userId,
                    'Your Post Was Shared',
                    `${user.fullName} shared your post`,
                    'info',
                    'share',
                    { 
                        postId: post.id, 
                        sharerId: userId,
                        sharerName: user.fullName,
                        postPreview: post.content ? post.content.substring(0, 100) : 'Your post'
                    }
                );
            }
            
            res.status(200).json({
                success: true,
                message: "Post shared successfully",
                data: { 
                    isShared: true,
                    sharesCount: updatedSharesCount
                }
            });
        }

    } catch (error) {
        console.error('Toggle share error:', error);
        res.status(500).json({ message: "Error sharing post", error: error.message });
    }
};

// Get user's saved posts
const getSavedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, collectionName } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        let whereClause = { userId };
        if (collectionName) {
            whereClause.collectionName = collectionName;
        }

        const savedPosts = await SavedPost.findAndCountAll({
            where: whereClause,
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
                            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                            order: [['mediaOrder', 'ASC']]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Map pagination fields to match frontend expectations
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(savedPosts.count / limit),
            totalSavedPosts: savedPosts.count,
            hasNextPage: offset + limit < savedPosts.count,
            hasPrevPage: page > 1
        };
        
        const frontendPagination = mapNestedFields(pagination, {
            currentPage: 'page',
            totalSavedPosts: 'totalCount',
            hasPrevPage: 'hasPreviousPage'
        });

        res.status(200).json({
            success: true,
            message: "Saved posts retrieved successfully",
            data: {
                savedPosts: savedPosts.rows,
                pagination: frontendPagination
            }
        });

    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({ message: "Error retrieving saved posts", error: error.message });
    }
};

// Search posts
const searchPosts = async (req, res) => {
    try {
        const { 
            query,
            q, // Alternative parameter name for compatibility
            page = 1, 
            limit = 10, 
            region, 
            country, 
            postType 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Use either 'query' or 'q' parameter
        const searchQuery = query || q;
        
        if (!searchQuery) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Build where clause
        let whereClause = {
            status: 'active',
            [Op.or]: [
                { content: { [Op.like]: `%${searchQuery}%` } },
                { productName: { [Op.like]: `%${searchQuery}%` } },
                { brand: { [Op.like]: `%${searchQuery}%` } },
                { location: { [Op.like]: `%${searchQuery}%` } },
                { tags: { [Op.like]: `%${searchQuery}%` } }
            ]
        };
        
        // Apply additional filters
        if (region) {
            whereClause.userRegion = region;
        }
        if (country) {
            whereClause.userCountry = country;
        }
        if (postType) {
            whereClause.postType = postType;
        }
        
        // Get posts with pagination
        const posts = await Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    include: [
                        {
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['id', 'businessName', 'businessEmail']
                        }
                    ],
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus', 'location']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });
        
        // Add engagement status for current user and include seller metadata
        const postsWithEngagement = await Promise.all(
            posts.rows.map(async (post) => {
                const postData = post.toJSON();
                
                // Add sellerEntityId and sellerMeta
                postData.sellerEntityId = postData.user?.seller?.id || null;
                postData.sellerMeta = postData.user?.seller ? {
                    businessName: postData.user.seller.businessName || null,
                    profilePicture: postData.user.profilePicture || null,
                    businessEmail: postData.user.seller.businessEmail || null
                } : null;
                
                if (currentUserId) {
                    // Check if user liked the post
                    const userLike = await PostLike.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    postData.isLiked = !!userLike;

                    // Check if user saved the post
                    const userSaved = await SavedItem.findOne({
                        where: { itemId: post.id, itemType: 'post', userId: currentUserId }
                    });
                    postData.isSaved = !!userSaved;

                    // Check if user is following the post author
                    const userFollow = await UserFollows.findOne({
                        where: { 
                            userId: currentUserId, 
                            followsUserId: post.userId 
                        }
                    });
                    postData.isFollowing = !!userFollow;
                }

                return postData;
            })
        );

        res.status(200).json({
            message: "Posts retrieved successfully",
            data: {
                posts: postsWithEngagement,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(posts.count / limit),
                    totalPosts: posts.count,
                    hasNextPage: offset + limit < posts.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ message: "Error searching posts", error: error.message });
    }
};

// Add minimal stubs for missing route handlers to prevent runtime errors
const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Find the post and verify ownership
        const post = await Post.findOne({
            where: { id: postId, userId, status: 'active' }
        });

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found or you do not have permission to update it' 
            });
        }

        // Parse form data - handle both multer parsed and raw FormData
        let formData = {};
        if (!req.files && req.body._parts) {
            req.body._parts.forEach(part => {
                if (part[0] !== 'media') {
                    formData[part[0]] = part[1];
                }
            });
        } else {
            formData = req.body;
        }

        // Extract updateable fields
        const { content, reach_limit, category_id } = formData;

        // Update fields if provided
        const updateData = {};
        if (content !== undefined && content !== null) {
            if (content.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Content cannot be empty' 
                });
            }
            updateData.content = content.trim();
            // Update productName from content
            updateData.productName = content.trim().split(' ').slice(0, 3).join(' ') || 'General Post';
        }

        if (reach_limit !== undefined && reach_limit !== null && reach_limit !== '') {
            const parsedReachLimit = parseInt(reach_limit);
            if (isNaN(parsedReachLimit) || parsedReachLimit < 1 || parsedReachLimit > 50) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Reach limit must be a number between 1 and 50' 
                });
            }
            updateData.reach_limit = parsedReachLimit;
        }

        if (category_id !== undefined && category_id !== null && category_id !== '') {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(category_id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category ID must be a valid UUID' 
                });
            }
            
            const category = await ProductCategory.findByPk(category_id);
            if (!category) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category not found' 
                });
            }
            updateData.category_id = category_id;
        }

        // Handle media uploads if provided
        if (req.files && req.files.length > 0) {
            // Delete existing media
            await PostMedia.destroy({ where: { postId: post.id } });

            // Upload new media files
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const isVideo = file.mimetype.startsWith('video/');
                
                try {
                    // Compress image before upload if it's an image file
                    let fileBuffer = file.buffer;
                    if (!isVideo) {
                        fileBuffer = await imageCompressionService.compressPostImage(file.buffer);
                    }
                    
                    let uploadResult;
                    if (isVideo) {
                        // Use unified video upload service (AWS S3 if configured, otherwise Cloudinary)
                        uploadResult = await videoUploadService.uploadVideo(
                            fileBuffer,
                            `ocean-app/posts/${post.id}`,
                            {
                                mimetype: file.mimetype
                            }
                        );
                    } else {
                        // Images always use Cloudinary
                        uploadResult = await cloudinaryService.uploadPostMedia(fileBuffer, post.id);
                    }
                    
                    if (uploadResult.success) {
                        await PostMedia.create({
                            postId: post.id,
                            mediaUrl: uploadResult.url,
                            mediaType: isVideo ? 'video' : 'image',
                            thumbnailUrl: uploadResult.thumbnailUrl || null,
                            mediaOrder: i
                        });
                    }
                } catch (error) {
                    console.error(`Error uploading media file ${file.originalname}:`, error);
                }
            }
        }

        // Update the post
        if (Object.keys(updateData).length > 0) {
            await post.update(updateData);
        }

        // Fetch updated post with all associations
        const updatedPost = await Post.findByPk(post.id, {
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            data: updatedPost.toJSON()
        });

    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating post', 
            error: error.message 
        });
    }
};

const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.user.id;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment content is required' 
            });
        }

        // Verify post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        // If parentCommentId is provided, verify it exists and belongs to the same post
        if (parentCommentId) {
            const parentComment = await PostComment.findOne({
                where: { id: parentCommentId, postId, status: 'active' }
            });
            if (!parentComment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Parent comment not found' 
                });
            }
        }

        // Get user info for notification
        const user = await UserTable.findByPk(userId, {
            attributes: ['id', 'fullName', 'username']
        });

        // Create the comment
        const comment = await PostComment.create({
            postId,
            userId,
            content: content.trim(),
            parentCommentId: parentCommentId || null,
            status: 'active'
        });

        // Fetch the created comment with user info
        const createdComment = await PostComment.findByPk(comment.id, {
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'username', 'profilePicture', 'accountType', 'accountStatus']
                }
            ]
        });

        // Create notification for post owner (if not the same user)
        if (post.userId !== userId) {
            await createNotification(
                post.userId,
                'New Comment',
                `${user?.fullName || 'Someone'} commented on your post`,
                'comment',
                'engagement',
                { postId, commentId: comment.id, userId }
            );
        }

        // Format comment to match Flutter expectations (same as getComments)
        const commentData = createdComment.toJSON();
        const formattedComment = {
            id: commentData.id,
            content: commentData.content,
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            user: {
                id: commentData.user?.id,
                fullName: commentData.user?.fullName,
                profilePicture: commentData.user?.profilePicture || null
            }
        };

        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: formattedComment  // Flutter expects: data.data
        });

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating comment', 
            error: error.message 
        });
    }
};

const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Verify post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        // Get top-level comments (no parent)
        const { count, rows: comments } = await PostComment.findAndCountAll({
            where: {
                postId,
                parentCommentId: null, // Only top-level comments
                status: 'active'
            },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'username', 'profilePicture', 'accountType', 'accountStatus']
                }
            ],
            order: [['createdAt', 'DESC']], // Newest comments first
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format comments to match Flutter expectations
        const formattedComments = comments.map(comment => {
            const commentData = comment.toJSON();
            return {
                id: commentData.id,
                content: commentData.content,
                createdAt: commentData.createdAt,
                updatedAt: commentData.updatedAt,
                user: {
                    id: commentData.user?.id,
                    fullName: commentData.user?.fullName,
                    profilePicture: commentData.user?.profilePicture || null
                }
            };
        });

        res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            data: {
                comments: formattedComments  // Flutter expects: data.data.comments
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving comments', 
            error: error.message 
        });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!commentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment ID is required' 
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment content is required' 
            });
        }

        // Find the comment and verify ownership
        const comment = await PostComment.findOne({
            where: { id: commentId, userId, status: 'active' },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'username', 'profilePicture', 'accountType', 'accountStatus']
                }
            ]
        });

        if (!comment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Comment not found or you do not have permission to update it' 
            });
        }

        // Update the comment
        await comment.update({
            content: content.trim()
        });

        // Refresh the comment to get updated timestamp
        await comment.reload({
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'username', 'profilePicture', 'accountType', 'accountStatus']
                }
            ]
        });

        // Format comment to match Flutter expectations
        const commentData = comment.toJSON();
        const formattedComment = {
            id: commentData.id,
            content: commentData.content,
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            user: {
                id: commentData.user?.id,
                fullName: commentData.user?.fullName,
                profilePicture: commentData.user?.profilePicture || null
            }
        };

        res.status(200).json({
            success: true,
            message: 'Comment updated successfully',
            data: formattedComment  // Flutter expects: data.data
        });

    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating comment', 
            error: error.message 
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        if (!commentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment ID is required' 
            });
        }

        // Find the comment and verify ownership
        const comment = await PostComment.findOne({
            where: { id: commentId, userId, status: 'active' }
        });

        if (!comment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Comment not found or you do not have permission to delete it' 
            });
        }

        // Soft delete: set status to 'deleted' instead of actually deleting
        await comment.update({
            status: 'deleted'
        });

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting comment', 
            error: error.message 
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Find the post and verify ownership
        const post = await Post.findOne({
            where: { id: postId, userId, status: 'active' }
        });

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found or you do not have permission to delete it' 
            });
        }

        // Soft delete: set status to 'inactive' instead of actually deleting
        await post.update({
            status: 'inactive'
        });

        // Optionally delete associated media from Cloudinary and database
        // For now, we'll just soft delete the post and keep media

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting post', 
            error: error.message 
        });
    }
};

const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const posts = await Post.findAndCountAll({
            where: { userId, status: 'active' },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        return res.status(200).json({
            message: 'User posts retrieved successfully',
            data: {
                posts: posts.rows,
                totalPosts: posts.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(posts.count / limit)
            }
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        return res.status(500).json({ message: 'Error retrieving user posts', error: error.message });
    }
};

// Get user's liked posts
const getLikedPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Use userId from params, or fallback to current user
        const targetUserId = userId || currentUserId;
        
        if (!targetUserId) {
            return res.status(400).json({ 
                success: false,
                message: 'User ID is required' 
            });
        }

        // Get all liked posts for the user
        const likedPosts = await PostLike.findAndCountAll({
            where: { userId: targetUserId },
            include: [
                {
                    model: Post,
                    as: 'post',
                    where: { status: 'active' },
                    include: [
                        {
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus', 'location'],
                            include: [{
                                model: SellersTable,
                                as: 'seller',
                                attributes: ['id', 'userId', 'businessName', 'businessEmail', 'verificationStatus'],
                                required: false
                            }]
                        },
                        {
                            model: PostMedia,
                            as: 'media',
                            attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                            order: [['mediaOrder', 'ASC']]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']], // Order by when the post was liked
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        // Format posts using the same logic as getHomeFeed
        const formattedPosts = await Promise.all(
            likedPosts.rows.map(async (likedItem) => {
                const post = likedItem.post;
                if (!post) return null; // Skip if post doesn't exist
                
                const postData = post.toJSON();
                
                // Determine post type and format accordingly (same as getHomeFeed)
                let formattedPost;
                
                // Format based on content type for unified feed
                if (postData.contentType === 'product') {
                    // Try to get images from product table if available
                    let productImages = postData.media?.map(m => m.mediaUrl) || [];
                    
                    // If no images from media, try to get from feed metadata
                    if (productImages.length === 0 && postData.feedMetadata?.images) {
                        productImages = postData.feedMetadata.images;
                    }
                    
                    // If still no images, try to query the actual product
                    if (productImages.length === 0 && postData.sourceId) {
                        const { Product } = require('../../models');
                        try {
                            const actualProduct = await Product.findByPk(postData.sourceId);
                            if (actualProduct && actualProduct.images) {
                                productImages = actualProduct.images;
                            }
                        } catch (err) {
                            console.error('Error fetching product images:', err);
                        }
                    }
                    
                    // Get business name if user is a seller, otherwise use personal name
                    const displayName = postData.user.seller?.businessName || postData.user.fullName;
                    
                    // Product post format
                    formattedPost = {
                        id: postData.id,
                        type: 'product',
                        contentType: postData.contentType,
                        category: 'product',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        productId: postData.sourceId || postData.feedMetadata?.product_id || null,
                        sourceId: postData.sourceId || null,
                        sourceTable: postData.sourceTable || 'products',
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        sellerEntityId: postData.user?.seller?.id || null,
                        sellerMeta: {
                            businessName: postData.user?.seller?.businessName || null,
                            profilePicture: postData.user?.profilePicture || null,
                            businessEmail: postData.user?.seller?.businessEmail || null
                        },
                        product: {
                            id: postData.sourceId || postData.feedMetadata?.product_id || null,
                            title: postData.productName || 'Product',
                            price: postData.price ? `₦${parseInt(postData.price).toLocaleString()}` : 'Price not specified',
                            brand: postData.brand,
                            description: postData.content.replace(/^New Product: /, '').trim() || postData.productName || 'Product',
                            images: productImages,
                            metadata: postData.feedMetadata
                        },
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true, // Always true since these are liked posts
                        isSaved: false, // Will be set below
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'auction') {
                    // Auction post format
                    const displayName = postData.user?.seller?.businessName || postData.user?.fullName;
                    const auctionId = postData.sourceId || postData.feedMetadata?.auction_id || null;
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'auction',
                        contentType: postData.contentType,
                        category: 'auction',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        auctionId: auctionId, // ✅ Required for navigation
                        sourceId: postData.sourceId || auctionId, // ✅ Required for navigation
                        sourceTable: postData.sourceTable || 'auctions', // ✅ Required for navigation
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        sellerEntityId: postData.user?.seller?.id || null,
                        sellerMeta: {
                            businessName: postData.user?.seller?.businessName || null,
                            profilePicture: postData.user?.profilePicture || null,
                            businessEmail: postData.user?.seller?.businessEmail || null
                        },
                        auction: {
                            id: auctionId,
                            title: postData.productName || 'Auction',
                            startingPrice: postData.price ? `₦${parseInt(postData.price).toLocaleString()}` : 'Price not specified',
                            description: postData.content,
                            images: postData.media?.map(m => m.mediaUrl) || [],
                            metadata: postData.feedMetadata
                        },
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'group_buy') {
                    // Group buy post format
                    const groupBuyId = postData.sourceId || postData.feedMetadata?.group_buy_id || null;
                    
                    formattedPost = {
                        id: postData.id,
                        type: 'group_buy',
                        contentType: postData.contentType,
                        category: 'bulk_purchase', // Frontend uses 'bulk_purchase'
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        bulkPurchaseId: groupBuyId, // ✅ Required for navigation
                        groupBuyId: groupBuyId, // ✅ Also add as alternative
                        sourceId: postData.sourceId || groupBuyId, // ✅ Required for navigation
                        sourceTable: postData.sourceTable || 'group_buys', // ✅ Required for navigation
                        user: {
                            id: postData.user.id,
                            name: postData.user.fullName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        sellerEntityId: postData.user?.seller?.id || null,
                        sellerMeta: {
                            businessName: postData.user?.seller?.businessName || null,
                            profilePicture: postData.user?.profilePicture || null,
                            businessEmail: postData.user?.seller?.businessEmail || null
                        },
                        groupBuy: {
                            id: groupBuyId,
                            title: postData.productName || 'Group Buy',
                            price: postData.price ? `₦${parseInt(postData.price).toLocaleString()}` : 'Price not specified',
                            description: postData.content,
                            images: postData.media?.map(m => m.mediaUrl) || [],
                            metadata: postData.feedMetadata
                        },
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'swap_deal') {
                    // Swap deal post format
                    const displayName = postData.user?.seller?.businessName || postData.user?.fullName;
                    
                    // Get swap deal ID from multiple sources for frontend compatibility
                    const swapDealId = postData.sourceId || 
                                      postData.feedMetadata?.swap_deal_id || 
                                      postData.feedMetadata?.swap_dealId || 
                                      null;
                    
                    // Get images from feedMetadata or media
                    let swapDealImages = [];
                    if (postData.feedMetadata?.images && Array.isArray(postData.feedMetadata.images)) {
                        swapDealImages = postData.feedMetadata.images;
                    } else if (postData.media && postData.media.length > 0) {
                        swapDealImages = postData.media.map(m => m.mediaUrl);
                    }
                    
                    // Format media array
                    const mediaArray = postData.media?.map((m, index) => ({
                        id: m.id || `media_${Date.now()}_${index}`,
                        type: m.mediaType || 'image',
                        url: m.mediaUrl,
                        thumbnailUrl: m.thumbnailUrl || m.mediaUrl
                    })) || [];
                    
                    // Build feedMetadata with all swap deal details
                    const feedMetadata = {
                        swap_deal_id: swapDealId,
                        images: swapDealImages,
                        ...(postData.feedMetadata || {}), // Include all existing metadata
                        product_to_swap: postData.feedMetadata?.product_to_swap || postData.productName || null,
                        category_to_swap: postData.feedMetadata?.category_to_swap || null,
                        brand_to_swap: postData.feedMetadata?.brand_to_swap || null,
                        condition: postData.feedMetadata?.condition || null,
                        status: postData.feedMetadata?.status || 'active',
                        is_featured: postData.feedMetadata?.is_featured || false
                    };
                    
                    formattedPost = {
                        id: postData.id,
                        swapDealId: swapDealId,  // ✅ Top level swap deal ID
                        category: 'swap_deal',   // ✅ Required category
                        type: 'swap_deal',       // ✅ Required type
                        contentType: 'swap_deal',
                        sourceId: postData.sourceId || swapDealId,  // ✅ Source ID
                        sourceTable: postData.sourceTable || 'swap_deals',  // ✅ Source table
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        // Attach seller identifiers & metadata for frontend
                        sellerEntityId: postData.user?.seller?.id || null,
                        sellerMeta: {
                            businessName: postData.user?.seller?.businessName || null,
                            profilePicture: postData.user?.profilePicture || null,
                            businessEmail: postData.user?.seller?.businessEmail || null
                        },
                        caption: postData.content || `Swap Deal: ${feedMetadata.product_to_swap || 'Product'}`,
                        feedMetadata: feedMetadata,  // ✅ Complete metadata with images array
                        media: mediaArray,  // ✅ Media array format
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'product_demand') {
                    // Product Demand post format (read-only mode on feed)
                    const buyerNeedId = postData.sourceId || postData.feedMetadata?.buyer_need_id || null;
                    
                    // Get images from media or feedMetadata
                    let demandImages = [];
                    if (postData.media && postData.media.length > 0) {
                        demandImages = postData.media.map(m => m.mediaUrl);
                    }
                    
                    // Format media array
                    const mediaArray = postData.media?.map((m, index) => ({
                        id: m.id || `media_${Date.now()}_${index}`,
                        type: m.mediaType || 'image',
                        url: m.mediaUrl,
                        thumbnailUrl: m.thumbnailUrl || m.mediaUrl
                    })) || [];
                    
                    // Build feedMetadata with all buyer need details
                    const feedMetadata = {
                        buyer_need_id: buyerNeedId,
                        title: postData.feedMetadata?.title || postData.productName || 'Product Demand',
                        description: postData.feedMetadata?.description || postData.content || '',
                        category: postData.feedMetadata?.category || postData.category || null,
                        status: postData.feedMetadata?.status || 'active',
                        reach_limit: postData.feedMetadata?.reach_limit || 5,
                        current_reach: postData.feedMetadata?.current_reach || 0,
                        reach_exceeded: postData.feedMetadata?.reach_exceeded || false,
                        expires_at: postData.feedMetadata?.expires_at || null,
                        is_featured: postData.feedMetadata?.is_featured || false,
                        images: demandImages,
                        ...(postData.feedMetadata || {}) // Include all existing metadata
                    };
                    
                    formattedPost = {
                        id: postData.id,
                        demandPostId: buyerNeedId,  // Top level buyer need ID
                        category: 'product_demand',   // Required category
                        type: 'product_demand',       // Required type
                        contentType: 'product_demand',
                        sourceId: postData.sourceId || buyerNeedId,  // Source ID
                        sourceTable: postData.sourceTable || 'buyer_needs',  // Source table
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        user: {
                            id: postData.user.id,
                            name: postData.user.fullName,  // Buyer name (not seller)
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        // Buyer need specific fields
                        buyerNeed: {
                            id: buyerNeedId,
                            title: postData.feedMetadata?.title || postData.productName || 'Product Demand',
                            description: postData.feedMetadata?.description || 
                                        (postData.content || '').replace(/^Product Demand:\s*/, '').trim() || '',
                            category: postData.feedMetadata?.category || postData.category || null,
                            status: postData.feedMetadata?.status || 'active',
                            reach_limit: postData.feedMetadata?.reach_limit || 5,
                            current_reach: postData.feedMetadata?.current_reach || 0,
                            reach_exceeded: postData.feedMetadata?.reach_exceeded || false,
                            expires_at: postData.feedMetadata?.expires_at || null,
                            is_featured: postData.feedMetadata?.is_featured || false
                        },
                        caption: (postData.content || `Product Demand: ${feedMetadata.title}`)
                            .replace(/^Product Demand:\s*/, '') // Remove "Product Demand: " prefix
                            .trim(),
                        feedMetadata: feedMetadata,  // Complete metadata with images array
                        media: mediaArray,  // Media array format
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true, // Always true since these are liked posts
                        isSaved: false, // Will be set below
                        showComments: false,
                        commentList: []
                    };
                } else {
                    // General post format (default) - Map to frontend field names
                    const displayName = postData.user?.seller?.businessName || postData.user?.fullName;
                    
                    // Check if this is a distress sale post
                    const isDistressSale = postData.contentType === 'distress_sale' || 
                                          postData.contentType === 'distressSale' ||
                                          postData.sourceTable === 'distress_sales' ||
                                          postData.feedMetadata?.distressSaleId;
                    
                    formattedPost = {
                        id: postData.id,
                        category: postData.contentType || 'general',  // type → category
                        contentType: postData.contentType || 'post',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        distressSaleId: isDistressSale ? (postData.sourceId || postData.feedMetadata?.distressSaleId || null) : null,
                        sourceId: postData.sourceId || null,
                        sourceTable: postData.sourceTable || null,
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        // Attach seller identifiers & metadata for frontend
                        sellerEntityId: postData.user?.seller?.id || null,
                        sellerMeta: {
                            businessName: postData.user?.seller?.businessName || null,
                            profilePicture: postData.user?.profilePicture || null,
                            businessEmail: postData.user?.seller?.businessEmail || null
                        },
                        caption: postData.content,  // content → caption
                        media: postData.media?.map((m, index) => ({
                            id: m.id || `media_${Date.now()}_${index}`,
                            type: m.mediaType || 'image',
                            url: m.mediaUrl,
                            thumbnailUrl: m.thumbnailUrl || m.mediaUrl
                        })) || [],  // images → media with structure
                        likes: postData.likesCount || 0,
                        comments: postData.commentsCount || 0,
                        shares: postData.sharesCount || 0,
                        saves: postData.savedCount || 0,
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: true,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                }

                // Check if user saved the post
                if (currentUserId) {
                    const userSaved = await SavedItem.findOne({
                        where: { itemId: post.id, itemType: 'post', userId: currentUserId }
                    });
                    formattedPost.isSaved = !!userSaved;
                }

                return formattedPost;
            })
        );

        // Filter out null posts (in case some posts were deleted)
        const validPosts = formattedPosts.filter(post => post !== null);

        // Map pagination fields to match frontend expectations
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(likedPosts.count / limit),
            totalPosts: likedPosts.count,
            hasNextPage: offset + limit < likedPosts.count,
            hasPrevPage: page > 1
        };
        
        const frontendPagination = mapNestedFields(pagination, {
            currentPage: 'page',
            totalPosts: 'totalCount',
            hasPrevPage: 'hasPreviousPage'
        });

        res.status(200).json({
            success: true,
            message: "Liked posts retrieved successfully",
            data: {
                posts: validPosts,
                pagination: frontendPagination
            }
        });

    } catch (error) {
        console.error('Get liked posts error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving liked posts", 
            error: error.message 
        });
    }
};

module.exports = {
    getHomeFeed,
    getFeed,
    createPost,
    updatePost,
    deletePost,
    getPost,
    toggleLike,
    // toggleSave, deleteSavedPost, getSavedPosts - REMOVED (see savedItemsController)
    toggleShare,
    searchPosts,
    createComment,
    getComments,
    updateComment,
    deleteComment,
    getUserPosts,
    getLikedPosts
};