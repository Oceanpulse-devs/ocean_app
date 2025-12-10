const cron = require('node-cron');
const { UserSubscription, SubscriptionPlan, UserTable } = require('../../models');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { Op } = require('sequelize');

/**
 * Subscription Reminder Job
 * 
 * Runs daily to send email reminders to users whose subscriptions
 * are expiring in 3 days
 */
class SubscriptionReminderJob {

  /**
   * Start the subscription reminder cron job
   * Runs daily at 9:00 AM
   */
  static start() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Starting subscription reminder job...');
      
      try {
        const results = {
          timestamp: new Date().toISOString(),
          checked: 0,
          remindersSent: 0,
          errors: []
        };

        // Calculate date 3 days from now
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(0, 0, 0, 0); // Start of day

        // Calculate end of day 3 days from now
        const threeDaysFromNowEnd = new Date(threeDaysFromNow);
        threeDaysFromNowEnd.setHours(23, 59, 59, 999);

        console.log(`Checking for subscriptions expiring between ${threeDaysFromNow.toISOString()} and ${threeDaysFromNowEnd.toISOString()}`);

        // Find active subscriptions expiring in 3 days
        const expiringSubscriptions = await UserSubscription.findAll({
          where: {
            status: 'active',
            end_date: {
              [Op.between]: [threeDaysFromNow, threeDaysFromNowEnd]
            }
          },
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan',
              attributes: ['id', 'name', 'displayName', 'price', 'currency']
            },
            {
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'username']
            }
          ]
        });

        results.checked = expiringSubscriptions.length;
        console.log(`Found ${expiringSubscriptions.length} subscriptions expiring in 3 days`);

        // Send reminder emails
        for (const subscription of expiringSubscriptions) {
          try {
            if (!subscription.user || !subscription.plan) {
              console.log(`⚠️ Skipping subscription ${subscription.id} - missing user or plan data`);
              continue;
            }

            const user = subscription.user;
            const plan = subscription.plan;
            const planName = plan.displayName || plan.name || 'Premium';

            console.log(`Sending reminder email to ${user.email} for ${planName} subscription expiring on ${subscription.endDate}`);

            // Send reminder email
            const emailTemplate = emailTemplates.subscriptionExpiringReminder(
              user.fullName || user.username || 'Valued User',
              planName,
              subscription.endDate
            );

            await sendEmail(
              user.email,
              emailTemplate.subject,
              emailTemplate.html,
              'subscription'
            );

            results.remindersSent++;
            console.log(`✅ Reminder email sent to ${user.email}`);

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error(`Error sending reminder for subscription ${subscription.id}:`, error);
            results.errors.push({
              subscriptionId: subscription.id,
              userId: subscription.userId,
              error: error.message
            });
          }
        }

        console.log('Subscription reminder job completed:', {
          checked: results.checked,
          remindersSent: results.remindersSent,
          errors: results.errors.length
        });

      } catch (error) {
        console.error('Error in subscription reminder job:', error);
      }
    });

    console.log('Subscription reminder cron job started (runs daily at 9:00 AM)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running subscription reminder job manually...');
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        checked: 0,
        remindersSent: 0,
        errors: []
      };

      // Calculate date 3 days from now
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(0, 0, 0, 0);

      const threeDaysFromNowEnd = new Date(threeDaysFromNow);
      threeDaysFromNowEnd.setHours(23, 59, 59, 999);

      const expiringSubscriptions = await UserSubscription.findAll({
        where: {
          status: 'active',
          end_date: {
            [Op.between]: [threeDaysFromNow, threeDaysFromNowEnd]
          }
        },
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
            attributes: ['id', 'name', 'displayName', 'price', 'currency']
          },
          {
            model: UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'username']
          }
        ]
      });

      results.checked = expiringSubscriptions.length;

      for (const subscription of expiringSubscriptions) {
        try {
          if (!subscription.user || !subscription.plan) {
            continue;
          }

          const user = subscription.user;
          const plan = subscription.plan;
          const planName = plan.displayName || plan.name || 'Premium';

          const emailTemplate = emailTemplates.subscriptionExpiringReminder(
            user.fullName || user.username || 'Valued User',
            planName,
            subscription.endDate
          );

          await sendEmail(
            user.email,
            emailTemplate.subject,
            emailTemplate.html,
            'subscription'
          );

          results.remindersSent++;
        } catch (error) {
          results.errors.push({
            subscriptionId: subscription.id,
            userId: subscription.userId,
            error: error.message
          });
        }
      }

      console.log('Subscription reminder job completed:', results);
      return results;
    } catch (error) {
      console.error('Error in manual subscription reminder job:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionReminderJob;

