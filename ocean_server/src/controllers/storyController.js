const { Story, StoryView, UserTable, UserFollows } = require('../../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cloudinaryService = require('../services/cloudinaryService');

class StoryController {
    // Create a new story
    static async createStory(req, res) {
        try {
            console.log('📱 Story creation request received');
            console.log('User ID:', req.user?.id);
            console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
            console.log('Request files details:', req.files);
            console.log('Request body:', req.body);
            console.log('Media file check:', req.files?.media ? 'Found' : 'Not found');
            
            const userId = req.user.id;
            const { 
                caption, 
                background_color, 
                text_color, 
                font_family 
            } = req.body;

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

                // Upload media to Cloudinary
                const folder = `ocean-app/stories/${userId}`;
                const uploadOptions = {
                    resource_type: isVideo ? 'video' : 'image',
                    quality: 'auto',
                    transformation: isVideo ? [
                        { width: 1080, height: 1920, crop: 'limit' } // Story aspect ratio
                    ] : [
                        { width: 1080, height: 1920, crop: 'fill', gravity: 'center' }
                    ]
                };

                const uploadResult = await cloudinaryService.uploadFile(
                    mediaFile.buffer, 
                    folder, 
                    uploadOptions
                );

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
                expiresAt,
                viewsCount: 0
            });

            res.status(201).json({
                success: true,
                message: 'Story created successfully',
                data: {
                    id: story.id,
                    mediaUrl: story.mediaUrl,
                    mediaType: story.mediaType,
                    caption: story.caption,
                    backgroundColor: story.backgroundColor,
                    textColor: story.textColor,
                    fontFamily: story.fontFamily,
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

    // Get all stories for feed (only from users you follow)
    static async getAllStories(req, res) {
        try {
            const userId = req.user.id;

            // Get users that the current user follows
            const followingUsers = await UserFollows.findAll({
                where: { userId },
                attributes: ['followsUserId']
            });

            const followingIds = followingUsers.map(follow => follow.followsUserId);

            // If user follows no one, return empty array
            if (followingIds.length === 0) {
                return res.json({
                    success: true,
                    message: 'No stories available - follow users to see their stories',
                    data: []
                });
            }

            // Get stories from followed users that haven't expired
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

            // Group stories by user
            const groupedStories = stories.reduce((acc, story) => {
                const userId = story.userId;
                if (!acc[userId]) {
                    acc[userId] = {
                        user: story.user,
                        stories: []
                    };
                }
                acc[userId].stories.push(story);
                return acc;
            }, {});

            res.json({
                success: true,
                message: 'Stories retrieved successfully',
                data: Object.values(groupedStories)
            });

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

            res.json({
                success: true,
                message: 'User stories retrieved successfully',
                data: stories
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
