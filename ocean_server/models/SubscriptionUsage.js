const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionUsage = sequelize.define('SubscriptionUsage', {
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
      comment: 'Date for daily usage tracking'
    },
    
    // Daily Usage Counters
    listingsCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'listings_created',
      comment: 'Products created today'
    },
    groupBuysCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'group_buys_created',
      comment: 'Group buys created today'
    },
    swapDealsCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'swap_deals_created',
      comment: 'Swap deals created today'
    },
    auctionsCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'auctions_created',
      comment: 'Auctions created today'
    },
    distressSalesCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'distress_sales_created',
      comment: 'Distress sales created today'
    },
    dmsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'dms_sent',
      comment: 'DMs sent today'
    },
    notificationsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'notifications_received',
      comment: 'Notifications received today'
    },
    arProductsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'ar_products_used',
      comment: 'AR products used today'
    },
    promotionalBoostsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'promotional_boosts_used',
      comment: 'Promotional boosts used today'
    }
  }, {
    tableName: 'subscription_usage',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['usage_period']
      },
      {
        fields: ['subscription_id']
      }
    ],
    uniqueKeys: {
      unique_user_period: {
        fields: ['user_id', 'usage_period']
      }
    }
  });

  // Define associations
  SubscriptionUsage.associate = (models) => {
    // SubscriptionUsage belongs to UserSubscription
    if (models.UserSubscription) {
      SubscriptionUsage.belongsTo(models.UserSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    // SubscriptionUsage belongs to UserTable
    if (models.UserTable) {
      SubscriptionUsage.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return SubscriptionUsage;
};

