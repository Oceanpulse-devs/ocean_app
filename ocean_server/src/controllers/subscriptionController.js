const subscriptionService = require('../services/subscriptionService');
const SubscriptionStatusChecker = require('../utils/subscriptionStatusChecker');
const { PaymentProvider } = require('../providers/PaymentProvider');
const { SellersTable } = require('../../models');
const { sendEmail, emailTemplates } = require('../services/emailService');

/**
 * Subscription Controller
 * 
 * Handles all subscription-related API endpoints including:
 * - Subscription management (create, cancel, change plan)
 * - Payment processing (with provider-agnostic design)
 * - Subscription status and analytics
 * - Webhook handling for payment providers
 */

class SubscriptionController {

  /**
   * Get all available subscription plans
   * GET /api/subscriptions/plans
   */
  static async getAvailablePlans(req, res) {
    try {
      const plans = await subscriptionService.getAvailablePlans();
      
      res.json({
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          displayName: plan.display_name,
          price: plan.price,
          currency: plan.currency,
          billingPeriod: plan.billing_period,
          features: plan.features,
          description: plan.description,
          limits: {
            maxListings: plan.max_listings,
            maxGroupBuys: plan.max_group_buys,
            maxSwapDeals: plan.max_swap_deals,
            maxAuctions: plan.max_auctions,
            maxDistressSales: plan.max_distress_sales,
            maxDailyDms: plan.max_daily_dms,
            maxDailyNotifications: plan.max_daily_notifications,
            maxArProducts: plan.max_ar_products,
            maxPromotionalBoosts: plan.max_promotional_boosts
          },
          capabilities: {
            canCreateGroupBuy: plan.can_create_group_buy,
            canCreateSwapDeals: plan.can_create_swap_deals,
            canCreateAuctions: plan.can_create_auctions,
            canCreateDistressSales: plan.can_create_distress_sales,
            canUseAr: plan.can_use_ar,
            canCustomizeShopfront: plan.can_customize_shopfront,
            hasVerifiedBadge: plan.has_verified_badge,
            hasPrioritySearch: plan.has_priority_search,
            hasBuyerInsights: plan.has_buyer_insights,
            hasUnlimitedFeatures: plan.has_unlimited_features
          }
        }))
      });
    } catch (error) {
      console.error('Error getting available plans:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving subscription plans',
        error: error.message
      });
    }
  }

  /**
   * Get user's current subscription status
   * GET /api/subscriptions/current
   */
  static async getCurrentSubscription(req, res) {
    try {
      const userId = req.user.id;
      const status = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      
      res.json({
        success: true,
        message: 'Subscription status retrieved successfully',
        data: status
      });
    } catch (error) {
      console.error('Error getting current subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving subscription status',
        error: error.message
      });
    }
  }

  /**
   * Subscribe to a plan
   * POST /api/subscriptions/subscribe
   */
  static async subscribeToPlan(req, res) {
    try {
      const userId = req.user.id;
      const { planId, paymentMethod = 'manual' } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID is required'
        });
      }

      // Check if user is a verified seller (subscriptions are seller-only)
      const seller = await SellersTable.findOne({
        where: { userId, verificationStatus: 'approved' }
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can subscribe to plans. Please complete seller verification first.',
          requiresSellerVerification: true
        });
      }

      // Get user details from database
      const user = await subscriptionService.getUserById(userId);
      if (!user || !user.email) {
        return res.status(400).json({
          success: false,
          message: 'User email not found. Please update your profile.'
        });
      }

      // Get the plan
      const plan = await subscriptionService.getPlanByName(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      // Debug: Plan found
      console.log('Plan found:', {
        id: plan.id,
        name: plan.name,
        display_name: plan.displayName,
        price: plan.price,
        paystack_plan_code: plan.paystackPlanCode,
        is_active: plan.isActive
      });

      // Check if user already has an active subscription
      const currentStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      if (currentStatus.hasActiveSubscription) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription. Please cancel it first or change your plan.',
          currentSubscription: currentStatus
        });
      }

      // Create payment intent
      const paymentIntent = await PaymentProvider.createPaymentIntent(userId, plan.id, {
        email: user.email,
        paystackPlanCode: plan.paystackPlanCode,
        amount: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod
      });

      // Check if payment intent creation failed
      if (!paymentIntent.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create payment intent',
          error: paymentIntent.message
        });
      }

      // Create pending subscription
      const subscription = await subscriptionService.createSubscription(userId, plan.id, {
        reference: paymentIntent.reference,
        method: paymentMethod
      });

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully. Complete payment to activate.',
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            plan: {
              name: plan.display_name,
              price: plan.price,
              currency: plan.currency
            },
            startDate: subscription.start_date,
            endDate: subscription.end_date
          },
          payment: {
            reference: paymentIntent.reference,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            checkoutUrl: paymentIntent.checkoutUrl,
            expiresAt: paymentIntent.expiresAt
          }
        }
      });
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating subscription',
        error: error.message
      });
    }
  }

  /**
   * Change subscription plan (upgrade/downgrade)
   * POST /api/subscriptions/change-plan
   */
  static async changePlan(req, res) {
    try {
      const userId = req.user.id;
      const { planId } = req.body;

      console.log('Change plan request:', { userId, planId, body: req.body });

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID is required',
          received: { planId, body: req.body }
        });
      }

      // Check if user is a verified seller (subscriptions are seller-only)
      const seller = await SellersTable.findOne({
        where: { userId, verificationStatus: 'approved' }
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only verified sellers can change subscription plans. Please complete seller verification first.',
          requiresSellerVerification: true
        });
      }

      // Get user details from database
      const user = await subscriptionService.getUserById(userId);
      if (!user || !user.email) {
        return res.status(400).json({
          success: false,
          message: 'User email not found. Please update your profile.'
        });
      }

      // Check upgrade eligibility
      const eligibility = await subscriptionService.checkUpgradeEligibility(userId, planId);
      if (!eligibility.eligible) {
        return res.status(400).json({
          success: false,
          message: eligibility.reason,
          currentPlan: eligibility.currentPlan,
          targetPlan: eligibility.targetPlan
        });
      }

      // Get the target plan
      console.log('Looking for plan with name:', planId);
      const targetPlan = await subscriptionService.getPlanByName(planId);
      console.log('Target plan found:', targetPlan ? {
        id: targetPlan.id,
        name: targetPlan.name,
        price: targetPlan.price,
        paystackPlanCode: targetPlan.paystackPlanCode
      } : 'null');
      
      if (!targetPlan) {
        return res.status(404).json({
          success: false,
          message: 'Target subscription plan not found',
          searchedPlan: planId
        });
      }

      // Create payment intent for plan change
      const paymentIntent = await PaymentProvider.createPaymentIntent(userId, targetPlan.id, {
        email: user.email,
        paystackPlanCode: targetPlan.paystackPlanCode,
        amount: targetPlan.price,
        currency: targetPlan.currency,
        billingPeriod: targetPlan.billingPeriod,
        type: 'plan_change'
      });

      res.json({
        success: true,
        message: 'Plan change initiated. Complete payment to activate new plan.',
        data: {
          currentPlan: eligibility.currentPlan,
          targetPlan: targetPlan,
          payment: {
            reference: paymentIntent.reference,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            checkoutUrl: paymentIntent.checkoutUrl,
            expiresAt: paymentIntent.expiresAt
          }
        }
      });
    } catch (error) {
      console.error('Error changing plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing subscription plan',
        error: error.message
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/subscriptions/cancel
   */
  static async cancelSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      // Get current subscription details before cancellation
      const currentSubscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      const user = await subscriptionService.getUserById(userId);

      const success = await subscriptionService.cancelSubscription(userId, reason);
      
      if (success) {
        // Send cancellation email
        if (user && currentSubscriptionStatus.hasActiveSubscription && currentSubscriptionStatus.plan) {
          try {
            const emailTemplate = emailTemplates.subscriptionCancelled(
              user.fullName,
              currentSubscriptionStatus.plan.displayName,
              reason || 'No reason provided',
              currentSubscriptionStatus.expiresAt
            );
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'subscription');
            console.log('✅ Subscription cancellation email sent to:', user.email);
          } catch (emailError) {
            console.error('❌ Failed to send cancellation email:', emailError);
          }
        }

        res.json({
          success: true,
          message: 'Subscription cancelled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No active subscription found to cancel'
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling subscription',
        error: error.message
      });
    }
  }

  /**
   * Get user's usage statistics
   * GET /api/subscriptions/usage
   */
  static async getUsageStats(req, res) {
    try {
      const userId = req.user.id;
      const { days = 7 } = req.query;

      const stats = await SubscriptionStatusChecker.getUserUsageStats(userId, parseInt(days));
      
      res.json({
        success: true,
        message: 'Usage statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving usage statistics',
        error: error.message
      });
    }
  }

  /**
   * Check if user can perform specific action
   * GET /api/subscriptions/check/:actionType
   */
  static async checkActionEligibility(req, res) {
    try {
      const userId = req.user.id;
      const { actionType } = req.params;

      const eligibility = await SubscriptionStatusChecker.canPerformAction(userId, actionType);
      
      res.json({
        success: true,
        message: 'Action eligibility checked successfully',
        data: eligibility
      });
    } catch (error) {
      console.error('Error checking action eligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking action eligibility',
        error: error.message
      });
    }
  }

  /**
   * Get subscription analytics
   * GET /api/subscriptions/analytics
   */
  static async getSubscriptionAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await subscriptionService.getUserSubscriptionAnalytics(userId, parseInt(days));
      
      res.json({
        success: true,
        message: 'Subscription analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving subscription analytics',
        error: error.message
      });
    }
  }

  /**
   * Create promotional boost
   * POST /api/subscriptions/boosts
   */
  static async createPromotionalBoost(req, res) {
    try {
      const userId = req.user.id;
      const { boostType, targetId, durationHours = 24, reason = '' } = req.body;

      if (!boostType || !targetId) {
        return res.status(400).json({
          success: false,
          message: 'Boost type and target ID are required'
        });
      }

      const boost = await subscriptionService.createPromotionalBoost(
        userId, 
        boostType, 
        targetId, 
        durationHours, 
        reason
      );

      res.status(201).json({
        success: true,
        message: 'Promotional boost created successfully',
        data: {
          id: boost.id,
          boostType: boost.boostType,
          targetId: boost.targetId,
          durationHours: boost.boostDurationHours,
          startTime: boost.startTime,
          endTime: boost.endTime,
          status: boost.status
        }
      });
    } catch (error) {
      console.error('Error creating promotional boost:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating promotional boost',
        error: error.message
      });
    }
  }

  /**
   * Get user's promotional boosts
   * GET /api/subscriptions/boosts
   */
  static async getPromotionalBoosts(req, res) {
    try {
      const userId = req.user.id;
      const { status = 'active' } = req.query;

      const { PromotionalBoost } = require('../../models');
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          status: status
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        message: 'Promotional boosts retrieved successfully',
        data: boosts.map(boost => ({
          id: boost.id,
          boostType: boost.boost_type,
          targetId: boost.target_id,
          durationHours: boost.boost_duration_hours,
          startTime: boost.start_time,
          endTime: boost.end_time,
          status: boost.status,
          reason: boost.boost_reason,
          createdAt: boost.created_at
        }))
      });
    } catch (error) {
      console.error('Error getting promotional boosts:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving promotional boosts',
        error: error.message
      });
    }
  }

  /**
   * Handle payment webhook from payment provider
   * POST /api/webhooks/payments/:provider
   */
  static async handlePaymentWebhook(req, res) {
    try {
      // Verify webhook signature using Paystack's method
      const signature = req.headers['x-paystack-signature'];
      const secret = process.env.PAYSTACK_SECRET_KEY;
      
      if (!signature || !secret) {
        console.log('Missing signature or secret key');
        return res.status(400).json({
          success: false,
          message: 'Missing signature or secret key'
        });
      }
      
      // Verify signature using HMAC SHA512
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== signature) {
        console.log('Invalid webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
      
      console.log('Valid webhook signature received');
      
      // Process webhook event
      const event = req.body;
      console.log('Webhook event:', event.event);
      
      switch (event.event) {
        case 'charge.success':
          await SubscriptionController.handleSuccessfulPayment(event.data);
          break;
        case 'charge.failed':
          await SubscriptionController.handleFailedPayment(event.data);
          break;
        case 'subscription.create':
          await SubscriptionController.handleSubscriptionCreated(event.data);
          break;
        case 'subscription.disable':
          await SubscriptionController.handleSubscriptionDisabled(event.data);
          break;
        default:
          console.log('Unhandled webhook event:', event.event);
      }
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
      
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error: error.message
      });
    }
  }

  /**
   * Handle successful payment
   */
  static async handleSuccessfulPayment(paymentData) {
    try {
      console.log('Processing successful payment:', paymentData.reference);
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      
      const paymentRef = paymentData.reference;
      if (!paymentRef) {
        console.error('No payment reference found in payment data');
        return;
      }
      
      // Find subscription by payment reference first (most reliable)
      const { UserSubscription, SubscriptionPlan } = require('../../models');
      
      let subscription = await UserSubscription.findOne({
        where: {
          paymentReference: paymentRef,
          status: 'pending'
        }
      });
      
      let finalUserId, finalPlanId, finalExpiresAt;
      
      if (subscription) {
        // Found subscription by payment reference - use its data
        console.log('✅ Found subscription by payment reference:', subscription.id);
        finalUserId = subscription.userId;
        finalPlanId = subscription.planId;
        
        // Calculate expiration date based on plan billing period
        const plan = await SubscriptionPlan.findByPk(subscription.planId);
        if (plan) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (plan.billingPeriod === 'yearly' ? 12 : 1));
          finalExpiresAt = endDate;
        } else {
          finalExpiresAt = subscription.endDate;
        }
        
        // Update the subscription record directly
        await subscription.update({
          status: 'active',
          endDate: finalExpiresAt
        });
        console.log('✅ Updated subscription record to active');
      } else {
        // Fallback: Use metadata from payment webhook
        const userId = paymentData.metadata?.userId || paymentData.customer?.email;
        const planId = paymentData.metadata?.planId;
        
        if (!userId) {
          console.error('❌ Cannot activate subscription: No subscription found by reference and missing userId in metadata');
          console.error('Payment reference:', paymentRef);
          console.error('Metadata:', paymentData.metadata);
          return;
        }
        
        // Try to find pending subscription by userId
        subscription = await UserSubscription.findOne({
          where: {
            userId: userId,
            status: 'pending'
          },
          order: [['created_at', 'DESC']]
        });
        
        if (subscription) {
          console.log('✅ Found pending subscription by userId:', subscription.id);
          finalUserId = subscription.userId;
          finalPlanId = subscription.planId || planId;
          
          if (!finalPlanId) {
            console.error('❌ Cannot activate subscription: No planId found');
            return;
          }
          
          const plan = await SubscriptionPlan.findByPk(finalPlanId);
          if (plan) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.billingPeriod === 'yearly' ? 12 : 1));
            finalExpiresAt = endDate;
          } else {
            finalExpiresAt = subscription.endDate;
          }
          
          // Update payment reference and status
          await subscription.update({
            status: 'active',
            paymentReference: paymentRef,
            endDate: finalExpiresAt
          });
          console.log('✅ Updated subscription record to active');
        } else {
          console.error('❌ Cannot activate subscription: No subscription found by reference or userId');
          console.error('Payment reference:', paymentRef);
          console.error('UserId:', userId);
          return;
        }
      }
      
      // Update user's subscription status in users table
      await subscriptionService.updateUserSubscriptionStatus(
        finalUserId,
        'active',
        finalPlanId,
        finalExpiresAt
      );
      console.log('✅ Subscription activated for user:', finalUserId);
    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }
  
  /**
   * Handle failed payment
   */
  static async handleFailedPayment(paymentData) {
    try {
      console.log('Processing failed payment:', paymentData.reference);
      console.log('Failed payment data:', JSON.stringify(paymentData, null, 2));
      
      // Extract user ID from metadata
      const userId = paymentData.metadata?.userId || paymentData.customer?.id;
      
      if (!userId) {
        console.error('No user ID found in failed payment data');
        return;
      }
      
      // Update subscription status to failed
      await subscriptionService.updateUserSubscriptionStatus(
        userId,
        'expired',
        null,
        null
      );
      
      console.log('Subscription marked as expired for user:', userId);
    } catch (error) {
      console.error('Error processing failed payment:', error);
    }
  }
  
  /**
   * Handle subscription created
   */
  static async handleSubscriptionCreated(subscriptionData) {
    try {
      console.log('Processing subscription created:', subscriptionData.subscription_code);
      console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2));
      
      // Extract user ID from customer data
      const userId = subscriptionData.customer?.id;
      const planId = subscriptionData.plan?.id;
      
      if (!userId) {
        console.error('No user ID found in subscription data');
        return;
      }
      
      // Update subscription status
      await subscriptionService.updateUserSubscriptionStatus(
        userId,
        'active',
        planId,
        new Date(subscriptionData.next_payment_date)
      );
      
      console.log('Subscription created for user:', userId);
    } catch (error) {
      console.error('Error processing subscription created:', error);
    }
  }
  
  /**
   * Handle subscription disabled
   */
  static async handleSubscriptionDisabled(subscriptionData) {
    try {
      console.log('Processing subscription disabled:', subscriptionData.subscription_code);
      
      // Update subscription status
      await subscriptionService.updateUserSubscriptionStatus(
        subscriptionData.customer.id,
        'cancelled',
        null,
        null
      );
      
      console.log('Subscription disabled for user:', subscriptionData.customer.id);
    } catch (error) {
      console.error('Error processing subscription disabled:', error);
    }
  }

  /**
   * Manual payment confirmation (for development/admin use)
   * POST /api/subscriptions/confirm-payment
   */
  static async confirmPayment(req, res) {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required'
        });
      }

      // Verify payment with provider
      const paymentResult = await PaymentProvider.verifyPayment(paymentReference);
      
      if (paymentResult.success && paymentResult.status === 'success') {
        console.log('Payment verification successful:', {
          userId: paymentResult.userId,
          planId: paymentResult.planId,
          expiresAt: paymentResult.expiresAt,
          reference: paymentReference
        });
        
        // Find subscription by payment reference first (same logic as callback handler)
        const { UserSubscription } = require('../../models');
        
        let subscription = await UserSubscription.findOne({
          where: {
            paymentReference: paymentReference,
            status: 'pending'
          }
        });
        
        let finalUserId, finalPlanId, finalExpiresAt;
        
        if (subscription) {
          // Found subscription by payment reference - use its data
          console.log('✅ Found subscription by payment reference:', subscription.id);
          finalUserId = subscription.userId;
          finalPlanId = subscription.planId;
          finalExpiresAt = paymentResult.expiresAt || subscription.endDate;
          
          // Update the subscription record directly
          await subscription.update({
            status: 'active',
            endDate: finalExpiresAt
          });
          console.log('✅ Updated subscription record to active');
        } else if (paymentResult.userId && paymentResult.planId) {
          // Fallback: Use metadata from payment verification
          console.log('⚠️ Subscription not found by reference, using metadata from payment verification');
          finalUserId = paymentResult.userId;
          finalPlanId = paymentResult.planId;
          finalExpiresAt = paymentResult.expiresAt;
        } else {
          // Last resort: Try to find any pending subscription for the user from metadata
          if (paymentResult.userId) {
            console.log('⚠️ Trying to find subscription by userId:', paymentResult.userId);
            subscription = await UserSubscription.findOne({
              where: {
                userId: paymentResult.userId,
                status: 'pending'
              },
              order: [['created_at', 'DESC']]
            });
            
            if (subscription) {
              console.log('✅ Found pending subscription by userId:', subscription.id);
              finalUserId = subscription.userId;
              finalPlanId = subscription.planId;
              finalExpiresAt = paymentResult.expiresAt || subscription.endDate;
              
              // Update payment reference and status
              await subscription.update({
                status: 'active',
                paymentReference: paymentReference,
                endDate: finalExpiresAt
              });
              console.log('✅ Updated subscription record to active');
            } else {
              console.error('❌ Cannot activate subscription: No subscription found by payment reference or userId');
              return res.status(400).json({
                success: false,
                message: 'Cannot activate subscription: No matching subscription found',
                details: {
                  reference: paymentReference,
                  userId: paymentResult.userId,
                  planId: paymentResult.planId
                }
              });
            }
          } else {
            console.error('❌ Cannot activate subscription: Missing payment reference, userId, and planId');
            return res.status(400).json({
              success: false,
              message: 'Cannot activate subscription: Missing payment reference or metadata',
              details: {
                reference: paymentReference,
                userId: paymentResult.userId,
                planId: paymentResult.planId
              }
            });
          }
        }
        
        // Update user's subscription status in users table
        await subscriptionService.updateUserSubscriptionStatus(
          finalUserId,
          'active',
          finalPlanId,
          finalExpiresAt
        );
        console.log('✅ Updated user subscription status to active');

        res.json({
          success: true,
          message: 'Payment confirmed and subscription activated',
          data: {
            reference: paymentReference,
            subscription: {
              planId: finalPlanId,
              status: 'active',
              expiresAt: finalExpiresAt
            }
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          status: paymentResult.status
        });
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error confirming payment',
        error: error.message
      });
    }
  }

  /**
   * Handle payment callback from Paystack (mobile app redirect)
   * GET /api/subscriptions/callback/paystack
   */
  static async handlePaymentCallback(req, res) {
    try {
      const { reference, status, trxref } = req.query;
      
      console.log('Payment callback received:', { reference, status, trxref });
      console.log('All query parameters:', req.query);
      
      // Always verify payment with Paystack since callback URL doesn't include status
      console.log('Verifying payment with Paystack API...');
      const paymentResult = await PaymentProvider.verifyPayment(reference || trxref);
      
      console.log('Payment verification result:', paymentResult);
      
      if (paymentResult.success && paymentResult.status === 'success') {
        console.log('Payment verification successful:', {
          userId: paymentResult.userId,
          planId: paymentResult.planId,
          expiresAt: paymentResult.expiresAt,
          reference: reference || trxref
        });
        
        // Find subscription by payment reference first (most reliable)
        const { UserSubscription } = require('../../models');
        const paymentRef = reference || trxref;
        
        let subscription = await UserSubscription.findOne({
          where: {
            paymentReference: paymentRef,
            status: 'pending'
          }
        });
        
        let finalUserId, finalPlanId, finalExpiresAt;
        
        if (subscription) {
          // Found subscription by payment reference - use its data
          console.log('✅ Found subscription by payment reference:', subscription.id);
          finalUserId = subscription.userId;
          finalPlanId = subscription.planId;
          finalExpiresAt = paymentResult.expiresAt || subscription.endDate;
          
          // Update the subscription record directly
          await subscription.update({
            status: 'active',
            endDate: finalExpiresAt
          });
          console.log('✅ Updated subscription record to active');
        } else if (paymentResult.userId && paymentResult.planId) {
          // Fallback: Use metadata from payment verification
          console.log('⚠️ Subscription not found by reference, using metadata from payment verification');
          finalUserId = paymentResult.userId;
          finalPlanId = paymentResult.planId;
          finalExpiresAt = paymentResult.expiresAt;
        } else {
          // Last resort: Try to find any pending subscription for the user from metadata
          if (paymentResult.userId) {
            console.log('⚠️ Trying to find subscription by userId:', paymentResult.userId);
            subscription = await UserSubscription.findOne({
              where: {
                userId: paymentResult.userId,
                status: 'pending'
              },
              order: [['created_at', 'DESC']]
            });
            
            if (subscription) {
              console.log('✅ Found pending subscription by userId:', subscription.id);
              finalUserId = subscription.userId;
              finalPlanId = subscription.planId;
              finalExpiresAt = paymentResult.expiresAt || subscription.endDate;
              
              // Update payment reference and status
              await subscription.update({
                status: 'active',
                paymentReference: paymentRef,
                endDate: finalExpiresAt
              });
              console.log('✅ Updated subscription record to active');
            } else {
              console.error('❌ Cannot activate subscription: No subscription found by payment reference or userId');
              return res.status(400).json({
                success: false,
                message: 'Cannot activate subscription: No matching subscription found',
                details: {
                  reference: paymentRef,
                  userId: paymentResult.userId,
                  planId: paymentResult.planId
                }
              });
            }
          } else {
            console.error('❌ Cannot activate subscription: Missing payment reference, userId, and planId');
            return res.status(400).json({
              success: false,
              message: 'Cannot activate subscription: Missing payment reference or metadata',
              details: {
                reference: paymentRef,
                userId: paymentResult.userId,
                planId: paymentResult.planId
              }
            });
          }
        }
        
        // Update user's subscription status in users table
        await subscriptionService.updateUserSubscriptionStatus(
          finalUserId,
          'active',
          finalPlanId,
          finalExpiresAt
        );
        console.log('✅ Updated user subscription status to active');
        
        // Send subscription confirmation email
        try {
          const user = await subscriptionService.getUserById(finalUserId);
          const plan = await subscriptionService.getPlanById(finalPlanId);
          
          if (user && plan) {
            // Check if this is a plan change or new subscription
            const currentSubscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(finalUserId);
            const isPlanChange = currentSubscriptionStatus.hasActiveSubscription && currentSubscriptionStatus.plan && currentSubscriptionStatus.plan.id !== finalPlanId;
            
            let emailTemplate;
            
            if (isPlanChange && currentSubscriptionStatus.hasActiveSubscription) {
              // Plan change email
              emailTemplate = emailTemplates.subscriptionChanged(
                user.fullName,
                currentSubscriptionStatus.plan.displayName,
                plan.displayName,
                plan.price,
                plan.currency,
                finalExpiresAt
              );
              console.log('📈 Sending plan change email');
            } else {
              // New subscription email
              emailTemplate = emailTemplates.subscriptionCreated(
                user.fullName,
                plan.displayName,
                plan.price,
                plan.currency,
                finalExpiresAt
              );
              console.log('🎉 Sending new subscription email');
            }
            
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'subscription');
            console.log('✅ Subscription email sent to:', user.email);
          }
        } catch (emailError) {
          console.error('❌ Failed to send subscription confirmation email:', emailError);
        }
        
        // Return success response for mobile app
        res.json({
          success: true,
          message: 'Payment successful',
          data: {
            reference: reference || trxref,
            status: 'success',
            subscription: {
              planId: finalPlanId,
              status: 'active',
              expiresAt: finalExpiresAt
            }
          }
        });
      } else {
        console.log('Payment verification failed:', paymentResult.message);
        
        // Send payment failure email
        try {
          const user = await subscriptionService.getUserById(paymentResult.userId);
          const plan = await subscriptionService.getPlanById(paymentResult.planId);
          
          if (user && plan) {
            const emailTemplate = emailTemplates.paymentFailed(
              user.fullName,
              plan.displayName,
              paymentResult.message || 'Payment could not be processed'
            );
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'subscription');
            console.log('❌ Payment failure email sent to:', user.email);
          }
        } catch (emailError) {
          console.error('❌ Failed to send payment failure email:', emailError);
        }
        
        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Payment verification failed',
          data: {
            reference: reference || trxref,
            status: 'failed',
            error: paymentResult.message,
            details: paymentResult
          }
        });
      }
    } catch (error) {
      console.error('Error handling payment callback:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing payment callback',
        error: error.message
      });
    }
  }
}

module.exports = SubscriptionController;