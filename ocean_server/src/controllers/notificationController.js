const { UserTable, Notification } = require('../../models');
const { Op } = require('sequelize');
const { mapArrayFields } = require('../../utils/fieldMapper');
const redisClient = require('../config/redisdb');
const fcmService = require('../services/fcmService');

// Remove lone Unicode surrogates from strings so MySQL JSON accepts them (avoids "surrogate pair invalid")
function sanitizeMetadataForStorage(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadataForStorage);
  }
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = sanitizeMetadataForStorage(obj[k]);
    }
    return out;
  }
  return obj;
}

// Helper to map category strings to UserNotificationPreference ENUM types
function mapCategoryToPreferenceType(category) {
  if (!category) return 'system_alert';
  const catLower = category.toLowerCase().trim();
  switch (catLower) {
    case 'price_drop':
    case 'pricedrop':
      return 'price_drop';
    case 'group_buy':
    case 'groupbuy':
    case 'group_buy_update':
      return 'group_buy_update';
    case 'swap':
    case 'swap_offer':
      return 'swap_offer';
    case 'buyer_need':
    case 'buyerneed':
    case 'buyer_need_match':
      return 'buyer_need_match';
    case 'auction':
    case 'auction_ending':
      return 'auction_ending';
    case 'follower':
    case 'new_follower':
      return 'new_follower';
    case 'message':
    case 'chat':
    case 'message_received':
      return 'message_received';
    case 'product_view':
    case 'product_viewed':
      return 'product_viewed';
    case 'search':
    case 'search_insight':
      return 'search_insight';
    case 'market':
    case 'market_trend':
      return 'market_trend';
    case 'verification':
    case 'verification_status':
      return 'verification_status';
    case 'subscription':
    case 'subscription_update':
      return 'subscription_update';
    case 'system':
    case 'system_alert':
    default:
      return 'system_alert';
  }
}

// Create and send notification
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null, options = {}) => {
  try {
    const { UserNotificationPreference } = require('../../models');
    const prefType = mapCategoryToPreferenceType(category);

    // Check user preference settings
    const preference = await UserNotificationPreference.findOne({
      where: { user_id: userId, notification_type: prefType }
    });

    // If the preference exists and is disabled, we abort early
    if (preference && !preference.is_enabled) {
      console.log(`🔕 Notification skipped for user ${userId} because preference ${prefType} is disabled.`);
      return null;
    }

    // Determine enabled delivery channels (default to all if no preferences set)
    const deliveryMethods = preference && Array.isArray(preference.delivery_methods)
      ? preference.delivery_methods
      : ['in_app', 'email', 'push'];

    const hasInApp = deliveryMethods.includes('in_app');
    const hasEmail = deliveryMethods.includes('email');
    const hasPush = deliveryMethods.includes('push');

    // If both push and in_app are disabled and they aren't getting emails, we skip saving
    if (!hasInApp && !hasEmail && !hasPush) {
      console.log(`🔕 Notification skipped for user ${userId} because all delivery channels are disabled.`);
      return null;
    }

    const safeMetadata = metadata && typeof metadata === 'object' ? sanitizeMetadataForStorage(metadata) : metadata;
    
    // Save notification to database if in_app channel is active
    let notification = null;
    if (hasInApp) {
      notification = await Notification.create({
        userId,
        title,
        message,
        type,
        category,
        metadata: safeMetadata,
        priority: options.priority || 'medium',
        deliveryMethods: deliveryMethods,
        targetEntityType: options.targetEntityType || null,
        targetEntityId: options.targetEntityId || null,
        scheduledFor: options.scheduledFor || null,
        expiresAt: options.expiresAt || null
      });
    }

    // Send email notification if allowed
    if (hasEmail) {
      await sendEmailNotification(userId, title, message, type);
    }

    // Send FCM push if allowed
    if (hasPush) {
      try {
        const fcmData = safeMetadata && typeof safeMetadata === 'object' ? { ...safeMetadata } : {};
        if (notification) fcmData.notificationId = notification.id;
        fcmData.createdAt = notification && notification.createdAt 
          ? new Date(notification.createdAt).toISOString() 
          : new Date().toISOString();
        
        // Include deep-link routing identifiers for the client
        if (options.targetEntityType) fcmData.targetEntityType = options.targetEntityType;
        if (options.targetEntityId) fcmData.targetEntityId = options.targetEntityId;
        
        await fcmService.sendPushNotification(userId, { title, body: message }, fcmData);
      } catch (pushErr) {
        console.error('Push notification send failed:', pushErr?.message || pushErr);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send email notification
const sendEmailNotification = async (userId, title, message, type) => {
  try {
    const user = await UserTable.findOne({ where: { id: userId } });
    if (!user || !user.email) {
      console.log('User not found or no email for notification');
      return;
    }

    // Update notification as email sent
    await Notification.update(
      { 
        isEmailSent: true, 
        emailSentAt: new Date() 
      },
      { 
        where: { 
          userId,
          title,
          message,
          isEmailSent: false
        }
      }
    );

    // Log email for development (replace with actual email service)
    console.log(`📧 Email sent to ${user.email}:`);
    console.log(`Subject: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`Type: ${type}`);

    // TODO: Integrate with your email service (Nodemailer, SendGrid, etc.)
    // await emailService.sendEmail(user.email, title, message);

  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    // Create cache key based on query parameters
    const cacheKey = `notifications:${userId}:${page}:${limit}:${unreadOnly}`;
    
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

    let whereClause = { userId };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      include: [{
        model: UserTable,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'profilePicture', 'accountType', 'accountStatus']
      }]
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.rows.map((notification) => {
      const notificationData = notification.toJSON();
      const metadata = notificationData.metadata || {};
      
      // Map backend types to frontend types
      const typeMapping = {
        'info': 'system',
        'success': 'system',
        'warning': 'system',
        'error': 'system',
        'admin': 'system'
      };

      // Use metadata.type for routing (post_like, post_comment, follow, etc.); fallback for legacy
      let frontendType = metadata.type || 'system';
      if (!metadata.type && notificationData.category === 'seller_application') {
        frontendType = 'seller_application';
      }

      // Format time
      const timeAgo = getTimeAgo(notificationData.createdAt);

      // Build user object: for "follow" use actor (follower) from metadata, else use recipient
      let userObj = {
        name: notificationData.user?.fullName || 'System',
        avatar: notificationData.user?.profilePicture || '🌊',
        verified: notificationData.user?.accountStatus === 'verified'
      };

      if (notificationData.category === 'follow' && (metadata.followerId || metadata.senderId)) {
        userObj = {
          name: metadata.followerName || metadata.followerUsername || 'Someone',
          avatar: metadata.followerProfilePicture || '🌊',
          verified: false
        };
      }

      // Normalized fields for push/navigation: relatedEntityId, senderId, commentId
      const relatedEntityId = metadata.relatedEntityId || metadata.postId || metadata.productId
        || metadata.groupBuyId || metadata.reportId || metadata.buyerNeedId || metadata.swapDealId
        || metadata.itemId || null;
      const senderId = metadata.senderId || metadata.userId || metadata.likerId || metadata.followerId
        || metadata.sharerId || metadata.joinerId || metadata.proposerId || null;

      const frontendCategory = mapToFrontendCategory(frontendType, notificationData.category);
      const createdAtISO = notificationData.createdAt
        ? new Date(notificationData.createdAt).toISOString()
        : new Date().toISOString();

      // Map field names to match frontend expectations
      return {
        id: notificationData.id,
        type: frontendType,
        category: frontendCategory,
        createdAt: createdAtISO,
        isRead: notificationData.isRead,
        body: notificationData.message,
        data: metadata,
        user: userObj,
        title: notificationData.title,
        comment: metadata.comment || null,
        message: metadata.message || null,
        offer: metadata.offer || null,
        time: timeAgo,
        postId: metadata.postId || null,
        productId: metadata.productId || null,
        userId: metadata.userId || metadata.followerId || null,
        chatId: metadata.chatId || null,
        auctionId: metadata.auctionId || null,
        relatedEntityId,
        senderId,
        commentId: metadata.commentId || null
      };
    });

    const responseData = {
      message: "Notifications retrieved successfully",
      data: {
        notifications: formattedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          totalNotifications: notifications.count,
          hasNextPage: offset + limit < notifications.count,
          hasPrevPage: page > 1
        }
      }
    };

    // Cache the response in Redis for 1 minute (notifications change frequently)
    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(responseData));
    } catch (redisError) {
      console.error('Redis cache write failed:', redisError.message);
      // Continue even if caching fails
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

// Map backend type/category to frontend category (social, marketplace, system)
const mapToFrontendCategory = (type, category) => {
  const socialTypes = ['follow', 'post_like', 'post_comment', 'post_share', 'like', 'share', 'engagement'];
  const marketplaceTypes = ['product', 'product_like', 'buyer_need', 'swap', 'swap_proposal', 'swap_created', 'swap_accepted', 'swap_rejected', 'auction', 'group_buy', 'seller_application', 'item_saved', 'distress_sale', 'buyer_need_matched'];
  const t = (type || '').toLowerCase();
  if (socialTypes.includes(t) || category === 'follow') return 'social';
  if (marketplaceTypes.includes(t) || ['seller_application', 'buyer_need', 'swap', 'group_buy'].includes(category)) return 'marketplace';
  return 'system';
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking notification as read", error: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: { userId, isRead: false }
      }
    );

    res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking notifications as read", error: error.message });
  }
};

// Mark specific notifications as read (bulk by IDs)
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "ids array is required" });
    }

    const MAX_IDS = 100;
    const validIds = ids
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .slice(0, MAX_IDS);

    if (validIds.length === 0) {
      return res.status(200).json({
        message: "No valid IDs provided",
        data: { updatedCount: 0 }
      });
    }

    const [updatedCount] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: { [Op.in]: validIds }, userId } }
    );

    res.status(200).json({
      message: `${updatedCount} notification(s) marked as read`,
      data: { updatedCount }
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking notifications as read", error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();

    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: { userId, isRead: false }
    });

    res.status(200).json({
      message: "Unread count retrieved successfully",
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving unread count", error: error.message });
  }
};

// Notification templates for common scenarios
const notificationTemplates = {
  sellerApplicationSubmitted: {
    title: "Seller Application Submitted",
    message: "Your seller application has been submitted successfully and is under review. We'll notify you once the review is complete.",
    type: "success",
    category: "seller_application"
  },
  sellerApplicationApproved: {
    title: "Seller Application Approved!",
    message: "Congratulations! Your seller application has been approved. You can now start selling on our platform.",
    type: "success",
    category: "seller_application"
  },
  sellerApplicationRejected: (reason) => ({
    title: "Seller Application Update",
    message: `Your seller application was not approved. Reason: ${reason}. You can submit a new application after addressing the issues.`,
    type: "warning",
    category: "seller_application"
  }),
  accountSuspended: (reason) => ({
    title: "Account Suspended",
    message: `Your account has been suspended. Reason: ${reason}. Please contact support for assistance.`,
    type: "error",
    category: "account_status"
  }),
  accountActivated: {
    title: "Account Reactivated",
    message: "Your account has been reactivated. You can now continue using our platform.",
    type: "success",
    category: "account_status"
  },
  passwordResetSuccess: {
    title: "Password Reset Successful",
    message: "Your password has been reset successfully. If you didn't request this change, please contact support immediately.",
    type: "info",
    category: "password_reset"
  },
  newSellerApplication: (businessName) => ({
    title: "New Seller Application",
    message: `A new seller application has been submitted for ${businessName}. Please review it in the admin dashboard.`,
    type: "info",
    category: "admin_action"
  })
};

// Helper function to send seller application notifications
const sendSellerApplicationNotification = async (userId, status, reason = null) => {
  try {
    let template;
    
    switch (status) {
      case 'submitted':
        template = notificationTemplates.sellerApplicationSubmitted;
        break;
      case 'approved':
        template = notificationTemplates.sellerApplicationApproved;
        break;
      case 'rejected':
        template = notificationTemplates.sellerApplicationRejected(reason);
        break;
      default:
        return;
    }

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { type: 'seller_application', status }
    );
  } catch (error) {
    console.error('Error sending seller application notification:', error);
  }
};

// Helper function to send account status notifications
const sendAccountStatusNotification = async (userId, action, reason = null) => {
  try {
    let template;
    
    switch (action) {
      case 'suspend':
        template = notificationTemplates.accountSuspended(reason);
        break;
      case 'activate':
        template = notificationTemplates.accountActivated;
        break;
      default:
        return;
    }

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { type: 'account_status', action }
    );
  } catch (error) {
    console.error('Error sending account status notification:', error);
  }
};

// Helper function to send admin notifications
const sendAdminNotification = async (businessName) => {
  try {
    const template = notificationTemplates.newSellerApplication(businessName);
    
    // Get all admin users
    const adminUsers = await UserTable.findAll({
      where: { accountType: 'admin' }
    });

    // Send notification to all admins
    for (const admin of adminUsers) {
      await createNotification(
        admin.id,
        template.title,
        template.message,
        template.type,
        template.category,
        { type: 'admin_new_seller', businessName }
      );
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

// Send a test push notification to authenticated user
const testPushNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body, type } = req.body || {};

    const defaultTitle = 'Market Activity Update 📈';
    const defaultBody = 'Buyers are looking for items in your area! Post a product or explore trending deals today.';

    const result = await fcmService.sendPushNotification(
      userId,
      {
        title: title || defaultTitle,
        body: body || defaultBody
      },
      {
        type: type || 'product',
        category: 'marketplace',
        navigationPath: '/marketplace',
        notificationId: 'notif-' + Date.now()
      }
    );

    return res.status(200).json({
      success: true,
      diagnostic: result
    });
  } catch (error) {
    console.error('Test push error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test push notification',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  sendEmailNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  sendSellerApplicationNotification,
  sendAccountStatusNotification,
  sendAdminNotification,
  testPushNotification,
  notificationTemplates
}; 