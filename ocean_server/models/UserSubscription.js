const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSubscription = sequelize.define('UserSubscription', {
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
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'plan_id',
      comment: 'Reference to subscription_plans table'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending', 'suspended'),
      defaultValue: 'pending'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
      comment: 'Subscription start date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
      comment: 'Subscription end date'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'auto_renew',
      comment: 'Auto-renew subscription'
    },
    paymentReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payment_reference',
      comment: 'Payment gateway reference'
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method',
      comment: 'Payment method used'
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'amount_paid',
      comment: 'Amount paid for this subscription'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'NGN'
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancellation_reason',
      comment: 'Reason for cancellation'
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
      comment: 'When subscription was cancelled'
    },

    // Flutterwave Subscription Fields
    flutterwaveSubscriptionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'flutterwave_subscription_id',
      comment: 'Flutterwave subscription ID for recurring billing'
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_billing_date',
      comment: 'Next billing date for recurring subscription'
    }
  }, {
    tableName: 'user_subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['end_date']
      },
      {
        fields: ['payment_reference']
      }
    ]
  });

  // Define associations
  UserSubscription.associate = (models) => {
    // UserSubscription belongs to SubscriptionPlan
    if (models.SubscriptionPlan) {
      UserSubscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
    }

    // UserSubscription belongs to UserTable
    if (models.UserTable) {
      UserSubscription.belongsTo(models.UserTable, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // UserSubscription has many SubscriptionUsage
    if (models.SubscriptionUsage) {
      UserSubscription.hasMany(models.SubscriptionUsage, {
        foreignKey: 'subscription_id',
        as: 'usage'
      });
    }

    // UserSubscription has many PromotionalBoosts
    if (models.PromotionalBoost) {
      UserSubscription.hasMany(models.PromotionalBoost, {
        foreignKey: 'subscription_id',
        as: 'boosts'
      });
    }
  };

  return UserSubscription;
};

