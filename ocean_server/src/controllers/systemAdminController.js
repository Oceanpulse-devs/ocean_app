const db = require('../../models');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

class SystemAdminController {
  // Get system configuration
  async getSystemConfig(req, res) {
    try {
      const config = {
        // Application settings
        app: {
          name: process.env.APP_NAME || 'BlueWhale',
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 5000,
          baseUrl: process.env.BASE_URL || 'http://localhost:5000'
        },
        
        // Database settings
        database: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          name: process.env.DB_NAME || 'ocean_app_db',
          dialect: process.env.DB_DIALECT || 'mysql',
          pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 5,
            min: parseInt(process.env.DB_POOL_MIN) || 0,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE) || 10000
          }
        },
        
        // Redis settings
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || null,
          db: process.env.REDIS_DB || 0
        },
        
        // Email settings
        email: {
          service: process.env.EMAIL_SERVICE || 'gmail',
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          user: process.env.EMAIL_USER || null,
          from: process.env.EMAIL_FROM || 'noreply@oceanapp.com'
        },
        
        // Cloudinary settings
        cloudinary: {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
          apiKey: process.env.CLOUDINARY_API_KEY || null,
          apiSecret: process.env.CLOUDINARY_API_SECRET ? '***' : null
        },
        
        // Security settings
        security: {
          jwtSecret: process.env.JWT_SECRET ? '***' : null,
          jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
          bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
          rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
          rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
        },
        
        // File upload settings
        upload: {
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
          uploadPath: process.env.UPLOAD_PATH || './uploads'
        },
        
        // Feature flags
        features: {
          emailVerification: process.env.EMAIL_VERIFICATION === 'true',
          googleAuth: process.env.GOOGLE_AUTH === 'true',
          notifications: process.env.NOTIFICATIONS === 'true',
          analytics: process.env.ANALYTICS === 'true',
          maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
        },
        
        // System limits
        limits: {
          maxUsers: parseInt(process.env.MAX_USERS) || 10000,
          maxSellers: parseInt(process.env.MAX_SELLERS) || 1000,
          maxProductsPerSeller: parseInt(process.env.MAX_PRODUCTS_PER_SELLER) || 100,
          maxPostsPerUser: parseInt(process.env.MAX_POSTS_PER_USER) || 50,
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
        }
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Error getting system config:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update system configuration
  async updateSystemConfig(req, res) {
    try {
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuration data is required'
        });
      }

      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration',
          errors: validation.errors
        });
      }

      // Update environment variables (in memory only - requires restart)
      const updatedConfig = this.updateEnvironmentVariables(config);

      // Log configuration change
      await this.logConfigChange(req.user.id, config);

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: updatedConfig,
        note: 'Server restart required for changes to take effect'
      });

    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get system logs
  async getSystemLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 100,
        level = 'all', // all, error, warn, info, debug
        startDate,
        endDate,
        source = 'all' // all, api, auth, database, email, upload
      } = req.query;

      const offset = (page - 1) * limit;

      // Mock log data - in production, you'd query actual log files
      const logs = {
        rows: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            level: 'INFO',
            source: 'API',
            message: 'User authentication successful',
            details: { userId: 'user-123', ip: '192.168.1.1' }
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            level: 'WARN',
            source: 'Database',
            message: 'Slow query detected',
            details: { query: 'SELECT * FROM users', duration: '2.5s' }
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            level: 'ERROR',
            source: 'Payment',
            message: 'Payment processing failed',
            details: { error: 'Insufficient funds', transactionId: 'tx-456' }
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            level: 'INFO',
            source: 'System',
            message: 'System backup completed',
            details: { size: '2.5GB', duration: '15min' }
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            level: 'DEBUG',
            source: 'Cache',
            message: 'Cache miss for user profile',
            details: { userId: 'user-789', key: 'profile:user-789' }
          }
        ],
        count: 5
      };

      res.json({
        success: true,
        data: {
          logs: logs.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(logs.count / limit),
            totalItems: logs.count,
            itemsPerPage: parseInt(limit)
          },
          filters: { level, startDate, endDate, source }
        }
      });

    } catch (error) {
      console.error('Error getting system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get backup management
  async getBackupManagement(req, res) {
    try {
      const backups = await this.getBackupList();
      const backupSettings = await this.getBackupSettings();

      res.json({
        success: true,
        data: {
          backups,
          settings: backupSettings,
          status: {
            lastBackup: backups.length > 0 ? backups[0].createdAt : null,
            nextScheduled: this.getNextBackupTime(),
            autoBackupEnabled: backupSettings.autoBackup,
            backupRetention: backupSettings.retentionDays
          }
        }
      });

    } catch (error) {
      console.error('Error getting backup management:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create backup
  async createBackup(req, res) {
    try {
      const { 
        type = 'full', // full, incremental, database_only, files_only
        description = 'Manual backup',
        compression = true
      } = req.body;

      // Validate backup type
      const validTypes = ['full', 'incremental', 'database_only', 'files_only'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup type'
        });
      }

      // Create backup
      const backup = await this.performBackup({
        type,
        description,
        compression,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Backup created successfully',
        data: backup
      });

    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Restore backup
  async restoreBackup(req, res) {
    try {
      const { backupId } = req.params;
      const { confirm = false } = req.body;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          message: 'Backup restoration requires confirmation'
        });
      }

      // Get backup details
      const backup = await this.getBackupById(backupId);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      // Perform restore
      const restore = await this.performRestore(backup, req.user.id);

      res.json({
        success: true,
        message: 'Backup restored successfully',
        data: restore
      });

    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete backup
  async deleteBackup(req, res) {
    try {
      const { backupId } = req.params;

      const backup = await this.getBackupById(backupId);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      await this.deleteBackupFile(backup);

      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get system health
  async getSystemHealth(req, res) {
    try {
      const health = await this.checkSystemHealth();

      res.json({
        success: true,
        data: health
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

  // Clear system cache
  async clearSystemCache(req, res) {
    try {
      const { cacheType = 'all' } = req.body; // all, redis, memory, file

      const result = await this.clearCache(cacheType);

      res.json({
        success: true,
        message: 'Cache cleared successfully',
        data: result
      });

    } catch (error) {
      console.error('Error clearing system cache:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Restart system services
  async restartSystemServices(req, res) {
    try {
      const { services = ['all'] } = req.body; // all, database, redis, email, upload

      const result = await this.restartServices(services);

      res.json({
        success: true,
        message: 'Services restarted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error restarting system services:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper methods
  validateConfig(config) {
    const errors = [];

    // Validate numeric values
    if (config.database?.pool?.max && (config.database.pool.max < 1 || config.database.pool.max > 100)) {
      errors.push('Database pool max must be between 1 and 100');
    }

    if (config.security?.bcryptRounds && (config.security.bcryptRounds < 10 || config.security.bcryptRounds > 15)) {
      errors.push('Bcrypt rounds must be between 10 and 15');
    }

    if (config.upload?.maxFileSize && config.upload.maxFileSize > 100 * 1024 * 1024) {
      errors.push('Max file size cannot exceed 100MB');
    }

    // Validate email settings
    if (config.email?.port && (config.email.port < 1 || config.email.port > 65535)) {
      errors.push('Email port must be between 1 and 65535');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  updateEnvironmentVariables(config) {
    // In a real implementation, you'd update the .env file or use a configuration management system
    // For now, we'll just return the updated config
    return {
      ...config,
      updatedAt: new Date(),
      updatedBy: 'admin'
    };
  }

  async logConfigChange(adminId, config) {
    // Log configuration change to database or log file
    console.log(`Configuration updated by admin ${adminId}:`, {
      timestamp: new Date(),
      adminId,
      changes: Object.keys(config)
    });
  }

  async getLogEntries({ level, startDate, endDate, source, limit, offset }) {
    // Mock log entries - in production, you'd query actual log files
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date(),
        level: 'info',
        source: 'api',
        message: 'User authentication successful',
        details: { userId: '123', ip: '192.168.1.1' }
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 60000),
        level: 'error',
        source: 'database',
        message: 'Database connection timeout',
        details: { query: 'SELECT * FROM users', duration: 30000 }
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 120000),
        level: 'warn',
        source: 'upload',
        message: 'File size exceeded limit',
        details: { filename: 'large-image.jpg', size: 15728640 }
      }
    ];

    return {
      entries: mockLogs.slice(offset, offset + limit),
      total: mockLogs.length
    };
  }

  async getBackupList() {
    // Mock backup list - in production, you'd query actual backup files
    return [
      {
        id: 'backup-001',
        name: 'Full Backup 2024-01-15',
        type: 'full',
        size: '2.5 GB',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdBy: 'admin',
        status: 'completed'
      },
      {
        id: 'backup-002',
        name: 'Incremental Backup 2024-01-14',
        type: 'incremental',
        size: '500 MB',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        createdBy: 'system',
        status: 'completed'
      }
    ];
  }

  async getBackupSettings() {
    return {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      retentionDays: 30,
      compression: true,
      encryption: false
    };
  }

  getNextBackupTime() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(2, 0, 0, 0);
    return tomorrow;
  }

  async performBackup({ type, description, compression, createdBy }) {
    // Mock backup creation - in production, you'd perform actual backup
    const backup = {
      id: `backup-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Backup ${new Date().toISOString().split('T')[0]}`,
      type,
      description,
      compression,
      size: '1.2 GB',
      createdAt: new Date(),
      createdBy,
      status: 'completed',
      filePath: `/backups/backup-${Date.now()}.tar.gz`
    };

    console.log(`Backup created: ${backup.name}`);
    return backup;
  }

  async getBackupById(backupId) {
    const backups = await this.getBackupList();
    return backups.find(backup => backup.id === backupId);
  }

  async performRestore(backup, adminId) {
    // Mock restore - in production, you'd perform actual restore
    console.log(`Restoring backup: ${backup.name} by admin ${adminId}`);
    
    return {
      backupId: backup.id,
      restoredAt: new Date(),
      restoredBy: adminId,
      status: 'completed'
    };
  }

  async deleteBackupFile(backup) {
    // Mock deletion - in production, you'd delete actual backup file
    console.log(`Deleting backup file: ${backup.filePath}`);
  }

  async checkSystemHealth() {
    // Mock system health check - in production, you'd check actual system metrics
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      },
      database: {
        status: 'connected',
        responseTime: '15ms',
        connections: 5
      },
      redis: {
        status: 'connected',
        responseTime: '2ms',
        memory: '50MB'
      },
      disk: {
        used: '45GB',
        total: '100GB',
        percentage: 45
      },
      services: {
        api: 'running',
        database: 'running',
        redis: 'running',
        email: 'running'
      }
    };
  }

  async clearCache(cacheType) {
    // Mock cache clearing - in production, you'd clear actual caches
    const result = {
      clearedAt: new Date(),
      cacheType,
      itemsCleared: 0
    };

    switch (cacheType) {
      case 'all':
        result.itemsCleared = 1250;
        break;
      case 'redis':
        result.itemsCleared = 800;
        break;
      case 'memory':
        result.itemsCleared = 300;
        break;
      case 'file':
        result.itemsCleared = 150;
        break;
    }

    console.log(`Cache cleared: ${cacheType}, ${result.itemsCleared} items`);
    return result;
  }

  async restartServices(services) {
    // Mock service restart - in production, you'd restart actual services
    const result = {
      restartedAt: new Date(),
      services,
      status: 'completed'
    };

    console.log(`Services restarted: ${services.join(', ')}`);
    return result;
  }
}

module.exports = new SystemAdminController();
