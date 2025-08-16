const db = require('../../models');
const { Op } = require('sequelize');

// Get user notification preferences
const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = await db.UserNotificationPreference.findAll({
      where: { user_id: userId },
      order: [['notification_type', 'ASC']]
    });

    res.status(200).json({
      message: 'User notification preferences retrieved successfully',
      data: preferences
    });

  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      message: 'Error retrieving user notification preferences',
      error: error.message
    });
  }
};

// Create or update user notification preference
const upsertUserPreference = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      notification_type,
      is_enabled = true,
      delivery_methods = ['in_app'],
      priority_threshold = 'low',
      quiet_hours_start,
      quiet_hours_end,
      timezone = 'UTC',
      frequency_limit = 0,
      category_preferences,
      location_preferences,
      price_threshold
    } = req.body;

    // Validate required fields
    if (!notification_type) {
      return res.status(400).json({
        message: 'notification_type is required'
      });
    }

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    // Validate delivery methods
    const validDeliveryMethods = ['in_app', 'push', 'email', 'sms'];
    const invalidMethods = delivery_methods.filter(method => !validDeliveryMethods.includes(method));
    if (invalidMethods.length > 0) {
      return res.status(400).json({
        message: `Invalid delivery methods: ${invalidMethods.join(', ')}`
      });
    }

    // Validate priority threshold
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority_threshold)) {
      return res.status(400).json({
        message: 'Invalid priority threshold'
      });
    }

    // Validate time format for quiet hours
    if (quiet_hours_start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_start)) {
      return res.status(400).json({
        message: 'Invalid quiet hours start time format (HH:MM)'
      });
    }

    if (quiet_hours_end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_end)) {
      return res.status(400).json({
        message: 'Invalid quiet hours end time format (HH:MM)'
      });
    }

    // Validate frequency limit
    if (frequency_limit < 0 || frequency_limit > 100) {
      return res.status(400).json({
        message: 'Frequency limit must be between 0 and 100'
      });
    }

    // Create or update preference
    const [preference, created] = await db.UserNotificationPreference.upsert({
      user_id: userId,
      notification_type,
      is_enabled,
      delivery_methods,
      priority_threshold,
      quiet_hours_start,
      quiet_hours_end,
      timezone,
      frequency_limit,
      category_preferences,
      location_preferences,
      price_threshold
    }, {
      returning: true
    });

    res.status(created ? 201 : 200).json({
      message: `Preference ${created ? 'created' : 'updated'} successfully`,
      data: preference
    });

  } catch (error) {
    console.error('Upsert user preference error:', error);
    res.status(500).json({
      message: 'Error creating/updating user notification preference',
      error: error.message
    });
  }
};

// Update multiple preferences at once
const updateMultiplePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        message: 'preferences array is required'
      });
    }

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const results = [];
    const errors = [];

    for (const pref of preferences) {
      try {
        const [preference, created] = await db.UserNotificationPreference.upsert({
          user_id: userId,
          notification_type: pref.notification_type,
          is_enabled: pref.is_enabled !== undefined ? pref.is_enabled : true,
          delivery_methods: pref.delivery_methods || ['in_app'],
          priority_threshold: pref.priority_threshold || 'low',
          quiet_hours_start: pref.quiet_hours_start,
          quiet_hours_end: pref.quiet_hours_end,
          timezone: pref.timezone || 'UTC',
          frequency_limit: pref.frequency_limit || 0,
          category_preferences: pref.category_preferences,
          location_preferences: pref.location_preferences,
          price_threshold: pref.price_threshold
        }, {
          returning: true
        });

        results.push({ preference, created });
      } catch (error) {
        errors.push({
          notification_type: pref.notification_type,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: 'Preferences updated successfully',
      data: {
        updated: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Update multiple preferences error:', error);
    res.status(500).json({
      message: 'Error updating multiple preferences',
      error: error.message
    });
  }
};

// Delete user notification preference
const deleteUserPreference = async (req, res) => {
  try {
    const { userId, notificationType } = req.params;

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preference = await db.UserNotificationPreference.findOne({
      where: {
        user_id: userId,
        notification_type: notificationType
      }
    });

    if (!preference) {
      return res.status(404).json({ message: 'Preference not found' });
    }

    await preference.destroy();

    res.status(200).json({
      message: 'User notification preference deleted successfully'
    });

  } catch (error) {
    console.error('Delete user preference error:', error);
    res.status(500).json({
      message: 'Error deleting user notification preference',
      error: error.message
    });
  }
};

// Get default notification preferences for a user
const getDefaultPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Define default preferences for all notification types
    const defaultPreferences = [
      'price_drop', 'group_buy_update', 'swap_offer', 'buyer_need_match',
      'auction_ending', 'new_follower', 'message_received', 'product_viewed',
      'search_insight', 'market_trend', 'verification_status', 'subscription_update', 'system_alert'
    ].map(type => ({
      user_id: userId,
      notification_type: type,
      is_enabled: true,
      delivery_methods: ['in_app'],
      priority_threshold: 'low',
      timezone: 'UTC',
      frequency_limit: 0
    }));

    res.status(200).json({
      message: 'Default notification preferences retrieved successfully',
      data: defaultPreferences
    });

  } catch (error) {
    console.error('Get default preferences error:', error);
    res.status(500).json({
      message: 'Error retrieving default notification preferences',
      error: error.message
    });
  }
};

// Initialize user with default notification preferences
const initializeUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has preferences
    const existingPreferences = await db.UserNotificationPreference.count({
      where: { user_id: userId }
    });

    if (existingPreferences > 0) {
      return res.status(400).json({
        message: 'User already has notification preferences'
      });
    }

    // Define default preferences for all notification types
    const defaultPreferences = [
      'price_drop', 'group_buy_update', 'swap_offer', 'buyer_need_match',
      'auction_ending', 'new_follower', 'message_received', 'product_viewed',
      'search_insight', 'market_trend', 'verification_status', 'subscription_update', 'system_alert'
    ].map(type => ({
      user_id: userId,
      notification_type: type,
      is_enabled: true,
      delivery_methods: ['in_app'],
      priority_threshold: 'low',
      timezone: 'UTC',
      frequency_limit: 0
    }));

    // Create all default preferences
    const createdPreferences = await db.UserNotificationPreference.bulkCreate(defaultPreferences);

    res.status(201).json({
      message: 'User notification preferences initialized successfully',
      data: {
        createdCount: createdPreferences.length,
        preferences: createdPreferences
      }
    });

  } catch (error) {
    console.error('Initialize user preferences error:', error);
    res.status(500).json({
      message: 'Error initializing user notification preferences',
      error: error.message
    });
  }
};

// Get notification preferences summary
const getPreferencesSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db.UserTable.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = await db.UserNotificationPreference.findAll({
      where: { user_id: userId }
    });

    const summary = {
      total_types: preferences.length,
      enabled_types: preferences.filter(p => p.is_enabled).length,
      disabled_types: preferences.filter(p => !p.is_enabled).length,
      has_quiet_hours: preferences.some(p => p.quiet_hours_start && p.quiet_hours_end),
      has_frequency_limits: preferences.some(p => p.frequency_limit > 0),
      delivery_methods_used: [...new Set(preferences.flatMap(p => p.delivery_methods))],
      by_priority: {
        low: preferences.filter(p => p.priority_threshold === 'low').length,
        medium: preferences.filter(p => p.priority_threshold === 'medium').length,
        high: preferences.filter(p => p.priority_threshold === 'high').length,
        urgent: preferences.filter(p => p.priority_threshold === 'urgent').length
      }
    };

    res.status(200).json({
      message: 'Notification preferences summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get preferences summary error:', error);
    res.status(500).json({
      message: 'Error retrieving notification preferences summary',
      error: error.message
    });
  }
};

module.exports = {
  getUserPreferences,
  upsertUserPreference,
  updateMultiplePreferences,
  deleteUserPreference,
  getDefaultPreferences,
  initializeUserPreferences,
  getPreferencesSummary
};
