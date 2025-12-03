const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VisibilityScore = sequelize.define('VisibilityScore', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    itemType: {
      type: DataTypes.ENUM('product', 'group_buy', 'swap_deal', 'auction', 'distress_sale'),
      allowNull: false,
      field: 'item_type',
      comment: 'Type of item'
    },
    itemId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'item_id',
      comment: 'ID of the item (UUID as CHAR)'
    },
    visibilityScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'visibility_score',
      comment: 'Calculated visibility score'
    },
    scoreBreakdown: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'score_breakdown',
      comment: 'JSON object with score component breakdown',
      // Example structure:
      // {
      //   promotion_weight: 300,
      //   seller_reputation: 100,
      //   media_quality: 50,
      //   engagement: 75,
      //   freshness: 30,
      //   location_match: 20,
      //   category_relevance: 30
      // }
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'calculated_at',
      comment: 'When score was calculated'
    }
  }, {
    tableName: 'visibility_scores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at needed, we track calculated_at
    indexes: [
      {
        fields: ['item_type', 'item_id'],
        unique: true,
        name: 'unique_item_score'
      },
      {
        fields: ['visibility_score']
      },
      {
        fields: ['calculated_at']
      },
      {
        fields: ['item_type', 'visibility_score']
      }
    ]
  });

  // No associations needed - this is a standalone tracking table
  VisibilityScore.associate = (models) => {
    // Can optionally associate with items if needed
  };

  return VisibilityScore;
};

