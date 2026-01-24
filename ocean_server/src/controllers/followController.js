const { UserTable, UserFollows, SellersTable, ProductCategory, Notification } = require('../../models');

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
        console.log(`📧 Follow notification created for user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('Error creating follow notification:', error);
    }
};

// Follow a user
const followUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const followerId = req.user.id;

        // Validate input
        if (!targetUserId) {
            return res.status(400).json({ message: "Target user ID is required" });
        }

        // Check if trying to follow self
        if (followerId === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        // Check if target user exists
        const targetUser = await UserTable.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Check if already following
        const existingFollow = await UserFollows.findOne({
            where: {
                userId: followerId,
                followsUserId: targetUserId
            }
        });

        if (existingFollow) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        // Create follow relationship
        await UserFollows.create({
            userId: followerId,
            followsUserId: targetUserId
        });

        // Get follower info for notification
        const follower = await UserTable.findByPk(followerId, {
            attributes: ['id', 'fullName', 'username', 'profilePicture']
        });

        // Send notification to the user being followed
        await createNotification(
            targetUserId,
            'New Follower!',
            `${follower.fullName || follower.username} started following you`,
            'info',
            'follow',
            {
                type: 'follow',
                relatedEntityId: followerId,
                senderId: followerId,
                followerId,
                followerName: follower.fullName || follower.username,
                followerUsername: follower.username,
                followerProfilePicture: follower.profilePicture,
                followedAt: new Date()
            }
        );

        res.status(201).json({ 
            message: "Successfully followed user",
            data: {
                followerId,
                targetUserId,
                followedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ message: "Error following user", error: error.message });
    }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const followerId = req.user.id;

        // Validate input
        if (!targetUserId) {
            return res.status(400).json({ message: "Target user ID is required" });
        }

        // Check if trying to unfollow self
        if (followerId === targetUserId) {
            return res.status(400).json({ message: "You cannot unfollow yourself" });
        }

        // Check if follow relationship exists
        const existingFollow = await UserFollows.findOne({
            where: {
                userId: followerId,
                followsUserId: targetUserId
            }
        });

        if (!existingFollow) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        // Remove follow relationship
        await existingFollow.destroy();

        res.status(200).json({ 
            message: "Successfully unfollowed user",
            data: {
                followerId,
                targetUserId,
                unfollowedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ message: "Error unfollowing user", error: error.message });
    }
};

// Get user's followers
const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const currentUserId = req.user?.id;

        // Check if user exists
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get followers with pagination
        const followers = await UserFollows.findAndCountAll({
            where: { followsUserId: userId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Get user details for each follower
        const followersWithDetails = await Promise.all(
            followers.rows.map(async (follow) => {
                const user = await UserTable.findByPk(follow.userId, {
                    attributes: ['id', 'fullName', 'username', 'email', 'profilePicture', 'accountType', 'accountStatus', 'lastActive']
                });
                return { ...follow.toJSON(), user };
            })
        );

        // Add follow status for each follower (if current user is logged in)
        const followersWithStatus = await Promise.all(
            followersWithDetails.map(async (follow) => {
                const followerData = follow.user;
                let isFollowingBack = false;
                
                if (currentUserId && currentUserId !== followerData.id) {
                    const followStatus = await UserFollows.findOne({
                        where: {
                            userId: currentUserId,
                            followsUserId: followerData.id
                        }
                    });
                    isFollowingBack = !!followStatus;
                }

                return {
                    id: followerData.id,
                    name: followerData.fullName,
                    username: followerData.username || `@${followerData.fullName.toLowerCase().replace(/\s+/g, '_')}`,
                    avatar: followerData.profilePicture || '👤',
                    lastActive: followerData.lastActive ? 
                        `${new Date(followerData.lastActive).getDate()}${getOrdinalSuffix(new Date(followerData.lastActive).getDate())} ${new Date(followerData.lastActive).toLocaleDateString('en-US', { month: 'long' })}, ${new Date(followerData.lastActive).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` :
                        'Recently',
                    isFollowing: isFollowingBack,
                    accountType: followerData.accountType,
                    accountStatus: followerData.accountStatus
                };
            })
        );

        // Helper function for ordinal suffixes
        function getOrdinalSuffix(day) {
            if (day >= 11 && day <= 13) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        }

        res.status(200).json({
            message: "Followers retrieved successfully",
            data: {
                followers: followersWithStatus,
                totalFollowers: followers.count,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(followers.count / limit),
                    hasNextPage: offset + limit < followers.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: "Error retrieving followers", error: error.message });
    }
};

// Get users that the user is following
const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Check if user exists
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get following with pagination
        const following = await UserFollows.findAndCountAll({
            where: { userId: userId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Get user details for each following
        const followingWithDetails = await Promise.all(
            following.rows.map(async (follow) => {
                const user = await UserTable.findByPk(follow.followsUserId, {
                    attributes: ['id', 'fullName', 'username', 'email', 'profilePicture', 'accountType', 'accountStatus', 'lastActive'],
                    include: [{
                        model: SellersTable,
                        as: 'seller',
                        attributes: ['category', 'businessName'],
                        required: false,
                        include: [{
                            model: ProductCategory,
                            as: 'categoryInfo',
                            attributes: ['name', 'icon'],
                            required: false
                        }]
                    }]
                });
                return { ...follow.toJSON(), followedUser: user };
            })
        );

        // Format following data with category info
        const followingWithData = followingWithDetails.map((follow) => {
            const userData = follow.followedUser;
            const sellerData = userData.seller;
            
            return {
                id: userData.id,
                name: userData.fullName,
                username: userData.username || `@${userData.fullName.toLowerCase().replace(/\s+/g, '_')}`,
                avatar: userData.profilePicture || '👤',
                lastActive: userData.lastActive ? 
                    `${new Date(userData.lastActive).getDate()}${getOrdinalSuffix(new Date(userData.lastActive).getDate())} ${new Date(userData.lastActive).toLocaleDateString('en-US', { month: 'long' })}, ${new Date(userData.lastActive).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` :
                    'Recently',
                category: sellerData?.categoryInfo?.name || (userData.accountType === 'seller' ? 'Seller' : 'Buyer'),
                accountType: userData.accountType,
                accountStatus: userData.accountStatus
            };
        });

        // Helper function for ordinal suffixes
        function getOrdinalSuffix(day) {
            if (day >= 11 && day <= 13) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        }

        res.status(200).json({
            message: "Following list retrieved successfully",
            data: {
                following: followingWithData,
                totalFollowing: following.count,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(following.count / limit),
                    hasNextPage: offset + limit < following.count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: "Error retrieving following list", error: error.message });
    }
};

// Check if current user is following target user
const checkFollowStatus = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.user.id;

        // Check if target user exists
        const targetUser = await UserTable.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Check follow status
        const followStatus = await UserFollows.findOne({
            where: {
                userId: currentUserId,
                followsUserId: targetUserId
            }
        });

        res.status(200).json({
            message: "Follow status retrieved successfully",
            data: {
                isFollowing: !!followStatus,
                followedAt: followStatus ? followStatus.createdAt : null
            }
        });

    } catch (error) {
        console.error('Check follow status error:', error);
        res.status(500).json({ message: "Error checking follow status", error: error.message });
    }
};

// Get follow statistics for a user
const getFollowStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get follower count
        const followerCount = await UserFollows.count({
            where: { followsUserId: userId }
        });

        // Get following count
        const followingCount = await UserFollows.count({
            where: { userId: userId }
        });

        res.status(200).json({
            message: "Follow statistics retrieved successfully",
            data: {
                userId,
                followerCount,
                followingCount
            }
        });

    } catch (error) {
        console.error('Get follow stats error:', error);
        res.status(500).json({ message: "Error retrieving follow statistics", error: error.message });
    }
};

// Get mutual followers (users who follow each other)
const getMutualFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Check if user exists
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get mutual followers using raw SQL for better performance
        const mutualFollowers = await UserTable.sequelize.query(`
            SELECT DISTINCT u.id, u.fullName, u.email, u.profilePicture, u.accountType, u.accountStatus
            FROM users u
            INNER JOIN user_follows uf1 ON u.id = uf1.userId
            INNER JOIN user_follows uf2 ON u.id = uf2.followsUserId
            WHERE uf1.followsUserId = :userId AND uf2.userId = :userId
            ORDER BY u.fullName
            LIMIT :limit OFFSET :offset
        `, {
            replacements: { userId, limit: parseInt(limit), offset: parseInt(offset) },
            type: UserTable.sequelize.QueryTypes.SELECT
        });

        // Get total count
        const totalCount = await UserTable.sequelize.query(`
            SELECT COUNT(DISTINCT u.id) as count
            FROM users u
            INNER JOIN user_follows uf1 ON u.id = uf1.userId
            INNER JOIN user_follows uf2 ON u.id = uf2.followsUserId
            WHERE uf1.followsUserId = :userId AND uf2.userId = :userId
        `, {
            replacements: { userId },
            type: UserTable.sequelize.QueryTypes.SELECT
        });

        const count = totalCount[0].count;

        res.status(200).json({
            message: "Mutual followers retrieved successfully",
            data: {
                mutualFollowers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalMutualFollowers: count,
                    hasNextPage: offset + limit < count,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get mutual followers error:', error);
        res.status(500).json({ message: "Error retrieving mutual followers", error: error.message });
    }
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus,
    getFollowStats,
    getMutualFollowers
}; 