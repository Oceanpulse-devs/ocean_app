module.exports = (sequelize, DataTypes) => {
  const UserBehaviorAnalytics = sequelize.define('UserBehaviorAnalytics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID (null for anonymous users)'
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique session identifier'
    },
    behavior_type: {
      type: DataTypes.ENUM(
        'page_view',
        'product_interaction',
        'auction_participation',
        'group_buy_activity',
        'swap_deal_activity',
        'buyer_need_activity',
        'messaging_activity',
        'social_interaction',
        'purchase_behavior',
        'search_behavior'
      ),
      allowNull: false,
      comment: 'Type of user behavior being tracked'
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Specific action performed'
    },
    target_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID of the target object (product, post, etc.)'
    },
    target_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Type of target object'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of interaction in seconds'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User location when action was performed'
    },
    device_type: {
      type: DataTypes.ENUM('mobile', 'desktop', 'tablet'),
      allowNull: true,
      comment: 'Device type used'
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Browser used'
    },
    os: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Operating system'
    },
    referrer: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Referrer URL'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Full user agent string'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'User IP address'
    },
    context_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional context data for the behavior'
    },
    conversion_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Monetary value if action led to conversion'
    },
    is_conversion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this action led to a conversion'
    },
    funnel_stage: {
      type: DataTypes.ENUM('awareness', 'interest', 'consideration', 'intent', 'purchase', 'retention'),
      allowNull: true,
      comment: 'Stage in the user funnel'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_behavior_analytics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['session_id']
      },
      {
        fields: ['behavior_type']
      },
      {
        fields: ['action']
      },
      {
        fields: ['target_type']
      },
      {
        fields: ['location']
      },
      {
        fields: ['device_type']
      },
      {
        fields: ['is_conversion']
      },
      {
        fields: ['funnel_stage']
      },
      {
        fields: ['created_at']
      }
    ]
  });
  
  return UserBehaviorAnalytics;
};
