const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TopPlacement = sequelize.define('TopPlacement', {
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
      comment: 'Type of item being placed at top'
    },
    itemId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'item_id',
      comment: 'ID of the item being placed (UUID as CHAR)'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Category where placement is active (null for all categories)'
    },
    placementType: {
      type: DataTypes.ENUM('category', 'search', 'homepage'),
      allowNull: false,
      defaultValue: 'category',
      field: 'placement_type',
      comment: 'Where the top placement appears'
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_days',
      comment: 'Duration in days (3, 7, or 14)',
      validate: {
        isIn: [[3, 7, 14]]
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
      comment: 'When placement starts'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
      comment: 'When placement ends'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      comment: 'Current status of the placement'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Priority order when multiple placements exist (higher = shown first)'
    }
  }, {
    tableName: 'top_placements',
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
        fields: ['category']
      },
      {
        fields: ['placement_type']
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
        fields: ['priority']
      }
    ]
  });

  // Define associations
  TopPlacement.associate = (models) => {
    // TopPlacement belongs to UserSubscription
    if (models.UserSubscription) {
      TopPlacement.belongsTo(models.UserSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    // TopPlacement belongs to UserTable
    if (models.UserTable) {
      TopPlacement.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return TopPlacement;
};

