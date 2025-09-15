const { UserTable, Notification } = require('../../models');

// Create and send notification
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

    // Send email notification
    await sendEmailNotification(userId, title, message, type);

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

      // Determine notification type from category or metadata
      let frontendType = 'system';
      if (metadata.type) {
        frontendType = metadata.type;
      } else if (notificationData.category === 'seller_application') {
        frontendType = 'system';
      }

      // Format time
      const timeAgo = getTimeAgo(notificationData.createdAt);

      return {
        id: notificationData.id,
        type: frontendType,
        isRead: notificationData.isRead,
        user: {
          name: notificationData.user?.fullName || 'System',
          avatar: notificationData.user?.profilePicture || '🌊',
          verified: notificationData.user?.accountStatus === 'verified'
        },
        content: notificationData.message,
        comment: metadata.comment || null,
        message: metadata.message || null,
        offer: metadata.offer || null,
        time: timeAgo,
        postId: metadata.postId || null,
        productId: metadata.productId || null,
        userId: metadata.userId || null,
        chatId: metadata.chatId || null,
        auctionId: metadata.auctionId || null
      };
    });

    res.status(200).json({
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
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
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
      template.category
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
      template.category
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
        template.category
      );
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

module.exports = {
  createNotification,
  sendEmailNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  sendSellerApplicationNotification,
  sendAccountStatusNotification,
  sendAdminNotification,
  notificationTemplates
}; 