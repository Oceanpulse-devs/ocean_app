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
      type: DataTypes.DECIMAL(18, 2),
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
    arModel: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'arModel',
      comment: 'URL to GLB file for AR model viewing'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    saves: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    savedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times this product has been saved (standardized field)'
    },
    likes: {
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
      type: DataTypes.DECIMAL(18, 2),
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
    },
    isBoosted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_boosted',
      comment: 'Whether product is currently boosted'
    },
    boostExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'boost_expires_at',
      comment: 'When boost expires'
    },
    boostId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'boost_id',
      comment: 'Reference to promotional boost'
    },
    // Top Placement Engine fields
    isTopPlaced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_top_placed',
      comment: 'Whether product is currently top placed'
    },
    topPlacementExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'top_placement_expires_at',
      comment: 'When top placement expires'
    },
    topPlacementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'top_placement_id',
      comment: 'Reference to top_placements table'
    },
    // Spotlight Engine fields
    isSpotlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_spotlighted',
      comment: 'Whether product is currently in spotlight'
    },
    spotlightExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'spotlight_expires_at',
      comment: 'When spotlight expires'
    },
    spotlightId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'spotlight_id',
      comment: 'Reference to spotlight_slots table'
    },
    // Ranking Engine fields
    visibilityScore: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
      field: 'visibility_score',
      comment: 'Calculated visibility score for ranking'
    },
    lastScoreUpdate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_score_update',
      comment: 'When visibility score was last calculated'
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