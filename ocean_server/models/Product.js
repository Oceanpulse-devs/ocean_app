const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    condition: {
      type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
      defaultValue: 'good',
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    saves: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('active', 'sold', 'inactive'),
      defaultValue: 'active'
    },
    // Distress sale fields
    isDistressSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is a distress sale item'
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Original price before discount'
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Discount percentage applied',
      validate: {
        min: 0,
        max: 100
      }
    },
    urgencyLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'Urgency level of the distress sale'
    },
    distressReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for distress sale (moving, financial, etc.)'
    },
    distressExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the distress sale expires'
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  Product.associate = (models) => {
    if (models.SellersTable) {
      Product.belongsTo(models.SellersTable, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  };

  return Product;
}; 