const BoostManagementService = require('./boostManagementService');
const { PromotionalBoost } = require('../../models');
const { Op } = require('sequelize');
const promotionGatingService = require('./promotionGatingService');

/**
 * Auto-Reboost Service
 * 
 * Handles automatic reboosting of expired boosts based on user preferences
 */
class AutoReboostService {

  /**
   * Process auto-reboost for a single boost
   * @param {Object} boost - Boost to reboost
   * @returns {Object|null} New boost created or null if failed
   */
  static async processAutoReboost(boost) {
    try {
      const {
        user_id: userId,
        subscription_id: subscriptionId,
        boost_type: boostType,
        target_id: targetId,
        boost_duration_hours: durationHours,
        reboost_interval_hours: intervalHours,
        location_target: locationTarget,
        boost_package: boostPackage,
        is_free: isFree
      } = boost;

      // Check if user still has active subscription
      const subscription = await promotionGatingService.getUserSubscription(userId);
      if (!subscription) {
        console.log(`Skipping auto-reboost for boost ${boost.id}: User ${userId} has no active subscription`);
        // Disable auto-reboost for this boost
        await boost.update({ auto_reboost: false });
        return null;
      }

      // Check if user still has boost eligibility
      const eligibility = await promotionGatingService.checkBoostEligibility(
        userId,
        boostType,
        durationHours,
        isFree
      );

      if (!eligibility.eligible) {
        console.log(`Skipping auto-reboost for boost ${boost.id}: ${eligibility.reason}`);
        // Disable auto-reboost for this boost
        await boost.update({ auto_reboost: false });
        return null;
      }

      // Create new boost with same settings
      const newBoost = await BoostManagementService.createBoostWithOptions(
        userId,
        boostType,
        targetId,
        {
          durationHours: durationHours,
          boostPackage: boostPackage,
          autoReboost: true, // Keep auto-reboost enabled
          reboostIntervalHours: intervalHours,
          locationTarget: locationTarget,
          isFree: isFree,
          subscriptionId: subscription.id,
          reason: `Auto-reboost from boost ${boost.id}`
        }
      );

      console.log(`Auto-reboosted boost ${boost.id} -> new boost ${newBoost.id}`);
      return newBoost;
    } catch (error) {
      console.error(`Error processing auto-reboost for boost ${boost.id}:`, error);
      // Disable auto-reboost on error to prevent infinite retries
      try {
        await boost.update({ auto_reboost: false });
      } catch (updateError) {
        console.error('Error disabling auto-reboost:', updateError);
      }
      return null;
    }
  }

  /**
   * Process all eligible auto-reboosts
   * @returns {Object} Processing results
   */
  static async processAllAutoReboosts() {
    try {
      const boostsToReboost = await BoostManagementService.getBoostsForAutoReboost();
      
      console.log(`Found ${boostsToReboost.length} boosts eligible for auto-reboost`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        newBoosts: []
      };

      for (const boost of boostsToReboost) {
        results.processed++;
        
        const newBoost = await this.processAutoReboost(boost);
        
        if (newBoost) {
          results.successful++;
          results.newBoosts.push(newBoost.id);
        } else {
          results.skipped++;
        }
      }

      console.log(`Auto-reboost processing complete:`, results);
      return results;
    } catch (error) {
      console.error('Error processing auto-reboosts:', error);
      return {
        processed: 0,
        successful: 0,
        failed: 1,
        skipped: 0,
        error: error.message
      };
    }
  }

  /**
   * Enable auto-reboost for a boost
   * @param {string} boostId - Boost ID
   * @param {string} userId - User ID
   * @param {number} intervalHours - Reboost interval (6, 12, or 24)
   * @returns {boolean} Success status
   */
  static async enableAutoReboost(boostId, userId, intervalHours = 24) {
    try {
      // Validate interval
      if (![6, 12, 24].includes(intervalHours)) {
        throw new Error('Reboost interval must be 6, 12, or 24 hours');
      }

      // Check eligibility
      const eligibility = await promotionGatingService.checkAutoReboostEligibility(userId);
      if (!eligibility.eligible) {
        throw new Error(eligibility.reason);
      }

      const boost = await PromotionalBoost.findOne({
        where: {
          id: boostId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!boost) {
        throw new Error('Active boost not found');
      }

      await boost.update({
        auto_reboost: true,
        reboost_interval_hours: intervalHours
      });

      console.log(`Enabled auto-reboost for boost ${boostId} with interval ${intervalHours} hours`);
      return true;
    } catch (error) {
      console.error('Error enabling auto-reboost:', error);
      throw error;
    }
  }

  /**
   * Disable auto-reboost for a boost
   * @param {string} boostId - Boost ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async disableAutoReboost(boostId, userId) {
    try {
      const boost = await PromotionalBoost.findOne({
        where: {
          id: boostId,
          user_id: userId
        }
      });

      if (!boost) {
        throw new Error('Boost not found');
      }

      await boost.update({
        auto_reboost: false,
        reboost_interval_hours: null
      });

      console.log(`Disabled auto-reboost for boost ${boostId}`);
      return true;
    } catch (error) {
      console.error('Error disabling auto-reboost:', error);
      throw error;
    }
  }

  /**
   * Get boosts with auto-reboost enabled for a user
   * @param {string} userId - User ID
   * @returns {Array} Boosts with auto-reboost
   */
  static async getUserAutoReboostBoosts(userId) {
    try {
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          auto_reboost: true
        },
        order: [['end_time', 'ASC']]
      });

      return boosts;
    } catch (error) {
      console.error('Error getting user auto-reboost boosts:', error);
      return [];
    }
  }
}

module.exports = AutoReboostService;

