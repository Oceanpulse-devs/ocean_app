const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Auction = sequelize.define('Auction', {
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
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    startingPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currentPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    reservePrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    minimumBidIncrement: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 1.00
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'ended', 'cancelled', 'sold'),
      allowNull: false,
      defaultValue: 'active'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    condition: {
      type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
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
    totalBids: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uniqueBidders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isReserveMet: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    winnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    winningBidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    autoExtend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    autoExtendMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    shippingInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    returnPolicy: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isBoosted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_boosted',
      comment: 'Whether auction is currently boosted'
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
      comment: 'Whether auction is currently top placed'
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
      comment: 'Whether auction is currently in spotlight'
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
    },
    buyNowPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Buy Now price - allows immediate purchase at this price'
    },
    buyNowEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether Buy Now feature is enabled for this auction'
    },
    boughtAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when item was purchased via Buy Now'
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who purchased via Buy Now'
    }
  }, {
    tableName: 'auctions',
    timestamps: true,
    indexes: [
      {
        fields: ['sellerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['endTime']
      },
      {
        fields: ['category']
      },
      {
        fields: ['currentPrice']
      }
    ]
  });

  Auction.associate = (models) => {
    // Auction belongs to Seller
    if (models.SellersTable) {
      Auction.belongsTo(models.SellersTable, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }

    // Auction has many Bids
    if (models.AuctionBid) {
      Auction.hasMany(models.AuctionBid, {
        foreignKey: 'auctionId',
        as: 'bids'
      });
    }

    // Auction has many Watchers
    if (models.AuctionWatcher) {
      Auction.hasMany(models.AuctionWatcher, {
        foreignKey: 'auctionId',
        as: 'watchers'
      });
    }

    // Auction belongs to Winner (User)
    if (models.UserTable) {
      Auction.belongsTo(models.UserTable, {
        foreignKey: 'winnerId',
        as: 'winner'
      });

      // Auction belongs to Buyer (User who used Buy Now)
      Auction.belongsTo(models.UserTable, {
        foreignKey: 'buyerId',
        as: 'buyer'
      });
    }
  };

  return Auction;
}; 