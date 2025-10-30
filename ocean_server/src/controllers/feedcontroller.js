const { Post, PostMedia, PostLike, PostComment, PostShare, SavedPost, UserTable, UserFollows, ProductCategory, Notification, BuyerNeed } = require('../../models');
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
                        user: {
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
                        },
                        product: {
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
                        user: {
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
                        user: {
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
                        timeAgo: getTimeAgo(postData.createdAt),
                        isLiked: false,
                        isSaved: false,
                        showComments: false,
                        commentList: []
                    };
                } else {
                    // General post format (default) - Map to frontend field names
                    const displayName = postData.user?.seller?.businessName || postData.user?.fullName;
                    formattedPost = {
                        id: postData.id,
                        category: postData.contentType || 'general',  // type → category
                        contentType: postData.contentType || 'post',
                        user: {
                            name: displayName,
                            avatar: postData.user.profilePicture || '👤',
                            verified: postData.user.accountStatus === 'verified',
                            location: postData.user.location
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

        // Auto-create buyer need for every post
        console.log('Creating buyer need for post...');
        try {
            const buyerNeedData = {
                title: content.trim().substring(0, 100) || 'General Post',
                description: content.trim(),
                buyer_id: userId,
                category_id: validatedCategoryId, // Use validated category_id
                budget_min: null, // Not provided by frontend
                budget_max: null, // Not provided by frontend
                currency: 'NGN', // Default currency
                location: user.location || 'Lagos, Nigeria',
                urgency: 'medium', // Default urgency
                status: 'active',
                reach_limit: parsedReachLimit, // Use the validated reach limit
                current_reach: 0,
                reach_exceeded: false,
                contact_preference: 'message',
                tags: generateTagsFromContent(content)
            };

            const buyerNeed = await BuyerNeed.create(buyerNeedData);
            console.log('Buyer need created:', buyerNeed.id);

            // Link post to buyer need
            await post.update({
                sourceId: buyerNeed.id.toString(),
                sourceTable: 'buyer_needs',
                contentType: 'buyer_need'
            });

            console.log('Post linked to buyer need');
        } catch (buyerNeedError) {
            console.error('Error creating buyer need:', buyerNeedError);
            // Don't fail the post creation if buyer need creation fails
        }

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

        if (region) whereClause.userRegion = region;
        if (country) whereClause.userCountry = country;
        if (postType) whereClause.postType = postType;

        const posts = await Post.findAndCountAll({
            where: whereClause,
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
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Add engagement status
        const postsWithEngagement = await Promise.all(
            posts.rows.map(async (post) => {
                const postData = post.toJSON();
                
                if (currentUserId) {
                    const [userLike, userSaved, userFollow] = await Promise.all([
                        PostLike.findOne({ where: { postId: post.id, userId: currentUserId } }),
                        SavedPost.findOne({ where: { postId: post.id, userId: currentUserId } }),
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

                return postData;
            })
        );

        res.status(200).json({
            message: "Search completed successfully",
            data: {
                posts: postsWithEngagement,
                query: searchQuery,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(posts.count / limit),
                    totalResults: posts.count,
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

// Create a comment on a post
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        // Check if post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Create comment
        const comment = await PostComment.create({
            postId,
            userId,
            content: content.trim()
        });

        // Increment comment count on post
        await post.increment('commentsCount');

        // Get user info for the comment
        const user = await UserTable.findByPk(userId, {
            attributes: ['id', 'fullName', 'email', 'profilePicture']
        });

        // Send notification to post owner (if not commenting on own post)
        if (post.userId !== userId) {
            await createNotification(
                post.userId,
                'New Comment on Your Post',
                `${user.fullName} commented on your post: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
                'info',
                'comment',
                { 
                    postId: post.id, 
                    commentId: comment.id, 
                    commenterId: userId,
                    commenterName: user.fullName,
                    commentPreview: content.trim().substring(0, 100)
                }
            );
        }

        const commentData = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture
            }
        };

        res.status(201).json({
            message: "Comment created successfully",
            data: commentData
        });

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: "Error creating comment", error: error.message });
    }
};

// Get comments for a post
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Check if post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Get comments with user info
        const comments = await PostComment.findAndCountAll({
            where: { postId },
            include: [
                {
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'profilePicture']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            message: "Comments retrieved successfully",
            data: {
                comments: comments.rows,
                total: comments.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(comments.count / limit)
            }
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: "Error retrieving comments", error: error.message });
    }
};

// Update a comment
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        // Find comment
        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            return res.status(403).json({ message: "You can only edit your own comments" });
        }

        // Update comment content
        comment.content = content.trim();
        await comment.save();

        // Get user info for the updated comment
        const user = await UserTable.findByPk(userId, {
            attributes: ['id', 'fullName', 'email', 'profilePicture']
        });

        const commentData = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture
            }
        };

        res.status(200).json({
            message: "Comment updated successfully",
            data: commentData
        });

    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: "Error updating comment", error: error.message });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Find comment
        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if user owns the comment (ONLY comment owner can delete)
        if (comment.userId !== userId) {
            return res.status(403).json({ message: "You can only delete your own comments" });
        }

        // Get post to update comment count
        const post = await Post.findByPk(comment.postId);
        if (post) {
            await post.decrement('commentsCount');
        }

        // Delete comment
        await comment.destroy();

        res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: "Error deleting comment", error: error.message });
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        // Find post
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user owns the post
        if (post.userId !== userId) {
            return res.status(403).json({ message: "You can only update your own posts" });
        }

        // Update post fields
        const allowedFields = ['content', 'productName', 'brand', 'price', 'location', 'tags'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                post[field] = updateData[field];
            }
        });

        // Handle tags array
        if (updateData.tags) {
            if (typeof updateData.tags === 'string') {
                try {
                    post.tags = JSON.parse(updateData.tags);
                } catch (e) {
                    post.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
            } else if (Array.isArray(updateData.tags)) {
                post.tags = updateData.tags;
            }
        }

        // Save updated post
        await post.save();

        // Handle new media files if provided
        if (req.files && req.files.length > 0) {
            // Delete existing media
            await PostMedia.destroy({ where: { postId: post.id } });
            
            // Add new media
            const mediaPromises = req.files.map((file, index) => {
                const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                
                return PostMedia.create({
                    postId: post.id,
                    mediaType: mediaType,
                    mediaUrl: `/uploads/${file.filename}`,
                    thumbnailUrl: mediaType === 'image' ? `/uploads/${file.filename}` : null,
                    mediaOrder: index,
                    altText: file.originalname
                });
            });
            await Promise.all(mediaPromises);
        }

        res.status(200).json({
            message: "Post updated successfully",
            data: post
        });

    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: "Error updating post", error: error.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Find post
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user owns the post
        if (post.userId !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }

        // Delete associated media files (you might want to add file deletion logic here)
        await PostMedia.destroy({ where: { postId } });

        // Delete associated likes, comments, saves, shares
        await PostLike.destroy({ where: { postId } });
        await PostComment.destroy({ where: { postId } });
        await SavedPost.destroy({ where: { postId } });
        await PostShare.destroy({ where: { postId } });

        // Delete the post
        await post.destroy();

        res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: "Error deleting post", error: error.message });
    }
};

// Get posts by a specific user
const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Get posts for the specified user
        const posts = await Post.findAndCountAll({
            where: {
                userId: userId,
                status: 'active'
            },
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
            ],
            order: [['createdAt', 'DESC']],
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

        res.status(200).json({
            message: "User posts retrieved successfully",
            data: {
                posts: postsWithEngagement,
                totalPosts: posts.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(posts.count / limit)
            }
        });

    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: "Error retrieving user posts", error: error.message });
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
    getSavedPosts,
    searchPosts,
    createComment,
    getComments,
    updateComment,
    deleteComment,
    getUserPosts
};