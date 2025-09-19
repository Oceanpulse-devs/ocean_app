const db = require('../../models');
const { Op } = require('sequelize');

// Helper function to create notifications
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type,
      category,
      metadata
    });
    console.log(`📧 System maintenance notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating system maintenance notification:', error);
  }
};

// Send maintenance notification to all active users
const sendMaintenanceNotification = async (maintenanceData) => {
  try {
    const {
      title = 'System Maintenance Scheduled',
      message,
      scheduledTime,
      estimatedDuration,
      affectedServices = [],
      maintenanceType = 'scheduled' // scheduled, emergency, update
    } = maintenanceData;

    // Get all active users (last active within 30 days)
    const activeUsers = await db.UserTable.findAll({
      where: {
        lastActive: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        accountStatus: 'active'
      },
      attributes: ['id', 'fullName', 'username', 'email']
    });

    console.log(`📢 Sending maintenance notification to ${activeUsers.length} active users`);

    // Send notification to each active user
    for (const user of activeUsers) {
      await createNotification(
        user.id,
        title,
        message,
        maintenanceType === 'emergency' ? 'error' : 'warning',
        'system_maintenance',
        { 
          scheduledTime: scheduledTime,
          estimatedDuration: estimatedDuration,
          affectedServices: affectedServices,
          maintenanceType: maintenanceType,
          notificationSentAt: new Date()
        }
      );
    }

    return activeUsers.length;
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    return 0;
  }
};

// Send maintenance completion notification
const sendMaintenanceCompletionNotification = async (maintenanceData) => {
  try {
    const {
      title = 'System Maintenance Completed',
      message,
      actualDuration,
      affectedServices = [],
      maintenanceType = 'scheduled'
    } = maintenanceData;

    // Get all active users
    const activeUsers = await db.UserTable.findAll({
      where: {
        lastActive: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        accountStatus: 'active'
      },
      attributes: ['id', 'fullName', 'username', 'email']
    });

    console.log(`✅ Sending maintenance completion notification to ${activeUsers.length} active users`);

    // Send notification to each active user
    for (const user of activeUsers) {
      await createNotification(
        user.id,
        title,
        message,
        'success',
        'system_maintenance',
        { 
          actualDuration: actualDuration,
          affectedServices: affectedServices,
          maintenanceType: maintenanceType,
          completedAt: new Date()
        }
      );
    }

    return activeUsers.length;
  } catch (error) {
    console.error('Error sending maintenance completion notification:', error);
    return 0;
  }
};

// Send emergency maintenance notification (immediate)
const sendEmergencyMaintenanceNotification = async (emergencyData) => {
  try {
    const {
      title = 'Emergency System Maintenance',
      message,
      affectedServices = [],
      estimatedDuration
    } = emergencyData;

    // Get all online users (last active within 1 hour)
    const onlineUsers = await db.UserTable.findAll({
      where: {
        lastActive: {
          [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        },
        accountStatus: 'active'
      },
      attributes: ['id', 'fullName', 'username', 'email']
    });

    console.log(`🚨 Sending emergency maintenance notification to ${onlineUsers.length} online users`);

    // Send notification to each online user
    for (const user of onlineUsers) {
      await createNotification(
        user.id,
        title,
        message,
        'error',
        'system_maintenance',
        { 
          affectedServices: affectedServices,
          estimatedDuration: estimatedDuration,
          maintenanceType: 'emergency',
          emergencyStartedAt: new Date()
        }
      );
    }

    return onlineUsers.length;
  } catch (error) {
    console.error('Error sending emergency maintenance notification:', error);
    return 0;
  }
};

// Check system health and send alerts if needed
const checkSystemHealth = async () => {
  try {
    console.log('🔍 Checking system health...');
    
    // Check database connection
    const dbHealth = await db.sequelize.authenticate();
    
    // Check Redis connection (if available)
    let redisHealth = true;
    try {
      // Add Redis health check here if Redis is configured
      // redisHealth = await redisClient.ping();
    } catch (error) {
      redisHealth = false;
    }

    // Check for high error rates in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const errorCount = await db.Notification.count({
      where: {
        type: 'error',
        createdAt: {
          [Op.gte]: oneHourAgo
        }
      }
    });

    // If error count is high, send alert to admins
    if (errorCount > 100) {
      const adminUsers = await db.UserTable.findAll({
        where: {
          accountType: 'admin'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'High Error Rate Alert',
          `System detected ${errorCount} errors in the last hour. Please investigate.`,
          'error',
          'system_alert',
          { 
            errorCount: errorCount,
            timeWindow: '1 hour',
            checkedAt: new Date(),
            dbHealth: !!dbHealth,
            redisHealth: redisHealth
          }
        );
      }
    }

    return {
      dbHealth: !!dbHealth,
      redisHealth,
      errorCount,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      dbHealth: false,
      redisHealth: false,
      errorCount: 0,
      timestamp: new Date(),
      error: error.message
    };
  }
};

module.exports = {
  sendMaintenanceNotification,
  sendMaintenanceCompletionNotification,
  sendEmergencyMaintenanceNotification,
  checkSystemHealth
};
