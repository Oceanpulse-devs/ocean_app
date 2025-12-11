const cron = require('node-cron');
const { UserSubscription } = require('../../models');
const { PaymentProviderFactory } = require('../providers/PaymentProvider');
const subscriptionService = require('../services/subscriptionService');
const { Op } = require('sequelize');

/**
 * Virtual Account Monitoring Job
 * 
 * Runs every 15 minutes to check for virtual account payments
 * Monitors pending subscriptions with virtual account payment method
 * Verifies payments and activates subscriptions automatically
 */
class VirtualAccountMonitoringJob {

  /**
   * Start the virtual account monitoring cron job
   * Runs every 15 minutes
   */
  static start() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Starting virtual account monitoring job...');
      
      try {
        const results = {
          timestamp: new Date().toISOString(),
          checked: 0,
          verified: 0,
          activated: 0,
          failed: 0,
          expired: 0,
          errors: []
        };

        // Find all pending subscriptions with Flutterwave virtual account payment method
        // Virtual accounts typically expire within 24-48 hours, so only check recent ones
        const pendingSubscriptions = await UserSubscription.findAll({
          where: {
            status: 'pending',
            paymentMethod: 'flutterwave',
            paymentReference: {
              [Op.like]: 'OCEAN_VA_%' // Virtual account references start with OCEAN_VA_
            },
            created_at: {
              // Only check subscriptions created in the last 48 hours (virtual accounts expire quickly)
              [Op.gte]: new Date(Date.now() - 48 * 60 * 60 * 1000)
            }
          },
          order: [['created_at', 'DESC']],
          limit: 50 // Process max 50 at a time to avoid rate limits
        });

        console.log(`Found ${pendingSubscriptions.length} pending virtual account subscriptions to check`);

        results.checked = pendingSubscriptions.length;

        // Get Flutterwave provider
        const provider = PaymentProviderFactory.getProvider('flutterwave');

        // Check each subscription
        for (const subscription of pendingSubscriptions) {
          try {
            const paymentReference = subscription.paymentReference;
            
            if (!paymentReference) {
              console.log(`⚠️ Subscription ${subscription.id} has no payment reference`);
              continue;
            }

            console.log(`Checking payment for subscription ${subscription.id}, reference: ${paymentReference}`);

            // Calculate hours since subscription creation
            const hoursSinceCreation = (Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60);

            // Verify payment with Flutterwave
            const paymentResult = await provider.verifyPayment(paymentReference);

            results.verified++;

            if (paymentResult.success && paymentResult.status === 'success') {
              console.log(`✅ Payment verified for subscription ${subscription.id}`);

              // Update subscription status
              await subscriptionService.updateUserSubscriptionStatus(
                subscription.userId,
                'active',
                subscription.planId,
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              );

              // Update subscription record
              await subscription.update({
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              });

              results.activated++;

              console.log(`✅ Subscription ${subscription.id} activated for user ${subscription.userId}`);

              // Send confirmation email
              try {
                const user = await subscriptionService.getUserById(subscription.userId);
                const plan = await subscriptionService.getPlanById(subscription.planId);

                if (user && plan) {
                  const { sendEmail, emailTemplates } = require('../services/emailService');
                  const emailTemplate = emailTemplates.subscriptionCreated(
                    user.fullName,
                    plan.displayName,
                    plan.price,
                    plan.currency,
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  );

                  await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'subscription');
                  console.log(`✅ Confirmation email sent to ${user.email}`);
                }
              } catch (emailError) {
                console.error(`Error sending confirmation email for subscription ${subscription.id}:`, emailError);
              }

            } else if (paymentResult.status === 'failed') {
              console.log(`❌ Payment failed for subscription ${subscription.id}`);
              results.failed++;

              // Mark as failed
              await subscription.update({ status: 'failed' });
            } else {
              // Payment still pending - check if virtual account has expired
              if (hoursSinceCreation > 48) {
                console.log(`⏰ Subscription ${subscription.id} expired (older than 48 hours), marking as cancelled`);
                await subscription.update({ status: 'cancelled' });
                results.expired++;
              } else {
                console.log(`⏳ Payment still pending for subscription ${subscription.id}`);
              }
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            // Handle "No transaction was found" error specifically
            const errorMessage = error.message || '';
            const errorResponse = error.response || {};
            const isTransactionNotFound = 
              errorMessage.includes('No transaction was found') ||
              (errorResponse.message && errorResponse.message.includes('No transaction was found'));

            if (isTransactionNotFound) {
              // Calculate hours since subscription creation
              const hoursSinceCreation = (Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60);

              if (hoursSinceCreation > 48) {
                console.log(`⏰ Subscription ${subscription.id} - transaction not found and older than 48 hours, marking as cancelled`);
                await subscription.update({ status: 'cancelled' });
                results.expired++;
              } else {
                console.log(`⚠️ Subscription ${subscription.id} - transaction not found yet (may be too early, ${hoursSinceCreation.toFixed(1)} hours old)`);
              }
            } else {
              console.error(`Error checking subscription ${subscription.id}:`, error);
              results.errors.push({
                subscriptionId: subscription.id,
                error: error.message
              });
            }
          }
        }

        console.log('Virtual account monitoring job completed:', results);

      } catch (error) {
        console.error('Error in virtual account monitoring job:', error);
      }
    });

    console.log('Virtual account monitoring cron job started (runs every 15 minutes)');
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually() {
    console.log('Running virtual account monitoring job manually...');
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        checked: 0,
        verified: 0,
        activated: 0,
        failed: 0,
        expired: 0,
        errors: []
      };

      // Find pending subscriptions
      // Virtual accounts typically expire within 24-48 hours, so only check recent ones
      const pendingSubscriptions = await UserSubscription.findAll({
        where: {
          status: 'pending',
          paymentMethod: 'flutterwave',
          paymentReference: {
            [Op.like]: 'OCEAN_VA_%'
          },
          created_at: {
            // Only check subscriptions created in the last 48 hours (virtual accounts expire quickly)
            [Op.gte]: new Date(Date.now() - 48 * 60 * 60 * 1000)
          }
        },
        order: [['created_at', 'DESC']],
        limit: 50
      });

      console.log(`Found ${pendingSubscriptions.length} pending virtual account subscriptions`);

      results.checked = pendingSubscriptions.length;

      const provider = PaymentProviderFactory.getProvider('flutterwave');

      for (const subscription of pendingSubscriptions) {
        try {
          const paymentReference = subscription.paymentReference;
          
          if (!paymentReference) {
            continue;
          }

          console.log(`Checking payment for subscription ${subscription.id}, reference: ${paymentReference}`);

          // Calculate hours since subscription creation
          const hoursSinceCreation = (Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60);

          const paymentResult = await provider.verifyPayment(paymentReference);
          results.verified++;

          if (paymentResult.success && paymentResult.status === 'success') {
            await subscriptionService.updateUserSubscriptionStatus(
              subscription.userId,
              'active',
              subscription.planId,
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            );

            await subscription.update({
              status: 'active',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            results.activated++;
            console.log(`✅ Subscription ${subscription.id} activated`);

          } else if (paymentResult.status === 'failed') {
            console.log(`❌ Payment failed for subscription ${subscription.id}`);
            results.failed++;
            await subscription.update({ status: 'failed' });
          } else {
            // Payment still pending - check if virtual account has expired
            if (hoursSinceCreation > 48) {
              console.log(`⏰ Subscription ${subscription.id} expired (older than 48 hours), marking as cancelled`);
              await subscription.update({ status: 'cancelled' });
              results.expired++;
            } else {
              console.log(`⏳ Payment still pending for subscription ${subscription.id}`);
            }
          }

          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          // Handle "No transaction was found" error specifically
          const errorMessage = error.message || '';
          const errorResponse = error.response || {};
          const isTransactionNotFound = 
            errorMessage.includes('No transaction was found') ||
            (errorResponse.message && errorResponse.message.includes('No transaction was found'));

          if (isTransactionNotFound) {
            // Calculate hours since subscription creation
            const hoursSinceCreation = (Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60);

            if (hoursSinceCreation > 48) {
              console.log(`⏰ Subscription ${subscription.id} - transaction not found and older than 48 hours, marking as cancelled`);
              await subscription.update({ status: 'cancelled' });
              results.expired++;
            } else {
              console.log(`⚠️ Subscription ${subscription.id} - transaction not found yet (may be too early, ${hoursSinceCreation.toFixed(1)} hours old)`);
            }
          } else {
            console.error(`Error checking subscription ${subscription.id}:`, error);
            results.errors.push({
              subscriptionId: subscription.id,
              error: error.message
            });
          }
        }
      }

      console.log('Virtual account monitoring job completed:', results);
      return results;

    } catch (error) {
      console.error('Error in manual virtual account monitoring job:', error);
      throw error;
    }
  }
}

module.exports = VirtualAccountMonitoringJob;

