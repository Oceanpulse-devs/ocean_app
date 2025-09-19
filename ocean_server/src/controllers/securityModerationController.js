const db = require('../../models');
const { Op } = require('sequelize');

class SecurityModerationController {
  // Get security alerts
  async getSecurityAlerts(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        severity = 'all', // all, low, medium, high, critical
        status = 'all', // all, active, resolved, dismissed
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (severity !== 'all') {
        whereClause.severity = severity;
      }
      if (status !== 'all') {
        whereClause.status = status;
      }
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Get security alerts (assuming we have a SecurityAlert model)
      const alerts = await db.SecurityAlert?.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      }) || { rows: [], count: 0 };

      // Mock security alerts if model doesn't exist
      const mockAlerts = alerts.count === 0 ? {
        rows: [
          {
            id: '1',
            type: 'suspicious_login',
            severity: 'high',
            title: 'Multiple failed login attempts',
            description: 'User account has 5 failed login attempts in the last hour',
            source: 'auth_system',
            timestamp: new Date().toISOString(),
            status: 'active',
            userId: 'user-123',
            ipAddress: '192.168.1.100'
          },
          {
            id: '2',
            type: 'unusual_activity',
            severity: 'medium',
            title: 'Unusual posting pattern detected',
            description: 'User posted 20 items in the last 10 minutes',
            source: 'content_moderation',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            status: 'investigating',
            userId: 'user-456',
            ipAddress: '192.168.1.101'
          },
          {
            id: '3',
            type: 'data_breach',
            severity: 'critical',
            title: 'Potential data exposure detected',
            description: 'Sensitive user data may have been exposed in public API response',
            source: 'security_monitor',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            status: 'urgent',
            userId: null,
            ipAddress: null
          }
        ],
        count: 3
      } : alerts;

      res.json({
        success: true,
        data: {
          alerts: mockAlerts.rows || mockAlerts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil((mockAlerts.count || mockAlerts.length) / limit),
            totalItems: mockAlerts.count || mockAlerts.length,
            itemsPerPage: parseInt(limit)
          },
          filters: { severity, status, startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Error getting security alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get content moderation queue
  async getModerationQueue(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'all', // all, posts, products, comments, images
        priority = 'all', // all, low, medium, high, urgent
        status = 'pending' // pending, in_review, approved, rejected
      } = req.query;

      const offset = (page - 1) * limit;

      // Get flagged content from various sources
      const moderationItems = await this.getModerationItems({
        type,
        priority,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          items: moderationItems.items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(moderationItems.total / limit),
            totalItems: moderationItems.total,
            itemsPerPage: parseInt(limit)
          },
          filters: { type, priority, status },
          summary: {
            pending: await this.getModerationCount('pending'),
            inReview: await this.getModerationCount('in_review'),
            approved: await this.getModerationCount('approved'),
            rejected: await this.getModerationCount('rejected')
          }
        }
      });

    } catch (error) {
      console.error('Error getting moderation queue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Approve content
  async approveContent(req, res) {
    try {
      const { id } = req.params;
      const { 
        type, // post, product, comment, image
        approvalNotes = 'Content approved by admin'
      } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Content type is required'
        });
      }

      // Approve content based on type
      const result = await this.approveContentByType(id, type, req.user.id, approvalNotes);

      res.json({
        success: true,
        message: 'Content approved successfully',
        data: result
      });

    } catch (error) {
      console.error('Error approving content:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Reject content
  async rejectContent(req, res) {
    try {
      const { id } = req.params;
      const { 
        type, // post, product, comment, image
        rejectionReason,
        rejectionNotes = 'Content rejected by admin'
      } = req.body;

      if (!type || !rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Content type and rejection reason are required'
        });
      }

      // Reject content based on type
      const result = await this.rejectContentByType(id, type, req.user.id, rejectionReason, rejectionNotes);

      res.json({
        success: true,
        message: 'Content rejected successfully',
        data: result
      });

    } catch (error) {
      console.error('Error rejecting content:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get flagged content
  async getFlaggedContent(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        contentType = 'all', // all, posts, products, comments, users
        flagType = 'all', // all, spam, inappropriate, copyright, fake
        status = 'all' // all, active, resolved, dismissed
      } = req.query;

      const offset = (page - 1) * limit;

      // Get flagged content
      const flaggedContent = await this.getFlaggedItems({
        contentType,
        flagType,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          items: flaggedContent.items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(flaggedContent.total / limit),
            totalItems: flaggedContent.total,
            itemsPerPage: parseInt(limit)
          },
          filters: { contentType, flagType, status },
          summary: {
            totalFlags: flaggedContent.total,
            activeFlags: await this.getFlagCount('active'),
            resolvedFlags: await this.getFlagCount('resolved'),
            dismissedFlags: await this.getFlagCount('dismissed')
          }
        }
      });

    } catch (error) {
      console.error('Error getting flagged content:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Resolve flag
  async resolveFlag(req, res) {
    try {
      const { id } = req.params;
      const { 
        resolution = 'dismissed', // dismissed, content_removed, user_warned, user_banned
        resolutionNotes = 'Flag resolved by admin'
      } = req.body;

      const result = await this.resolveFlagById(id, req.user.id, resolution, resolutionNotes);

      res.json({
        success: true,
        message: 'Flag resolved successfully',
        data: result
      });

    } catch (error) {
      console.error('Error resolving flag:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get suspicious activities
  async getSuspiciousActivities(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        activityType = 'all', // all, login_attempts, spam_posts, fake_accounts, suspicious_transactions
        severity = 'all', // all, low, medium, high, critical
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;

      const activities = await this.getSuspiciousActivityItems({
        activityType,
        severity,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          activities: activities.items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(activities.total / limit),
            totalItems: activities.total,
            itemsPerPage: parseInt(limit)
          },
          filters: { activityType, severity, startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Error getting suspicious activities:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Block suspicious user
  async blockSuspiciousUser(req, res) {
    try {
      const { userId } = req.params;
      const { 
        reason,
        duration = null, // null for permanent, number for days
        blockType = 'account' // account, ip, email
      } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Block reason is required'
        });
      }

      const result = await this.blockUser(userId, req.user.id, reason, duration, blockType);

      res.json({
        success: true,
        message: 'User blocked successfully',
        data: result
      });

    } catch (error) {
      console.error('Error blocking suspicious user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get security statistics
  async getSecurityStats(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = this.getDateRange(period);

      const stats = await Promise.all([
        this.getSecurityAlertStats(dateRange),
        this.getModerationStats(dateRange),
        this.getFlagStats(dateRange),
        this.getSuspiciousActivityStats(dateRange)
      ]);

      const [alertStats, moderationStats, flagStats, activityStats] = stats;

      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            start: dateRange.start,
            end: dateRange.end
          },
          security: {
            alerts: alertStats,
            suspiciousActivities: activityStats
          },
          moderation: {
            content: moderationStats,
            flags: flagStats
          }
        }
      });

    } catch (error) {
      console.error('Error getting security stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper methods
  getMockSecurityAlerts() {
    return [
      {
        id: 1,
        type: 'suspicious_login',
        severity: 'high',
        status: 'active',
        title: 'Multiple failed login attempts',
        description: 'User attempted to login 10 times in 5 minutes',
        userId: 'user-123',
        ipAddress: '192.168.1.100',
        createdAt: new Date(),
        user: {
          id: 'user-123',
          fullName: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com'
        }
      },
      {
        id: 2,
        type: 'spam_detected',
        severity: 'medium',
        status: 'resolved',
        title: 'Spam content detected',
        description: 'Post flagged as spam by automated system',
        userId: 'user-456',
        ipAddress: '192.168.1.101',
        createdAt: new Date(Date.now() - 3600000),
        user: {
          id: 'user-456',
          fullName: 'Jane Smith',
          username: 'janesmith',
          email: 'jane@example.com'
        }
      }
    ];
  }

  async getModerationItems({ type, priority, status, limit, offset }) {
    // Mock moderation items
    const mockItems = [
      {
        id: 1,
        type: 'post',
        priority: 'high',
        status: 'pending',
        content: 'This is a flagged post content...',
        userId: 'user-123',
        flaggedBy: 'user-456',
        flaggedAt: new Date(),
        reason: 'inappropriate_content',
        user: {
          id: 'user-123',
          fullName: 'John Doe',
          username: 'johndoe'
        }
      },
      {
        id: 2,
        type: 'product',
        priority: 'medium',
        status: 'pending',
        content: 'Product description flagged...',
        userId: 'user-789',
        flaggedBy: 'system',
        flaggedAt: new Date(Date.now() - 1800000),
        reason: 'spam',
        user: {
          id: 'user-789',
          fullName: 'Bob Wilson',
          username: 'bobwilson'
        }
      }
    ];

    return {
      items: mockItems.slice(offset, offset + limit),
      total: mockItems.length
    };
  }

  async getModerationCount(status) {
    // Mock moderation counts
    const counts = {
      pending: 15,
      in_review: 8,
      approved: 45,
      rejected: 12
    };
    return counts[status] || 0;
  }

  async approveContentByType(id, type, adminId, notes) {
    // Mock content approval
    console.log(`Approving ${type} ${id} by admin ${adminId}: ${notes}`);
    
    return {
      id,
      type,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      notes
    };
  }

  async rejectContentByType(id, type, adminId, reason, notes) {
    // Mock content rejection
    console.log(`Rejecting ${type} ${id} by admin ${adminId}: ${reason} - ${notes}`);
    
    return {
      id,
      type,
      status: 'rejected',
      rejectedBy: adminId,
      rejectedAt: new Date(),
      reason,
      notes
    };
  }

  async getFlaggedItems({ contentType, flagType, status, limit, offset }) {
    // Mock flagged items
    const mockItems = [
      {
        id: 1,
        contentType: 'post',
        flagType: 'inappropriate',
        status: 'active',
        content: 'Flagged post content...',
        userId: 'user-123',
        flaggedBy: 'user-456',
        flaggedAt: new Date(),
        reason: 'Contains inappropriate language',
        user: {
          id: 'user-123',
          fullName: 'John Doe',
          username: 'johndoe'
        }
      }
    ];

    return {
      items: mockItems.slice(offset, offset + limit),
      total: mockItems.length
    };
  }

  async getFlagCount(status) {
    // Mock flag counts
    const counts = {
      active: 25,
      resolved: 150,
      dismissed: 30
    };
    return counts[status] || 0;
  }

  async resolveFlagById(id, adminId, resolution, notes) {
    // Mock flag resolution
    console.log(`Resolving flag ${id} by admin ${adminId}: ${resolution} - ${notes}`);
    
    return {
      id,
      status: 'resolved',
      resolution,
      resolvedBy: adminId,
      resolvedAt: new Date(),
      notes
    };
  }

  async getSuspiciousActivityItems({ activityType, severity, startDate, endDate, limit, offset }) {
    // Mock suspicious activities
    const mockActivities = [
      {
        id: 1,
        type: 'login_attempts',
        severity: 'high',
        userId: 'user-123',
        ipAddress: '192.168.1.100',
        details: '10 failed login attempts in 5 minutes',
        createdAt: new Date(),
        user: {
          id: 'user-123',
          fullName: 'John Doe',
          username: 'johndoe'
        }
      }
    ];

    return {
      items: mockActivities.slice(offset, offset + limit),
      total: mockActivities.length
    };
  }

  async blockUser(userId, adminId, reason, duration, blockType) {
    // Mock user blocking
    console.log(`Blocking user ${userId} by admin ${adminId}: ${reason} (${blockType}, ${duration} days)`);
    
    return {
      userId,
      blockType,
      reason,
      duration,
      blockedBy: adminId,
      blockedAt: new Date(),
      status: 'blocked'
    };
  }

  getDateRange(period) {
    const now = new Date();
    let start;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }

  async getSecurityAlertStats(dateRange) {
    // Mock security alert statistics
    return {
      total: 25,
      critical: 2,
      high: 8,
      medium: 12,
      low: 3,
      resolved: 20,
      active: 5
    };
  }

  async getModerationStats(dateRange) {
    // Mock moderation statistics
    return {
      total: 150,
      pending: 15,
      approved: 120,
      rejected: 15,
      byType: {
        posts: 80,
        products: 45,
        comments: 20,
        images: 5
      }
    };
  }

  async getFlagStats(dateRange) {
    // Mock flag statistics
    return {
      total: 200,
      active: 25,
      resolved: 150,
      dismissed: 25,
      byType: {
        spam: 80,
        inappropriate: 60,
        copyright: 30,
        fake: 20,
        other: 10
      }
    };
  }

  async getSuspiciousActivityStats(dateRange) {
    // Mock suspicious activity statistics
    return {
      total: 50,
      loginAttempts: 20,
      spamPosts: 15,
      fakeAccounts: 10,
      suspiciousTransactions: 5,
      bySeverity: {
        critical: 5,
        high: 15,
        medium: 20,
        low: 10
      }
    };
  }
}

module.exports = new SecurityModerationController();
