module.exports = (sequelize, DataTypes) => {
  const BuyerSearchInsight = sequelize.define('BuyerSearchInsight', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    search_term: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'The product name or search query that returned no results'
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'User ID who performed the search (null for anonymous)'
    },
    category_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Category name or filter used during search (if any)'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User location when search was performed'
    },
    search_filters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional filters applied (price range, brand, condition, etc.)'
    },
    device_type: {
      type: DataTypes.ENUM('mobile', 'desktop', 'tablet'),
      allowNull: true,
      comment: 'Device type used for search'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address (for location detection if user location not provided)'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'When this search was performed'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'buyer_search_insights',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['search_term']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['location']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['search_term', 'created_at']
      }
    ]
  });
  
  return BuyerSearchInsight;
};

