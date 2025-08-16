module.exports = (sequelize, DataTypes) => {
  const MarketAnalytics = sequelize.define('MarketAnalytics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    metric_type: {
      type: DataTypes.ENUM(
        'product_views',
        'search_queries',
        'category_trends',
        'price_analysis',
        'user_engagement',
        'market_volume',
        'conversion_rates',
        'geographic_distribution'
      ),
      allowNull: false,
      comment: 'Type of market metric being tracked'
    },
    metric_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Specific name of the metric'
    },
    metric_value: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      comment: 'Numeric value of the metric'
    },
    metric_unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Unit of measurement for the metric'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Product category this metric relates to (if applicable)'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Geographic location this metric relates to (if applicable)'
    },
    time_period: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
      comment: 'Time period for the metric aggregation'
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Start of the time period'
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'End of the time period'
    },
    comparison_value: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: 'Previous period value for comparison'
    },
    change_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Percentage change from previous period'
    },
    trend_direction: {
      type: DataTypes.ENUM('increasing', 'decreasing', 'stable', 'fluctuating'),
      allowNull: true,
      comment: 'Overall trend direction'
    },
    confidence_level: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Confidence level in the metric (0.00 to 1.00)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata and context for the metric'
    },
    is_forecast: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is a forecasted/predicted value'
    },
    forecast_accuracy: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Accuracy of previous forecasts (0.00 to 1.00)'
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
    tableName: 'market_analytics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['metric_type']
      },
      {
        fields: ['metric_name']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['location']
      },
      {
        fields: ['time_period']
      },
      {
        fields: ['period_start']
      },
      {
        fields: ['period_end']
      },
      {
        fields: ['trend_direction']
      },
      {
        fields: ['is_forecast']
      },
      {
        fields: ['created_at']
      }
    ]
  });
  
  return MarketAnalytics;
};
