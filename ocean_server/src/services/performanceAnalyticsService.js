const db = require('../../models');
const { Op } = require('sequelize');

// Helper function to create notifications
const createNotification = async (userId, title, message, type = 'info', category = 'system', metadata = null) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type,
      category,
      metadata
    });
    console.log(`📧 Performance analytics notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating performance analytics notification:', error);
  }
};

// Analyze user engagement metrics
const analyzeUserEngagement = async () => {
  try {
    console.log('📊 Analyzing user engagement metrics...');
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get engagement metrics
    const metrics = await Promise.all([
      // Posts created in last week
      db.Post.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Products created in last week
      db.Product.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Group buys created in last week
      db.GroupBuy.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Swap deals created in last week
      db.SwapDeal.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Active users in last week
      db.UserTable.count({
        where: {
          lastActive: { [Op.gte]: oneWeekAgo },
          accountStatus: 'active'
        }
      }),
      
      // Total users
      db.UserTable.count({
        where: {
          accountStatus: 'active'
        }
      })
    ]);

    const [postsCount, productsCount, groupBuysCount, swapDealsCount, activeUsersCount, totalUsersCount] = metrics;

    // Calculate engagement rate
    const engagementRate = totalUsersCount > 0 ? (activeUsersCount / totalUsersCount) * 100 : 0;

    // Send performance insights to admins if engagement is low
    if (engagementRate < 20) { // Less than 20% engagement
      const adminUsers = await db.UserTable.findAll({
        where: {
          accountType: 'admin'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'Low User Engagement Alert',
          `User engagement rate is ${engagementRate.toFixed(1)}% (${activeUsersCount}/${totalUsersCount} active users). Consider implementing engagement strategies.`,
          'warning',
          'performance_analytics',
          {
            type: 'performance_engagement',
            engagementRate: engagementRate,
            activeUsersCount: activeUsersCount,
            totalUsersCount: totalUsersCount,
            postsCount: postsCount,
            productsCount: productsCount,
            groupBuysCount: groupBuysCount,
            swapDealsCount: swapDealsCount,
            analyzedAt: new Date()
          }
        );
      }
    }

    return {
      engagementRate,
      activeUsersCount,
      totalUsersCount,
      postsCount,
      productsCount,
      groupBuysCount,
      swapDealsCount,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing user engagement:', error);
    return null;
  }
};

// Analyze marketplace performance
const analyzeMarketplacePerformance = async () => {
  try {
    console.log('📈 Analyzing marketplace performance...');
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get marketplace metrics - FIXED: Removed incorrect promise addition
    const metrics = await Promise.all([
      // Successful group buys
      db.GroupBuy.count({
        where: {
          status: 'successful',
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Completed swap deals
      db.SwapDeal.count({
        where: {
          status: 'completed',
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      
      // Fulfilled buyer needs
      db.BuyerNeed.count({
        where: {
          status: 'fulfilled',
          created_at: { [Op.gte]: oneWeekAgo }
        }
      })
    ]);

    const [successfulGroupBuys, completedSwapDeals, fulfilledBuyerNeeds] = metrics;

    // FIXED: Calculate totalTransactions properly by summing the successful transactions
    const totalTransactions = successfulGroupBuys + completedSwapDeals + fulfilledBuyerNeeds;

    // Calculate total attempts (all created in the last week) - OPTIMIZED: Using Promise.all
    const [groupBuyAttempts, swapDealAttempts, buyerNeedAttempts] = await Promise.all([
      db.GroupBuy.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      db.SwapDeal.count({
        where: {
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      }),
      db.BuyerNeed.count({
        where: {
          created_at: { [Op.gte]: oneWeekAgo }
        }
      })
    ]);

    const totalAttempts = groupBuyAttempts + swapDealAttempts + buyerNeedAttempts;

    const successRate = totalAttempts > 0 ? (totalTransactions / totalAttempts) * 100 : 0;

    // Send performance insights to admins if success rate is low
    if (successRate < 30) { // Less than 30% success rate
      const adminUsers = await db.UserTable.findAll({
        where: {
          accountType: 'admin'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'Low Marketplace Success Rate Alert',
          `Marketplace success rate is ${successRate.toFixed(1)}% (${totalTransactions}/${totalAttempts} successful). Consider optimizing matching algorithms.`,
          'warning',
          'performance_analytics',
          {
            type: 'performance_marketplace',
            successRate: successRate,
            totalTransactions: totalTransactions,
            totalAttempts: totalAttempts,
            successfulGroupBuys: successfulGroupBuys,
            completedSwapDeals: completedSwapDeals,
            fulfilledBuyerNeeds: fulfilledBuyerNeeds,
            analyzedAt: new Date()
          }
        );
      }
    }

    return {
      successRate,
      totalTransactions,
      totalAttempts,
      successfulGroupBuys,
      completedSwapDeals,
      fulfilledBuyerNeeds,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing marketplace performance:', error);
    return null;
  }
};

// Analyze system performance
const analyzeSystemPerformance = async () => {
  try {
    console.log('⚡ Analyzing system performance...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get system metrics
    const metrics = await Promise.all([
      // Error notifications in last hour
      db.Notification.count({
        where: {
          type: 'error',
          createdAt: { [Op.gte]: oneHourAgo }
        }
      }),
      
      // Total notifications in last hour
      db.Notification.count({
        where: {
          createdAt: { [Op.gte]: oneHourAgo }
        }
      }),
      
      // Database connection test
      db.sequelize.authenticate().then(() => true).catch(() => false)
    ]);

    const [errorCount, totalNotifications, dbHealth] = metrics;

    // Calculate error rate
    const errorRate = totalNotifications > 0 ? (errorCount / totalNotifications) * 100 : 0;

    // Send performance insights to admins if error rate is high
    if (errorRate > 10 || !dbHealth) { // More than 10% error rate or DB issues
      const adminUsers = await db.UserTable.findAll({
        where: {
          accountType: 'admin'
        },
        attributes: ['id', 'fullName', 'username', 'email']
      });

      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'System Performance Alert',
          `System error rate is ${errorRate.toFixed(1)}% (${errorCount}/${totalNotifications} errors). Database health: ${dbHealth ? 'OK' : 'ISSUES'}. Please investigate.`,
          'error',
          'performance_analytics',
          {
            type: 'performance_system',
            errorRate: errorRate,
            errorCount: errorCount,
            totalNotifications: totalNotifications,
            dbHealth: dbHealth,
            analyzedAt: new Date()
          }
        );
      }
    }

    return {
      errorRate,
      errorCount,
      totalNotifications,
      dbHealth,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing system performance:', error);
    return null;
  }
};

// Run all performance analytics
const runPerformanceAnalytics = async () => {
  try {
    console.log('📊 Running performance analytics...');
    
    const userEngagement = await analyzeUserEngagement();
    const marketplacePerformance = await analyzeMarketplacePerformance();
    const systemPerformance = await analyzeSystemPerformance();
    
    console.log('✅ Performance analytics completed');
    
    return {
      userEngagement,
      marketplacePerformance,
      systemPerformance,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error running performance analytics:', error);
    return null;
  }
};

module.exports = {
  analyzeUserEngagement,
  analyzeMarketplacePerformance,
  analyzeSystemPerformance,
  runPerformanceAnalytics
};
