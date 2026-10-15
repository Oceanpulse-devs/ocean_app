const { Story, StoryView, UserTable, UserFollows } = require('../../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cloudinaryService = require('../services/cloudinaryService');
const videoUploadService = require('../services/videoUploadService');
const redisClient = require('../config/redisdb');

class StoryController {
    // Create a new story
    static async createStory(req, res) {
        try {
            const userId = req.user.id;
            
            // Extract all fields from request body (matching frontend field names)
            const { 
                caption, 
                background_color, 
                text_color, 
                font_family,
                // New overlay fields from frontend
                textOverlay,
                textSize,
                textPosition,
                music,
                emoji,
                emojiPosition
            } = req.body;

            // Parse position objects if they come as JSON strings
            let textPositionX = null;
            let textPositionY = null;
            let emojiPositionX = null;
            let emojiPositionY = null;

            if (textPosition) {
                try {
                    const position = typeof textPosition === 'string' ? JSON.parse(textPosition) : textPosition;
                    textPositionX = position.x !== undefined ? position.x : (position.dx !== undefined ? position.dx : null);
                    textPositionY = position.y !== undefined ? position.y : (position.dy !== undefined ? position.dy : null);
                } catch (e) {
                    console.warn('Failed to parse textPosition:', e);
                }
            }

            if (emojiPosition) {
                try {
                    const position = typeof emojiPosition === 'string' ? JSON.parse(emojiPosition) : emojiPosition;
                    emojiPositionX = position.x !== undefined ? position.x : (position.dx !== undefined ? position.dx : null);
                    emojiPositionY = position.y !== undefined ? position.y : (position.dy !== undefined ? position.dy : null);
                } catch (e) {
                    console.warn('Failed to parse emojiPosition:', e);
                }
            }

            // Check if media file is uploaded OR if it's a text-only story
            if (!req.files || req.files.length === 0) {
                // Check if it's a text-only story (requires caption and background)
                if (!caption || !background_color) {
                    return res.status(400).json({
                        success: false,
                        message: 'Either a media file is required, or for text-only stories, both caption and background_color are required'
                    });
                }
            }

            let mediaFile = null;
            let mediaUrl = null;
            let mediaType = 'text';

            // If file is uploaded, process it
            if (req.files && req.files.length > 0) {
                mediaFile = req.files[0]; // multer array format
                
                // Validate file type
                const isImage = mediaFile.mimetype.startsWith('image/');
                const isVideo = mediaFile.mimetype.startsWith('video/');
                
                if (!isImage && !isVideo) {
                    return res.status(400).json({
                        success: false,
                        message: 'Only image and video files are allowed'
                    });
                }

                const folder = `ocean-app/stories/${userId}`;
                let uploadResult;

                if (isVideo) {
                    // Use unified video upload service (AWS S3 if configured, otherwise Cloudinary)
                    uploadResult = await videoUploadService.uploadVideo(
                        mediaFile.buffer,
                        folder,
                        {
                            mimetype: mediaFile.mimetype
                        }
                    );
                } else {
                    // Images always use Cloudinary
                    const uploadOptions = {
                        resource_type: 'image',
                        quality: 'auto',
                        transformation: [
                            { width: 1080, height: 1920, crop: 'fill', gravity: 'center' }
                        ]
                    };
                    uploadResult = await cloudinaryService.uploadFile(
                        mediaFile.buffer,
                        folder,
                        uploadOptions
                    );
                }

                if (!uploadResult.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload media',
                        error: uploadResult.error
                    });
                }

                mediaUrl = uploadResult.url;
                mediaType = isVideo ? 'video' : 'image';
            }

            // Create story with 24-hour expiration
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            const story = await Story.create({
                id: uuidv4(),
                userId,
                mediaUrl: mediaUrl, // Will be null for text-only stories
                mediaType: mediaType, // Will be 'text' for text-only stories
                caption: caption || null,
                backgroundColor: background_color || null,
                textColor: text_color || null,
                fontFamily: font_family || null,
                // New overlay fields
                textOverlay: textOverlay || null,
                textSize: textSize ? parseFloat(textSize) : null,
                textPositionX: textPositionX !== null ? parseFloat(textPositionX) : null,
                textPositionY: textPositionY !== null ? parseFloat(textPositionY) : null,
                musicTrack: music || null,
                emoji: emoji || null,
                emojiPositionX: emojiPositionX !== null ? parseFloat(emojiPositionX) : null,
                emojiPositionY: emojiPositionY !== null ? parseFloat(emojiPositionY) : null,
                expiresAt,
                viewsCount: 0
            });

            res.status(201).json({
                success: true,
                message: 'Story created successfully',
                data: {
                    id: story.id,
                    userId: story.userId,
                    mediaUrl: story.mediaUrl,
                    mediaType: story.mediaType,
                    caption: story.caption,
                    backgroundColor: story.backgroundColor,
                    textColor: story.textColor,
                    fontFamily: story.fontFamily,
                    // Include new fields in response
                    textOverlay: story.textOverlay,
                    textSize: story.textSize ? parseFloat(story.textSize) : null,
                    textPosition: story.textPositionX !== null && story.textPositionY !== null ? {
                        x: parseFloat(story.textPositionX),
                        y: parseFloat(story.textPositionY)
                    } : null,
                    music: story.musicTrack,
                    emoji: story.emoji,
                    emojiPosition: story.emojiPositionX !== null && story.emojiPositionY !== null ? {
                        x: parseFloat(story.emojiPositionX),
                        y: parseFloat(story.emojiPositionY)
                    } : null,
                    expiresAt: story.expiresAt,
                    viewsCount: story.viewsCount,
                    createdAt: story.createdAt
                }
            });

        } catch (error) {
            console.error('Error creating story:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating story',
                error: error.message
            });
        }
    }

    // Get all stories for feed (from users you follow + your own stories)
    static async getAllStories(req, res) {
        try {
            const userId = req.user.id;

            // Create cache key based on user ID
            const cacheKey = `stories:${userId}`;
            
            // Try to get from Redis cache first
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    return res.json(cachedData);
                }
            } catch (redisError) {
                console.error('Redis cache read failed:', redisError.message);
                // Continue with DB query if cache fails
            }

            // Get users that the current user follows
            const followingUsers = await UserFollows.findAll({
                where: { userId },
                attributes: ['followsUserId']
            });

            const followingIds = followingUsers.map(follow => follow.followsUserId);
            
            // Include current user's own stories
            followingIds.push(userId);

            // 🔒 Block Exclusion: Filter out stories from blocked users
            if (userId) {
                const { getBlockedUserIds } = require('../utils/userBlockHelper');
                const blockedIds = await getBlockedUserIds(userId);
                if (blockedIds.length > 0) {
                    const blockedSet = new Set(blockedIds);
                    for (let i = followingIds.length - 1; i >= 0; i--) {
                        if (blockedSet.has(followingIds[i])) {
                            followingIds.splice(i, 1);
                        }
                    }
                }
            }

            // Get stories from followed users and own stories that haven't expired
            const stories = await Story.findAll({
                where: {
                    userId: { [Op.in]: followingIds },
                    expiresAt: { [Op.gt]: new Date() }
                },
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture']
                }],
                order: [['createdAt', 'DESC']]
            });

            // Group stories by user and format them like createStory response
            const groupedStories = stories.reduce((acc, story) => {
                const userId = story.userId;
                if (!acc[userId]) {
                    acc[userId] = {
                        user: story.user,
                        stories: []
                    };
                }
                // Format story object to match createStory response format
                acc[userId].stories.push({
                    id: story.id,
                    userId: story.userId,
                    mediaUrl: story.mediaUrl,
                    mediaType: story.mediaType,
                    caption: story.caption,
                    backgroundColor: story.backgroundColor,
                    textColor: story.textColor,
                    fontFamily: story.fontFamily,
                    textOverlay: story.textOverlay,
                    textSize: story.textSize ? parseFloat(story.textSize) : null,
                    textPosition: story.textPositionX !== null && story.textPositionY !== null ? {
                        x: parseFloat(story.textPositionX),
                        y: parseFloat(story.textPositionY)
                    } : null,
                    music: story.musicTrack,
                    emoji: story.emoji,
                    emojiPosition: story.emojiPositionX !== null && story.emojiPositionY !== null ? {
                        x: parseFloat(story.emojiPositionX),
                        y: parseFloat(story.emojiPositionY)
                    } : null,
                    expiresAt: story.expiresAt,
                    viewsCount: story.viewsCount,
                    createdAt: story.createdAt
                });
                return acc;
            }, {});

            const responseData = {
                success: true,
                message: 'Stories retrieved successfully',
                data: Object.values(groupedStories)
            };

            // Cache the response in Redis for 1 minute (stories are short-lived)
            try {
                await redisClient.setEx(cacheKey, 60, JSON.stringify(responseData));
            } catch (redisError) {
                console.error('Redis cache write failed:', redisError.message);
                // Continue even if caching fails
            }

            res.json(responseData);

        } catch (error) {
            console.error('Error getting stories:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving stories',
                error: error.message
            });
        }
    }

    // Get specific user's stories (only if you follow them)
    static async getUserStories(req, res) {
        try {
            const currentUserId = req.user.id;
            const { userId } = req.params;

            // Check if current user follows the target user
            const isFollowing = await UserFollows.findOne({
                where: {
                    userId: currentUserId,
                    followsUserId: userId
                }
            });

            if (!isFollowing) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view stories from users you follow'
                });
            }

            // Get user's non-expired stories
            const stories = await Story.findAll({
                where: {
                    userId,
                    expiresAt: { [Op.gt]: new Date() }
                },
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName', 'profilePicture']
                }],
                order: [['createdAt', 'ASC']]
            });

            // Format stories to match createStory response format
            const formattedStories = stories.map(story => ({
                id: story.id,
                userId: story.userId,
                mediaUrl: story.mediaUrl,
                mediaType: story.mediaType,
                caption: story.caption,
                backgroundColor: story.backgroundColor,
                textColor: story.textColor,
                fontFamily: story.fontFamily,
                textOverlay: story.textOverlay,
                textSize: story.textSize ? parseFloat(story.textSize) : null,
                textPosition: story.textPositionX !== null && story.textPositionY !== null ? {
                    x: parseFloat(story.textPositionX),
                    y: parseFloat(story.textPositionY)
                } : null,
                music: story.musicTrack,
                emoji: story.emoji,
                emojiPosition: story.emojiPositionX !== null && story.emojiPositionY !== null ? {
                    x: parseFloat(story.emojiPositionX),
                    y: parseFloat(story.emojiPositionY)
                } : null,
                expiresAt: story.expiresAt,
                viewsCount: story.viewsCount,
                createdAt: story.createdAt
            }));

            res.json({
                success: true,
                message: 'User stories retrieved successfully',
                data: formattedStories
            });

        } catch (error) {
            console.error('Error getting user stories:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user stories',
                error: error.message
            });
        }
    }

    // View a story (only if you follow the story owner)
    static async viewStory(req, res) {
        try {
            const currentUserId = req.user.id;
            const { storyId } = req.params;

            // Get the story with user info
            const story = await Story.findOne({
                where: { id: storyId },
                include: [{
                    model: UserTable,
                    as: 'user',
                    attributes: ['id', 'fullName']
                }]
            });

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Check if story has expired
            if (story.expiresAt < new Date()) {
                return res.status(410).json({
                    success: false,
                    message: 'Story has expired'
                });
            }

            // Check if current user follows the story owner
            const isFollowing = await UserFollows.findOne({
                where: {
                    userId: currentUserId,
                    followsUserId: story.userId
                }
            });

            if (!isFollowing) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view stories from users you follow'
                });
            }

            // Check if user has already viewed this story
            const existingView = await StoryView.findOne({
                where: {
                    storyId,
                    viewerId: currentUserId
                }
            });

            if (!existingView) {
                // Create new view record
                await StoryView.create({
                    id: uuidv4(),
                    storyId,
                    viewerId: currentUserId
                });

                // Increment view count
                await Story.increment('viewsCount', {
                    where: { id: storyId }
                });
            }

            res.json({
                success: true,
                message: 'Story viewed successfully'
            });

        } catch (error) {
            console.error('Error viewing story:', error);
            res.status(500).json({
                success: false,
                message: 'Error viewing story',
                error: error.message
            });
        }
    }

    // Get story viewers (only story owner can see this)
    static async getStoryViewers(req, res) {
        try {
            const currentUserId = req.user.id;
            const { storyId } = req.params;

            // Get the story
            const story = await Story.findOne({
                where: { id: storyId }
            });

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Only story owner can see viewers
            if (story.userId !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view analytics for your own stories'
                });
            }

            // Get story viewers
            const viewers = await StoryView.findAll({
                where: { storyId },
                include: [{
                    model: UserTable,
                    as: 'viewer',
                    attributes: ['id', 'fullName', 'profilePicture']
                }],
                order: [['viewedAt', 'DESC']]
            });

            res.json({
                success: true,
                message: 'Story viewers retrieved successfully',
                data: viewers
            });

        } catch (error) {
            console.error('Error getting story viewers:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving story viewers',
                error: error.message
            });
        }
    }

    // Delete own story
    static async deleteStory(req, res) {
        try {
            const currentUserId = req.user.id;
            const { storyId } = req.params;

            // Find the story
            const story = await Story.findOne({
                where: { id: storyId }
            });

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Only story owner can delete
            if (story.userId !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own stories'
                });
            }

            // Delete the story (views will be deleted automatically due to CASCADE)
            await Story.destroy({
                where: { id: storyId }
            });

            res.json({
                success: true,
                message: 'Story deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting story:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting story',
                error: error.message
            });
        }
    }

    // Get user's own stories
    static async getMyStories(req, res) {
        try {
            const userId = req.user.id;

            const stories = await Story.findAll({
                where: {
                    userId,
                    expiresAt: { [Op.gt]: new Date() }
                },
                include: [{
                    model: StoryView,
                    as: 'views',
                    include: [{
                        model: UserTable,
                        as: 'viewer',
                        attributes: ['id', 'fullName', 'profilePicture']
                    }]
                }],
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                message: 'Your stories retrieved successfully',
                data: stories
            });

        } catch (error) {
            console.error('Error getting my stories:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving your stories',
                error: error.message
            });
        }
    }
}

module.exports = StoryController;
