module.exports = (sequelize, DataTypes) => {
    const GroupBuy = sequelize.define('GroupBuy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Title of the group buy'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the group buy'
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Product category for the group buy'
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Name of the product being purchased'
  },
  product_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL to product image'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Original retail price of the product'
  },
  group_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Discounted price when group buy threshold is met'
  },
  min_buyers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: 'Minimum number of buyers required to activate group buy'
  },
  max_buyers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of buyers allowed (optional)'
  },
  current_buyers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current number of committed buyers'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'successful', 'failed', 'cancelled'),
    defaultValue: 'pending',
    comment: 'Current status of the group buy'
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID who created the group buy'
  },
  seller_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Seller ID if a specific seller is involved'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Location for pickup/delivery'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Deadline for joining the group buy'
  },
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expected delivery date when successful'
  },
  terms_conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Terms and conditions for the group buy'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of tags for categorization'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this group buy is featured'
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of views on this group buy'
  },
  is_boosted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether group buy is currently boosted'
  },
  boost_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When boost expires'
  },
  boost_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reference to promotional boost'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_buys',
  timestamps: true,
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['creator_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['deadline']
    },
    {
      fields: ['is_featured']
    }
  ]
  });
  
  return GroupBuy;
};
