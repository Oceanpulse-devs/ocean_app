module.exports = (sequelize, DataTypes) => {
    const SwapDeal = sequelize.define('SwapDeal', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    comment: 'User ID who created the swap deal (seller)'
  },
  productToSwap: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'product_to_swap',
    comment: 'Name of the product being swapped'
  },
  categoryToSwap: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'category_to_swap',
    comment: 'Category of the product being swapped'
  },
  brandToSwap: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'brand_to_swap',
    comment: 'Brand of the product being swapped'
  },
  condition: {
    type: DataTypes.ENUM('New', 'Like New', 'Good', 'Fair', 'Poor'),
    defaultValue: 'Good',
    comment: 'Condition of the product being swapped'
  },
  preferredSwapCategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'preferred_swap_category',
    comment: 'Category the seller wants to swap with'
  },
  preferredSwapSubcategories: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'preferred_swap_subcategories',
    comment: 'JSON array of preferred subcategories'
  },
  swapConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'swap_conditions',
    comment: 'Swap deal conditions and preferences'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Title of the swap deal'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the swap deal'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON array of image URLs for the swap deal'
  },
  arModel: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'ar_model',
    comment: 'URL to GLB file for AR model viewing'
  },
  swapTerms: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'swap_terms',
    comment: 'Additional terms or conditions for the swap'
  },
  preferredItems: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'preferred_items',
    comment: 'What the seller wants in exchange'
  },
  meetingLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'meeting_location',
    comment: 'Preferred meeting location for item exchange'
  },
  meetingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'meeting_date',
    comment: 'Preferred meeting date for item exchange'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed', 'cancelled'),
    defaultValue: 'active',
    comment: 'Current status of the swap deal'
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'views_count',
    comment: 'Number of views on this swap deal'
  },
  savedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'savedCount',
    comment: 'Number of times this swap deal has been saved (standardized field)'
  },
  proposalsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'proposals_count',
    comment: 'Number of swap proposals received'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured',
    comment: 'Whether this swap deal is featured'
  },
  // Boost Engine fields
  isBoosted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_boosted',
    comment: 'Whether swap deal is currently boosted'
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
    comment: 'Whether swap deal is currently top placed'
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
  // Spotlight Engine fields (using is_featured as well, but adding explicit spotlight fields)
  isSpotlighted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_spotlighted',
    comment: 'Whether swap deal is currently in spotlight'
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
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    comment: 'When the swap offer expires'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updatedAt'
  }
}, {
  tableName: 'swap_deals',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['seller_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['createdAt']
    }
  ]
  });

  // Define associations
  SwapDeal.associate = function(models) {
    // SwapDeal belongs to User (seller)
    SwapDeal.belongsTo(models.UserTable, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    if (models.UserTable) {
      models.UserTable.hasMany(SwapDeal, {
        foreignKey: 'sellerId',
        as: 'swapDeals'
      });
    }

    // SwapDeal has many SwapProposals
    SwapDeal.hasMany(models.SwapProposal, {
      foreignKey: 'swapDealId',
      as: 'proposals'
    });
  };
  
  return SwapDeal;
};
