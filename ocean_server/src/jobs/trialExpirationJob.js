const cron = require('node-cron');
const { UserSubscription, SubscriptionPlan, UserTable } = require('../../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../services/emailService');

/**
 * Trial Expiration Job
 * 
 * Runs daily to:
 * - Send reminders to users with expiring trials (7, 3, 1 day before)
 * - Expire trials that have ended
 * - Remove premium access for expired trials
 * - Send "trial ended" emails
 */
class TrialExpirationJob {

  /**
   * Start the trial expiration cron job
   * Runs daily at 9:00 AM
   */
  static start() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Starting trial expiration job...');
      
      try {
        await this.processExpiringTrials();
        await this.processExpiredTrials();
        
        console.log('Trial expiration job completed:', {
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in trial expiration job:', error);
      }
    });

    console.log('Trial expiration cron job started (runs daily at 9:00 AM)');
  }

  /**
   * Process trials that are expiring soon (send reminders)
   */
  static async processExpiringTrials() {
    try {
      const now = new Date();
      
      // Send reminders for 7 days, 3 days, and 1 day before expiration
      const reminderDays = [7, 3, 1];
      
      for (const days of reminderDays) {
        const targetDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
        
        const expiringTrials = await UserSubscription.findAll({
          where: {
            isTrial: true,
            status: 'active',
            trialEndDate: {
              [Op.between]: [targetDate, nextDay]
            }
          },
          include: [
            { model: UserTable, as: 'user' },
            { model: SubscriptionPlan, as: 'plan' }
          ]
        });
        
        console.log(`Found ${expiringTrials.length} trials expiring in ${days} day(s)`);
        
        for (const trial of expiringTrials) {
          try {
            await sendEmail(
              trial.user.email,
              `⏰ Your ${trial.plan.displayName} trial expires in ${days} day${days > 1 ? 's' : ''}!`,
              `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Don't lose your premium features!</h2>
                  <p>Hi ${trial.user.fullName || trial.user.username},</p>
                  <p>Your 30-day free trial of <strong>${trial.plan.displayName}</strong> ends in <strong>${days} day${days > 1 ? 's' : ''}</strong>.</p>
                  <p>Subscribe now for only <strong>₦${trial.plan.price}/month</strong> to keep all your premium benefits:</p>
                  <ul>
                    ${trial.plan.features ? trial.plan.features.map(f => `<li>${f}</li>`).join('') : ''}
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://ocean.app'}/subscription/plans" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Subscribe Now
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px;">
                    You can continue using all features until ${new Date(trial.trialEndDate).toLocaleDateString()}.
                  </p>
                </div>
              `
            );
            console.log(`✅ Sent ${days}-day reminder to ${trial.user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send reminder email to ${trial.user.email}:`, emailError);
          }
        }
      }
    } catch (error) {
      console.error('Error processing expiring trials:', error);
      throw error;
    }
  }

  /**
   * Process trials that have expired
   */
  static async processExpiredTrials() {
    try {
      const now = new Date();
      
      // Find all expired trials
      const expiredTrials = await UserSubscription.findAll({
        where: {
          isTrial: true,
          status: 'active',
          trialEndDate: { [Op.lt]: now }
        },
        include: [
          { model: UserTable, as: 'user' },
          { model: SubscriptionPlan, as: 'plan' }
        ]
      });
      
      console.log(`Found ${expiredTrials.length} expired trials to process`);
      
      for (const trial of expiredTrials) {
        try {
          // Mark trial as expired
          await trial.update({ 
            status: 'expired',
            cancelledAt: now,
            cancellationReason: 'Trial period ended - requires payment to continue'
          });
          
          // Remove all premium access from user
          await UserTable.update({
            subscription_status: null,
            current_plan_id: null,
            subscription_expires_at: null
          }, {
            where: { id: trial.userId }
          });
          
          console.log(`✅ Expired trial for user ${trial.userId}`);
          
          // Send "trial ended" email
          try {
            await sendEmail(
              trial.user.email,
              `Your ${trial.plan.displayName} trial has ended`,
              `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Your free trial has ended</h2>
                  <p>Hi ${trial.user.fullName || trial.user.username},</p>
                  <p>Your 30-day free trial of <strong>${trial.plan.displayName}</strong> has ended.</p>
                  <p>To regain access to all premium features, subscribe now for only <strong>₦${trial.plan.price}/month</strong>:</p>
                  <ul>
                    ${trial.plan.features ? trial.plan.features.map(f => `<li>${f}</li>`).join('') : ''}
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://ocean.app'}/subscription/plans" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Choose Your Plan
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px;">
                    Start selling with Ocean again today!
                  </p>
                </div>
              `
            );
            console.log(`✅ Sent trial ended email to ${trial.user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send trial ended email to ${trial.user.email}:`, emailError);
          }
        } catch (updateError) {
          console.error(`❌ Failed to expire trial for user ${trial.userId}:`, updateError);
        }
      }
      
      return expiredTrials.length;
    } catch (error) {
      console.error('Error processing expired trials:', error);
      throw error;
    }
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running trial expiration job manually...');
    
    try {
      await this.processExpiringTrials();
      const expiredCount = await this.processExpiredTrials();
      
      console.log('Trial expiration job completed manually:', {
        expiredTrials: expiredCount
      });
      
      return expiredCount;
    } catch (error) {
      console.error('Error in manual trial expiration job:', error);
      throw error;
    }
  }
}

module.exports = TrialExpirationJob;
