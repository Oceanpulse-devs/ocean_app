module.exports = (sequelize, DataTypes) => {
  const SearchAnalytics = sequelize.define('SearchAnalytics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    search_query: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'The actual search query text'
    },
    search_type: {
      type: DataTypes.ENUM('product', 'user', 'category', 'general'),
      allowNull: false,
      comment: 'Type of search performed'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who performed the search (if logged in)'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Category being searched (if applicable)'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User location when search was performed'
    },
    device_type: {
      type: DataTypes.ENUM('mobile', 'desktop', 'tablet'),
      allowNull: true,
      comment: 'Device type used for search'
    },
    results_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of results returned'
    },
    click_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Position of clicked result (1-based)'
    },
    time_spent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent on search results (seconds)'
    },
    is_successful: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether search led to a successful action'
    },
    success_action: {
      type: DataTypes.ENUM('view', 'purchase', 'contact', 'save', 'share'),
      allowNull: true,
      comment: 'Type of successful action taken'
    },
    search_filters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Filters applied during search (price, location, etc.)'
    },
    search_suggestions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Search suggestions shown to user'
    },
    search_session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Unique session identifier for search analytics'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'search_analytics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['search_query']
      },
      {
        fields: ['search_type']
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
        fields: ['device_type']
      },
      {
        fields: ['is_successful']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['search_session_id']
      }
    ]
  });
  
  return SearchAnalytics;
};
