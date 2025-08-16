// models/UserNotificationPreference.js

module.exports = (sequelize, DataTypes) => {
  const UserNotificationPreference = sequelize.define('UserNotificationPreference', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notification_type: {
      type: DataTypes.ENUM(
        'price_drop',
        'group_buy_update',
        'swap_offer',
        'buyer_need_match',
        'auction_ending',
        'new_follower',
        'message_received',
        'product_viewed',
        'search_insight',
        'market_trend',
        'verification_status',
        'subscription_update',
        'system_alert'
      ),
      allowNull: false
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    delivery_methods: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['in_app'],
      comment: 'Array of preferred delivery methods'
    },
    priority_threshold: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'low',
      comment: 'Minimum priority level to receive notifications'
    },
    quiet_hours_start: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Start time for quiet hours (24-hour format)'
    },
    quiet_hours_end: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'End time for quiet hours (24-hour format)'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
      comment: 'User timezone for quiet hours'
    },
    frequency_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Maximum notifications per hour (0 = no limit)'
    },
    category_preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Category-specific preferences (e.g., electronics, fashion)'
    },
    location_preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Location-based preferences (cities, regions)'
    },
    price_threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Minimum price change to trigger price drop notifications'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_notification_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['notification_type'] },
      { fields: ['is_enabled'] },
      { unique: true, fields: ['user_id', 'notification_type'] }
    ]
  });

  return UserNotificationPreference;
};
