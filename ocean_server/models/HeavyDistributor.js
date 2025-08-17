const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HeavyDistributor = sequelize.define('HeavyDistributor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'id'
      },
      comment: 'Reference to the supplier/seller'
    },
    businessName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Official business name of the distributor'
    },
    businessType: {
      type: DataTypes.ENUM('manufacturer', 'wholesaler', 'distributor', 'retailer', 'importer', 'exporter'),
      allowNull: false,
      comment: 'Type of business operation'
    },
    productCategories: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of product categories this distributor handles'
    },
    productBrands: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of product brands this distributor carries'
    },
    minimumOrderQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minimum quantity required for wholesale orders'
    },
    minimumOrderValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Minimum order value in local currency'
    },
    paymentTerms: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Payment terms and conditions (e.g., net 30, upfront, etc.)'
    },
    deliveryOptions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Available delivery options and costs'
    },
    coverageAreas: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Geographic areas this distributor covers (states, cities, regions)'
    },
    contactInfo: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Contact information including phone, email, website'
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Physical business address'
    },
    operatingHours: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Business operating hours and days'
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Business certifications and licenses'
    },
    yearsInBusiness: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of years the business has been operating'
    },
    employeeCount: {
      type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
      allowNull: true,
      comment: 'Number of employees'
    },
    annualRevenue: {
      type: DataTypes.ENUM('under_1m', '1m_5m', '5m_25m', '25m_100m', 'over_100m'),
      allowNull: true,
      comment: 'Annual revenue range'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this distributor has been verified by Ocean'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when verification was completed'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      comment: 'Average rating from buyers (0-5)'
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of reviews received'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this distributor listing is active'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'inactive'),
      defaultValue: 'pending',
      comment: 'Current status of the distributor listing'
    },
    featuredUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date until which this distributor is featured'
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Last activity or update timestamp'
    }
  }, {
    tableName: 'heavy_distributors',
    timestamps: true,
    indexes: [
      {
        fields: ['supplierId']
      },
      {
        fields: ['businessType']
      },
      {
        fields: ['isVerified']
      },
      {
        fields: ['status']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['lastActivity']
      }
    ]
  });

  HeavyDistributor.associate = (models) => {
    if (models.SellersTable) {
      HeavyDistributor.belongsTo(models.SellersTable, {
        foreignKey: 'supplierId',
        as: 'supplier'
      });
    }
  };

  return HeavyDistributor;
};
