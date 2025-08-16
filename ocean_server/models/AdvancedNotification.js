// models/AdvancedNotification.js

module.exports = (sequelize, DataTypes) => {
  const AdvancedNotification = sequelize.define('AdvancedNotification', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    delivery_methods: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['in_app'],
      comment: 'Array of delivery methods: in_app, push, email, sms'
    },
    target_entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Type of entity this notification relates to (product, auction, group_buy, etc.)'
    },
    target_entity_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID of the target entity'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data for the notification (prices, counts, etc.)'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    delivery_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to deliver this notification (for scheduled notifications)'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this notification expires and should be removed'
    },
    user_preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'User-specific preferences for this notification type'
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
    tableName: 'advanced_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['notification_type'] },
      { fields: ['priority'] },
      { fields: ['is_read'] },
      { fields: ['is_delivered'] },
      { fields: ['scheduled_for'] },
      { fields: ['expires_at'] },
      { fields: ['created_at'] },
      { fields: ['target_entity_type', 'target_entity_id'] }
    ]
  });

  return AdvancedNotification;
};
