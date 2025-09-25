const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SellersTable = sequelize.define('SellersTable', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Category UUID from ProductCategory table (Universal Category System)'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'rejected', 'approved', 'suspended', 'active', 'expired'),
      defaultValue: 'pending',
    },
    verifiedAt: {
      type: DataTypes.DATE,
    },
    verificationExpiresAt: {
      type: DataTypes.DATE,
      comment: 'When verification expires and needs renewal'
    },
    verificationLevel: {
      type: DataTypes.ENUM('basic', 'premium', 'enterprise'),
      defaultValue: 'basic',
      comment: 'Level of verification achieved'
    },
    verificationScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Overall verification score (0-100)'
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      comment: 'Admin notes about verification process'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      comment: 'Reason for rejection if verification failed'
    },
    documentsSubmitted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification documents submitted'
    },
    documentsApproved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification documents approved'
    },
    lastVerificationCheck: {
      type: DataTypes.DATE,
      comment: 'Last time verification was reviewed'
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verifiedSellerBenefits: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of benefits this verified seller has access to'
    },
    trustScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Trust score based on verification, sales, and reviews (0-100)'
    },
    subscriptionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'subscription_plan_id',
      comment: 'Current subscription plan for seller'
    },
    subscriptionFeatures: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'subscription_features',
      comment: 'Active subscription features'
    }
  }, {
    tableName: 'sellers',
    timestamps: true,
  });

  // Define associations
  SellersTable.associate = (models) => {
    SellersTable.hasMany(models.SellerDocument, {
      foreignKey: 'sellerId',
      as: 'documents'
    });
    
    // Association with UserTable
    if (models.UserTable) {
      SellersTable.belongsTo(models.UserTable, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
    
    // Association with ProductCategory (Universal Category System)
    if (models.ProductCategory) {
      SellersTable.belongsTo(models.ProductCategory, {
        foreignKey: 'category',
        as: 'categoryInfo'
      });
    }
  };

  return SellersTable;
};
