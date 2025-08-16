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
      comment: 'Product category for the buyer need (optional)'
    },
    budget_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Minimum budget range'
    },
    budget_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum budget range'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false,
      comment: 'Currency for budget amounts'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Preferred location for pickup/delivery'
    },
    urgency: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'How urgently the buyer needs this item'
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
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of tags for categorization and search'
    },
    contact_preference: {
      type: DataTypes.ENUM('message', 'email', 'phone', 'any'),
      defaultValue: 'message',
      comment: 'Preferred contact method for sellers'
    },
    additional_requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Any additional requirements or preferences'
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
        fields: ['urgency']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });
  
  return BuyerNeed;
};
