const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SpotlightSlot = sequelize.define('SpotlightSlot', {
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
    itemType: {
      type: DataTypes.ENUM('product', 'group_buy', 'swap_deal', 'auction', 'distress_sale'),
      allowNull: false,
      field: 'item_type',
      comment: 'Type of item being featured in spotlight'
    },
    itemId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'item_id',
      comment: 'ID of the item being featured (UUID as CHAR)'
    },
    slotType: {
      type: DataTypes.ENUM('homepage', 'category', 'search', 'sponsored'),
      allowNull: false,
      field: 'slot_type',
      comment: 'Where the spotlight appears'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Category for category-specific spotlight (null for homepage/search)'
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_days',
      comment: 'Duration in days (7 or 14)',
      validate: {
        isIn: [[7, 14]]
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
      comment: 'When spotlight starts'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
      comment: 'When spotlight ends'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order',
      comment: 'Order in which items appear in spotlight (lower = shown first)'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      comment: 'Current status of the spotlight'
    },
    impressions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times spotlight item was shown'
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of clicks on spotlight item'
    }
  }, {
    tableName: 'spotlight_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['item_type', 'item_id']
      },
      {
        fields: ['slot_type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['end_date']
      },
      {
        fields: ['start_date', 'end_date']
      },
      {
        fields: ['display_order']
      },
      {
        fields: ['slot_type', 'status', 'display_order']
      }
    ]
  });

  // Define associations
  SpotlightSlot.associate = (models) => {
    // SpotlightSlot belongs to UserSubscription
    if (models.UserSubscription) {
      SpotlightSlot.belongsTo(models.UserSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    // SpotlightSlot belongs to UserTable
    if (models.UserTable) {
      SpotlightSlot.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return SpotlightSlot;
};

