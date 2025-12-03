const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PromotionUsage = sequelize.define('PromotionUsage', {
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
    usagePeriod: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'usage_period',
      comment: 'Year-month for tracking (YYYY-MM-01)'
    },
    boostsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'boosts_used',
      comment: 'Number of boosts used this month'
    },
    topPlacementsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'top_placements_used',
      comment: 'Number of top placements used this month'
    },
    spotlightsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'spotlights_used',
      comment: 'Number of spotlights used this month'
    }
  }, {
    tableName: 'promotion_usage',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['usage_period']
      },
      {
        fields: ['subscription_id']
      },
      {
        fields: ['user_id']
      }
    ],
    uniqueKeys: {
      unique_user_period: {
        fields: ['user_id', 'usage_period']
      }
    }
  });

  // Define associations
  PromotionUsage.associate = (models) => {
    // PromotionUsage belongs to UserSubscription
    if (models.UserSubscription) {
      PromotionUsage.belongsTo(models.UserSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    // PromotionUsage belongs to UserTable
    if (models.UserTable) {
      PromotionUsage.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return PromotionUsage;
};

