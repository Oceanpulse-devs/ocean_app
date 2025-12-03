const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PromotionalBoost = sequelize.define('PromotionalBoost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'user_id',
      comment: 'Reference to users table (UUID as CHAR)'
    },
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'subscription_id',
      comment: 'Reference to user_subscriptions table'
    },
    boostType: {
      type: DataTypes.ENUM('product', 'group_buy', 'swap_deal', 'auction', 'buyer_need'),
      allowNull: false,
      field: 'boost_type'
    },
    targetId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'target_id',
      comment: 'ID of the item being boosted (UUID as CHAR)'
    },
    boostDurationHours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      field: 'boost_duration_hours',
      comment: 'Duration in hours'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      comment: 'When boost starts'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
      comment: 'When boost ends'
    },
    boostReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'boost_reason',
      comment: 'Reason for boost'
    },
    autoReboost: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'auto_reboost',
      comment: 'Whether boost should automatically reboost when expired'
    },
    reboostIntervalHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reboost_interval_hours',
      comment: 'Interval in hours for auto-reboost (6, 12, or 24)'
    },
    locationTarget: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'location_target',
      comment: 'Target locations (states/cities) for boost'
    },
    boostPackage: {
      type: DataTypes.ENUM('1-day', '3-day', '7-day'),
      defaultValue: '1-day',
      field: 'boost_package',
      comment: 'Boost package duration'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'cost',
      comment: 'Cost of the boost (0.00 for free boosts)'
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_free',
      comment: 'Whether this boost is free (from monthly allowance)'
    }
  }, {
    tableName: 'promotional_boosts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['boost_type']
      },
      {
        fields: ['target_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['end_time']
      }
    ]
  });

  // Define associations
  PromotionalBoost.associate = (models) => {
    // PromotionalBoost belongs to UserSubscription
    if (models.UserSubscription) {
      PromotionalBoost.belongsTo(models.UserSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    // PromotionalBoost belongs to UserTable
    if (models.UserTable) {
      PromotionalBoost.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return PromotionalBoost;
};

