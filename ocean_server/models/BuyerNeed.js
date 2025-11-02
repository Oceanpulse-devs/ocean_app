module.exports = (sequelize, DataTypes) => {
  const BuyerNeed = sequelize.define('BuyerNeed', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Title describing what the buyer is looking for'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed description of the item/service needed'
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User ID who posted this buyer need'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Product category for the buyer need (optional) - kept for backward compatibility'
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Category name (string) - stored directly, not using ProductCategory table anymore'
    },
    status: {
      type: DataTypes.ENUM('active', 'in_progress', 'fulfilled', 'expired', 'cancelled'),
      defaultValue: 'active',
      comment: 'Current status of the buyer need'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this buyer need is featured'
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of views on this buyer need'
    },
    responses_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of seller responses received'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this buyer need expires'
    },
    reach_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: 'Maximum number of people who can contact the buyer'
    },
    current_reach: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current number of people who have contacted the buyer'
    },
    reach_exceeded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the reach limit has been exceeded'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'buyer_needs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['buyer_id']
      },
      {
        fields: ['category_id']
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
        fields: ['created_at']
      },
      {
        fields: ['reach_exceeded', 'current_reach']
      },
      {
        fields: ['status', 'reach_exceeded']
      }
    ]
  });
  
  return BuyerNeed;
};
