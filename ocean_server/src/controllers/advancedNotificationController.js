const db = require('../../models');
const { Op } = require('sequelize');

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const {
      user_id,
      notification_type,
      title,
      message,
      priority = 'medium',
      delivery_methods = ['in_app'],
      target_entity_type,
      target_entity_id,
      metadata,
      scheduled_for,
      expires_at
    } = req.body;

    // Validate required fields
    if (!user_id || !notification_type || !title || !message) {
      return res.status(400).json({
        message: 'Missing required fields: user_id, notification_type, title, message'
      });
    }

    // Check if user exists
    const user = await db.UserTable.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check user notification preferences
    const userPrefs = await db.UserNotificationPreference.findOne({
      where: {
        user_id,
        notification_type,
        is_enabled: true
      }
    });

    if (!userPrefs) {
      return res.status(400).json({
        message: 'User has disabled this notification type'
      });
    }

    // Check quiet hours
    if (userPrefs.quiet_hours_start && userPrefs.quiet_hours_end) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = userPrefs.quiet_hours_start.split(':').map(Number);
      const endTime = userPrefs.quiet_hours_end.split(':').map(Number);
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];

      if (currentTime >= startMinutes && currentTime <= endMinutes) {
        return res.status(400).json({
          message: 'Notification blocked during quiet hours'
        });
      }
    }

    // Check frequency limit
    if (userPrefs.frequency_limit > 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentNotifications = await db.AdvancedNotification.count({
        where: {
          user_id,
          created_at: { [Op.gte]: oneHourAgo }
        }
      });

      if (recentNotifications >= userPrefs.frequency_limit) {
        return res.status(429).json({
          message: 'Notification frequency limit exceeded'
        });
      }
    }

    // Create notification
    const notification = await db.AdvancedNotification.create({
      user_id,
      notification_type,
      title,
      message,
      priority,
      delivery_methods: userPrefs.delivery_methods || delivery_methods,
      target_entity_type,
      target_entity_id,
      metadata,
      scheduled_for,
      expires_at
    });

    res.status(201).json({
      message: 'Notification created successfully',
      data: notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// Get user notifications with filtering and pagination
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user ID from token (security fix)
    const {
      page = 1,
      limit = 20,
      notification_type,
      priority,
      is_read,
      is_delivered
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { user_id: userId };

    // Add filters
    if (notification_type) whereClause.notification_type = notification_type;
    if (priority) whereClause.priority = priority;
    if (is_read !== undefined) whereClause.is_read = is_read === 'true';
    if (is_delivered !== undefined) whereClause.is_delivered = is_delivered === 'true';

    const notifications = await db.AdvancedNotification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: {
        notifications: notifications.rows,
        totalNotifications: notifications.count,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          hasNextPage: offset + limit < notifications.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id; // Use authenticated user ID from token (security fix)

    const notification = await db.AdvancedNotification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ is_read: true });

    res.status(200).json({
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark multiple notifications as read
const markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.id; // Use authenticated user ID from token (security fix)

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        message: 'notificationIds array is required'
      });
    }

    const result = await db.AdvancedNotification.update(
      { is_read: true },
      {
        where: {
          id: { [Op.in]: notificationIds },
          user_id: userId
        }
      }
    );

    res.status(200).json({
      message: `${result[0]} notifications marked as read`,
      data: { updatedCount: result[0] }
    });

  } catch (error) {
    console.error('Mark multiple as read error:', error);
    res.status(500).json({
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id; // Use authenticated user ID from token (security fix)

    const notification = await db.AdvancedNotification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    res.status(200).json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user ID from token (security fix)

    const stats = await db.AdvancedNotification.findAll({
      where: { user_id: userId },
      attributes: [
        'notification_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_read = true THEN 1 END')), 'read_count'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_read = false THEN 1 END')), 'unread_count']
      ],
      group: ['notification_type']
    });

    const totalStats = await db.AdvancedNotification.findOne({
      where: { user_id: userId },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_notifications'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_read = true THEN 1 END')), 'total_read'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_read = false THEN 1 END')), 'total_unread']
      ]
    });

    res.status(200).json({
      message: 'Notification statistics retrieved successfully',
      data: {
        byType: stats,
        overall: totalStats
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      message: 'Error retrieving notification statistics',
      error: error.message
    });
  }
};

// Create notification from template
const createFromTemplate = async (req, res) => {
  try {
    const {
      user_id,
      template_name,
      variables = {},
      priority,
      delivery_methods,
      target_entity_type,
      target_entity_id,
      metadata
    } = req.body;

    // Get template
    const template = await db.NotificationTemplate.findOne({
      where: {
        template_name,
        is_active: true
      }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Replace variables in template
    let title = template.title_template;
    let message = template.message_template;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      title = title.replace(regex, variables[key]);
      message = message.replace(regex, variables[key]);
    });

    // Create notification using the template
    const notificationData = {
      user_id,
      notification_type: template.notification_type,
      title,
      message,
      priority: priority || template.default_priority,
      delivery_methods: delivery_methods || template.default_delivery_methods,
      target_entity_type,
      target_entity_id,
      metadata
    };

    const notification = await db.AdvancedNotification.create(notificationData);

    res.status(201).json({
      message: 'Notification created from template successfully',
      data: notification
    });

  } catch (error) {
    console.error('Create from template error:', error);
    res.status(500).json({
      message: 'Error creating notification from template',
      error: error.message
    });
  }
};

// Bulk create notifications (for system-wide announcements)
const bulkCreateNotifications = async (req, res) => {
  try {
    const {
      user_ids,
      notification_type,
      title,
      message,
      priority = 'medium',
      delivery_methods = ['in_app'],
      target_entity_type,
      target_entity_id,
      metadata
    } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        message: 'user_ids array is required and must not be empty'
      });
    }

    // Create notifications in batches
    const batchSize = 100;
    const notifications = [];
    
    for (let i = 0; i < user_ids.length; i += batchSize) {
      const batch = user_ids.slice(i, i + batchSize);
      const batchNotifications = batch.map(user_id => ({
        user_id,
        notification_type,
        title,
        message,
        priority,
        delivery_methods,
        target_entity_type,
        target_entity_id,
        metadata
      }));
      
      const created = await db.AdvancedNotification.bulkCreate(batchNotifications);
      notifications.push(...created);
    }

    res.status(201).json({
      message: `${notifications.length} notifications created successfully`,
      data: { createdCount: notifications.length }
    });

  } catch (error) {
    console.error('Bulk create notifications error:', error);
    res.status(500).json({
      message: 'Error creating bulk notifications',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markMultipleAsRead,
  deleteNotification,
  getNotificationStats,
  createFromTemplate,
  bulkCreateNotifications
};
