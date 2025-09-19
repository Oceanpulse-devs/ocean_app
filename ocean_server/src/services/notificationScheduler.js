const db = require('../../models');
const { Op } = require('sequelize');
const performanceAnalyticsService = require('./performanceAnalyticsService');

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
    console.log(`📧 Scheduled notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating scheduled notification:', error);
  }
};

// Check for group buys with approaching deadlines
const checkGroupBuyDeadlines = async () => {
  try {
    console.log('🔍 Checking for group buys with approaching deadlines...');
    
    // Find group buys that expire in the next 24 hours and are still active/pending
    const approachingDeadlines = await db.GroupBuy.findAll({
      where: {
        status: { [Op.in]: ['active', 'pending'] },
        deadline: {
          [Op.between]: [
            new Date(), // Now
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          ]
        }
      },
      include: [
        {
          model: db.UserTable,
          as: 'creator',
          attributes: ['id', 'fullName', 'username', 'email']
        },
        {
          model: db.GroupBuyParticipant,
          as: 'participants',
          include: [
            {
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'username', 'email']
            }
          ]
        }
      ]
    });

    console.log(`Found ${approachingDeadlines.length} group buys with approaching deadlines`);

    for (const groupBuy of approachingDeadlines) {
      const hoursLeft = Math.ceil((new Date(groupBuy.deadline) - new Date()) / (1000 * 60 * 60));
      
      // Notify creator
      await createNotification(
        groupBuy.creator_id,
        'Group Buy Deadline Approaching!',
        `Your group buy "${groupBuy.title}" expires in ${hoursLeft} hours. Current participants: ${groupBuy.current_buyers}/${groupBuy.min_buyers} minimum`,
        'warning',
        'group_buy',
        { 
          groupBuyId: groupBuy.id,
          title: groupBuy.title,
          deadline: groupBuy.deadline,
          hoursLeft: hoursLeft,
          currentBuyers: groupBuy.current_buyers,
          minBuyers: groupBuy.min_buyers,
          maxBuyers: groupBuy.max_buyers,
          groupPrice: groupBuy.group_price,
          status: groupBuy.status
        }
      );

      // Notify all participants
      for (const participant of groupBuy.participants) {
        await createNotification(
          participant.user_id,
          'Group Buy Deadline Approaching!',
          `The group buy "${groupBuy.title}" you joined expires in ${hoursLeft} hours. Current participants: ${groupBuy.current_buyers}/${groupBuy.min_buyers} minimum`,
          'warning',
          'group_buy',
          { 
            groupBuyId: groupBuy.id,
            title: groupBuy.title,
            deadline: groupBuy.deadline,
            hoursLeft: hoursLeft,
            currentBuyers: groupBuy.current_buyers,
            minBuyers: groupBuy.min_buyers,
            maxBuyers: groupBuy.max_buyers,
            groupPrice: groupBuy.group_price,
            status: groupBuy.status
          }
        );
      }
    }

    return approachingDeadlines.length;
  } catch (error) {
    console.error('Error checking group buy deadlines:', error);
    return 0;
  }
};

// Check for expired group buys
const checkExpiredGroupBuys = async () => {
  try {
    console.log('🔍 Checking for expired group buys...');
    
    const expiredGroupBuys = await db.GroupBuy.findAll({
      where: {
        status: { [Op.in]: ['active', 'pending'] },
        deadline: {
          [Op.lt]: new Date() // Expired
        }
      },
      include: [
        {
          model: db.UserTable,
          as: 'creator',
          attributes: ['id', 'fullName', 'username', 'email']
        },
        {
          model: db.GroupBuyParticipant,
          as: 'participants',
          include: [
            {
              model: db.UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'username', 'email']
            }
          ]
        }
      ]
    });

    console.log(`Found ${expiredGroupBuys.length} expired group buys`);

    for (const groupBuy of expiredGroupBuys) {
      // Update status to expired
      await groupBuy.update({ status: 'expired' });

      // Notify creator
      await createNotification(
        groupBuy.creator_id,
        'Group Buy Expired',
        `Your group buy "${groupBuy.title}" has expired. Final participants: ${groupBuy.current_buyers}/${groupBuy.min_buyers} minimum`,
        'error',
        'group_buy',
        { 
          groupBuyId: groupBuy.id,
          title: groupBuy.title,
          deadline: groupBuy.deadline,
          currentBuyers: groupBuy.current_buyers,
          minBuyers: groupBuy.min_buyers,
          maxBuyers: groupBuy.max_buyers,
          groupPrice: groupBuy.group_price,
          status: 'expired'
        }
      );

      // Notify all participants
      for (const participant of groupBuy.participants) {
        await createNotification(
          participant.user_id,
          'Group Buy Expired',
          `The group buy "${groupBuy.title}" you joined has expired. Final participants: ${groupBuy.current_buyers}/${groupBuy.min_buyers} minimum`,
          'error',
          'group_buy',
          { 
            groupBuyId: groupBuy.id,
            title: groupBuy.title,
            deadline: groupBuy.deadline,
            currentBuyers: groupBuy.current_buyers,
            minBuyers: groupBuy.min_buyers,
            maxBuyers: groupBuy.max_buyers,
            groupPrice: groupBuy.group_price,
            status: 'expired'
          }
        );
      }
    }

    return expiredGroupBuys.length;
  } catch (error) {
    console.error('Error checking expired group buys:', error);
    return 0;
  }
};

// Run all scheduled checks
const runScheduledChecks = async () => {
  try {
    console.log('🕐 Running scheduled notification checks...');
    
    const approachingCount = await checkGroupBuyDeadlines();
    const expiredCount = await checkExpiredGroupBuys();
    
    console.log(`✅ Scheduled checks completed: ${approachingCount} approaching deadlines, ${expiredCount} expired group buys`);
    
    return {
      approachingDeadlines: approachingCount,
      expiredGroupBuys: expiredCount
    };
  } catch (error) {
    console.error('Error running scheduled checks:', error);
    return { approachingDeadlines: 0, expiredGroupBuys: 0 };
  }
};

// Run performance analytics (daily)
const runPerformanceAnalytics = async () => {
  try {
    console.log('📊 Running daily performance analytics...');
    
    const analytics = await performanceAnalyticsService.runPerformanceAnalytics();
    
    console.log('✅ Performance analytics completed');
    
    return analytics;
  } catch (error) {
    console.error('Error running performance analytics:', error);
    return null;
  }
};

module.exports = {
  checkGroupBuyDeadlines,
  checkExpiredGroupBuys,
  runScheduledChecks,
  runPerformanceAnalytics
};
