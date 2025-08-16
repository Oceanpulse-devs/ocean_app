const db = require('../../models');
const { Op } = require('sequelize');

// Create a new notification template
const createTemplate = async (req, res) => {
  try {
    const {
      template_name,
      notification_type,
      title_template,
      message_template,
      variables = [],
      default_priority = 'medium',
      default_delivery_methods = ['in_app'],
      language = 'en',
      category
    } = req.body;

    // Validate required fields
    if (!template_name || !notification_type || !title_template || !message_template) {
      return res.status(400).json({
        message: 'Missing required fields: template_name, notification_type, title_template, message_template'
      });
    }

    // Validate notification type
    const validTypes = [
      'price_drop', 'group_buy_update', 'swap_offer', 'buyer_need_match',
      'auction_ending', 'new_follower', 'message_received', 'product_viewed',
      'search_insight', 'market_trend', 'verification_status', 'subscription_update', 'system_alert'
    ];

    if (!validTypes.includes(notification_type)) {
      return res.status(400).json({
        message: 'Invalid notification type'
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(default_priority)) {
      return res.status(400).json({
        message: 'Invalid default priority'
      });
    }

    // Validate delivery methods
    const validDeliveryMethods = ['in_app', 'push', 'email', 'sms'];
    const invalidMethods = default_delivery_methods.filter(method => !validDeliveryMethods.includes(method));
    if (invalidMethods.length > 0) {
      return res.status(400).json({
        message: `Invalid delivery methods: ${invalidMethods.join(', ')}`
      });
    }

    // Check if template name already exists
    const existingTemplate = await db.NotificationTemplate.findOne({
      where: { template_name }
    });

    if (existingTemplate) {
      return res.status(400).json({
        message: 'Template name already exists'
      });
    }

    // Create template
    const template = await db.NotificationTemplate.create({
      template_name,
      notification_type,
      title_template,
      message_template,
      variables,
      default_priority,
      default_delivery_methods,
      language,
      category
    });

    res.status(201).json({
      message: 'Notification template created successfully',
      data: template
    });

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      message: 'Error creating notification template',
      error: error.message
    });
  }
};

// Get all notification templates with filtering
const getAllTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      notification_type,
      language = 'en',
      category,
      is_active
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add filters
    if (notification_type) whereClause.notification_type = notification_type;
    if (language) whereClause.language = language;
    if (category) whereClause.category = category;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const templates = await db.NotificationTemplate.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      message: 'Notification templates retrieved successfully',
      data: {
        templates: templates.rows,
        totalTemplates: templates.count,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(templates.count / limit),
          hasNextPage: offset + limit < templates.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({
      message: 'Error retrieving notification templates',
      error: error.message
    });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await db.NotificationTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({
      message: 'Template retrieved successfully',
      data: template
    });

  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({
      message: 'Error retrieving template',
      error: error.message
    });
  }
};

// Update notification template
const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      title_template,
      message_template,
      variables,
      default_priority,
      default_delivery_methods,
      is_active,
      category
    } = req.body;

    const template = await db.NotificationTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Validate priority if provided
    if (default_priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(default_priority)) {
        return res.status(400).json({
          message: 'Invalid default priority'
        });
      }
    }

    // Validate delivery methods if provided
    if (default_delivery_methods) {
      const validDeliveryMethods = ['in_app', 'push', 'email', 'sms'];
      const invalidMethods = default_delivery_methods.filter(method => !validDeliveryMethods.includes(method));
      if (invalidMethods.length > 0) {
        return res.status(400).json({
          message: `Invalid delivery methods: ${invalidMethods.join(', ')}`
        });
      }
    }

    // Update template
    await template.update({
      title_template: title_template || template.title_template,
      message_template: message_template || template.message_template,
      variables: variables || template.variables,
      default_priority: default_priority || template.default_priority,
      default_delivery_methods: default_delivery_methods || template.default_delivery_methods,
      is_active: is_active !== undefined ? is_active : template.is_active,
      category: category || template.category
    });

    res.status(200).json({
      message: 'Template updated successfully',
      data: template
    });

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      message: 'Error updating template',
      error: error.message
    });
  }
};

// Create new version of template
const createTemplateVersion = async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      title_template,
      message_template,
      variables,
      default_priority,
      default_delivery_methods,
      category
    } = req.body;

    const originalTemplate = await db.NotificationTemplate.findByPk(templateId);

    if (!originalTemplate) {
      return res.status(404).json({ message: 'Original template not found' });
    }

    // Get the next version number
    const latestVersion = await db.NotificationTemplate.max('version', {
      where: { template_name: originalTemplate.template_name }
    });

    const newVersion = (latestVersion || 0) + 1;

    // Create new version
    const newTemplate = await db.NotificationTemplate.create({
      template_name: originalTemplate.template_name,
      notification_type: originalTemplate.notification_type,
      title_template: title_template || originalTemplate.title_template,
      message_template: message_template || originalTemplate.message_template,
      variables: variables || originalTemplate.variables,
      default_priority: default_priority || originalTemplate.default_priority,
      default_delivery_methods: default_delivery_methods || originalTemplate.default_delivery_methods,
      language: originalTemplate.language,
      category: category || originalTemplate.category,
      version: newVersion
    });

    res.status(201).json({
      message: 'Template version created successfully',
      data: newTemplate
    });

  } catch (error) {
    console.error('Create template version error:', error);
    res.status(500).json({
      message: 'Error creating template version',
      error: error.message
    });
  }
};

// Delete notification template
const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await db.NotificationTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await template.destroy();

    res.status(200).json({
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      message: 'Error deleting template',
      error: error.message
    });
  }
};

// Get template versions
const getTemplateVersions = async (req, res) => {
  try {
    const { templateName } = req.params;

    const versions = await db.NotificationTemplate.findAll({
      where: { template_name: templateName },
      order: [['version', 'DESC']]
    });

    if (versions.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({
      message: 'Template versions retrieved successfully',
      data: versions
    });

  } catch (error) {
    console.error('Get template versions error:', error);
    res.status(500).json({
      message: 'Error retrieving template versions',
      error: error.message
    });
  }
};

// Activate template version
const activateTemplateVersion = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await db.NotificationTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Deactivate all other versions of this template
    await db.NotificationTemplate.update(
      { is_active: false },
      {
        where: {
          template_name: template.template_name,
          id: { [Op.ne]: templateId }
        }
      }
    );

    // Activate this version
    await template.update({ is_active: true });

    res.status(200).json({
      message: 'Template version activated successfully',
      data: template
    });

  } catch (error) {
    console.error('Activate template version error:', error);
    res.status(500).json({
      message: 'Error activating template version',
      error: error.message
    });
  }
};

// Get template statistics
const getTemplateStats = async (req, res) => {
  try {
    const stats = await db.NotificationTemplate.findAll({
      attributes: [
        'notification_type',
        'language',
        'category',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_templates'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_active = true THEN 1 END')), 'active_templates'],
        [db.sequelize.fn('MAX', db.sequelize.col('version')), 'max_version']
      ],
      group: ['notification_type', 'language', 'category']
    });

    const totalStats = await db.NotificationTemplate.findOne({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_templates'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_active = true THEN 1 END')), 'active_templates'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN is_active = false THEN 1 END')), 'inactive_templates']
      ]
    });

    res.status(200).json({
      message: 'Template statistics retrieved successfully',
      data: {
        byCategory: stats,
        overall: totalStats
      }
    });

  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({
      message: 'Error retrieving template statistics',
      error: error.message
    });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  createTemplateVersion,
  deleteTemplate,
  getTemplateVersions,
  activateTemplateVersion,
  getTemplateStats
};
