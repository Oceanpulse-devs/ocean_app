const { UserTable, UserFollows } = require('../../models');

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
                user_id: followerId,
                follows_user_id: targetUserId
            }
        });

        if (existingFollow) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        // Create follow relationship
        await UserFollows.create({
            user_id: followerId,
            follows_user_id: targetUserId
        });

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
                user_id: followerId,
                follows_user_id: targetUserId
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

        // Check if user exists
        const user = await UserTable.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get followers with pagination
        const followers = await UserFollows.findAndCountAll({
            where: { follows_user_id: userId },
            include: [{
                model: UserTable,
                as: 'follower',
                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: "Followers retrieved successfully",
            data: {
                followers: followers.rows,
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
            where: { user_id: userId },
            include: [{
                model: UserTable,
                as: 'followed',
                attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: "Following list retrieved successfully",
            data: {
                following: following.rows,
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
                user_id: currentUserId,
                follows_user_id: targetUserId
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
            where: { follows_user_id: userId }
        });

        // Get following count
        const followingCount = await UserFollows.count({
            where: { user_id: userId }
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
            FROM UserTable u
            INNER JOIN UserFollows uf1 ON u.id = uf1.user_id
            INNER JOIN UserFollows uf2 ON u.id = uf2.follows_user_id
            WHERE uf1.follows_user_id = :userId AND uf2.user_id = :userId
            ORDER BY u.fullName
            LIMIT :limit OFFSET :offset
        `, {
            replacements: { userId, limit: parseInt(limit), offset: parseInt(offset) },
            type: UserTable.sequelize.QueryTypes.SELECT
        });

        // Get total count
        const totalCount = await UserTable.sequelize.query(`
            SELECT COUNT(DISTINCT u.id) as count
            FROM UserTable u
            INNER JOIN UserFollows uf1 ON u.id = uf1.user_id
            INNER JOIN UserFollows uf2 ON u.id = uf2.follows_user_id
            WHERE uf1.follows_user_id = :userId AND uf2.user_id = :userId
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