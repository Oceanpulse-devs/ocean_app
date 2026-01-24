const db = require('../../models');
const systemMaintenanceService = require('../services/systemMaintenanceService');

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
    console.log(`📧 Admin notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

class AdminController {
  // Send system maintenance notification
  async sendMaintenanceNotification(req, res) {
    try {
      const {
        title,
        message,
        scheduledTime,
        estimatedDuration,
        affectedServices,
        maintenanceType
      } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const notificationCount = await systemMaintenanceService.sendMaintenanceNotification({
        title,
        message,
        scheduledTime,
        estimatedDuration,
        affectedServices,
        maintenanceType
      });

      res.json({
        success: true,
        message: 'Maintenance notification sent successfully',
        data: {
          notificationCount,
          scheduledTime,
          estimatedDuration,
          affectedServices
        }
      });

    } catch (error) {
      console.error('Error sending maintenance notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send maintenance completion notification
  async sendMaintenanceCompletionNotification(req, res) {
    try {
      const {
        message,
        actualDuration,
        affectedServices,
        maintenanceType
      } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const notificationCount = await systemMaintenanceService.sendMaintenanceCompletionNotification({
        message,
        actualDuration,
        affectedServices,
        maintenanceType
      });

      res.json({
        success: true,
        message: 'Maintenance completion notification sent successfully',
        data: {
          notificationCount,
          actualDuration,
          affectedServices
        }
      });

    } catch (error) {
      console.error('Error sending maintenance completion notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send emergency maintenance notification
  async sendEmergencyMaintenanceNotification(req, res) {
    try {
      const {
        title,
        message,
        affectedServices,
        estimatedDuration
      } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const notificationCount = await systemMaintenanceService.sendEmergencyMaintenanceNotification({
        title,
        message,
        affectedServices,
        estimatedDuration
      });

      res.json({
        success: true,
        message: 'Emergency maintenance notification sent successfully',
        data: {
          notificationCount,
          affectedServices,
          estimatedDuration
        }
      });

    } catch (error) {
      console.error('Error sending emergency maintenance notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send feature update notification
  async sendFeatureUpdateNotification(req, res) {
    try {
      const {
        title = 'New Feature Update',
        message,
        featureName,
        featureDescription,
        updateType = 'feature' // feature, improvement, bug_fix
      } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Get all active users
      const activeUsers = await db.UserTable.findAll({
        where: {
          lastActive: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          },
          accountStatus: 'active'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      console.log(`📢 Sending feature update notification to ${activeUsers.length} active users`);

      // Send notification to each active user
      for (const user of activeUsers) {
        await createNotification(
          user.id,
          title,
          message,
          'info',
          'feature_update',
          {
            type: 'feature_update',
            featureName: featureName,
            featureDescription: featureDescription,
            updateType: updateType,
            notificationSentAt: new Date()
          }
        );
      }

      res.json({
        success: true,
        message: 'Feature update notification sent successfully',
        data: {
          notificationCount: activeUsers.length,
          featureName,
          updateType
        }
      });

    } catch (error) {
      console.error('Error sending feature update notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send app update notification
  async sendAppUpdateNotification(req, res) {
    try {
      const {
        title = 'App Update Available',
        message,
        version,
        updateType = 'update', // update, critical_update, maintenance
        downloadUrl,
        releaseNotes
      } = req.body;

      // Validate required fields
      if (!message || !version) {
        return res.status(400).json({
          success: false,
          message: 'Message and version are required'
        });
      }

      // Get all active users
      const activeUsers = await db.UserTable.findAll({
        where: {
          lastActive: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          },
          accountStatus: 'active'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      console.log(`📱 Sending app update notification to ${activeUsers.length} active users`);

      // Send notification to each active user
      for (const user of activeUsers) {
        await createNotification(
          user.id,
          title,
          message,
          updateType === 'critical_update' ? 'error' : 'info',
          'app_update',
          {
            type: 'app_update',
            version: version,
            updateType: updateType,
            downloadUrl: downloadUrl,
            releaseNotes: releaseNotes,
            notificationSentAt: new Date()
          }
        );
      }

      res.json({
        success: true,
        message: 'App update notification sent successfully',
        data: {
          notificationCount: activeUsers.length,
          version,
          updateType
        }
      });

    } catch (error) {
      console.error('Error sending app update notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send security alert notification
  async sendSecurityAlertNotification(req, res) {
    try {
      const {
        title = 'Security Alert',
        message,
        alertType = 'security', // security, suspicious_activity, data_breach, phishing
        severity = 'medium', // low, medium, high, critical
        affectedUsers = 'all' // all, specific_users, admins
      } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      let targetUsers;
      
      if (affectedUsers === 'admins') {
        targetUsers = await db.UserTable.findAll({
          where: {
            accountType: 'admin'
          },
          attributes: ['id', 'fullName', 'username', 'email']
        });
      } else if (affectedUsers === 'specific_users') {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds)) {
          return res.status(400).json({
            success: false,
            message: 'userIds array is required for specific_users'
          });
        }
        targetUsers = await db.UserTable.findAll({
          where: {
            id: { [Op.in]: userIds }
          },
          attributes: ['id', 'fullName', 'username', 'email']
        });
      } else {
        // All active users
        targetUsers = await db.UserTable.findAll({
          where: {
            lastActive: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            },
            accountStatus: 'active'
          },
          attributes: ['id', 'fullName', 'username', 'email']
        });
      }

      console.log(`🚨 Sending security alert notification to ${targetUsers.length} users`);

      // Send notification to each target user
      for (const user of targetUsers) {
        await createNotification(
          user.id,
          title,
          message,
          severity === 'critical' ? 'error' : severity === 'high' ? 'warning' : 'info',
          'security_alert',
          { 
            alertType: alertType,
            severity: severity,
            affectedUsers: affectedUsers,
            notificationSentAt: new Date()
          }
        );
      }

      res.json({
        success: true,
        message: 'Security alert notification sent successfully',
        data: {
          notificationCount: targetUsers.length,
          alertType,
          severity,
          affectedUsers
        }
      });

    } catch (error) {
      console.error('Error sending security alert notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get system health status
  async getSystemHealth(req, res) {
    try {
      const healthStatus = await systemMaintenanceService.checkSystemHealth();
      
      res.json({
        success: true,
        data: healthStatus
      });

    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();