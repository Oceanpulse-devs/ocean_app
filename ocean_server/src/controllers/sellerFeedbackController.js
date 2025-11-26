const {
    SellerFeedback,
    SellerFeedbackLike,
    SellerFeedbackResponse,
    SellerFeedbackResponseLike,
    UserTable,
    SellersTable
} = require('../../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../config/redisdb');

class SellerFeedbackController {
    // Create feedback
    static async createFeedback(req, res) {
        try {
            const reviewerId = req.user.id;
            const { sellerId, rating, comment } = req.body;

            // Validate required fields
            if (!sellerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Seller ID is required'
                });
            }

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            // Prevent self-feedback
            if (sellerId === reviewerId) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot leave feedback for yourself'
                });
            }

            // Check if seller exists
            const seller = await UserTable.findByPk(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: 'Seller not found'
                });
            }

            // Check if feedback already exists (one per buyer per seller)
            const existingFeedback = await SellerFeedback.findOne({
                where: {
                    sellerId,
                    reviewerId,
                    status: 'active'
                }
            });

            if (existingFeedback) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already left feedback for this seller. You can update your existing feedback instead.'
                });
            }

            // Create feedback
            const feedback = await SellerFeedback.create({
                id: uuidv4(),
                sellerId,
                reviewerId,
                rating: parseInt(rating),
                comment: comment?.trim() || null,
                likeCount: 0,
                status: 'active'
            });

            // Clear summary cache for this seller
            try {
                await redisClient.del(`seller-feedback:summary:${sellerId}`);
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            // Fetch created feedback with user data
            const createdFeedback = await SellerFeedback.findByPk(feedback.id, {
                include: [
                    {
                        model: UserTable,
                        as: 'reviewer',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'seller',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        include: [{
                            model: SellersTable,
                            as: 'seller',
                            attributes: ['businessName'],
                            required: false
                        }]
                    },
                    {
                        model: SellerFeedbackResponse,
                        as: 'response',
                        required: false,
                        include: [{
                            model: UserTable,
                            as: 'seller',
                            attributes: ['id', 'fullName', 'profilePicture'],
                            include: [{
                                model: SellersTable,
                                as: 'seller',
                                attributes: ['businessName'],
                                required: false
                            }]
                        }]
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: SellerFeedbackController._formatFeedback(createdFeedback, req.user?.id)
            });
        } catch (error) {
            console.error('Error creating feedback:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating feedback',
                error: error.message
            });
        }
    }

    // Get feedback list for a seller
    static async getFeedbackList(req, res) {
        try {
            const { sellerId } = req.params;
            const { page = 1, limit = 20, sort = 'newest' } = req.query;
            const currentUserId = req.user?.id;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            // Validate seller exists
            const seller = await UserTable.findByPk(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: 'Seller not found'
                });
            }

            // Build order clause based on sort parameter
            let order;
            switch (sort.toLowerCase()) {
                case 'highest':
                    order = [['rating', 'DESC'], ['created_at', 'DESC']];
                    break;
                case 'lowest':
                    order = [['rating', 'ASC'], ['created_at', 'DESC']];
                    break;
                case 'newest':
                default:
                    order = [['created_at', 'DESC']];
                    break;
            }

            // Fetch feedback with pagination
            const { count, rows: feedbacks } = await SellerFeedback.findAndCountAll({
                where: {
                    sellerId,
                    status: 'active'
                },
                include: [
                    {
                        model: UserTable,
                        as: 'reviewer',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: SellerFeedbackResponse,
                        as: 'response',
                        required: false,
                        include: [{
                            model: UserTable,
                            as: 'seller',
                            attributes: ['id', 'fullName', 'profilePicture'],
                            include: [{
                                model: SellersTable,
                                as: 'seller',
                                attributes: ['businessName'],
                                required: false
                            }]
                        }]
                    }
                ],
                order,
                limit: parseInt(limit),
                offset
            });

            // Format feedbacks and check if current user liked them
            const formattedFeedbacks = await Promise.all(
                feedbacks.map(async (feedback) => {
                    const isLiked = currentUserId ? await SellerFeedbackLike.findOne({
                        where: {
                            feedbackId: feedback.id,
                            userId: currentUserId
                        }
                    }) : false;

                    const formatted = SellerFeedbackController._formatFeedback(feedback, currentUserId);
                    formatted.isLiked = !!isLiked;

                    // Check if response is liked
                    if (formatted.response && currentUserId) {
                        const responseLiked = await SellerFeedbackResponseLike.findOne({
                            where: {
                                responseId: formatted.response.id,
                                userId: currentUserId
                            }
                        });
                        formatted.response.isLiked = !!responseLiked;
                    }

                    return formatted;
                })
            );

            res.json({
                success: true,
                data: formattedFeedbacks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching feedback list:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching feedback list',
                error: error.message
            });
        }
    }

    // Get feedback summary (average rating, total count, distribution)
    static async getFeedbackSummary(req, res) {
        try {
            const { sellerId } = req.params;

            // Try to get from Redis cache first
            const cacheKey = `seller-feedback:summary:${sellerId}`;
            let cachedSummary = null;

            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    cachedSummary = JSON.parse(cached);
                    console.log('✅ Feedback summary retrieved from Redis cache');
                }
            } catch (redisError) {
                console.error('Redis cache read failed:', redisError.message);
            }

            if (cachedSummary) {
                return res.json({
                    success: true,
                    data: cachedSummary
                });
            }

            // Validate seller exists
            const seller = await UserTable.findByPk(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: 'Seller not found'
                });
            }

            // Get all active feedbacks for this seller
            const feedbacks = await SellerFeedback.findAll({
                where: {
                    sellerId,
                    status: 'active'
                },
                attributes: ['rating']
            });

            // Calculate summary
            const totalCount = feedbacks.length;
            let averageRating = 0;
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            if (totalCount > 0) {
                const totalRating = feedbacks.reduce((sum, f) => {
                    ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
                    return sum + f.rating;
                }, 0);
                averageRating = totalRating / totalCount;
            }

            const summary = {
                averageRating: parseFloat(averageRating.toFixed(2)),
                totalCount,
                ratingDistribution
            };

            // Cache for 5 minutes
            try {
                await redisClient.setEx(cacheKey, 300, JSON.stringify(summary));
            } catch (redisError) {
                console.error('Redis cache write failed:', redisError.message);
            }

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error fetching feedback summary:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching feedback summary',
                error: error.message
            });
        }
    }

    // Like/unlike feedback
    static async toggleFeedbackLike(req, res) {
        try {
            const { feedbackId } = req.params;
            const userId = req.user.id;

            // Find feedback
            const feedback = await SellerFeedback.findByPk(feedbackId);
            if (!feedback) {
                return res.status(404).json({
                    success: false,
                    message: 'Feedback not found'
                });
            }

            // Check if like exists
            const existingLike = await SellerFeedbackLike.findOne({
                where: {
                    feedbackId,
                    userId
                }
            });

            let isLiked;
            if (existingLike) {
                // Unlike - delete the like
                await existingLike.destroy();
                isLiked = false;
            } else {
                // Like - create new like
                await SellerFeedbackLike.create({
                    id: uuidv4(),
                    feedbackId,
                    userId
                });
                isLiked = true;
            }

            // Fetch updated feedback to get new like count
            const updatedFeedback = await SellerFeedback.findByPk(feedbackId);

            res.json({
                success: true,
                message: isLiked ? 'Feedback liked' : 'Feedback unliked',
                data: {
                    isLiked,
                    likeCount: updatedFeedback.likeCount
                }
            });
        } catch (error) {
            console.error('Error toggling feedback like:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling feedback like',
                error: error.message
            });
        }
    }

    // Seller response to feedback
    static async createResponse(req, res) {
        try {
            const { feedbackId } = req.params;
            const { responseText } = req.body;
            const sellerId = req.user.id;

            // Validate response text
            if (!responseText || !responseText.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Response text is required'
                });
            }

            // Find feedback
            const feedback = await SellerFeedback.findByPk(feedbackId);

            if (!feedback) {
                return res.status(404).json({
                    success: false,
                    message: 'Feedback not found'
                });
            }

            // Verify seller owns this feedback
            if (feedback.sellerId !== sellerId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only respond to feedback about your own business'
                });
            }

            // Check if response already exists
            let response = await SellerFeedbackResponse.findOne({
                where: { feedbackId }
            });

            if (response) {
                // Update existing response
                response.responseText = responseText.trim();
                response.isEdited = true;
                await response.save();
            } else {
                // Create new response
                response = await SellerFeedbackResponse.create({
                    id: uuidv4(),
                    feedbackId,
                    sellerId,
                    responseText: responseText.trim(),
                    isEdited: false,
                    likeCount: 0
                });
            }

            // Clear summary cache
            try {
                await redisClient.del(`seller-feedback:summary:${sellerId}`);
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            // Fetch response with seller data
            const createdResponse = await SellerFeedbackResponse.findByPk(response.id, {
                include: [{
                    model: UserTable,
                    as: 'seller',
                    attributes: ['id', 'fullName', 'profilePicture'],
                    include: [{
                        model: SellersTable,
                        as: 'seller',
                        attributes: ['businessName'],
                        required: false
                    }]
                }]
            });

            res.status(response.isEdited ? 200 : 201).json({
                success: true,
                message: response.isEdited ? 'Response updated successfully' : 'Response created successfully',
                data: SellerFeedbackController._formatResponse(createdResponse, req.user?.id)
            });
        } catch (error) {
            console.error('Error creating response:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating response',
                error: error.message
            });
        }
    }

    // Like/unlike seller response
    static async toggleResponseLike(req, res) {
        try {
            const { responseId } = req.params;
            const userId = req.user.id;

            // Find response
            const response = await SellerFeedbackResponse.findByPk(responseId);
            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'Response not found'
                });
            }

            // Check if like exists
            const existingLike = await SellerFeedbackResponseLike.findOne({
                where: {
                    responseId,
                    userId
                }
            });

            let isLiked;
            if (existingLike) {
                // Unlike - delete the like
                await existingLike.destroy();
                isLiked = false;
            } else {
                // Like - create new like
                await SellerFeedbackResponseLike.create({
                    id: uuidv4(),
                    responseId,
                    userId
                });
                isLiked = true;
            }

            // Fetch updated response to get new like count
            const updatedResponse = await SellerFeedbackResponse.findByPk(responseId);

            res.json({
                success: true,
                message: isLiked ? 'Response liked' : 'Response unliked',
                data: {
                    isLiked,
                    likeCount: updatedResponse.likeCount
                }
            });
        } catch (error) {
            console.error('Error toggling response like:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling response like',
                error: error.message
            });
        }
    }

    // Delete feedback (soft delete)
    static async deleteFeedback(req, res) {
        try {
            const { feedbackId } = req.params;
            const userId = req.user.id;

            // Find feedback
            const feedback = await SellerFeedback.findByPk(feedbackId);
            if (!feedback) {
                return res.status(404).json({
                    success: false,
                    message: 'Feedback not found'
                });
            }

            // Verify user owns this feedback or is the seller
            if (feedback.reviewerId !== userId && feedback.sellerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own feedback or feedback about your business'
                });
            }

            // Soft delete
            feedback.status = 'deleted';
            await feedback.save();

            // Clear summary cache
            try {
                await redisClient.del(`seller-feedback:summary:${feedback.sellerId}`);
            } catch (redisError) {
                console.error('Redis cache clear failed:', redisError.message);
            }

            res.json({
                success: true,
                message: 'Feedback deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting feedback:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting feedback',
                error: error.message
            });
        }
    }

    // Helper: Format feedback for response
    static _formatFeedback(feedback, currentUserId = null) {
        const feedbackData = feedback.toJSON ? feedback.toJSON() : feedback;
        const reviewer = feedbackData.reviewer || {};
        const seller = feedbackData.seller || {};
        const response = feedbackData.response || null;

        return {
            id: feedbackData.id,
            sellerId: feedbackData.sellerId,
            reviewer: {
                id: reviewer.id,
                name: reviewer.fullName || 'Anonymous',
                avatar: reviewer.profilePicture || null
            },
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            likeCount: feedbackData.likeCount || 0,
            isLiked: false, // Will be set by caller if needed
            createdAt: feedbackData.createdAt,
            updatedAt: feedbackData.updatedAt,
            response: response ? SellerFeedbackController._formatResponse(response, currentUserId) : null
        };
    }

    // Helper: Format response for response
    static _formatResponse(response, currentUserId = null) {
        const responseData = response.toJSON ? response.toJSON() : response;
        const seller = responseData.seller || {};
        const businessName = seller.seller?.businessName || seller.businessName || seller.fullName;

        return {
            id: responseData.id,
            feedbackId: responseData.feedbackId,
            seller: {
                id: seller.id,
                name: businessName || seller.fullName || 'Seller',
                avatar: seller.profilePicture || null
            },
            responseText: responseData.responseText,
            isEdited: responseData.isEdited || false,
            likeCount: responseData.likeCount || 0,
            isLiked: false, // Will be set by caller if needed
            createdAt: responseData.createdAt,
            updatedAt: responseData.updatedAt
        };
    }
}

module.exports = SellerFeedbackController;

