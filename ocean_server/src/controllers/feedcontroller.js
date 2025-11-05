const { Post, PostMedia, PostLike, PostComment, PostShare, SavedPost, UserTable, SellersTable, UserFollows, ProductCategory, Notification } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');
const { mapNestedFields } = require('../../utils/fieldMapper');

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
        console.log(`📧 Notification created for user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Get home feed with stories and mixed posts
const getHomeFeed = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

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
            lastStoryTime: getTimeAgo(story.posts[0]?.createdAt),
            isViewed: false // TODO: Implement story viewing tracking
        }));

        // Get mixed feed posts (seller and buyer posts)
        const { SellersTable } = require('../../models');
        const posts = await Post.findAndCountAll({
            where: {
                status: 'active'
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

        // Format posts for frontend
        const formattedPosts = await Promise.all(
            posts.rows.map(async (post) => {
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
                    
                    // Get business name if user is a seller, otherwise use personal name
                    const displayName = postData.user.seller?.businessName || postData.user.fullName;
                    
                    // Product post format
                    formattedPost = {
                        id: postData.id,
                        type: 'product',
                        contentType: postData.contentType,
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        productId: postData.sourceId || postData.feedMetadata?.product_id || null,
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
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
                        isLiked: false, // Will be set below
                        isSaved: false, // Will be set below
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'auction') {
                    // Auction post format
                    const displayName = postData.user?.seller?.businessName || postData.user?.fullName;
                    formattedPost = {
                        id: postData.id,
                        type: 'auction',
                        contentType: postData.contentType,
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        user: {
                            id: postData.user.id,
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        auction: {
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
                        isLiked: false,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                } else if (postData.contentType === 'group_buy') {
                    // Group buy post format
                    formattedPost = {
                        id: postData.id,
                        type: 'group_buy',
                        contentType: postData.contentType,
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        user: {
                            id: postData.user.id,
                            name: postData.user.fullName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        groupBuy: {
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
                        isLiked: false,
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
                        isLiked: false,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                    
                    console.log('🔄 SWAP DEAL POST FOUND:', {
                        postId: postData.id,
                        swapDealId: swapDealId,
                        sourceId: postData.sourceId,
                        imagesCount: swapDealImages.length
                    });
                    console.log('🔄 SWAP DEAL MAPPING:', {
                        swapDealId: swapDealId,
                        sourceId: postData.sourceId,
                        feedMetadataSwapDealId: postData.feedMetadata?.swap_deal_id,
                        hasImages: swapDealImages.length > 0
                    });
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
                        isLiked: false,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                }

                // Add user engagement status
                if (currentUserId) {
                    // Check if user liked the post
                    const userLike = await PostLike.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    formattedPost.isLiked = !!userLike;

                    // Check if user saved the post
                    const userSaved = await SavedPost.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    formattedPost.isSaved = !!userSaved;
                }

                return formattedPost;
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

        res.status(200).json({
            message: "Home feed retrieved successfully",
            data: {
                stories: formattedStories,
                posts: formattedPosts,
                pagination: frontendPagination
            }
        });

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

        // Add engagement status for current user
        const postsWithEngagement = await Promise.all(
            posts.rows.map(async (post) => {
                const postData = post.toJSON();
                
                if (currentUserId) {
                    // Check if user liked the post
                    const userLike = await PostLike.findOne({
                        where: { postId: post.id, userId: currentUserId }
                    });
                    postData.isLiked = !!userLike;

                    // Check if user saved the post
                    const userSaved = await SavedPost.findOne({
                        where: { postId: post.id, userId: currentUserId }
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

        res.status(200).json({
            message: "Feed retrieved successfully",
            data: {
                posts: postsWithEngagement,
                pagination: frontendPagination
            }
        });

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
        if (!req.files && req.body._parts) {
            console.log('Files not parsed by multer, handling manually');
            // Parse the _parts array to extract form data
            req.body._parts.forEach(part => {
                if (part[0] !== 'media') {
                    formData[part[0]] = part[1];
                }
            });
            console.log('Parsed form data:', formData);
        } else {
            formData = req.body;
        }
        
        // Extract only the fields the frontend actually uses
        const { 
            content, 
            reach_limit, 
            category_id  // Changed from 'category' to 'category_id' for proper UUID reference
        } = formData;
        const userId = req.user.id;
        const userAccountType = req.user.accountType;

        // Block buyers from creating posts - they should use buyer needs instead
        if (userAccountType === 'buyer' || userAccountType === 'pending-seller') {
            return res.status(403).json({ 
                message: "Buyers cannot create posts. Please use the Buyer Needs feature instead.",
                redirectTo: "/buyer-needs/create"
            });
        }

        // Validate required fields - only content is required now
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Content is required" });
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
        console.log('=== MEDIA PROCESSING DEBUG ===');
        console.log('req.files:', req.files);
        console.log('req.files length:', req.files ? req.files.length : 'no files');
        console.log('req.body keys:', Object.keys(req.body));
        console.log('req.body.media present:', !!req.body.media);
        console.log('req.body.media_name present:', !!req.body.media_name);
        console.log('req.body.media_type present:', !!req.body.media_type);
        console.log('===============================');
        
        if (req.files && req.files.length > 0) {
            console.log(`Processing ${req.files.length} files`);
            const mediaPromises = req.files.map(async (file, index) => {
                try {
                    console.log(`Processing file ${index}:`, {
                        name: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        bufferLength: file.buffer ? file.buffer.length : 'no buffer'
                    });
                    
                    // Determine media type from file mimetype
                    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                    
                    // Upload to Cloudinary
                    console.log(`Uploading file ${index} to Cloudinary...`);
                    const uploadResult = await cloudinaryService.uploadPostMedia(file.buffer, post.id);
                    
                    if (!uploadResult.success) {
                        console.error('Cloudinary upload failed:', uploadResult.error);
                        throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
                    }
                    
                    console.log(`Cloudinary upload successful for file ${index}:`, uploadResult.url);
                    
                    // Create PostMedia record with Cloudinary URLs
                    const mediaRecord = await PostMedia.create({
                        postId: post.id,
                        mediaType: mediaType,
                        mediaUrl: uploadResult.url,
                        thumbnailUrl: uploadResult.thumbnailUrl,
                        mediaOrder: index,
                        altText: file.originalname
                    });
                    
                    console.log(`Created PostMedia record for file ${index}:`, mediaRecord.id);
                    return mediaRecord;
                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    throw error;
                }
            });
            await Promise.all(mediaPromises);
            console.log('All media files processed successfully');
        } else if (req.body._parts) {
            // Handle files from _parts array when multer fails
            console.log('Processing files from _parts array');
            const mediaParts = req.body._parts.filter(part => part[0] === 'media');
            
            if (mediaParts.length > 0) {
                console.log(`Found ${mediaParts.length} media files in _parts`);
                
                // Process files from _parts array
                const mediaPromises = mediaParts.map(async (part, index) => {
                    try {
                        // Extract file data from the part
                        const fileData = part[1];
                        console.log(`Processing file ${index}:`, fileData);
                        
                        // For now, we'll skip actual file processing since we can't easily extract the buffer
                        // This is a limitation of the current approach
                        console.log('Note: Files from _parts array cannot be processed with current implementation');
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

        console.log('Sending response:', { message: "Post created successfully", data: createdPost });
        res.status(201).json({
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
                message: "Post unsaved successfully",
                data: { isSaved: false }
            });
        } else {
            // Save
            await SavedPost.create({ postId, userId, collectionName });
            await post.increment('savedCount');
            
            res.status(200).json({
                message: "Post saved successfully",
                data: { isSaved: true }
            });
        }

    } catch (error) {
        console.error('Toggle save error:', error);
        res.status(500).json({ message: "Error toggling save", error: error.message });
    }
};

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

        res.status(200).json({
            message: "Saved posts retrieved successfully",
            data: {
                savedPosts: savedPosts.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(savedPosts.count / limit),
                    totalSavedPosts: savedPosts.count,
                    hasNextPage: offset + limit < savedPosts.count,
                    hasPrevPage: page > 1
                }
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
                    const userSaved = await SavedPost.findOne({
                        where: { postId: post.id, userId: currentUserId }
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
                    const uploadResult = await cloudinaryService.uploadPostMedia(file.buffer, post.id);
                    
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

module.exports = {
    getHomeFeed,
    getFeed,
    createPost,
    updatePost,
    deletePost,
    getPost,
    toggleLike,
    toggleSave,
    toggleShare,
    getSavedPosts,
    searchPosts,
    createComment,
    getComments,
    updateComment,
    deleteComment,
    getUserPosts
};