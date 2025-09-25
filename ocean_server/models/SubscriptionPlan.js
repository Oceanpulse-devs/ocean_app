const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Plan identifier (drift, wave, tide, surge)'
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'display_name',
      comment: 'Human-readable plan name'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price in NGN'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'NGN'
    },
    billingPeriod: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      defaultValue: 'monthly',
      field: 'billing_period'
    },
    
    // Feature Limits
    maxListings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_listings',
      comment: 'Maximum product listings allowed'
    },
    maxGroupBuys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_group_buys',
      comment: 'Maximum group buys can create'
    },
    maxSwapDeals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_swap_deals',
      comment: 'Maximum swap deals can create'
    },
    maxAuctions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_auctions',
      comment: 'Maximum auctions can create'
    },
    maxDistressSales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_distress_sales',
      comment: 'Maximum distress sales can create'
    },
    maxDailyDms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_daily_dms',
      comment: 'Maximum DMs per day'
    },
    maxDailyNotifications: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_daily_notifications',
      comment: 'Maximum notifications per day'
    },
    maxArProducts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_ar_products',
      comment: 'Maximum AR products can use'
    },
    maxPromotionalBoosts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'max_promotional_boosts',
      comment: 'Maximum promotional boosts per month'
    },
    
    // Feature Flags
    canCreateGroupBuy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_create_group_buy',
      comment: 'Can create group buy posts'
    },
    canCreateSwapDeals: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_create_swap_deals',
      comment: 'Can create swap deals'
    },
    canCreateAuctions: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_create_auctions',
      comment: 'Can create auctions'
    },
    canCreateDistressSales: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_create_distress_sales',
      comment: 'Can create distress sales'
    },
    canUseAr: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_use_ar',
      comment: 'Can use AR features'
    },
    canCustomizeShopfront: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'can_customize_shopfront',
      comment: 'Can customize shopfront'
    },
    hasVerifiedBadge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_verified_badge',
      comment: 'Gets verified seller badge'
    },
    hasPrioritySearch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_priority_search',
      comment: 'Priority in search results'
    },
    hasBuyerInsights: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_buyer_insights',
      comment: 'Access to buyer search insights'
    },
    hasUnlimitedFeatures: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_unlimited_features',
      comment: 'Unlimited access to all features'
    },
    
    // Additional Features
    features: {
      type: DataTypes.JSON,
      comment: 'Array of additional features and benefits'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Plan description'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether plan is available for subscription'
    },
    paystackPlanCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'paystack_plan_code',
      comment: 'Paystack plan code (PLN_xxxxxxxxxx)'
    }
  }, {
    tableName: 'subscription_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Define associations
  SubscriptionPlan.associate = (models) => {
    // SubscriptionPlan has many UserSubscriptions
    if (models.UserSubscription) {
      SubscriptionPlan.hasMany(models.UserSubscription, {
        foreignKey: 'plan_id',
        as: 'subscriptions'
      });
    }
  };

  return SubscriptionPlan;
};
