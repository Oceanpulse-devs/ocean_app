const { Video, VideoLike, VideoView, VideoComment, VideoCommentLike, UserTable, SellersTable } = require('../../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cloudinaryService = require('../services/cloudinaryService');
const redisClient = require('../config/redisdb');

class VideoController {
    // Create a new video
    static async createVideo(req, res) {
        try {
            console.log('📹 Video creation request received');
            console.log('User ID:', req.user?.id);
            console.log('Request file:', req.file ? 'File present' : 'No file');
            console.log('Request body:', req.body);

            const userId = req.user.id;

            // Extract fields from request body
            const {
                description,
                cta_enabled,
                cta_type,
                cta_label,
                video_role
            } = req.body;

            // Check if video file is uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Video file is required'
                });
            }

            const videoFile = req.file;

            // Validate file type
            if (!videoFile.mimetype.startsWith('video/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Only video files are allowed'
                });
            }

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (videoFile.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: 'Video file size exceeds 100MB limit'
                });
            }

            // Upload video to Cloudinary with eager transformations for thumbnail
            const folder = `ocean-app/videos/${userId}`;
            const uploadOptions = {
                resource_type: 'video',
                quality: 'auto', // Preserves quality while optimizing file size
                // Generate thumbnail as eager transformation (extract frame at 5 seconds)
                eager: [
                    {
                        format: 'jpg',
                        width: 400,
                        height: 300,
                        crop: 'fill',
                        quality: 'auto:good',
                        start_offset: '5' // Extract frame at 5 seconds (or 'auto' for middle frame)
                    }
                ],
                eager_async: true // Use async processing to handle large videos from modern phones
                // Note: Modern phone cameras record high-resolution videos that exceed Cloudinary's
                // synchronous processing limits, so async is required for reliable uploads
            };

            const uploadResult = await cloudinaryService.uploadFile(
                videoFile.buffer,
                folder,
                uploadOptions
            );

            if (!uploadResult.success) {
                // Check for specific Cloudinary errors and provide user-friendly messages
                let errorMessage = 'Failed to upload video';
                let statusCode = 500;
                
                if (uploadResult.error) {
                    const errorLower = uploadResult.error.toLowerCase();
                    
                    // Check for "too large" error (even with async, there might be other size limits)
                    if (errorLower.includes('too large') || 
                        errorLower.includes('eager_async') ||
                        errorLower.includes('synchronously')) {
                        errorMessage = 'Video file is too large to process. Please try uploading a smaller or compressed video.';
                        statusCode = 400;
                    } else if (errorLower.includes('file size') || errorLower.includes('size limit')) {
                        errorMessage = 'Video file size exceeds the maximum allowed limit. Please upload a smaller video.';
                        statusCode = 400;
                    } else if (errorLower.includes('format') || errorLower.includes('not supported')) {
                        errorMessage = 'Video format is not supported. Please use a supported video format (MP4, MOV, etc.).';
                        statusCode = 400;
                    }
                }
                
                return res.status(statusCode).json({
                    success: false,
                    message: errorMessage,
                    error: uploadResult.error // Include technical error for debugging
                });
            }

            // Validate video duration (max 2 minutes = 120 seconds)
            const maxDuration = 120; // 2 minutes in seconds
            const videoDuration = uploadResult.duration ? Math.round(uploadResult.duration) : null;

            if (videoDuration && videoDuration > maxDuration) {
                // Delete the uploaded video from Cloudinary since it exceeds limit
                try {
                    await cloudinaryService.deleteFile(uploadResult.publicId);
                    console.log('🗑️ Deleted video exceeding duration limit from Cloudinary');
                } catch (deleteError) {
                    console.error('Error deleting video from Cloudinary:', deleteError);
                }
                
                return res.status(400).json({
                    success: false,
                    message: `Video duration exceeds 2 minute limit. Your video is ${Math.round(videoDuration)} seconds long.`
                });
            }

            // Get thumbnail from eager transformations (preferred) or fallback
            let thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url;
            
            // If eager transformations were generated, use the first one as thumbnail
            if (uploadResult.eager && uploadResult.eager.length > 0) {
                thumbnailUrl = uploadResult.eager[0].secure_url || uploadResult.eager[0].url;
                console.log('✅ Using eager transformation thumbnail:', thumbnailUrl);
            } else {
                console.log('⚠️ No eager transformations found, using fallback thumbnail URL');
            }

            // Create video record
            const video = await Video.create({
                id: uuidv4(),
                userId,
                videoUrl: uploadResult.url,
                thumbnailUrl: thumbnailUrl,
                description: description || null,
                ctaEnabled: cta_enabled === 'true' || cta_enabled === true,
                ctaType: cta_type || 'none',
                ctaLabel: cta_label || null,
                videoRole: video_role || 'seller',
                duration: uploadResult.duration ? Math.round(uploadResult.duration) : null,
                fileSize: videoFile.size,
                mimeType: videoFile.mimetype,
                likeCount: 0,
                commentCount: 0,
                shareCount: 0,
                viewsCount: 0,
                isSponsored: false,
                status: 'active'
            });

            // Clear video feed cache
            try {
                await redisClient.del('video:feed:*');
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            // Fetch the created video with user data
            const createdVideo = await Video.findByPk(video.id, {
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture'],
                    include: [{
                        model: SellersTable,
                        as: 'seller',
                        attributes: ['businessName', 'businessPhone'],
                        required: false
                    }]
                }]
            });

            const videoData = createdVideo.toJSON();

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    id: videoData.id,
                    videoUrl: videoData.videoUrl,
                    thumbnailUrl: videoData.thumbnailUrl,
                    description: videoData.description,
                    ctaEnabled: videoData.ctaEnabled,
                    ctaType: videoData.ctaType,
                    ctaLabel: videoData.ctaLabel,
                    videoRole: videoData.videoRole,
                    duration: videoData.duration,
                    createdAt: videoData.createdAt,
                    creatorId: videoData.user?.id || null,
                    creatorName: videoData.user?.seller?.businessName || videoData.user?.fullName || 'Unknown',
                    creatorAvatar: videoData.user?.profilePicture || null,
                    category: videoData.videoRole === 'seller' ? 'seller' : 'buyer',
                    isBuyerNeed: videoData.videoRole === 'buyer',
                    ctaType: videoData.ctaType,
                    businessPhone: videoData.user?.seller?.businessPhone || null,
                    likeCount: videoData.likeCount,
                    commentCount: videoData.commentCount,
                    shareCount: videoData.shareCount,
                    isSponsored: videoData.isSponsored
                }
            });
        } catch (error) {
            console.error('Error creating video:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating video',
                error: error.message
            });
        }
    }

    // Get video feed (paginated, TikTok-style)
    static async getVideos(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            const currentUserId = req.user?.id;

            // Try to get from Redis cache first
            const cacheKey = `video:feed:${page}:${limit}`;
            let cachedVideos = null;

            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    cachedVideos = JSON.parse(cached);
                    console.log('✅ Video feed retrieved from Redis cache');
                }
            } catch (redisError) {
                console.error('Redis cache read failed:', redisError.message);
            }

            if (cachedVideos) {
                // Still need to check user-specific data (likes, etc.)
                // Also need to ensure cached videos have creatorId and proper creatorName
                const videos = await Promise.all(
                    cachedVideos.map(async (video) => {
                        const isLiked = currentUserId ? await VideoLike.findOne({
                            where: { videoId: video.id, userId: currentUserId }
                        }) : false;

                        // If cached video doesn't have creatorId, fetch it
                        if (!video.creatorId) {
                            const videoRecord = await Video.findByPk(video.id, {
                                include: [{
                                    model: UserTable,
                                    as: 'user',
                                    attributes: ['id', 'fullName', 'profilePicture'],
                                    include: [{
                                        model: SellersTable,
                                        as: 'seller',
                                        attributes: ['businessName'],
                                        required: false
                                    }]
                                }]
                            });
                            
                            if (videoRecord) {
                                const videoData = videoRecord.toJSON();
                                video.creatorId = videoData.user?.id || null;
                                video.creatorName = videoData.user?.seller?.businessName || videoData.user?.fullName || 'Unknown';
                                video.creatorAvatar = videoData.user?.profilePicture || null;
                            }
                        }

                        return {
                            ...video,
                            isLiked: !!isLiked
                        };
                    })
                );

                return res.json({
                    success: true,
                    data: videos,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: cachedVideos.length
                    }
                });
            }

            // Fetch from database
            const videos = await Video.findAndCountAll({
                where: {
                    status: 'active'
                },
                include: [
                    {
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'profilePicture', 'accountStatus'],
                        include: [{
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['businessName', 'verificationStatus', 'businessPhone'],
                            required: false
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            // Check user likes for each video
            const videoIds = videos.rows.map(v => v.id);
            const userLikes = currentUserId ? await VideoLike.findAll({
                where: {
                    videoId: { [Op.in]: videoIds },
                    userId: currentUserId
                }
            }) : [];

            const likedVideoIds = new Set(userLikes.map(like => like.videoId));

            // Format videos for frontend
            const formattedVideos = videos.rows.map(video => {
                const videoData = video.toJSON();
                return {
                    id: videoData.id,
                    videoUrl: videoData.videoUrl,
                    thumbnailUrl: videoData.thumbnailUrl,
                    description: videoData.description,
                    creatorId: videoData.user?.id || null,
                    creatorName: videoData.user?.seller?.businessName || videoData.user?.fullName || 'Unknown',
                    creatorAvatar: videoData.user?.profilePicture || null,
                    category: videoData.videoRole === 'seller' ? 'seller' : 'buyer',
                    location: videoData.user?.location || null,
                    likeCount: videoData.likeCount,
                    commentCount: videoData.commentCount,
                    shareCount: videoData.shareCount,
                    isSponsored: videoData.isSponsored,
                    ctaType: videoData.ctaType,
                    ctaLabel: videoData.ctaLabel,
                    businessPhone: videoData.user?.seller?.businessPhone || null,
                    isBuyerNeed: videoData.videoRole === 'buyer',
                    isLiked: likedVideoIds.has(videoData.id),
                    isSaved: false, // TODO: Implement saved videos
                    createdAt: videoData.createdAt
                };
            });

            // Cache in Redis (expire after 5 minutes)
            try {
                await redisClient.setEx(cacheKey, 300, JSON.stringify(formattedVideos));
            } catch (redisError) {
                console.error('Redis cache write failed:', redisError.message);
            }

            res.json({
                success: true,
                data: formattedVideos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: videos.count,
                    totalPages: Math.ceil(videos.count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching videos:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching videos',
                error: error.message
            });
        }
    }

    // Get videos by user ID (for profile pages)
    static async getUserVideos(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            const currentUserId = req.user?.id;

            // Validate userId
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Fetch videos from database filtered by userId
            const videos = await Video.findAndCountAll({
                where: {
                    userId: userId,
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
                            attributes: ['businessName', 'verificationStatus', 'businessPhone'],
                            required: false
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            // Check user likes for each video
            const videoIds = videos.rows.map(v => v.id);
            const userLikes = currentUserId ? await VideoLike.findAll({
                where: {
                    videoId: { [Op.in]: videoIds },
                    userId: currentUserId
                }
            }) : [];

            const likedVideoIds = new Set(userLikes.map(like => like.videoId));

            // Format videos for frontend
            const formattedVideos = videos.rows.map(video => {
                const videoData = video.toJSON();
                return {
                    id: videoData.id,
                    videoUrl: videoData.videoUrl,
                    thumbnailUrl: videoData.thumbnailUrl,
                    description: videoData.description,
                    creatorId: videoData.user?.id || null,
                    creatorName: videoData.user?.seller?.businessName || videoData.user?.fullName || 'Unknown',
                    creatorAvatar: videoData.user?.profilePicture || null,
                    category: videoData.videoRole === 'seller' ? 'seller' : 'buyer',
                    location: videoData.user?.location || null,
                    likeCount: videoData.likeCount,
                    commentCount: videoData.commentCount,
                    shareCount: videoData.shareCount,
                    isSponsored: videoData.isSponsored,
                    ctaType: videoData.ctaType,
                    ctaLabel: videoData.ctaLabel,
                    businessPhone: videoData.user?.seller?.businessPhone || null,
                    isBuyerNeed: videoData.videoRole === 'buyer',
                    isLiked: likedVideoIds.has(videoData.id),
                    isSaved: false, // TODO: Implement saved videos
                    createdAt: videoData.createdAt
                };
            });

            res.json({
                success: true,
                data: formattedVideos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: videos.count,
                    totalPages: Math.ceil(videos.count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching user videos:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user videos',
                error: error.message
            });
        }
    }

    // Get single video by ID
    static async getVideoById(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.id;

            const video = await Video.findByPk(id, {
                include: [
                    {
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'profilePicture', 'accountStatus', 'location'],
                        include: [{
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['businessName', 'verificationStatus', 'businessPhone'],
                            required: false
                        }]
                    },
                    {
                        model: VideoComment,
                        as: 'comments',
                        where: { status: 'active' },
                        required: false,
                        include: [{
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'profilePicture']
                        }],
                        limit: 10,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if user liked the video
            const isLiked = currentUserId ? await VideoLike.findOne({
                where: { videoId: id, userId: currentUserId }
            }) : false;

            const videoData = video.toJSON();
            res.json({
                success: true,
                data: {
                    ...videoData,
                    isLiked: !!isLiked
                }
            });
        } catch (error) {
            console.error('Error fetching video:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching video',
                error: error.message
            });
        }
    }

    // Like/unlike video
    static async likeVideo(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if video exists
            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if already liked
            const existingLike = await VideoLike.findOne({
                where: { videoId: id, userId }
            });

            if (existingLike) {
                // Unlike: delete the like
                await existingLike.destroy();
                // Trigger will automatically decrement like_count

                res.json({
                    success: true,
                    message: 'Video unliked',
                    data: {
                        isLiked: false,
                        likeCount: video.likeCount - 1
                    }
                });
            } else {
                // Like: create new like
                await VideoLike.create({
                    id: uuidv4(),
                    videoId: id,
                    userId
                });
                // Trigger will automatically increment like_count

                res.json({
                    success: true,
                    message: 'Video liked',
                    data: {
                        isLiked: true,
                        likeCount: video.likeCount + 1
                    }
                });
            }

            // Clear cache
            try {
                await redisClient.del('video:feed:*');
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }
        } catch (error) {
            console.error('Error liking video:', error);
            res.status(500).json({
                success: false,
                message: 'Error liking video',
                error: error.message
            });
        }
    }

    // Track video view
    static async viewVideo(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Check if video exists
            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if user already viewed (prevent duplicate views)
            const existingView = userId ? await VideoView.findOne({
                where: {
                    videoId: id,
                    userId,
                    viewedAt: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            }) : null;

            if (!existingView) {
                // Create view record
                await VideoView.create({
                    id: uuidv4(),
                    videoId: id,
                    userId: userId || null,
                    ipAddress: userId ? null : ipAddress
                });
                // Trigger will automatically increment views_count
            }

            res.json({
                success: true,
                message: 'View tracked'
            });
        } catch (error) {
            console.error('Error tracking view:', error);
            res.status(500).json({
                success: false,
                message: 'Error tracking view',
                error: error.message
            });
        }
    }

    // Add comment to video
    static async addComment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { comment, parent_comment_id } = req.body;

            if (!comment || comment.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Comment text is required'
                });
            }

            // Check if video exists
            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // If parent_comment_id provided, verify it exists
            if (parent_comment_id) {
                const parentComment = await VideoComment.findByPk(parent_comment_id);
                if (!parentComment || parentComment.videoId !== id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid parent comment'
                    });
                }
            }

            // Create comment
            const newComment = await VideoComment.create({
                id: uuidv4(),
                videoId: id,
                userId,
                comment: comment.trim(),
                parentCommentId: parent_comment_id || null,
                likeCount: 0,
                status: 'active'
            });

            // Fetch comment with user info
            const commentWithUser = await VideoComment.findByPk(newComment.id, {
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture']
                }]
            });

            // Trigger will automatically increment comment_count

            res.status(201).json({
                success: true,
                message: 'Comment added',
                data: commentWithUser
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding comment',
                error: error.message
            });
        }
    }

    // Get video comments
    static async getComments(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;
            const currentUserId = req.user?.id;

            // Check if video exists
            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            const comments = await VideoComment.findAndCountAll({
                where: {
                    videoId: id,
                    status: 'active',
                    parentCommentId: null // Only top-level comments
                },
                include: [
                    {
                        model: UserTable,
                        as: 'user',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: VideoComment,
                        as: 'replies',
                        where: { status: 'active' },
                        required: false,
                        include: [{
                            model: UserTable,
                            as: 'user',
                            attributes: ['id', 'fullName', 'profilePicture']
                        }],
                        limit: 3,
                        order: [['createdAt', 'DESC']]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            // Check user likes for comments
            const commentIds = comments.rows.map(c => c.id);
            const userLikes = currentUserId ? await VideoCommentLike.findAll({
                where: {
                    commentId: { [Op.in]: commentIds },
                    userId: currentUserId
                }
            }) : [];

            const likedCommentIds = new Set(userLikes.map(like => like.commentId));

            // Format comments
            const formattedComments = comments.rows.map(comment => {
                const commentData = comment.toJSON();
                return {
                    ...commentData,
                    isLiked: likedCommentIds.has(commentData.id)
                };
            });

            res.json({
                success: true,
                data: formattedComments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: comments.count,
                    totalPages: Math.ceil(comments.count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching comments',
                error: error.message
            });
        }
    }

    // Like/unlike comment
    static async likeComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.id;

            // Check if comment exists
            const comment = await VideoComment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check if already liked
            const existingLike = await VideoCommentLike.findOne({
                where: { commentId, userId }
            });

            if (existingLike) {
                // Unlike: delete the like
                await existingLike.destroy();
                // Trigger will automatically decrement like_count

                res.json({
                    success: true,
                    message: 'Comment unliked',
                    data: {
                        isLiked: false,
                        likeCount: comment.likeCount - 1
                    }
                });
            } else {
                // Like: create new like
                await VideoCommentLike.create({
                    id: uuidv4(),
                    commentId,
                    userId
                });
                // Trigger will automatically increment like_count

                res.json({
                    success: true,
                    message: 'Comment liked',
                    data: {
                        isLiked: true,
                        likeCount: comment.likeCount + 1
                    }
                });
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            res.status(500).json({
                success: false,
                message: 'Error liking comment',
                error: error.message
            });
        }
    }

    // Delete video
    static async deleteVideo(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if user owns the video
            if (video.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own videos'
                });
            }

            // Soft delete: update status
            await video.update({ status: 'deleted' });

            // Clear cache
            try {
                await redisClient.del('video:feed:*');
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            res.json({
                success: true,
                message: 'Video deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting video:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting video',
                error: error.message
            });
        }
    }

    // Update video (description and CTA only)
    static async updateVideo(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Extract fields from request body
            const {
                description,
                cta_enabled,
                cta_type,
                cta_label
            } = req.body;

            // Check if video exists
            const video = await Video.findByPk(id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if user owns the video
            if (video.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only edit your own videos'
                });
            }

            // Prepare update data (only allow description and CTA fields)
            const updateData = {};
            
            if (description !== undefined) {
                updateData.description = description || null;
            }
            
            if (cta_enabled !== undefined) {
                updateData.ctaEnabled = cta_enabled === 'true' || cta_enabled === true;
            }
            
            if (cta_type !== undefined) {
                // Validate CTA type
                const validCtaTypes = ['message_seller', 'call_seller', 'message_buyer', 'none'];
                if (!validCtaTypes.includes(cta_type)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid CTA type. Must be one of: message_seller, call_seller, message_buyer, none'
                    });
                }
                updateData.ctaType = cta_type;
            }
            
            if (cta_label !== undefined) {
                updateData.ctaLabel = cta_label || null;
            }

            // If no fields to update, return error
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields provided for update'
                });
            }

            // Update the video
            await video.update(updateData);

            // Clear cache
            try {
                await redisClient.del('video:feed:*');
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            // Fetch the updated video with user data
            const updatedVideo = await Video.findByPk(id, {
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture'],
                    include: [{
                        model: SellersTable,
                        as: 'seller',
                        attributes: ['businessName', 'businessPhone'],
                        required: false
                    }]
                }]
            });

            const videoData = updatedVideo.toJSON();

            res.json({
                success: true,
                message: 'Video updated successfully',
                data: videoData
            });
        } catch (error) {
            console.error('Error updating video:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating video',
                error: error.message
            });
        }
    }
}

module.exports = VideoController;

