const db = require('../../models');
const { Op } = require('sequelize');

class MarketAnalyticsController {
  // Track a new market metric
  async trackMetric(req, res) {
    try {
      const {
        metric_type,
        metric_name,
        metric_value,
        metric_unit,
        category_id,
        location,
        time_period,
        period_start,
        period_end,
        comparison_value,
        change_percentage,
        trend_direction,
        confidence_level,
        metadata,
        is_forecast,
        forecast_accuracy
      } = req.body;

      // Validate required fields
      if (!metric_type || !metric_name || metric_value === undefined || !time_period || !period_start || !period_end) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: metric_type, metric_name, metric_value, time_period, period_start, period_end'
        });
      }

      // Validate metric value
      if (isNaN(parseFloat(metric_value))) {
        return res.status(400).json({
          success: false,
          message: 'metric_value must be a valid number'
        });
      }

      // Validate time period dates
      if (new Date(period_start) >= new Date(period_end)) {
        return res.status(400).json({
          success: false,
          message: 'period_start must be before period_end'
        });
      }

      // Check if category exists if provided
      if (category_id) {
        const category = await db.ProductCategory.findByPk(category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category_id'
          });
        }
      }

      const metric = await db.MarketAnalytics.create({
        metric_type,
        metric_name,
        metric_value: parseFloat(metric_value),
        metric_unit,
        category_id,
        location,
        time_period,
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        comparison_value: comparison_value ? parseFloat(comparison_value) : null,
        change_percentage: change_percentage ? parseFloat(change_percentage) : null,
        trend_direction,
        confidence_level: confidence_level ? parseFloat(confidence_level) : null,
        metadata: metadata ? JSON.parse(metadata) : null,
        is_forecast: is_forecast || false,
        forecast_accuracy: forecast_accuracy ? parseFloat(forecast_accuracy) : null
      });

      res.status(201).json({
        success: true,
        message: 'Market metric tracked successfully',
        data: metric
      });

    } catch (error) {
      console.error('Error tracking market metric:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get market overview dashboard
  async getMarketOverview(req, res) {
    try {
      const { time_period = 'daily', limit = 30 } = req.query;

      // Get current period metrics
      const currentPeriod = MarketAnalyticsController.getCurrentPeriod(time_period);
      
      // Get previous period for comparison
      const previousPeriod = MarketAnalyticsController.getPreviousPeriod(time_period, currentPeriod.start, currentPeriod.end);

      // Aggregate metrics by type
      const metricsByType = await db.MarketAnalytics.findAll({
        where: {
          time_period,
          period_start: { [Op.gte]: currentPeriod.start },
          period_end: { [Op.lte]: currentPeriod.end }
        },
        attributes: [
          'metric_type',
          [db.sequelize.fn('AVG', db.sequelize.col('metric_value')), 'avg_value'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('metric_value')), 'total_value']
        ],
        group: ['metric_type'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
      });

      // Get top trending categories
      const topCategories = await MarketAnalyticsController.getTopTrendingCategories(time_period, currentPeriod.start, currentPeriod.end);

      // Get geographic distribution
      const geographicData = await MarketAnalyticsController.getGeographicDistribution(time_period, currentPeriod.start, currentPeriod.end);

      // Get market volume trends
      const volumeTrends = await MarketAnalyticsController.getMarketVolumeTrends(time_period, limit);

      res.json({
        success: true,
        data: {
          current_period: currentPeriod,
          previous_period: previousPeriod,
          metrics_by_type: metricsByType,
          top_trending_categories: topCategories,
          geographic_distribution: geographicData,
          volume_trends: volumeTrends,
          summary: {
            total_metrics: metricsByType.reduce((sum, m) => sum + parseInt(m.dataValues.count), 0),
            period_duration: Math.ceil((currentPeriod.end - currentPeriod.start) / (1000 * 60 * 60 * 24)),
            trend_overall: await MarketAnalyticsController.calculateOverallTrend(currentPeriod.start, currentPeriod.end)
          }
        }
      });

    } catch (error) {
      console.error('Error getting market overview:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get category performance analytics
  async getCategoryAnalytics(req, res) {
    try {
      const { category_id } = req.params;
      const { time_period = 'monthly', limit = 12 } = req.query;

      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: 'category_id is required'
        });
      }

      // Verify category exists
      const category = await db.ProductCategory.findByPk(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get category metrics over time
      const categoryMetrics = await db.MarketAnalytics.findAll({
        where: {
          category_id,
          time_period,
          is_forecast: false
        },
        order: [['period_start', 'ASC']],
        limit: parseInt(limit)
      });

      // Get product performance in this category
      const productPerformance = await MarketAnalyticsController.getCategoryProductPerformance(category_id);

      // Get user engagement by category
      const userEngagement = await MarketAnalyticsController.getCategoryUserEngagement(category_id);

      // Get price analysis for category
      const priceAnalysis = await MarketAnalyticsController.getCategoryPriceAnalysis(category_id);

      res.json({
        success: true,
        data: {
          category: {
            id: category.id,
            name: category.name
          },
          metrics_over_time: categoryMetrics,
          product_performance: productPerformance,
          user_engagement: userEngagement,
          price_analysis: priceAnalysis
        }
      });

    } catch (error) {
      console.error('Error getting category analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get search analytics and trends
  async getSearchAnalytics(req, res) {
    try {
      const { time_period = 'daily', limit = 50, category_id, location } = req.query;

      const whereClause = {};
      if (category_id) whereClause.category_id = category_id;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };

      // Get top search queries
      const topQueries = await db.SearchAnalytics.findAll({
        where: {
          ...whereClause,
          created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(time_period)) }
        },
        attributes: [
          'search_query',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'search_count'],
          [db.sequelize.fn('AVG', db.sequelize.col('results_count')), 'avg_results'],
          [db.sequelize.fn('AVG', db.sequelize.col('time_spent')), 'avg_time_spent'],
          [db.sequelize.fn('SUM', db.sequelize.fn('IF', db.sequelize.col('is_successful'), 1, 0)), 'successful_searches']
        ],
        group: ['search_query'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
        limit: parseInt(limit)
      });

      // Get search success rates
      const successRates = await MarketAnalyticsController.getSearchSuccessRates(time_period, whereClause);

      // Get search trends over time
      const searchTrends = await MarketAnalyticsController.getSearchTrends(time_period, limit, whereClause);

      // Get device and location insights
      const deviceInsights = await MarketAnalyticsController.getSearchDeviceInsights(time_period, whereClause);
      const locationInsights = await MarketAnalyticsController.getSearchLocationInsights(time_period, whereClause);

      res.json({
        success: true,
        data: {
          top_queries: topQueries,
          success_rates: successRates,
          search_trends: searchTrends,
          device_insights: deviceInsights,
          location_insights: locationInsights
        }
      });

    } catch (error) {
      console.error('Error getting search analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user behavior analytics
  async getUserBehaviorAnalytics(req, res) {
    try {
      const { time_period = 'daily', limit = 30, user_id, behavior_type } = req.query;

      const whereClause = {};
      if (user_id) whereClause.user_id = user_id;
      if (behavior_type) whereClause.behavior_type = behavior_type;

      // Get behavior patterns over time
      const behaviorPatterns = await db.UserBehaviorAnalytics.findAll({
        where: {
          ...whereClause,
          created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(time_period)) }
        },
        attributes: [
          'behavior_type',
          'action',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'action_count'],
          [db.sequelize.fn('AVG', db.sequelize.col('duration')), 'avg_duration'],
          [db.sequelize.fn('SUM', db.sequelize.fn('IF', db.sequelize.col('is_conversion'), 1, 0)), 'conversions']
        ],
        group: ['behavior_type', 'action'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
        limit: parseInt(limit)
      });

      // Get conversion funnel analysis
      const conversionFunnel = await MarketAnalyticsController.getConversionFunnelAnalysis(time_period, whereClause);

      // Get user engagement metrics
      const engagementMetrics = await MarketAnalyticsController.getUserEngagementMetrics(time_period, whereClause);

      // Get geographic behavior patterns
      const geographicPatterns = await MarketAnalyticsController.getGeographicBehaviorPatterns(time_period, whereClause);

      res.json({
        success: true,
        data: {
          behavior_patterns: behaviorPatterns,
          conversion_funnel: conversionFunnel,
          engagement_metrics: engagementMetrics,
          geographic_patterns: geographicPatterns
        }
      });

    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get market trends and forecasting
  async getMarketTrends(req, res) {
    try {
      const { metric_type, category_id, time_period = 'monthly', forecast_periods = 3 } = req.query;

      const whereClause = {};
      if (metric_type) whereClause.metric_type = metric_type;
      if (category_id) whereClause.category_id = category_id;

      // Get historical trends
      const historicalTrends = await db.MarketAnalytics.findAll({
        where: {
          ...whereClause,
          is_forecast: false,
          time_period
        },
        order: [['period_start', 'ASC']],
        limit: 24 // Last 24 periods
      });

      // Get existing forecasts
      const existingForecasts = await db.MarketAnalytics.findAll({
        where: {
          ...whereClause,
          is_forecast: true,
          time_period
        },
        order: [['period_start', 'ASC']]
      });

      // Generate new forecasts if needed
      const newForecasts = await MarketAnalyticsController.generateForecasts(historicalTrends, parseInt(forecast_periods), time_period);

      // Calculate trend indicators
      const trendIndicators = await MarketAnalyticsController.calculateTrendIndicators(historicalTrends);

      res.json({
        success: true,
        data: {
          historical_trends: historicalTrends,
          existing_forecasts: existingForecasts,
          new_forecasts: newForecasts,
          trend_indicators: trendIndicators
        }
      });

    } catch (error) {
      console.error('Error getting market trends:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper method to get current period dates
  static getCurrentPeriod(timePeriod) {
    const now = new Date();
    let start, end;

    switch (timePeriod) {
      case 'hourly':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59);
        break;
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
        end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    return { start, end };
  }

  // Helper method to get previous period dates
  static getPreviousPeriod(timePeriod, currentStart, currentEnd) {
    const duration = currentEnd - currentStart;
    const start = new Date(currentStart.getTime() - duration);
    const end = new Date(currentStart.getTime() - 1);

    return { start, end };
  }

  // Helper method to get time period in milliseconds
  static getTimePeriodMs(timePeriod) {
    const periods = {
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000,
      'quarterly': 90 * 24 * 60 * 60 * 1000,
      'yearly': 365 * 24 * 60 * 60 * 1000
    };
    return periods[timePeriod] || periods.daily;
  }

  // Helper method to get top trending categories
  static async getTopTrendingCategories(timePeriod, start, end) {
    return await db.MarketAnalytics.findAll({
      where: {
        metric_type: 'category_trends',
        time_period: timePeriod,
        period_start: { [Op.gte]: start },
        period_end: { [Op.lte]: end }
      },
      include: [{
        model: db.ProductCategory,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['change_percentage', 'DESC']],
      limit: 10
    });
  }

  // Helper method to get geographic distribution
  static async getGeographicDistribution(timePeriod, start, end) {
    return await db.MarketAnalytics.findAll({
      where: {
        metric_type: 'geographic_distribution',
        time_period: timePeriod,
        period_start: { [Op.gte]: start },
        period_end: { [Op.lte]: end }
      },
      attributes: [
        'location',
        [db.sequelize.fn('SUM', db.sequelize.col('metric_value')), 'total_value'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'metric_count']
      ],
      group: ['location'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('metric_value')), 'DESC']],
      limit: 20
    });
  }

  // Helper method to get market volume trends
  static async getMarketVolumeTrends(timePeriod, limit) {
    return await db.MarketAnalytics.findAll({
      where: {
        metric_type: 'market_volume',
        time_period: timePeriod
      },
      order: [['period_start', 'DESC']],
      limit: parseInt(limit)
    });
  }

  // Helper method to calculate overall trend
  static async calculateOverallTrend(start, end) {
    const metrics = await db.MarketAnalytics.findAll({
      where: {
        period_start: { [Op.gte]: start },
        period_end: { [Op.lte]: end }
      },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('change_percentage')), 'avg_change']
      ]
    });

    const avgChange = parseFloat(metrics[0]?.dataValues?.avg_change || 0);
    
    if (avgChange > 5) return 'strongly_increasing';
    if (avgChange > 1) return 'increasing';
    if (avgChange < -5) return 'strongly_decreasing';
    if (avgChange < -1) return 'decreasing';
    return 'stable';
  }

  // Helper method to get category product performance
  static async getCategoryProductPerformance(categoryId) {
    // First get the category name from the categoryId
    const category = await db.ProductCategory.findByPk(categoryId);
    if (!category) {
      return [];
    }
    
    // Then find products with that category name
    return await db.Product.findAll({
      where: { category: category.name },
      attributes: [
        'id',
        'title',
        'price',
        'views',
        'likes',
        'saves'
      ],
      order: [['views', 'DESC']],
      limit: 10
    });
  }

  // Helper method to get category user engagement
  static async getCategoryUserEngagement(categoryId) {
    // First get the category name from the categoryId
    const category = await db.ProductCategory.findByPk(categoryId);
    if (!category) {
      return [];
    }
    
    // Get product IDs for this category
    const products = await db.Product.findAll({
      where: { category: category.name },
      attributes: ['id']
    });
    
    const productIds = products.map(p => p.id);
    
    if (productIds.length === 0) {
      return [];
    }
    
    // Get user behavior analytics for products in this category
    return await db.UserBehaviorAnalytics.findAll({
      where: {
        target_type: 'product',
        behavior_type: 'product_interaction',
        target_id: productIds
      },
      attributes: [
        'behavior_type',
        'action',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'interaction_count']
      ],
      group: ['behavior_type', 'action'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });
  }

  // Helper method to get category price analysis
  static async getCategoryPriceAnalysis(categoryId) {
    // First get the category name from the categoryId
    const category = await db.ProductCategory.findByPk(categoryId);
    if (!category) {
      return {};
    }
    
    const products = await db.Product.findAll({
      where: { category: category.name },
      attributes: [
        [db.sequelize.fn('MIN', db.sequelize.col('price')), 'min_price'],
        [db.sequelize.fn('MAX', db.sequelize.col('price')), 'max_price'],
        [db.sequelize.fn('AVG', db.sequelize.col('price')), 'avg_price'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'product_count']
      ]
    });

    return products[0]?.dataValues || {};
  }

  // Helper method to get search success rates
  static async getSearchSuccessRates(timePeriod, whereClause) {
    const totalSearches = await db.SearchAnalytics.count({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) }
      }
    });

    const successfulSearches = await db.SearchAnalytics.count({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) },
        is_successful: true
      }
    });

    return {
      total_searches: totalSearches,
      successful_searches: successfulSearches,
      success_rate: totalSearches > 0 ? (successfulSearches / totalSearches * 100).toFixed(2) : 0
    };
  }

  // Helper method to get search trends
  static async getSearchTrends(timePeriod, limit, whereClause) {
    return await db.SearchAnalytics.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) }
      },
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'search_count']
      ],
      group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']],
      limit: parseInt(limit)
    });
  }

  // Helper method to get search device insights
  static async getSearchDeviceInsights(timePeriod, whereClause) {
    return await db.SearchAnalytics.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) }
      },
      attributes: [
        'device_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'search_count'],
        [db.sequelize.fn('AVG', db.sequelize.col('time_spent')), 'avg_time_spent']
      ],
      group: ['device_type'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });
  }

  // Helper method to get search location insights
  static async getSearchLocationInsights(timePeriod, whereClause) {
    return await db.SearchAnalytics.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) },
        location: { [Op.ne]: null }
      },
      attributes: [
        'location',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'search_count']
      ],
      group: ['location'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
      limit: 20
    });
  }

  // Helper method to get conversion funnel analysis
  static async getConversionFunnelAnalysis(timePeriod, whereClause) {
    const funnelStages = ['awareness', 'interest', 'consideration', 'intent', 'purchase', 'retention'];
    const funnelData = [];

    for (const stage of funnelStages) {
      const count = await db.UserBehaviorAnalytics.count({
        where: {
          ...whereClause,
          funnel_stage: stage,
          created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) }
        }
      });
      funnelData.push({ stage, count });
    }

    return funnelData;
  }

  // Helper method to get user engagement metrics
  static async getUserEngagementMetrics(timePeriod, whereClause) {
    return await db.UserBehaviorAnalytics.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) }
      },
      attributes: [
        'behavior_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'interaction_count'],
        [db.sequelize.fn('AVG', db.sequelize.col('duration')), 'avg_duration'],
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('user_id'))), 'unique_users']
      ],
      group: ['behavior_type'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });
  }

  // Helper method to get geographic behavior patterns
  static async getGeographicBehaviorPatterns(timePeriod, whereClause) {
    return await db.UserBehaviorAnalytics.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: new Date(Date.now() - MarketAnalyticsController.getTimePeriodMs(timePeriod)) },
        location: { [Op.ne]: null }
      },
      attributes: [
        'location',
        'behavior_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'interaction_count']
      ],
      group: ['location', 'behavior_type'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
      limit: 50
    });
  }

  // Helper method to generate forecasts
  static async generateForecasts(historicalData, forecastPeriods, timePeriod) {
    // Simple linear regression forecast
    const forecasts = [];
    if (historicalData.length < 2) return forecasts;

    const values = historicalData.map(d => parseFloat(d.metric_value));
    const n = values.length;
    
    // Calculate linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    for (let i = 1; i <= forecastPeriods; i++) {
      const forecastValue = slope * (n + i - 1) + intercept;
      const lastPeriod = historicalData[historicalData.length - 1];
      
      forecasts.push({
        metric_type: lastPeriod.metric_type,
        metric_name: lastPeriod.metric_name,
        metric_value: Math.max(0, forecastValue), // Ensure non-negative
        time_period: timePeriod,
        period_start: new Date(lastPeriod.period_end.getTime() + MarketAnalyticsController.getTimePeriodMs(timePeriod)),
        period_end: new Date(lastPeriod.period_end.getTime() + 2 * MarketAnalyticsController.getTimePeriodMs(timePeriod)),
        is_forecast: true,
        confidence_level: 0.7 // Default confidence for simple forecast
      });
    }

    return forecasts;
  }

  // Helper method to calculate trend indicators
  static async calculateTrendIndicators(historicalData) {
    if (historicalData.length < 2) return {};

    const values = historicalData.map(d => parseFloat(d.metric_value));
    const recentValues = values.slice(-5); // Last 5 periods
    const olderValues = values.slice(-10, -5); // Previous 5 periods

    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const volatility = MarketAnalyticsController.calculateVolatility(values);

    return {
      trend_direction: changePercent > 5 ? 'increasing' : changePercent < -5 ? 'decreasing' : 'stable',
      change_percentage: changePercent.toFixed(2),
      volatility: volatility.toFixed(2),
      momentum: recentValues[recentValues.length - 1] - recentValues[0]
    };
  }

  // Helper method to calculate volatility
  static calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(variance);
  }
}

module.exports = new MarketAnalyticsController();
