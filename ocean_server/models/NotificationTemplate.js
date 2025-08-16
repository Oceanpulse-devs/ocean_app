// models/NotificationTemplate.js

module.exports = (sequelize, DataTypes) => {
  const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
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
    title_template: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Template for notification title with placeholders'
    },
    message_template: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Template for notification message with placeholders'
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Available variables for this template (e.g., {product_name}, {price})'
    },
    default_priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    default_delivery_methods: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['in_app'],
      comment: 'Default delivery methods for this template'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Template version for A/B testing'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
      comment: 'Language code for this template'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Category for organizing templates'
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
    tableName: 'notification_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['template_name'] },
      { fields: ['notification_type'] },
      { fields: ['is_active'] },
      { fields: ['language'] },
      { fields: ['category'] }
    ]
  });

  return NotificationTemplate;
};
