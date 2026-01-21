const db = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');
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
    return notification;
  } catch (error) {
    console.error('Error creating scheduled notification:', error);
  }
};

// Helper function to send system message to conversation
const sendSystemMessageToConversation = async (conversationId, senderId, content, metadata = {}) => {
  if (!conversationId || !senderId || !content) {
    return;
  }
  
  try {
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    
    // Trim whitespace and remove trailing slashes
    messageServerUrl = messageServerUrl.trim().replace(/\/$/, '');
    
    // Auto-add https:// if protocol is missing
    if (messageServerUrl && !messageServerUrl.startsWith('http://') && !messageServerUrl.startsWith('https://')) {
      messageServerUrl = `https://${messageServerUrl}`;
    }
    
    await axios.post(
      `${messageServerUrl}/api/messages`,
      {
        conversationId,
        content,
        type: 'system',
        senderId,
        metadata
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );
  } catch (error) {
    console.error('❌ Error sending system message to conversation:', error.message);
  }
};

// Helper function to calculate remaining units
const calculateRemainingUnits = async (groupBuyId) => {
  try {
    const groupBuy = await db.GroupBuy.findByPk(groupBuyId);
    
    // If quantity_unit is not set, return null
    if (!groupBuy || groupBuy.quantity_unit === null || groupBuy.quantity_unit === undefined) {
      return null;
    }
    
    // Get all active participants (exclude cancelled ones)
    const participants = await db.GroupBuyParticipant.findAll({
      where: { 
        group_buy_id: groupBuyId,
        status: { [Op.ne]: 'cancelled' }
      }
    });
    
    // Sum all participant quantities
    const totalReservedUnits = participants.reduce((sum, p) => sum + (p.quantity || 0), 0);
    
    // Calculate remaining units
    const remainingUnits = groupBuy.quantity_unit - totalReservedUnits;
    
    // Ensure it doesn't go negative
    return Math.max(0, remainingUnits);
  } catch (error) {
    console.error('Error calculating remaining units:', error);
    return null;
  }
};

// Check for group buys with approaching deadlines
const checkGroupBuyDeadlines = async () => {
  try {
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

    for (const groupBuy of expiredGroupBuys) {
      const failedToMeetMinimum = groupBuy.current_buyers < groupBuy.min_buyers;
      
      if (failedToMeetMinimum) {
        // Group buy failed - didn't meet minimum requirement
        await groupBuy.update({ status: 'failed' });

        // Cancel all participants
        for (const participant of groupBuy.participants) {
          if (participant.status !== 'cancelled') {
            await participant.update({ status: 'cancelled' });
          }
        }

        // Return all units to pool
        if (groupBuy.quantity_unit !== null && groupBuy.quantity_unit !== undefined) {
          const updatedRemainingUnits = await calculateRemainingUnits(groupBuy.id);
          if (updatedRemainingUnits !== null) {
            await groupBuy.update({ remaining_units: updatedRemainingUnits });
          }
        }

        // Reset current buyers
        await groupBuy.update({ current_buyers: 0 });

        // Send system message to conversation
        if (groupBuy.conversation_id) {
          await sendSystemMessageToConversation(
            groupBuy.conversation_id,
            groupBuy.creator_id,
            `❌ This group buy didn't meet the minimum requirement (${groupBuy.current_buyers}/${groupBuy.min_buyers} buyers). All reservations have been cancelled.`,
            {
              event: 'group_buy_failed',
              groupBuyId: groupBuy.id,
              currentBuyers: groupBuy.current_buyers,
              minBuyers: groupBuy.min_buyers
            }
          );
        }

        // Notify creator
        await createNotification(
          groupBuy.creator_id,
          'Group Buy Failed',
          `Your group buy "${groupBuy.title}" didn't meet the minimum requirement. Final participants: ${groupBuy.current_buyers}/${groupBuy.min_buyers} minimum`,
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
            status: 'failed'
          }
        );

        // Notify all participants
        for (const participant of groupBuy.participants) {
          await createNotification(
            participant.user_id,
            'Group Buy Failed',
            `The group buy "${groupBuy.title}" you joined didn't meet the minimum requirement. All reservations have been cancelled.`,
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
              status: 'failed'
            }
          );
        }
      } else {
        // Group buy expired but met minimum - just mark as expired
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
    const approachingCount = await checkGroupBuyDeadlines();
    const expiredCount = await checkExpiredGroupBuys();
    
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
