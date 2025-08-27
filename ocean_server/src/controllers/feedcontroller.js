const { Post, PostMedia, PostLike, PostComment, PostShare, SavedPost, UserTable, UserFollows } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const cloudinaryService = require('../services/cloudinaryService');

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
            status: 'active'
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
                    attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
                },
                {
                    model: PostMedia,
                    as: 'media',
                    attributes: ['id', 'mediaType', 'mediaUrl', 'thumbnailUrl', 'mediaOrder'],
                    order: [['mediaOrder', 'ASC']]
                }
            ],
            order: [
                [Sequelize.fn('RAND')], // Random ordering
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

        res.status(200).json({
            message: "Feed retrieved successfully",
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
        console.error('Get feed error:', error);
        res.status(500).json({ message: "Error retrieving feed", error: error.message });
    }
};

// Create a new post
const createPost = async (req, res) => {
    try {
        console.log('Create post request body:', req.body);
        console.log('Create post request files:', req.files);
        
        const {
            postType = 'product',
            content,
            productName,
            brand,
            price,
            currency = 'USD',
            location,
            tags
        } = req.body;

        const userId = req.user.id;

        // Validate required fields
        if (!postType) {
            return res.status(400).json({ message: "postType is required" });
        }
        if (!content) {
            return res.status(400).json({ message: "content is required" });
        }

        // Get user's region and country
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create post
        const post = await Post.create({
            userId,
            postType,
            content,
            productName,
            brand,
            price: price ? parseFloat(price) : null,
            currency,
            location,
            userRegion: user.region || 'Unknown',
            userCountry: user.country || 'Unknown',
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : null
        });

        // Add media if provided (optional - pictures are always optional)
        if (req.files && req.files.length > 0) {
            const mediaPromises = req.files.map(async (file, index) => {
                try {
                    // Determine media type from file mimetype
                    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                    
                    // Upload to Cloudinary
                    const uploadResult = await cloudinaryService.uploadPostMedia(file.buffer, post.id);
                    
                    if (!uploadResult.success) {
                        console.error('Cloudinary upload failed:', uploadResult.error);
                        throw new Error(`Failed to upload ${file.originalname}: ${uploadResult.error}`);
                    }
                    
                    // Create PostMedia record with Cloudinary URLs
                    return PostMedia.create({
                        postId: post.id,
                        mediaType: mediaType,
                        mediaUrl: uploadResult.url,
                        thumbnailUrl: uploadResult.thumbnailUrl,
                        mediaOrder: index,
                        altText: file.originalname
                    });
                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    throw error;
                }
            });
            await Promise.all(mediaPromises);
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
        const { collectionName = 'General' } = req.body;
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
            page = 1, 
            limit = 10, 
            region, 
            country, 
            postType 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Build where clause
        let whereClause = {
            status: 'active',
            [Op.or]: [
                { content: { [Op.like]: `%${query}%` } },
                { productName: { [Op.like]: `%${query}%` } },
                { brand: { [Op.like]: `%${query}%` } },
                { location: { [Op.like]: `%${query}%` } },
                { tags: { [Op.like]: `%${query}%` } }
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
                query,
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

        // Check if user owns the comment or is admin
        if (comment.userId !== userId && req.user.accountType !== 'admin') {
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
    deleteComment,
    getUserPosts
};