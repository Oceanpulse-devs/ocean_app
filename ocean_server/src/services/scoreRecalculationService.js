const VisibilityScoreService = require('./visibilityScoreService');
const { Product, Auction, SwapDeal, GroupBuy } = require('../../models');
const { Op } = require('sequelize');

/**
 * Score Recalculation Service
 * 
 * Handles batch recalculation of visibility scores for all items
 */
class ScoreRecalculationService {

  /**
   * Recalculate scores for all active items of a specific type
   * @param {string} itemType - Item type
   * @param {Object} options - Options (limit, offset, batchSize)
   * @returns {Object} Recalculation results
   */
  static async recalculateScoresForType(itemType, options = {}) {
    try {
      const { limit = null, offset = 0, batchSize = 100 } = options;

      const modelMap = {
        'product': Product,
        'auction': Auction,
        'swap_deal': SwapDeal,
        'group_buy': GroupBuy,
        'distress_sale': Product // Distress sales use Product model
      };

      const Model = modelMap[itemType];
      if (!Model) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Build where clause for active items
      const whereClause = {
        status: { [Op.ne]: 'inactive' }
      };

      // For products, also check isAvailable
      if (itemType === 'product' || itemType === 'distress_sale') {
        whereClause.isAvailable = true;
      }

      // Get total count
      const totalCount = await Model.count({ where: whereClause });

      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors = [];

      // Process in batches
      const maxItems = limit || totalCount;
      let currentOffset = offset;

      while (processed < maxItems) {
        const items = await Model.findAll({
          where: whereClause,
          limit: Math.min(batchSize, maxItems - processed),
          offset: currentOffset,
          attributes: ['id']
        });

        if (items.length === 0) {
          break;
        }

        // Process each item
        for (const item of items) {
          try {
            await VisibilityScoreService.calculateAndSaveScore(itemType, item.id);
            successful++;
          } catch (error) {
            failed++;
            errors.push({
              itemType,
              itemId: item.id,
              error: error.message
            });
            console.error(`Error recalculating score for ${itemType} ${item.id}:`, error);
          }
          processed++;
        }

        currentOffset += items.length;

        // Log progress
        if (processed % 100 === 0) {
          console.log(`Recalculated ${processed}/${maxItems} ${itemType} scores...`);
        }
      }

      return {
        itemType,
        totalCount,
        processed,
        successful,
        failed,
        errors: errors.slice(0, 10) // Limit error details
      };
    } catch (error) {
      console.error(`Error recalculating scores for ${itemType}:`, error);
      throw error;
    }
  }

  /**
   * Recalculate scores for all active items
   * @param {Object} options - Options (itemTypes, batchSize)
   * @returns {Object} Overall recalculation results
   */
  static async recalculateAllScores(options = {}) {
    try {
      const { itemTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'], batchSize = 100 } = options;

      const results = {
        startTime: new Date(),
        itemTypes: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        errors: []
      };

      // Process each item type
      for (const itemType of itemTypes) {
        console.log(`Starting recalculation for ${itemType}...`);
        
        const typeResult = await this.recalculateScoresForType(itemType, { batchSize });
        
        results.itemTypes.push(typeResult);
        results.totalProcessed += typeResult.processed;
        results.totalSuccessful += typeResult.successful;
        results.totalFailed += typeResult.failed;
        results.errors.push(...typeResult.errors);

        console.log(`Completed ${itemType}: ${typeResult.successful}/${typeResult.processed} successful`);
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`Score recalculation complete: ${results.totalSuccessful}/${results.totalProcessed} successful in ${results.duration}ms`);

      return results;
    } catch (error) {
      console.error('Error in recalculateAllScores:', error);
      throw error;
    }
  }

  /**
   * Recalculate scores for items in a specific category
   * @param {string} category - Category name
   * @param {Object} options - Options
   * @returns {Object} Recalculation results
   */
  static async recalculateScoresForCategory(category, options = {}) {
    try {
      const { itemTypes = ['product', 'auction', 'swap_deal', 'group_buy'], batchSize = 100 } = options;

      const results = {
        category,
        startTime: new Date(),
        itemTypes: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0
      };

      for (const itemType of itemTypes) {
        const modelMap = {
          'product': Product,
          'auction': Auction,
          'swap_deal': SwapDeal,
          'group_buy': GroupBuy
        };

        const Model = modelMap[itemType];
        if (!Model) continue;

        const whereClause = {
          category: category,
          status: { [Op.ne]: 'inactive' }
        };

        if (itemType === 'product') {
          whereClause.isAvailable = true;
        }

        const items = await Model.findAll({
          where: whereClause,
          attributes: ['id']
        });

        let successful = 0;
        let failed = 0;

        for (const item of items) {
          try {
            await VisibilityScoreService.calculateAndSaveScore(itemType, item.id);
            successful++;
          } catch (error) {
            failed++;
            console.error(`Error recalculating score for ${itemType} ${item.id}:`, error);
          }
        }

        results.itemTypes.push({
          itemType,
          processed: items.length,
          successful,
          failed
        });

        results.totalProcessed += items.length;
        results.totalSuccessful += successful;
        results.totalFailed += failed;
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      return results;
    } catch (error) {
      console.error(`Error recalculating scores for category ${category}:`, error);
      throw error;
    }
  }
}

module.exports = ScoreRecalculationService;

