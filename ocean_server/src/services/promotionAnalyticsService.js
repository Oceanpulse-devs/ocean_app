const BoostManagementService = require('./boostManagementService');
const TopPlacementService = require('./topPlacementService');
const SpotlightService = require('./spotlightService');
const { PromotionalBoost, TopPlacement, SpotlightSlot, Product, Auction, GroupBuy, SwapDeal } = require('../../models');
const { Op } = require('sequelize');

/**
 * Promotion Analytics Service
 * 
 * Provides comprehensive analytics for all promotion types:
 * - Aggregate analytics across boost, top placement, and spotlight
 * - Performance metrics (views, clicks, messages, conversions)
 * - ROI calculations
 * - Comparison reports
 * - Time-series data for charts
 */
class PromotionAnalyticsService {

  /**
   * Calculate date range for analytics queries
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Object} Date range object with startDate and endDate
   */
  static calculateDateRange(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return {
      startDate,
      endDate
    };
  }

  /**
   * Format date range for API responses
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Formatted date range
   */
  static formatDateRange(startDate, endDate) {
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateFormatted: startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      endDateFormatted: endDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };
  }

  /**
   * Get human-readable period label
   * @param {number} days - Number of days
   * @returns {string} Period label
   */
  static getPeriodLabel(days) {
    if (days === 7) return 'Last 7 days';
    if (days === 30) return 'Last 30 days';
    if (days === 90) return 'Last 90 days';
    if (days === 365) return 'Last year';
    return `Last ${days} days`;
  }

  /**
   * Aggregate numeric metrics from an array of objects
   * @param {Array} dataArray - Array of data objects
   * @param {string} metricField - Field name to aggregate
   * @param {string} operation - Operation type ('sum', 'avg', 'min', 'max', 'count')
   * @returns {number} Aggregated value
   */
  static aggregateMetrics(dataArray, metricField, operation = 'sum') {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return 0;
    }

    const values = dataArray
      .map(item => {
        const value = item[metricField];
        return typeof value === 'number' ? value : 0;
      })
      .filter(val => !isNaN(val));

    if (values.length === 0) {
      return 0;
    }

    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values.reduce((sum, val) => sum + val, 0);
    }
  }

  /**
   * Group data by a specific field
   * @param {Array} dataArray - Array of data objects
   * @param {string} fieldName - Field name to group by
   * @returns {Object} Grouped data object
   */
  static groupByField(dataArray, fieldName) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return {};
    }

    const grouped = {};
    dataArray.forEach(item => {
      const key = item[fieldName] || 'unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  /**
   * Calculate total cost from promotions
   * @param {Array} promotions - Array of promotion objects with cost field
   * @returns {number} Total cost
   */
  static calculateTotalCost(promotions) {
    if (!Array.isArray(promotions) || promotions.length === 0) {
      return 0;
    }

    return promotions.reduce((total, promotion) => {
      const cost = parseFloat(promotion.cost) || 0;
      return total + cost;
    }, 0);
  }

  /**
   * Calculate ROI percentage
   * @param {number} cost - Total cost
   * @param {number} revenue - Total revenue (optional, defaults to 0)
   * @returns {number} ROI percentage
   */
  static calculateROI(cost, revenue = 0) {
    if (!cost || cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }

  /**
   * Calculate Cost Per View (CPV)
   * @param {number} cost - Total cost
   * @param {number} views - Total views
   * @returns {number} Cost per view
   */
  static calculateCPV(cost, views) {
    if (!views || views === 0) return 0;
    return cost / views;
  }

  /**
   * Calculate Cost Per Click (CPC)
   * @param {number} cost - Total cost
   * @param {number} clicks - Total clicks
   * @returns {number} Cost per click
   */
  static calculateCPC(cost, clicks) {
    if (!clicks || clicks === 0) return 0;
    return cost / clicks;
  }

  /**
   * Calculate Cost Per Message (CPM)
   * @param {number} cost - Total cost
   * @param {number} messages - Total messages
   * @returns {number} Cost per message
   */
  static calculateCPM(cost, messages) {
    if (!messages || messages === 0) return 0;
    return cost / messages;
  }

  /**
   * Calculate Click-Through Rate (CTR)
   * @param {number} clicks - Total clicks
   * @param {number} views - Total views
   * @returns {number} CTR percentage
   */
  static calculateCTR(clicks, views) {
    if (!views || views === 0) return 0;
    return (clicks / views) * 100;
  }

  /**
   * Calculate Conversion Rate
   * @param {number} conversions - Total conversions
   * @param {number} clicks - Total clicks
   * @returns {number} Conversion rate percentage
   */
  static calculateConversionRate(conversions, clicks) {
    if (!clicks || clicks === 0) return 0;
    return (conversions / clicks) * 100;
  }

  /**
   * Calculate comprehensive ROI from metrics
   * @param {number} cost - Total cost
   * @param {number} views - Total views
   * @param {number} clicks - Total clicks
   * @param {number} messages - Total messages
   * @param {number} revenue - Total revenue (optional, defaults to 0)
   * @returns {Object} Comprehensive ROI metrics
   */
  static calculateROIFromMetrics(cost, views, clicks, messages, revenue = 0) {
    return {
      cost: cost || 0,
      views: views || 0,
      clicks: clicks || 0,
      messages: messages || 0,
      revenue: revenue || 0,
      roi: this.calculateROI(cost, revenue),
      cpv: this.calculateCPV(cost, views),
      cpc: this.calculateCPC(cost, clicks),
      cpm: this.calculateCPM(cost, messages),
      ctr: this.calculateCTR(clicks, views),
      conversionRate: revenue > 0 ? this.calculateConversionRate(revenue, clicks) : 0
    };
  }

  /**
   * Calculate performance metrics
   * @param {number} views - Total views
   * @param {number} clicks - Total clicks
   * @param {number} messages - Total messages
   * @param {number} conversions - Total conversions (optional, defaults to 0)
   * @returns {Object} Performance metrics
   */
  static calculatePerformanceMetrics(views, clicks, messages, conversions = 0) {
    const totalViews = views || 0;
    const totalClicks = clicks || 0;
    const totalMessages = messages || 0;
    const totalConversions = conversions || 0;

    return {
      views: totalViews,
      clicks: totalClicks,
      messages: totalMessages,
      conversions: totalConversions,
      ctr: this.calculateCTR(totalClicks, totalViews),
      conversionRate: this.calculateConversionRate(totalConversions, totalClicks),
      engagementRate: totalViews > 0 ? ((totalClicks + totalMessages) / totalViews) * 100 : 0
    };
  }

  /**
   * Calculate average metrics across promotions
   * @param {Array} promotionsArray - Array of promotion objects with metrics
   * @returns {Object} Average metrics
   */
  static calculateAverageMetrics(promotionsArray) {
    if (!Array.isArray(promotionsArray) || promotionsArray.length === 0) {
      return {
        averageViews: 0,
        averageClicks: 0,
        averageMessages: 0,
        averageCost: 0
      };
    }

    const totalViews = this.aggregateMetrics(promotionsArray, 'views', 'sum');
    const totalClicks = this.aggregateMetrics(promotionsArray, 'clicks', 'sum');
    const totalMessages = this.aggregateMetrics(promotionsArray, 'messages', 'sum');
    const totalCost = this.calculateTotalCost(promotionsArray);
    const count = promotionsArray.length;

    return {
      averageViews: count > 0 ? totalViews / count : 0,
      averageClicks: count > 0 ? totalClicks / count : 0,
      averageMessages: count > 0 ? totalMessages / count : 0,
      averageCost: count > 0 ? totalCost / count : 0
    };
  }

  /**
   * Calculate cost metrics
   * @param {Array} promotionsArray - Array of promotion objects with cost field
   * @returns {Object} Cost metrics
   */
  static calculateCostMetrics(promotionsArray) {
    if (!Array.isArray(promotionsArray) || promotionsArray.length === 0) {
      return {
        totalCost: 0,
        averageCost: 0,
        promotionCount: 0,
        minCost: 0,
        maxCost: 0
      };
    }

    const costs = promotionsArray
      .map(p => parseFloat(p.cost) || 0)
      .filter(cost => !isNaN(cost) && cost >= 0);

    if (costs.length === 0) {
      return {
        totalCost: 0,
        averageCost: 0,
        promotionCount: 0,
        minCost: 0,
        maxCost: 0
      };
    }

    const totalCost = this.calculateTotalCost(promotionsArray);
    const averageCost = costs.length > 0 ? totalCost / costs.length : 0;

    return {
      totalCost,
      averageCost,
      promotionCount: promotionsArray.length,
      minCost: Math.min(...costs),
      maxCost: Math.max(...costs)
    };
  }

  /**
   * Calculate cost breakdown by promotion type
   * @param {Array} promotionsArray - Array of promotion objects
   * @returns {Object} Cost breakdown by type
   */
  static calculateCostByType(promotionsArray) {
    if (!Array.isArray(promotionsArray) || promotionsArray.length === 0) {
      return {};
    }

    const grouped = this.groupByField(promotionsArray, 'promotionType');
    const breakdown = {};

    Object.keys(grouped).forEach(type => {
      breakdown[type] = this.calculateCostMetrics(grouped[type]);
    });

    return breakdown;
  }

  /**
   * Calculate cost breakdown by item type
   * @param {Array} promotionsArray - Array of promotion objects with item_type field
   * @returns {Object} Cost breakdown by item type
   */
  static calculateCostByItemType(promotionsArray) {
    if (!Array.isArray(promotionsArray) || promotionsArray.length === 0) {
      return {};
    }

    const grouped = this.groupByField(promotionsArray, 'item_type');
    const breakdown = {};

    Object.keys(grouped).forEach(itemType => {
      breakdown[itemType] = this.calculateCostMetrics(grouped[itemType]);
    });

    return breakdown;
  }

  /**
   * Group promotions by date (day)
   * @param {Array} promotionsArray - Array of promotion objects
   * @param {string} dateField - Field name containing the date (default: 'created_at')
   * @returns {Object} Grouped promotions by date (YYYY-MM-DD format)
   */
  static groupByDate(promotionsArray, dateField = 'created_at') {
    if (!Array.isArray(promotionsArray) || promotionsArray.length === 0) {
      return {};
    }

    const grouped = {};
    promotionsArray.forEach(promotion => {
      const date = promotion[dateField] || promotion.createdAt || promotion.created_at;
      if (!date) return;

      const dateKey = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(promotion);
    });

    return grouped;
  }

  /**
   * Fill missing dates with zero values
   * @param {Object} dateData - Object with dates as keys
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of all dates in range with values
   */
  static fillMissingDates(dateData, startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dates.push({
        date: dateKey,
        value: dateData[dateKey] || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Format date for chart display
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} Formatted date string
   */
  static formatDateForChart(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Aggregate daily metrics from grouped promotions
   * @param {Object} groupedPromotions - Promotions grouped by date
   * @param {Function} metricExtractor - Function to extract metric from promotion
   * @returns {Object} Daily aggregated metrics
   */
  static aggregateDailyMetrics(groupedPromotions, metricExtractor) {
    const dailyMetrics = {};
    
    Object.keys(groupedPromotions).forEach(dateKey => {
      const promotions = groupedPromotions[dateKey];
      dailyMetrics[dateKey] = promotions.reduce((sum, promotion) => {
        return sum + (metricExtractor(promotion) || 0);
      }, 0);
    });

    return dailyMetrics;
  }

  /**
   * Calculate cost trend over time
   * @param {Array} costData - Array of cost data objects with date and cost
   * @param {number} days - Number of days to analyze
   * @returns {Object} Cost trend data
   */
  static calculateCostTrend(costData, days = 30) {
    if (!Array.isArray(costData) || costData.length === 0) {
      return {
        trend: 'stable',
        change: 0,
        averageDailyCost: 0
      };
    }

    // Sort by date
    const sorted = [...costData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate average daily cost
    const totalCost = this.aggregateMetrics(sorted, 'cost', 'sum');
    const averageDailyCost = sorted.length > 0 ? totalCost / sorted.length : 0;

    // Calculate trend (comparing first half vs second half)
    if (sorted.length < 2) {
      return {
        trend: 'stable',
        change: 0,
        averageDailyCost
      };
    }

    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstHalfAvg = firstHalf.length > 0 
      ? this.aggregateMetrics(firstHalf, 'cost', 'avg') 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? this.aggregateMetrics(secondHalf, 'cost', 'avg') 
      : 0;

    const change = firstHalfAvg > 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0;

    let trend = 'stable';
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';

    return {
      trend,
      change: Math.round(change * 100) / 100,
      averageDailyCost: Math.round(averageDailyCost * 100) / 100
    };
  }

  /**
   * Get overall analytics across all promotion types
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Overall analytics data
   */
  static async getOverallAnalytics(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get analytics from all promotion types
      const [boostAnalytics, topPlacementAnalytics, spotlightAnalytics] = await Promise.all([
        this.getBoostAnalytics(userId, days),
        this.getTopPlacementAnalytics(userId, days),
        this.getSpotlightAnalytics(userId, days)
      ]);

      // Extract summary data from each type
      const boostSummary = boostAnalytics?.summary || {};
      const topPlacementSummary = topPlacementAnalytics?.summary || {};
      const spotlightSummary = spotlightAnalytics?.summary || {};

      // Aggregate totals
      const totalPromotions = 
        (boostSummary.totalBoosts || 0) +
        (topPlacementSummary.totalPlacements || 0) +
        (spotlightSummary.totalSpotlights || 0);

      const activePromotions = 
        (boostSummary.activeBoosts || 0) +
        (topPlacementSummary.activePlacements || 0) +
        (spotlightSummary.activeSpotlights || 0);

      const totalSpent = 
        (boostSummary.totalCost || 0) +
        (topPlacementSummary.totalCost || 0) +
        (spotlightSummary.totalCost || 0);

      const totalViews = 
        (boostSummary.totalViews || 0) +
        (topPlacementSummary.totalViews || 0) +
        (spotlightSummary.totalImpressions || 0); // Spotlight uses impressions

      const totalClicks = 
        (boostSummary.totalClicks || 0) +
        (topPlacementSummary.totalClicks || 0) +
        (spotlightSummary.totalClicks || 0);

      const totalMessages = 
        (boostSummary.totalMessages || 0) +
        (topPlacementSummary.totalMessages || 0) +
        (spotlightSummary.totalMessages || 0);

      // Calculate overall ROI metrics
      const roiMetrics = this.calculateROIFromMetrics(
        totalSpent,
        totalViews,
        totalClicks,
        totalMessages,
        0 // Revenue tracking not implemented yet
      );

      // Calculate average ROI from individual type ROIs
      const boostROI = boostSummary.roi || 0;
      const topPlacementROI = topPlacementSummary.roi || 0;
      const spotlightROI = spotlightSummary.roi || 0;
      const roiCount = [boostROI, topPlacementROI, spotlightROI].filter(r => r !== 0).length;
      const averageROI = roiCount > 0 
        ? (boostROI + topPlacementROI + spotlightROI) / roiCount
        : roiMetrics.roi;

      return {
        summary: {
          totalPromotions,
          activePromotions,
          totalSpent: Math.round(totalSpent * 100) / 100,
          totalViews,
          totalClicks,
          totalMessages,
          averageROI: Math.round(averageROI * 100) / 100,
          ...roiMetrics
        },
        byType: {
          boost: boostAnalytics || {},
          top_placement: topPlacementAnalytics || {},
          spotlight: spotlightAnalytics || {}
        },
        period: {
          days,
          label: this.getPeriodLabel(days),
          ...this.formatDateRange(dateRange.startDate, dateRange.endDate)
        }
      };
    } catch (error) {
      console.error('Error getting overall analytics:', error);
      return null;
    }
  }

  /**
   * Get boost analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Boost analytics data
   */
  static async getBoostAnalytics(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get base analytics from BoostManagementService
      const baseAnalytics = await BoostManagementService.getBoostPerformanceAnalytics(userId, days);
      if (!baseAnalytics) {
        return null;
      }

      // Get boost records to calculate cost and metrics
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'DESC']]
      });

      // Calculate cost metrics
      const costMetrics = this.calculateCostMetrics(boosts);

      // For now, we'll estimate views/clicks/messages from boost data
      // In a real implementation, you'd query item views during boost period
      // For now, we'll use placeholder values or calculate from item data if available
      const totalViews = 0; // TODO: Query item views during boost periods
      const totalClicks = 0; // TODO: Query item clicks during boost periods
      const totalMessages = 0; // TODO: Query messages during boost periods

      // Calculate ROI metrics
      const roiMetrics = this.calculateROIFromMetrics(
        costMetrics.totalCost,
        totalViews,
        totalClicks,
        totalMessages,
        0 // Revenue tracking not implemented yet
      );

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        totalViews,
        totalClicks,
        totalMessages,
        0 // Conversions
      );

      // Calculate cost breakdown by item type
      const costByItemType = this.calculateCostByItemType(boosts.map(b => ({
        item_type: b.boost_type,
        cost: b.cost || 0
      })));

      return {
        ...baseAnalytics,
        summary: {
          ...baseAnalytics.summary,
          totalCost: costMetrics.totalCost,
          averageCost: costMetrics.averageCost,
          totalViews,
          totalClicks,
          totalMessages,
          ...roiMetrics,
          ...performanceMetrics
        },
        costMetrics,
        performanceMetrics,
        costByItemType,
        roiMetrics
      };
    } catch (error) {
      console.error('Error getting boost analytics:', error);
      return null;
    }
  }

  /**
   * Get top placement analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Top placement analytics data
   */
  static async getTopPlacementAnalytics(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get base analytics from TopPlacementService
      const baseAnalytics = await TopPlacementService.getTopPlacementAnalytics(userId, days);
      if (!baseAnalytics) {
        return null;
      }

      // Get placement records
      const placements = await TopPlacement.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'DESC']]
      });

      // Top placements don't have cost field yet, so we'll use 0 for now
      // In a real implementation, you'd calculate cost from subscription or pricing
      const costMetrics = {
        totalCost: 0, // TODO: Calculate from subscription plan or pricing
        averageCost: 0,
        promotionCount: placements.length,
        minCost: 0,
        maxCost: 0
      };

      // For now, we'll estimate views/clicks/messages
      // In a real implementation, you'd query item views during placement period
      const totalViews = 0; // TODO: Query item views during placement periods
      const totalClicks = 0; // TODO: Query item clicks during placement periods
      const totalMessages = 0; // TODO: Query messages during placement periods

      // Calculate ROI metrics (will be 0 if cost is 0)
      const roiMetrics = this.calculateROIFromMetrics(
        costMetrics.totalCost,
        totalViews,
        totalClicks,
        totalMessages,
        0 // Revenue tracking not implemented yet
      );

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        totalViews,
        totalClicks,
        totalMessages,
        0 // Conversions
      );

      // Calculate cost breakdown by item type
      const costByItemType = this.calculateCostByItemType(placements.map(p => ({
        item_type: p.item_type,
        cost: 0 // Cost not tracked yet
      })));

      return {
        ...baseAnalytics,
        summary: {
          ...baseAnalytics.summary,
          totalCost: costMetrics.totalCost,
          averageCost: costMetrics.averageCost,
          totalViews,
          totalClicks,
          totalMessages,
          ...roiMetrics,
          ...performanceMetrics
        },
        costMetrics,
        performanceMetrics,
        costByItemType,
        roiMetrics
      };
    } catch (error) {
      console.error('Error getting top placement analytics:', error);
      return null;
    }
  }

  /**
   * Get spotlight analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Spotlight analytics data
   */
  static async getSpotlightAnalytics(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get base analytics from SpotlightService
      const baseAnalytics = await SpotlightService.getSpotlightAnalytics(userId, days);
      if (!baseAnalytics) {
        return null;
      }

      // Get spotlight records
      const spotlights = await SpotlightSlot.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'DESC']]
      });

      // Spotlight slots don't have cost field yet, so we'll use 0 for now
      // In a real implementation, you'd calculate cost from subscription or pricing
      const costMetrics = {
        totalCost: 0, // TODO: Calculate from subscription plan or pricing
        averageCost: 0,
        promotionCount: spotlights.length,
        minCost: 0,
        maxCost: 0
      };

      // Spotlight already tracks impressions and clicks
      const totalViews = baseAnalytics.summary.totalImpressions || 0;
      const totalClicks = baseAnalytics.summary.totalClicks || 0;
      const totalMessages = 0; // TODO: Query messages during spotlight periods

      // Calculate ROI metrics (will be 0 if cost is 0)
      const roiMetrics = this.calculateROIFromMetrics(
        costMetrics.totalCost,
        totalViews,
        totalClicks,
        totalMessages,
        0 // Revenue tracking not implemented yet
      );

      // Calculate performance metrics (CTR already calculated in base analytics)
      const performanceMetrics = this.calculatePerformanceMetrics(
        totalViews,
        totalClicks,
        totalMessages,
        0 // Conversions
      );

      // Calculate cost breakdown by item type and slot type
      const costByItemType = this.calculateCostByItemType(spotlights.map(s => ({
        item_type: s.item_type,
        cost: 0 // Cost not tracked yet
      })));

      return {
        ...baseAnalytics,
        summary: {
          ...baseAnalytics.summary,
          totalCost: costMetrics.totalCost,
          averageCost: costMetrics.averageCost,
          totalViews,
          totalClicks,
          totalMessages,
          ...roiMetrics,
          ...performanceMetrics
        },
        costMetrics,
        performanceMetrics,
        costByItemType,
        roiMetrics
      };
    } catch (error) {
      console.error('Error getting spotlight analytics:', error);
      return null;
    }
  }

  /**
   * Get performance comparison across promotion types
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Performance comparison data
   */
  static async getPerformanceComparison(userId, days = 30) {
    try {
      // Get analytics for all promotion types
      const [boostAnalytics, topPlacementAnalytics, spotlightAnalytics] = await Promise.all([
        this.getBoostAnalytics(userId, days),
        this.getTopPlacementAnalytics(userId, days),
        this.getSpotlightAnalytics(userId, days)
      ]);

      // Extract key metrics from each type
      const boostMetrics = {
        type: 'boost',
        views: boostAnalytics?.summary?.totalViews || 0,
        clicks: boostAnalytics?.summary?.totalClicks || 0,
        messages: boostAnalytics?.summary?.totalMessages || 0,
        cost: boostAnalytics?.summary?.totalCost || 0,
        roi: boostAnalytics?.roiMetrics?.roi || 0,
        cpv: boostAnalytics?.roiMetrics?.cpv || 0,
        cpc: boostAnalytics?.roiMetrics?.cpc || 0,
        ctr: boostAnalytics?.performanceMetrics?.ctr || 0,
        count: boostAnalytics?.summary?.totalBoosts || 0
      };

      const topPlacementMetrics = {
        type: 'top_placement',
        views: topPlacementAnalytics?.summary?.totalViews || 0,
        clicks: topPlacementAnalytics?.summary?.totalClicks || 0,
        messages: topPlacementAnalytics?.summary?.totalMessages || 0,
        cost: topPlacementAnalytics?.summary?.totalCost || 0,
        roi: topPlacementAnalytics?.roiMetrics?.roi || 0,
        cpv: topPlacementAnalytics?.roiMetrics?.cpv || 0,
        cpc: topPlacementAnalytics?.roiMetrics?.cpc || 0,
        ctr: topPlacementAnalytics?.performanceMetrics?.ctr || 0,
        count: topPlacementAnalytics?.summary?.totalPlacements || 0
      };

      const spotlightMetrics = {
        type: 'spotlight',
        views: spotlightAnalytics?.summary?.totalImpressions || 0,
        clicks: spotlightAnalytics?.summary?.totalClicks || 0,
        messages: spotlightAnalytics?.summary?.totalMessages || 0,
        cost: spotlightAnalytics?.summary?.totalCost || 0,
        roi: spotlightAnalytics?.roiMetrics?.roi || 0,
        cpv: spotlightAnalytics?.roiMetrics?.cpv || 0,
        cpc: spotlightAnalytics?.roiMetrics?.cpc || 0,
        ctr: spotlightAnalytics?.summary?.clickThroughRate || 0,
        count: spotlightAnalytics?.summary?.totalSpotlights || 0
      };

      // Determine best performing type
      let bestPerforming = null;
      const allMetrics = [boostMetrics, topPlacementMetrics, spotlightMetrics];
      
      // Find best by ROI (if cost > 0) or CTR
      const withROI = allMetrics.filter(m => m.cost > 0 && m.roi > 0);
      if (withROI.length > 0) {
        bestPerforming = withROI.reduce((best, current) => 
          current.roi > best.roi ? current : best
        );
      } else {
        // Fall back to CTR if no ROI data
        bestPerforming = allMetrics.reduce((best, current) => 
          current.ctr > best.ctr ? current : best
        );
      }

      // Generate recommendations
      const recommendations = [];
      if (bestPerforming) {
        if (bestPerforming.type === 'boost' && bestPerforming.roi > 0) {
          recommendations.push('Boost promotions show strong ROI - consider increasing budget');
        } else if (bestPerforming.type === 'spotlight' && bestPerforming.ctr > 5) {
          recommendations.push('Spotlight promotions have excellent CTR - expand to more items');
        } else if (bestPerforming.type === 'top_placement') {
          recommendations.push('Top placement is performing well - consider longer durations');
        }
      }

      // Add cost efficiency recommendations
      const costEfficient = allMetrics
        .filter(m => m.cost > 0 && m.views > 0)
        .sort((a, b) => a.cpv - b.cpv)[0];
      
      if (costEfficient && costEfficient.type !== bestPerforming?.type) {
        recommendations.push(`${costEfficient.type} has the lowest cost per view`);
      }

      return {
        comparison: {
          boost: boostMetrics,
          top_placement: topPlacementMetrics,
          spotlight: spotlightMetrics
        },
        bestPerforming: bestPerforming ? {
          type: bestPerforming.type,
          metrics: bestPerforming,
          reason: bestPerforming.roi > 0 
            ? `Highest ROI: ${bestPerforming.roi.toFixed(2)}%`
            : `Highest CTR: ${bestPerforming.ctr.toFixed(2)}%`
        } : null,
        recommendations
      };
    } catch (error) {
      console.error('Error getting performance comparison:', error);
      return null;
    }
  }

  /**
   * Get period comparison (current vs previous period)
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Period comparison data
   */
  static async getPeriodComparison(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get current period analytics
      const currentAnalytics = await this.getOverallAnalytics(userId, days);
      
      // Calculate previous period (same duration, before current period)
      const previousEndDate = new Date(dateRange.startDate);
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      
      // Get previous period data by querying promotions directly
      // We'll calculate metrics manually since getOverallAnalytics uses current date
      const [prevBoosts, prevPlacements, prevSpotlights] = await Promise.all([
        PromotionalBoost.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.between]: [previousStartDate, previousEndDate] }
          }
        }),
        TopPlacement.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.between]: [previousStartDate, previousEndDate] }
          }
        }),
        SpotlightSlot.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.between]: [previousStartDate, previousEndDate] }
          }
        })
      ]);

      // Calculate previous period metrics
      const previousTotalPromotions = prevBoosts.length + prevPlacements.length + prevSpotlights.length;
      const previousTotalSpent = this.calculateTotalCost(prevBoosts);
      const previousTotalViews = prevSpotlights.reduce((sum, s) => sum + (s.impressions || 0), 0);
      const previousTotalClicks = prevSpotlights.reduce((sum, s) => sum + (s.clicks || 0), 0);
      const previousTotalMessages = 0; // TODO: Track messages
      
      const previousAnalytics = {
        summary: {
          totalPromotions: previousTotalPromotions,
          totalSpent: previousTotalSpent,
          totalViews: previousTotalViews,
          totalClicks: previousTotalClicks,
          totalMessages: previousTotalMessages,
          averageROI: previousTotalSpent > 0 ? 0 : 0 // Simplified
        }
      };
      
      if (!currentAnalytics || !previousAnalytics) {
        return null;
      }

      const currentSummary = currentAnalytics.summary || {};
      const previousSummary = previousAnalytics.summary || {};

      // Calculate changes
      const calculateChange = (current, previous) => {
        const value = (current || 0) - (previous || 0);
        const percentage = previous > 0 ? ((value / previous) * 100) : (current > 0 ? 100 : 0);
        return {
          value: Math.round(value * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          trend: percentage > 5 ? 'increasing' : percentage < -5 ? 'decreasing' : 'stable'
        };
      };

      const changes = {
        totalPromotions: calculateChange(currentSummary.totalPromotions, previousSummary.totalPromotions),
        totalSpent: calculateChange(currentSummary.totalSpent, previousSummary.totalSpent),
        totalViews: calculateChange(currentSummary.totalViews, previousSummary.totalViews),
        totalClicks: calculateChange(currentSummary.totalClicks, previousSummary.totalClicks),
        totalMessages: calculateChange(currentSummary.totalMessages, previousSummary.totalMessages),
        averageROI: calculateChange(currentSummary.averageROI, previousSummary.averageROI)
      };

      // Determine overall trend
      const positiveChanges = Object.values(changes).filter(c => c.trend === 'increasing').length;
      const negativeChanges = Object.values(changes).filter(c => c.trend === 'decreasing').length;
      
      let overallTrend = 'stable';
      if (positiveChanges > negativeChanges) overallTrend = 'improving';
      else if (negativeChanges > positiveChanges) overallTrend = 'declining';

      // Find best and worst metrics
      const metricChanges = Object.entries(changes)
        .filter(([key]) => key !== 'totalPromotions')
        .map(([key, value]) => ({ metric: key, ...value }));
      
      const bestMetric = metricChanges
        .filter(m => m.trend === 'increasing')
        .sort((a, b) => b.percentage - a.percentage)[0];
      
      const worstMetric = metricChanges
        .filter(m => m.trend === 'decreasing')
        .sort((a, b) => a.percentage - b.percentage)[0];

      return {
        currentPeriod: {
          days,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          metrics: currentSummary
        },
        previousPeriod: {
          days,
          startDate: previousStartDate,
          endDate: previousEndDate,
          metrics: previousSummary
        },
        changes,
        summary: {
          overallTrend,
          bestMetric: bestMetric?.metric || null,
          worstMetric: worstMetric?.metric || null
        }
      };
    } catch (error) {
      console.error('Error getting period comparison:', error);
      return null;
    }
  }

  /**
   * Get item type comparison
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Item type comparison data
   */
  static async getItemTypeComparison(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get all promotions grouped by item type
      const [boosts, placements, spotlights] = await Promise.all([
        PromotionalBoost.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          }
        }),
        TopPlacement.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          }
        }),
        SpotlightSlot.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          }
        })
      ]);

      // Group by item type
      const itemTypeData = {};
      
      // Process boosts
      boosts.forEach(boost => {
        const itemType = boost.boost_type;
        if (!itemTypeData[itemType]) {
          itemTypeData[itemType] = {
            count: 0,
            cost: 0,
            views: 0,
            clicks: 0,
            messages: 0
          };
        }
        itemTypeData[itemType].count++;
        itemTypeData[itemType].cost += parseFloat(boost.cost) || 0;
      });

      // Process placements
      placements.forEach(placement => {
        const itemType = placement.item_type;
        if (!itemTypeData[itemType]) {
          itemTypeData[itemType] = {
            count: 0,
            cost: 0,
            views: 0,
            clicks: 0,
            messages: 0
          };
        }
        itemTypeData[itemType].count++;
        // Cost not tracked yet
      });

      // Process spotlights
      spotlights.forEach(spotlight => {
        const itemType = spotlight.item_type;
        if (!itemTypeData[itemType]) {
          itemTypeData[itemType] = {
            count: 0,
            cost: 0,
            views: 0,
            clicks: 0,
            messages: 0
          };
        }
        itemTypeData[itemType].count++;
        itemTypeData[itemType].views += spotlight.impressions || 0;
        itemTypeData[itemType].clicks += spotlight.clicks || 0;
        // Cost not tracked yet
      });

      // Calculate metrics per item type
      const byItemType = {};
      Object.keys(itemTypeData).forEach(itemType => {
        const data = itemTypeData[itemType];
        const roiMetrics = this.calculateROIFromMetrics(
          data.cost,
          data.views,
          data.clicks,
          data.messages,
          0
        );
        
        byItemType[itemType] = {
          count: data.count,
          cost: data.cost,
          views: data.views,
          clicks: data.clicks,
          messages: data.messages,
          ...roiMetrics
        };
      });

      // Find best performing item type
      let bestPerforming = null;
      const itemTypes = Object.entries(byItemType);
      
      if (itemTypes.length > 0) {
        // Find by ROI if available, otherwise by CTR
        const withROI = itemTypes.filter(([_, data]) => data.cost > 0 && data.roi > 0);
        if (withROI.length > 0) {
          bestPerforming = withROI.reduce((best, [type, data]) => 
            data.roi > best[1].roi ? [type, data] : best
          );
        } else {
          // Fall back to CTR
          bestPerforming = itemTypes.reduce((best, [type, data]) => 
            data.ctr > best[1].ctr ? [type, data] : best
          );
        }
      }

      // Generate recommendations
      const recommendations = [];
      if (bestPerforming) {
        const [itemType, metrics] = bestPerforming;
        recommendations.push(`${itemType} items show the best performance - focus promotions here`);
        
        if (metrics.ctr > 5) {
          recommendations.push(`High CTR (${metrics.ctr.toFixed(2)}%) for ${itemType} - consider increasing budget`);
        }
      }

      return {
        byItemType,
        bestPerforming: bestPerforming ? {
          itemType: bestPerforming[0],
          metrics: bestPerforming[1]
        } : null,
        recommendations
      };
    } catch (error) {
      console.error('Error getting item type comparison:', error);
      return null;
    }
  }

  /**
   * Get recent promotions with metrics
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent promotions to return (default: 10)
   * @returns {Array} Recent promotions with metrics
   */
  static async getRecentPromotions(userId, limit = 10) {
    try {
      const dateRange = this.calculateDateRange(90); // Look back 90 days
      
      // Get recent promotions from all types
      const [boosts, placements, spotlights] = await Promise.all([
        PromotionalBoost.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          },
          order: [['created_at', 'DESC']],
          limit: Math.ceil(limit / 3)
        }),
        TopPlacement.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          },
          order: [['created_at', 'DESC']],
          limit: Math.ceil(limit / 3)
        }),
        SpotlightSlot.findAll({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: dateRange.startDate }
          },
          order: [['created_at', 'DESC']],
          limit: Math.ceil(limit / 3)
        })
      ]);

      // Helper function to fetch item details
      const fetchItemDetails = async (itemType, itemId) => {
        try {
          let item = null;
          let itemName = '';
          let itemImage = null;

          console.log(`🔍 Fetching item details: itemType=${itemType}, itemId=${itemId}`);

          switch (itemType) {
            case 'product':
              item = await Product.findByPk(itemId, {
                attributes: ['id', 'name', 'title', 'images']
              });
              if (item) {
                // Try both name and title fields
                itemName = item.name || item.title || '';
                itemImage = item.images && item.images.length > 0 ? item.images[0] : null;
                console.log(`✅ Product found: name="${itemName}", hasImage=${itemImage != null}, images.length=${item.images ? item.images.length : 0}`);
              } else {
                console.log(`⚠️ Product not found for ID: ${itemId}`);
              }
              break;
            case 'auction':
              item = await Auction.findByPk(itemId, {
                attributes: ['id', 'title', 'images']
              });
              if (item) {
                itemName = item.title || '';
                itemImage = item.images && item.images.length > 0 ? item.images[0] : null;
                console.log(`✅ Auction found: title="${itemName}", hasImage=${itemImage != null}`);
              } else {
                console.log(`⚠️ Auction not found for ID: ${itemId}`);
              }
              break;
            case 'group_buy':
              item = await GroupBuy.findByPk(itemId, {
                attributes: ['id', 'title', 'product_name', 'product_image']
              });
              if (item) {
                itemName = item.title || item.product_name || '';
                // product_image is JSON array, get first image
                if (item.product_image) {
                  const images = typeof item.product_image === 'string' 
                    ? JSON.parse(item.product_image) 
                    : item.product_image;
                  itemImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
                }
                console.log(`✅ GroupBuy found: title="${itemName}", hasImage=${itemImage != null}`);
              } else {
                console.log(`⚠️ GroupBuy not found for ID: ${itemId}`);
              }
              break;
            case 'swap_deal':
              item = await SwapDeal.findByPk(itemId, {
                attributes: ['id', 'title', 'images']
              });
              if (item) {
                itemName = item.title || '';
                itemImage = item.images && item.images.length > 0 ? item.images[0] : null;
                console.log(`✅ SwapDeal found: title="${itemName}", hasImage=${itemImage != null}`);
              } else {
                console.log(`⚠️ SwapDeal not found for ID: ${itemId}`);
              }
              break;
            case 'distress_sale':
              // Distress sales are stored as products with is_distress_sale flag
              item = await Product.findByPk(itemId, {
                attributes: ['id', 'name', 'title', 'images']
              });
              if (item) {
                // Try both name and title fields
                itemName = item.name || item.title || '';
                itemImage = item.images && item.images.length > 0 ? item.images[0] : null;
                console.log(`✅ DistressSale (Product) found: name="${itemName}", hasImage=${itemImage != null}`);
              } else {
                console.log(`⚠️ DistressSale (Product) not found for ID: ${itemId}`);
              }
              break;
          }

          console.log(`📦 Returning item details: itemName="${itemName}", itemImage=${itemImage ? 'exists' : 'null'}`);
          return { itemName, itemImage };
        } catch (error) {
          console.error(`❌ Error fetching item details for ${itemType} ${itemId}:`, error);
          return { itemName: '', itemImage: null };
        }
      };

      // Format promotions with metrics
      const recentPromotions = [];

      // Format boosts
      for (const boost of boosts) {
        const itemDetails = await fetchItemDetails(boost.boost_type, boost.target_id);
        const endDate = boost.end_time || boost.endTime;
        
        recentPromotions.push({
          id: boost.id,
          type: 'boost',
          itemType: boost.boost_type,
          itemId: boost.target_id,
          itemName: itemDetails.itemName,
          itemImage: itemDetails.itemImage,
          createdAt: boost.created_at || boost.createdAt,
          endDate: endDate,
          status: boost.status,
          cost: parseFloat(boost.cost) || 0,
          duration: boost.boost_duration_hours,
          views: 0,
          clicks: 0,
          messages: 0
        });
      }

      // Format placements
      for (const placement of placements) {
        const itemDetails = await fetchItemDetails(placement.item_type, placement.item_id);
        // Calculate endDate from createdAt + duration_days
        const createdAt = new Date(placement.created_at || placement.createdAt);
        const endDate = new Date(createdAt);
        endDate.setDate(endDate.getDate() + (placement.duration_days || 0));
        
        recentPromotions.push({
          id: placement.id,
          type: 'top_placement',
          itemType: placement.item_type,
          itemId: placement.item_id,
          itemName: itemDetails.itemName,
          itemImage: itemDetails.itemImage,
          createdAt: placement.created_at || placement.createdAt,
          endDate: endDate.toISOString(),
          status: placement.status,
          cost: 0,
          duration: placement.duration_days,
          views: 0,
          clicks: 0,
          messages: 0
        });
      }

      // Format spotlights
      for (const spotlight of spotlights) {
        const itemDetails = await fetchItemDetails(spotlight.item_type, spotlight.item_id);
        // Calculate endDate from createdAt + duration_days
        const createdAt = new Date(spotlight.created_at || spotlight.createdAt);
        const endDate = new Date(createdAt);
        endDate.setDate(endDate.getDate() + (spotlight.duration_days || 0));
        
        recentPromotions.push({
          id: spotlight.id,
          type: 'spotlight',
          itemType: spotlight.item_type,
          itemId: spotlight.item_id,
          itemName: itemDetails.itemName,
          itemImage: itemDetails.itemImage,
          createdAt: spotlight.created_at || spotlight.createdAt,
          endDate: endDate.toISOString(),
          status: spotlight.status,
          cost: 0,
          duration: spotlight.duration_days,
          views: spotlight.impressions || 0,
          clicks: spotlight.clicks || 0,
          messages: 0
        });
      }

      // Sort by creation date (most recent first) and limit
      recentPromotions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      return recentPromotions.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent promotions:', error);
      return [];
    }
  }

  /**
   * Get boost time-series data
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Time-series data for boosts
   */
  static async getBoostTimeSeries(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get boosts for the date range
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'ASC']]
      });

      // Group by date
      const grouped = this.groupByDate(boosts, 'created_at');

      // Aggregate daily metrics
      const dailyCost = this.aggregateDailyMetrics(grouped, (b) => parseFloat(b.cost) || 0);
      const dailyCount = this.aggregateDailyMetrics(grouped, () => 1);
      
      // Fill missing dates
      const costData = this.fillMissingDates(dailyCost, dateRange.startDate, dateRange.endDate);
      const countData = this.fillMissingDates(dailyCount, dateRange.startDate, dateRange.endDate);

      // Format for charts
      const dates = costData.map(d => d.date);
      const cost = costData.map(d => d.value);
      const count = countData.map(d => d.value);
      
      // Views, clicks, messages are not tracked yet (TODO)
      const views = dates.map(() => 0);
      const clicks = dates.map(() => 0);
      const messages = dates.map(() => 0);

      return {
        dates,
        cost,
        count,
        views,
        clicks,
        messages
      };
    } catch (error) {
      console.error('Error getting boost time-series data:', error);
      return null;
    }
  }

  /**
   * Get top placement time-series data
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Time-series data for top placements
   */
  static async getTopPlacementTimeSeries(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get placements for the date range
      const placements = await TopPlacement.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'ASC']]
      });

      // Group by date
      const grouped = this.groupByDate(placements, 'created_at');

      // Aggregate daily metrics
      const dailyCount = this.aggregateDailyMetrics(grouped, () => 1);
      // Cost not tracked yet (TODO)
      const dailyCost = this.aggregateDailyMetrics(grouped, () => 0);
      
      // Fill missing dates
      const costData = this.fillMissingDates(dailyCost, dateRange.startDate, dateRange.endDate);
      const countData = this.fillMissingDates(dailyCount, dateRange.startDate, dateRange.endDate);

      // Format for charts
      const dates = costData.map(d => d.date);
      const cost = costData.map(d => d.value);
      const count = countData.map(d => d.value);
      
      // Views, clicks, messages are not tracked yet (TODO)
      const views = dates.map(() => 0);
      const clicks = dates.map(() => 0);
      const messages = dates.map(() => 0);

      return {
        dates,
        cost,
        count,
        views,
        clicks,
        messages
      };
    } catch (error) {
      console.error('Error getting top placement time-series data:', error);
      return null;
    }
  }

  /**
   * Get spotlight time-series data
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Time-series data for spotlights
   */
  static async getSpotlightTimeSeries(userId, days = 30) {
    try {
      const dateRange = this.calculateDateRange(days);
      
      // Get spotlights for the date range
      const spotlights = await SpotlightSlot.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: dateRange.startDate }
        },
        order: [['created_at', 'ASC']]
      });

      // Group by date
      const grouped = this.groupByDate(spotlights, 'created_at');

      // Aggregate daily metrics
      const dailyCount = this.aggregateDailyMetrics(grouped, () => 1);
      const dailyImpressions = this.aggregateDailyMetrics(grouped, (s) => s.impressions || 0);
      const dailyClicks = this.aggregateDailyMetrics(grouped, (s) => s.clicks || 0);
      // Cost not tracked yet (TODO)
      const dailyCost = this.aggregateDailyMetrics(grouped, () => 0);
      
      // Fill missing dates
      const costData = this.fillMissingDates(dailyCost, dateRange.startDate, dateRange.endDate);
      const countData = this.fillMissingDates(dailyCount, dateRange.startDate, dateRange.endDate);
      const impressionsData = this.fillMissingDates(dailyImpressions, dateRange.startDate, dateRange.endDate);
      const clicksData = this.fillMissingDates(dailyClicks, dateRange.startDate, dateRange.endDate);

      // Format for charts
      const dates = costData.map(d => d.date);
      const cost = costData.map(d => d.value);
      const count = countData.map(d => d.value);
      const impressions = impressionsData.map(d => d.value);
      const clicks = clicksData.map(d => d.value);
      
      // Calculate CTR per day
      const ctr = dates.map((_, index) => {
        const imp = impressions[index];
        const clk = clicks[index];
        return imp > 0 ? (clk / imp) * 100 : 0;
      });
      
      // Messages are not tracked yet (TODO)
      const messages = dates.map(() => 0);

      return {
        dates,
        cost,
        count,
        impressions,
        clicks,
        ctr,
        messages
      };
    } catch (error) {
      console.error('Error getting spotlight time-series data:', error);
      return null;
    }
  }

  /**
   * Get overall time-series data (all promotion types combined)
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Combined time-series data
   */
  static async getOverallTimeSeries(userId, days = 30) {
    try {
      // Get time-series data from all types
      const [boostSeries, topPlacementSeries, spotlightSeries] = await Promise.all([
        this.getBoostTimeSeries(userId, days),
        this.getTopPlacementTimeSeries(userId, days),
        this.getSpotlightTimeSeries(userId, days)
      ]);

      if (!boostSeries || !topPlacementSeries || !spotlightSeries) {
        return null;
      }

      // Use boost dates as base (all should have same dates after filling)
      const dates = boostSeries.dates;

      // Combine metrics
      const cost = dates.map((_, index) => 
        (boostSeries.cost[index] || 0) +
        (topPlacementSeries.cost[index] || 0) +
        (spotlightSeries.cost[index] || 0)
      );

      const count = dates.map((_, index) => 
        (boostSeries.count[index] || 0) +
        (topPlacementSeries.count[index] || 0) +
        (spotlightSeries.count[index] || 0)
      );

      const views = dates.map((_, index) => 
        (boostSeries.views[index] || 0) +
        (topPlacementSeries.views[index] || 0) +
        (spotlightSeries.impressions[index] || 0) // Spotlight uses impressions
      );

      const clicks = dates.map((_, index) => 
        (boostSeries.clicks[index] || 0) +
        (topPlacementSeries.clicks[index] || 0) +
        (spotlightSeries.clicks[index] || 0)
      );

      const messages = dates.map((_, index) => 
        (boostSeries.messages[index] || 0) +
        (topPlacementSeries.messages[index] || 0) +
        (spotlightSeries.messages[index] || 0)
      );

      return {
        dates,
        cost,
        count,
        views,
        clicks,
        messages,
        byType: {
          boost: boostSeries,
          top_placement: topPlacementSeries,
          spotlight: spotlightSeries
        }
      };
    } catch (error) {
      console.error('Error getting overall time-series data:', error);
      return null;
    }
  }

  /**
   * Get time-series data for charts
   * @param {string} userId - User ID
   * @param {string} promotionType - Promotion type ('boost', 'top_placement', 'spotlight', 'all')
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Object} Time-series data
   */
  static async getTimeSeriesData(userId, promotionType = 'all', days = 30) {
    try {
      switch (promotionType.toLowerCase()) {
        case 'boost':
          return await this.getBoostTimeSeries(userId, days);
        case 'top_placement':
        case 'topplacement':
          return await this.getTopPlacementTimeSeries(userId, days);
        case 'spotlight':
          return await this.getSpotlightTimeSeries(userId, days);
        case 'all':
        default:
          return await this.getOverallTimeSeries(userId, days);
      }
    } catch (error) {
      console.error('Error getting time-series data:', error);
      return null;
    }
  }
}

module.exports = PromotionAnalyticsService;

