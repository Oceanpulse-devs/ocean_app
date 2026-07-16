const subscriptionService = require('../services/subscriptionService');
const SubscriptionStatusChecker = require('../utils/subscriptionStatusChecker');
const { PaymentProvider, PaymentProviderFactory } = require('../providers/PaymentProvider');
const { SellersTable, UserTable } = require('../../models');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { getSellerCurrency } = require('../utils/sellerCountryDetector');

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
      // Try to get user ID from token if present (optional auth)
      let userId = req.user?.id;
      
      // If no user from middleware, try to decode token manually (for public route)
      if (!userId) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET;
          let token = req.headers.authorization;
          if (token && token.startsWith('Bearer ')) {
            token = token.substring(7);
          } else {
            token = req.cookies?.token;
          }
          
          if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
            console.log('✅ Decoded user from token for currency detection:', userId);
          }
        } catch (tokenError) {
          // Token invalid or not present - that's okay, will default to NGN
          console.log('ℹ️ No valid token found, defaulting to NGN');
        }
      }
      
      const currency = userId ? await getSellerCurrency(userId) : 'NGN';
      
      // Add logging for debugging
      console.log('📋 getAvailablePlans - userId:', userId, 'currency:', currency);
      if (userId) {
        const { getSellerCountry } = require('../utils/sellerCountryDetector');
        const country = await getSellerCountry(userId);
        console.log('📋 Seller country:', country);
      }
      
      const plans = await subscriptionService.getAvailablePlans();
      
      // Check if user is eligible for trial
      let userTrialStatus = { eligible: false, hasUsedTrial: false };
      if (userId) {
        try {
          const user = await UserTable.findByPk(userId, {
            attributes: ['hasUsedTrial', 'trialPlanUsed']
          });
          userTrialStatus = {
            eligible: !user.hasUsedTrial,
            hasUsedTrial: user.hasUsedTrial,
            trialPlanUsed: user.trialPlanUsed
          };
        } catch (error) {
          console.log('Could not check trial status:', error.message);
        }
      }
      
      res.json({
        success: true,
        message: 'Subscription plans retrieved successfully',
        currency, // Include detected currency in response
        trialAvailable: userTrialStatus.eligible,
        trialDays: 30,
        data: plans.map(plan => {
          // Use price_usd if currency is USD, otherwise use price (NGN)
          const price = currency === 'USD' && plan.priceUsd 
            ? parseFloat(plan.priceUsd) 
            : parseFloat(plan.price);
          const planCurrency = currency === 'USD' ? 'USD' : 'NGN';
          
          return {
            id: plan.id,
            name: plan.name,
            displayName: plan.display_name,
            price: price,
            priceNgn: parseFloat(plan.price), // Always include NGN price
            priceUsd: plan.priceUsd ? parseFloat(plan.priceUsd) : null, // Always include USD price
            currency: planCurrency,
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
            },
            // Trial information
            trialAvailable: userTrialStatus.eligible,
            trialDays: 30,
            trialMessage: userTrialStatus.eligible 
              ? 'Start your 30-day free trial - no card required!' 
              : (userTrialStatus.hasUsedTrial 
                  ? `Trial already used on ${userTrialStatus.trialPlanUsed}` 
                  : null)
          };
        })
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
      const { planId, paymentMethod, actualPaymentMethod, skipTrial } = req.body;
      console.log('Subscribe to plan request:', { userId, planId, paymentMethod, actualPaymentMethod, skipTrial });

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID is required'
        });
      }

      // Note: Payment method check moved to after trial eligibility check
      // If user is eligible for trial AND doesn't skip it, no payment method is required

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

      // Determine currency based on seller country
      const currency = await getSellerCurrency(userId);

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

      // Get correct price based on currency
      const price = currency === 'USD' && plan.priceUsd 
        ? parseFloat(plan.priceUsd) 
        : parseFloat(plan.price);

      // Debug: Plan found
      console.log('Plan found:', {
        id: plan.id,
        name: plan.name,
        display_name: plan.displayName,
        price: price,
        currency: currency,
        priceNgn: plan.price,
        priceUsd: plan.priceUsd,
        is_active: plan.isActive
      });

      // ✅ CHECK TRIAL ELIGIBILITY FIRST (NO PAYMENT METHOD REQUIRED IF TAKING TRIAL)
      const trialCheck = await subscriptionService.checkTrialEligibility(userId, planId);

      // User is eligible for trial AND hasn't chosen to skip it
      if (trialCheck.eligible && !skipTrial) {
        // 🎁 OFFER TRIAL - NO PAYMENT NEEDED
        console.log('User eligible for trial and accepting it, creating trial subscription');
        
        try {
          const trialSubscription = await subscriptionService.createTrialSubscription(userId, planId);
          
          return res.status(201).json({
            success: true,
            message: `🎉 Welcome to ${plan.displayName}! Your 30-day free trial has started. No card required!`,
            isTrial: true,
            trialDays: 30,
            trialEndsAt: trialSubscription.trialEndDate,
            data: {
              subscription: trialSubscription,
              plan: plan,
              nextSteps: 'Enjoy all premium features for 30 days. You\'ll be prompted to subscribe before your trial ends.'
            }
          });
        } catch (error) {
          console.error('Error creating trial subscription:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to start trial subscription',
            error: error.message
          });
        }
      }

      // 🚫 NOT ELIGIBLE FOR TRIAL OR USER CHOSE TO SKIP - REQUIRE PAYMENT
      if (skipTrial && trialCheck.eligible) {
        console.log('User is eligible for trial but chose to skip it, requiring payment');
      } else {
        console.log('User not eligible for trial:', trialCheck.reason);
      }

      // Check if user already has an active subscription
      const currentStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      if (currentStatus.hasActiveSubscription) {
        // Allow plan changes/upgrades - only block if trying to subscribe to the same plan
        if (currentStatus.plan && currentStatus.plan.id === plan.id) {
          return res.status(400).json({
            success: false,
            message: 'You already have an active subscription for this plan. Please cancel it first or choose a different plan.',
            currentSubscription: currentStatus
          });
        } else {
          // Different plan - allow subscription change (will cancel old one)
          console.log('Plan change detected. Will cancel old subscription and create new one.', {
            oldPlanId: currentStatus.plan?.id,
            newPlanId: plan.id
          });
          // The old subscription will be cancelled in the subscription service
        }
      }

      // Check if Apple payment method is requested
      const isApple = (val) => {
        if (!val) return false;
        const v = val.toLowerCase().trim();
        return v === 'apple' || v === 'apple_iap' || v === 'applepay' || v === 'apple_pay' || v === 'iap';
      };

      if (isApple(paymentMethod) || isApple(actualPaymentMethod)) {
        const reference = `APPLE_PENDING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = await subscriptionService.createSubscription(userId, plan.id, {
          reference: reference,
          method: 'apple_iap',
          amount: price,
          currency: currency
        });

        console.log('Created pending Apple subscription:', {
          userId,
          planId: plan.id,
          reference
        });

        return res.status(201).json({
          success: true,
          message: 'Apple subscription initiated. Complete payment on device and verify receipt.',
          data: {
            subscription: {
              id: subscription.id,
              status: subscription.status,
              flutterwaveSubscriptionId: null,
              plan: {
                name: plan.displayName || plan.display_name || plan.name,
                price: price,
                currency: currency
              },
              startDate: subscription.startDate || subscription.start_date,
              endDate: subscription.endDate || subscription.end_date
            },
            payment: {
              reference: reference,
              paymentMethod: 'apple_iap',
              hasCheckoutUrl: false,
              checkoutUrl: null
            }
          }
        });
      }

      // Get the appropriate payment provider - default to Flutterwave
      const { PaymentProviderFactory } = require('../providers/PaymentProvider');
      // Default to Flutterwave if paymentMethod is not provided (Flutterwave subscriptions don't need explicit paymentMethod)
      const effectivePaymentMethod = paymentMethod || 'flutterwave';
      let providerName;
      
      // In test environment, use mock provider
      if (process.env.NODE_ENV === 'test') {
        providerName = 'mock';
      } else if (effectivePaymentMethod === 'mock') {
        providerName = 'mock';
      } else {
        // Default to Flutterwave for production
        providerName = 'flutterwave';
      }
      const paymentProvider = PaymentProviderFactory.getProvider(providerName);

      // Get Flutterwave plan ID helper
      const { getFlutterwavePlanId } = require('../utils/flutterwavePlanHelper');
      const flutterwavePlanId = getFlutterwavePlanId(plan.name, currency);

      if (!flutterwavePlanId) {
        return res.status(400).json({
          success: false,
          message: `Flutterwave plan ID not configured for ${plan.name} (${currency}). Please contact support.`
        });
      }

      // Create Flutterwave subscription (recurring billing)
      let subscriptionResult;
      try {
        subscriptionResult = await paymentProvider.createSubscription(userId, plan.id, {
          email: user.email,
          name: user.fullName || user.username || 'Customer',
          phone: user.phoneNumber || user.phone || '',
          amount: price,
          currency: currency,
          planName: plan.name,
          flutterwavePlanId: flutterwavePlanId
        });

        console.log('Flutterwave subscription created:', {
          success: subscriptionResult.success,
          subscriptionId: subscriptionResult.subscriptionId,
          hasCheckoutUrl: !!subscriptionResult.checkoutUrl,
          checkoutUrl: subscriptionResult.checkoutUrl
        });

        if (!subscriptionResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Failed to create subscription',
            error: subscriptionResult.message
          });
        }
      } catch (error) {
        console.error('Error creating Flutterwave subscription:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to create subscription',
          error: error.message
        });
      }

      // Generate reference for tracking
      const reference = `OCEAN_SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create pending subscription in database
      const subscription = await subscriptionService.createSubscription(userId, plan.id, {
        reference: reference,
        method: paymentMethod,
        amount: price,
        currency: currency,
        flutterwaveSubscriptionId: subscriptionResult.subscriptionId
      });

      // Prepare subscription response
      const subscriptionResponse = {
        reference: reference,
        subscriptionId: subscriptionResult.subscriptionId,
        amount: price,
        currency: currency,
        checkoutUrl: subscriptionResult.checkoutUrl,
        emailToken: subscriptionResult.emailToken // For customer to authorize subscription
      };

      console.log('Sending subscription response to frontend:', {
        hasCheckoutUrl: !!subscriptionResponse.checkoutUrl,
        checkoutUrl: subscriptionResponse.checkoutUrl,
        subscriptionId: subscription.id,
        flutterwaveSubscriptionId: subscriptionResult.subscriptionId
      });

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully. Complete payment setup to activate recurring billing.',
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            flutterwaveSubscriptionId: subscriptionResult.subscriptionId,
            plan: {
              name: plan.display_name,
              price: price,
              currency: currency
            },
            startDate: subscription.start_date,
            endDate: subscription.end_date
          },
          payment: subscriptionResponse
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
   * Verify payment and update subscription status
   * POST /api/subscriptions/verify-payment
   */
  static async verifyPayment(req, res) {
    try {
      const userId = req.user.id;
      const { paymentReference, paymentMethod = 'flutterwave' } = req.body;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required'
        });
      }

      console.log('Verifying payment:', {
        userId,
        paymentReference,
        paymentMethod
      });

      // Get payment provider
      const { PaymentProviderFactory } = require('../providers/PaymentProvider');
      // Check test environment FIRST to ensure tests always use mock provider
      const providerName = (process.env.NODE_ENV === 'test' || paymentMethod === 'mock') ? 'mock' : 'flutterwave';
      const provider = PaymentProviderFactory.getProvider(providerName);

      // Verify payment
      const verificationResult = await provider.verifyPayment(paymentReference);

      console.log('Payment verification result:', verificationResult);

      if (verificationResult.success && verificationResult.status === 'success') {
        // Get plan ID from verification result or find active subscription
        let planId = verificationResult.planId;
        
        if (!planId) {
          // Find pending subscription for this user with this payment reference
          const { UserSubscription } = require('../../models');
          const subscription = await UserSubscription.findOne({
            where: {
              userId: userId,
              paymentReference: paymentReference,
              status: 'pending'
            },
            order: [['createdAt', 'DESC']]
          });

          if (subscription) {
            planId = subscription.planId;
          }
        }

        if (planId) {
          // Update subscription status
          await subscriptionService.updateUserSubscriptionStatus(
            userId,
            'active',
            planId,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          );

          // Update subscription record
          const { UserSubscription } = require('../../models');
          await UserSubscription.update(
            {
              status: 'active',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
              where: {
                userId: userId,
                paymentReference: paymentReference,
                status: 'pending'
              }
            }
          );

          // Get updated subscription
          const subscription = await UserSubscription.findOne({
            where: {
              userId: userId,
              paymentReference: paymentReference,
              status: 'active'
            },
            include: [{
              model: require('../../models').SubscriptionPlan,
              as: 'plan'
            }]
          });

          return res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
              status: 'success',
              subscription: subscription ? {
                id: subscription.id,
                planId: subscription.planId,
                status: subscription.status,
                plan: subscription.plan ? {
                  name: subscription.plan.name,
                  displayName: subscription.plan.display_name,
                  price: subscription.plan.price,
                  currency: subscription.plan.currency
                } : null
              } : null
            }
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'Subscription not found for this payment'
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: verificationResult
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying payment',
        error: error.message
      });
    }
  }

  static async verifyApplePurchase(req, res) {
    try {
      const userId = req.user.id;
      const { receiptData, productId, transactionId } = req.body;

      if (!receiptData || !productId) {
        return res.status(400).json({
          success: false,
          message: 'Receipt data and productId are required'
        });
      }

      console.log('Verifying Apple Purchase:', {
        userId,
        productId,
        transactionId
      });

      const axios = require('axios');
      // Apple's verification endpoint
      // Use sandbox for test, production for live. The best practice is to call prod, if status=21007, call sandbox
      const isProduction = process.env.NODE_ENV === 'production';
      const hasSharedSecret = process.env.APPLE_SHARED_SECRET && process.env.APPLE_SHARED_SECRET.trim() !== "";
      
      let latestSub = null;
      let expiresDateMs = null;

      if (!isProduction && !hasSharedSecret) {
        console.warn('⚠️ WARNING: APPLE_SHARED_SECRET is not configured in .env. Bypassing Apple verification for local testing.');
        latestSub = {
          expires_date_ms: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
          transaction_id: transactionId || `MOCK_APPLE_TX_${Date.now()}`
        };
        expiresDateMs = parseInt(latestSub.expires_date_ms);
      } else {
        let verifyUrl = isProduction 
          ? 'https://buy.itunes.apple.com/verifyReceipt' 
          : 'https://sandbox.itunes.apple.com/verifyReceipt';

        const verifyPayload = {
          'receipt-data': receiptData,
          'password': process.env.APPLE_SHARED_SECRET // required for auto-renewable subscriptions
        };

        console.log(`Sending receipt verification to Apple: ${verifyUrl}`);
        let appleResponse;
        try {
          appleResponse = await axios.post(verifyUrl, verifyPayload, { timeout: 25000 });
          console.log(`Apple verifyReceipt status: ${appleResponse.status}, status field in data: ${appleResponse.data.status}`);
        } catch (postErr) {
          console.error('Error posting to Apple verifyReceipt:', {
            message: postErr.message,
            code: postErr.code,
            response: postErr.response ? {
              status: postErr.response.status,
              data: postErr.response.data
            } : null
          });
          throw postErr;
        }

        // Status 21007 means this is a sandbox receipt, but it was sent to production
        if (appleResponse.data.status === 21007 && isProduction) {
            verifyUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
            console.log(`Redirecting verification to Apple Sandbox: ${verifyUrl}`);
            try {
              appleResponse = await axios.post(verifyUrl, verifyPayload, { timeout: 25000 });
              console.log(`Apple Sandbox verifyReceipt status: ${appleResponse.status}, status field in data: ${appleResponse.data.status}`);
            } catch (sandboxErr) {
              console.error('Error posting to Apple Sandbox verifyReceipt:', {
                message: sandboxErr.message,
                code: sandboxErr.code,
                response: sandboxErr.response ? {
                  status: sandboxErr.response.status,
                  data: sandboxErr.response.data
                } : null
              });
              throw sandboxErr;
            }
        }

        if (appleResponse.data.status !== 0) {
            console.warn(`Apple verification failed with status code: ${appleResponse.data.status}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid Apple receipt',
                appleStatus: appleResponse.data.status
            });
        }

        let latestReceiptInfo = appleResponse.data.latest_receipt_info;
        // Fallback to checking receipt.in_app if latest_receipt_info is not present
        if (!latestReceiptInfo && appleResponse.data.receipt && appleResponse.data.receipt.in_app) {
            latestReceiptInfo = appleResponse.data.receipt.in_app;
        }

        if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
            console.warn('No subscription or in-app purchase information found in Apple response receipt');
            return res.status(400).json({
                success: false,
                message: 'No subscription information found in receipt'
            });
        }

        // Sort to get the most recent transaction
        latestReceiptInfo.sort((a, b) => parseInt(b.expires_date_ms || 0) - parseInt(a.expires_date_ms || 0));
        latestSub = latestReceiptInfo[0];
        console.log(`Latest transaction found: transaction_id: ${latestSub.transaction_id}, product_id: ${latestSub.product_id}, expires_date: ${latestSub.expires_date}`);

        // Validate bundle ID (optional but recommended)
        if (appleResponse.data.receipt && appleResponse.data.receipt.bundle_id !== (process.env.APPLE_BUNDLE_ID || 'com.oceanpulse.bluewhale')) {
            console.warn('Bundle ID mismatch:', appleResponse.data.receipt.bundle_id, 'expected:', process.env.APPLE_BUNDLE_ID || 'com.oceanpulse.bluewhale');
        }

        expiresDateMs = latestSub.expires_date_ms ? parseInt(latestSub.expires_date_ms) : null;
      }

      // Check if subscription has expired
      const now = Date.now();
      if (expiresDateMs && now > expiresDateMs) {
          return res.status(400).json({
              success: false,
              message: 'Apple subscription has expired'
          });
      }

      const endDate = expiresDateMs ? new Date(expiresDateMs) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Map Apple productId to our internal planId
      let targetPlan = null;
      try {
           const { SubscriptionPlan } = require('../../models');
           targetPlan = await SubscriptionPlan.findOne({
              where: { name: productId }
           });
           
           if (!targetPlan) {
              const knownPlans = ['drift', 'wave', 'tide', 'surge'];
              const matchedName = knownPlans.find(name => productId.toLowerCase().includes(name));
              if (matchedName) {
                targetPlan = await SubscriptionPlan.findOne({
                  where: { name: matchedName }
                });
              }
           }
           
           if (!targetPlan) {
              targetPlan = await SubscriptionPlan.findOne({ where: { isActive: true }}); // Fallback active plan
           }
      } catch (err) {
           console.error("Could not fetch plan", err);
      }
      
      const planId = targetPlan ? targetPlan.id : 1; 

      // Make sure user is a seller
      const { UserTable, SellersTable } = require('../../models');
      await UserTable.update(
          { accountType: 'seller' },
          { where: { id: userId } }
      );

      // Create or update Seller record
      const existingSeller = await SellersTable.findOne({ where: { userId } });
      if (!existingSeller) {
          const userObj = await UserTable.findByPk(userId);
          await SellersTable.create({
              userId,
              fullName: userObj ? userObj.fullName : '',
              verificationStatus: 'approved',
              businessName: `Seller-${userId.substring(0,6)}`,
          });
      } else {
          await SellersTable.update({ verificationStatus: 'approved' }, { where: { userId } });
      }

      // Update subscription status
      await subscriptionService.updateUserSubscriptionStatus(
        userId,
        'active',
        planId,
        endDate
      );

      // Track transaction
      const { UserSubscription } = require('../../models');
      const reference = transactionId || latestSub.transaction_id || `APPLE_${Date.now()}`;
      
      // 1. Try to find by Apple transaction reference first
      let subscriptionObj = await UserSubscription.findOne({
          where: { paymentReference: reference, userId }
      });
      
      // 2. If not found, try to find the most recent pending Apple subscription for this user
      if (!subscriptionObj) {
          subscriptionObj = await UserSubscription.findOne({
              where: { 
                userId,
                status: 'pending',
                paymentMethod: 'apple_iap'
              },
              order: [['createdAt', 'DESC']]
          });
      }
      
      const planPrice = targetPlan ? targetPlan.price : 0;
      const planCurrency = targetPlan ? targetPlan.currency : 'USD';

      if (!subscriptionObj) {
          // 3. Create a new active subscription if none exists
          subscriptionObj = await UserSubscription.create({
              userId: userId,
              planId: planId,
              status: 'active',
              startDate: new Date(),
              endDate: endDate,
              paymentReference: reference,
              paymentMethod: 'apple_iap',
              amountPaid: planPrice, 
              currency: planCurrency
          });
      } else {
          // 4. Update the existing subscription (either pending or active)
          await subscriptionObj.update({ 
              status: 'active',
              planId: planId,
              endDate: endDate, 
              paymentReference: reference,
              paymentMethod: 'apple_iap',
              amountPaid: planPrice || subscriptionObj.amountPaid,
              currency: planCurrency || subscriptionObj.currency
          });
      }

      console.log('✅ Apple purchase verified and activated in DB successfully for user:', userId);
      return res.status(200).json({
          success: true,
          message: 'Apple In-App Purchase verified successfully',
          data: {
              status: 'active',
              expiresAt: endDate,
              subscription: {
                  id: subscriptionObj.id,
                  planId: planId
              }
          }
      });

    } catch (error) {
      console.error('Error verifying Apple purchase:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying Apple purchase',
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
      const { planId, paymentMethod, actualPaymentMethod } = req.body;

      console.log('Change plan request:', { userId, planId, paymentMethod, actualPaymentMethod, body: req.body });

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
        price: targetPlan.price
      } : 'null');
      
      if (!targetPlan) {
        return res.status(404).json({
          success: false,
          message: 'Target subscription plan not found',
          searchedPlan: planId
        });
      }

      // Get currency for target plan
      const currency = getSellerCurrency(seller.country) || 'NGN';
      const price = currency === 'USD' ? targetPlan.priceUsd : targetPlan.price;

      // Cancel existing subscription if it has Flutterwave subscription ID
      const currentSubscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      if (currentSubscriptionStatus.hasActiveSubscription && currentSubscriptionStatus.subscription?.flutterwaveSubscriptionId) {
        const { PaymentProviderFactory } = require('../providers/PaymentProvider');
        const providerName = (process.env.NODE_ENV === 'test') ? 'mock' : 'flutterwave';
        const paymentProvider = PaymentProviderFactory.getProvider(providerName);
        
        try {
          await paymentProvider.cancelSubscription(currentSubscriptionStatus.subscription.flutterwaveSubscriptionId);
          console.log('Cancelled existing Flutterwave subscription:', currentSubscriptionStatus.subscription.flutterwaveSubscriptionId);
        } catch (error) {
          console.error('Error cancelling existing subscription:', error);
          // Continue with new subscription creation even if cancellation fails
        }
      }

      // Check if Apple payment method is requested
      const isApple = (val) => {
        if (!val) return false;
        const v = val.toLowerCase().trim();
        return v === 'apple' || v === 'apple_iap' || v === 'applepay' || v === 'apple_pay' || v === 'iap';
      };

      if (isApple(paymentMethod) || isApple(actualPaymentMethod)) {
        const reference = `APPLE_PENDING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = await subscriptionService.createSubscription(userId, targetPlan.id, {
          reference: reference,
          method: 'apple_iap',
          amount: price,
          currency: currency
        });

        console.log('Created pending Apple subscription for plan change:', {
          userId,
          planId: targetPlan.id,
          reference
        });

        return res.json({
          success: true,
          message: 'Plan change initiated for Apple. Complete payment on device and verify receipt.',
          data: {
            currentPlan: eligibility.currentPlan,
            targetPlan: targetPlan,
            subscription: {
              subscriptionId: reference,
              hasCheckoutUrl: false,
              checkoutUrl: null
            },
            payment: {
              amount: price,
              currency: currency
            }
          }
        });
      }

      // Create new subscription for plan change
      const { PaymentProviderFactory } = require('../providers/PaymentProvider');
      const { getFlutterwavePlanId } = require('../utils/flutterwavePlanHelper');
      const providerName = (process.env.NODE_ENV === 'test') ? 'mock' : 'flutterwave';
      const paymentProvider = PaymentProviderFactory.getProvider(providerName);
      
      const flutterwavePlanId = getFlutterwavePlanId(targetPlan.name, currency);
      if (!flutterwavePlanId) {
        return res.status(400).json({
          success: false,
          message: `Flutterwave plan ID not configured for ${targetPlan.name} (${currency}). Please contact support.`
        });
      }

      const subscriptionResult = await paymentProvider.createSubscription(userId, targetPlan.id, {
        email: user.email,
        name: user.fullName || user.username || 'Customer',
        phone: user.phoneNumber || user.phone || '',
        amount: price,
        currency: currency,
        planName: targetPlan.name,
        flutterwavePlanId: flutterwavePlanId
      });

      if (!subscriptionResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create subscription for plan change',
          error: subscriptionResult.message
        });
      }

      res.json({
        success: true,
        message: 'Plan change initiated. Complete payment setup to activate new plan.',
        data: {
          currentPlan: eligibility.currentPlan,
          targetPlan: targetPlan,
          subscription: {
            subscriptionId: subscriptionResult.subscriptionId,
            checkoutUrl: subscriptionResult.checkoutUrl,
            emailToken: subscriptionResult.emailToken
          },
          payment: {
            amount: price,
            currency: currency
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

      // Cancel Flutterwave subscription if it exists
      if (currentSubscriptionStatus.hasActiveSubscription && 
          currentSubscriptionStatus.subscription?.flutterwaveSubscriptionId) {
        const { PaymentProviderFactory } = require('../providers/PaymentProvider');
        const providerName = (process.env.NODE_ENV === 'test') ? 'mock' : 'flutterwave';
        const paymentProvider = PaymentProviderFactory.getProvider(providerName);
        
        try {
          await paymentProvider.cancelSubscription(currentSubscriptionStatus.subscription.flutterwaveSubscriptionId);
          console.log('Cancelled Flutterwave subscription:', currentSubscriptionStatus.subscription.flutterwaveSubscriptionId);
        } catch (error) {
          console.error('Error cancelling Flutterwave subscription:', error);
          // Continue with database cancellation even if Flutterwave cancellation fails
        }
      }

      let success;
      try {
        success = await subscriptionService.cancelSubscription(userId, reason);
      } catch (error) {
        // Handle service errors properly
        if (error.message.includes('No active subscription')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
        throw error; // Re-throw other errors
      }
      
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
      // Extract user ID from metadata
      const userId = paymentData.metadata?.userId || paymentData.customer?.id;
      const planId = paymentData.metadata?.planId;
      
      if (!userId) {
        console.error('No user ID found in payment data');
        return;
      }
      
      // Update subscription status
      await subscriptionService.updateUserSubscriptionStatus(
        userId,
        'active',
        planId,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      );
      
      console.log('Subscription activated for user:', userId);
    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }
  
  /**
   * Handle failed payment
   */
  static async handleFailedPayment(paymentData) {
    try {
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
      
      if (paymentResult.status === 'success') {
        // Update subscription status
        await subscriptionService.updateUserSubscriptionStatus(
          paymentResult.userId,
          'active',
          paymentResult.planId,
          paymentResult.expiresAt
        );

        res.json({
          success: true,
          message: 'Payment confirmed and subscription activated'
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
      
      // Verify payment with Flutterwave (Paystack removed)
      console.log('Verifying payment with Flutterwave API...');
      const paymentResult = await PaymentProvider.verifyPayment(reference || trxref);
      
      console.log('Payment verification result:', paymentResult);
      
      if (paymentResult.success && paymentResult.status === 'success') {
        console.log('Updating subscription status:', {
          userId: paymentResult.userId,
          planId: paymentResult.planId,
          expiresAt: paymentResult.expiresAt
        });
        
        // Update subscription status
        await subscriptionService.updateUserSubscriptionStatus(
          paymentResult.userId,
          'active',
          paymentResult.planId,
          paymentResult.expiresAt
        );
        
        // Send subscription confirmation email
        try {
          const user = await subscriptionService.getUserById(paymentResult.userId);
          const plan = await subscriptionService.getPlanById(paymentResult.planId);
          
          if (user && plan) {
            // Check if this is a plan change or new subscription
            const currentSubscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(subscription.userId);
            const isPlanChange = currentSubscriptionStatus.hasActiveSubscription && currentSubscriptionStatus.plan && currentSubscriptionStatus.plan.id !== subscription.planId;
            
            let emailTemplate;
            
            if (isPlanChange && currentSubscriptionStatus.hasActiveSubscription) {
              // Plan change email
              emailTemplate = emailTemplates.subscriptionChanged(
                user.fullName,
                currentSubscriptionStatus.plan.displayName,
                plan.displayName,
                plan.price,
                plan.currency,
                paymentResult.expiresAt
              );
              console.log('📈 Sending plan change email');
            } else {
              // New subscription email
              emailTemplate = emailTemplates.subscriptionCreated(
                user.fullName,
                plan.displayName,
                plan.price,
                plan.currency,
                paymentResult.expiresAt
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
              planId: paymentResult.planId,
              status: 'active',
              expiresAt: paymentResult.expiresAt
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

  /**
   * Handle Flutterwave payment webhook
   * POST /api/subscriptions/webhooks/flutterwave
   */
  static async handleFlutterwaveWebhook(req, res) {
    try {
      const { PaymentProviderFactory } = require('../providers/PaymentProvider');
      const provider = PaymentProviderFactory.getProvider('flutterwave');
      
      // Verify webhook signature
      const isValid = await provider.verifyWebhookSignature(
        'flutterwave',
        req.body,
        req.headers
      );
      
      if (!isValid) {
        console.log('Invalid Flutterwave webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
      
      console.log('Valid Flutterwave webhook signature received');
      console.log('Webhook event:', req.body.event);
      
      // Process webhook
      const result = await provider.processWebhook('flutterwave', req.body);
      
      // Handle subscription renewal events
      if (result.eventType === 'subscription_renewal' && result.success) {
        const { UserSubscription } = require('../../models');
        
        // Find subscription by Flutterwave subscription ID
        const subscription = await UserSubscription.findOne({
          where: { flutterwaveSubscriptionId: result.subscriptionId }
        });
        
        if (subscription) {
          // Update subscription with new billing period
          const nextBillingDate = result.nextBillingDate ? new Date(result.nextBillingDate) : null;
          const newEndDate = nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
          
          await subscription.update({
            status: 'active',
            endDate: newEndDate,
            nextBillingDate: nextBillingDate,
            paymentReference: result.reference,
            amountPaid: result.amount,
            currency: result.currency
          });
          
          console.log('✅ Subscription renewed successfully:', {
            subscriptionId: subscription.id,
            flutterwaveSubscriptionId: result.subscriptionId,
            nextBillingDate: nextBillingDate
          });
        } else {
          console.warn('⚠️ Subscription not found for Flutterwave subscription ID:', result.subscriptionId);
        }
      } else if (result.eventType === 'subscription_cancelled' && result.success) {
        const { UserSubscription } = require('../../models');
        
        // Find and cancel subscription
        const subscription = await UserSubscription.findOne({
          where: { flutterwaveSubscriptionId: result.subscriptionId }
        });
        
        if (subscription) {
          await subscription.update({
            status: 'cancelled',
            cancelledAt: new Date()
          });
          
          console.log('✅ Subscription cancelled via webhook:', {
            subscriptionId: subscription.id,
            flutterwaveSubscriptionId: result.subscriptionId
          });
        }
      } else if (result.success && result.paymentStatus === 'success') {
        // Handle one-time payment success (for initial subscription setup)
        await SubscriptionController.handleSuccessfulPayment({
          reference: result.reference,
          flwRef: result.flwRef,
          metadata: {
            userId: result.userId,
            planId: result.planId
          },
          amount: result.amount,
          currency: result.currency,
          created_at: result.paidAt
        });
      } else if (!result.success && result.paymentStatus === 'failed') {
        // Handle failed payment
        await SubscriptionController.handleFailedPayment({
          reference: result.reference,
          message: result.message
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
      
    } catch (error) {
      console.error('Error handling Flutterwave webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error: error.message
      });
    }
  }

  /**
   * Handle Flutterwave payment callback (redirect after payment)
   * GET /api/subscriptions/callback/flutterwave
   */
  static async handleFlutterwaveCallback(req, res) {
    try {
      // Flutterwave redirects with query parameters
      // Check for both tx_ref and transaction_id
      const { tx_ref, transaction_id, status, flw_ref, reference } = req.query;
      
      console.log('Flutterwave callback received:', { 
        tx_ref, 
        transaction_id, 
        status, 
        flw_ref,
        reference,
        allParams: req.query 
      });
      
      // Flutterwave sends tx_ref in the redirect URL, but verification needs transaction_id
      // Use transaction_id first (Flutterwave's actual transaction ID), then tx_ref, then flw_ref
      const paymentReference = transaction_id || tx_ref || flw_ref || reference;
      
      if (!paymentReference) {
        console.warn('No payment reference found in callback (user may not have completed payment)');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/error?message=${encodeURIComponent('Payment reference not found')}`);
      }

      // Verify payment with Flutterwave
      const { PaymentProviderFactory } = require('../providers/PaymentProvider');
      const provider = PaymentProviderFactory.getProvider('flutterwave');
      
      console.log('Verifying payment with Flutterwave API using reference:', paymentReference);
      console.log('Available references:', { transaction_id, tx_ref, flw_ref, reference });
      const paymentResult = await provider.verifyPayment(paymentReference);
      
      console.log('Payment verification result:', paymentResult);
      
      if (paymentResult.success && paymentResult.status === 'success') {
        // Find pending subscription by tx_ref (our custom reference)
        // We use tx_ref to find the subscription because that's what we stored
        const { UserSubscription } = require('../../models');
        let subscription = await UserSubscription.findOne({
          where: {
            paymentReference: tx_ref || paymentReference, // Use tx_ref to find subscription
            status: 'pending'
          },
          order: [['created_at', 'DESC']]
        });

        if (!subscription) {
          console.error('Pending subscription not found for reference:', paymentReference);
          // Try to find by userId and planId from verification result
          if (paymentResult.userId && paymentResult.planId) {
            const subscriptionByUser = await UserSubscription.findOne({
              where: {
                userId: paymentResult.userId,
                planId: paymentResult.planId,
                status: 'pending'
              },
              order: [['created_at', 'DESC']]
            });
            
            if (subscriptionByUser) {
              console.log('Found subscription by userId and planId, updating payment reference');
              await subscriptionByUser.update({
                paymentReference: paymentReference
              });
              // Use this subscription
              subscription = subscriptionByUser;
            }
          }
          
          if (!subscription) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/error?message=${encodeURIComponent('Subscription not found')}`);
          }
        }

        // Activate subscription
        await subscription.update({
          status: 'active',
          startDate: new Date()
        });

        // Update user subscription status
        await subscriptionService.updateUserSubscriptionStatus(
          subscription.userId,
          'active',
          subscription.planId,
          subscription.endDate
        );
        
        // Send subscription confirmation email
        try {
          const user = await subscriptionService.getUserById(subscription.userId);
          const plan = await subscriptionService.getPlanById(subscription.planId);
          
          if (user && plan) {
            // Check if this is a plan change or new subscription
            const currentSubscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(subscription.userId);
            const isPlanChange = currentSubscriptionStatus.hasActiveSubscription && currentSubscriptionStatus.plan && currentSubscriptionStatus.plan.id !== subscription.planId;
            
            let emailTemplate;
            
            if (isPlanChange && currentSubscriptionStatus.hasActiveSubscription) {
              // Plan change email
              emailTemplate = emailTemplates.subscriptionChanged(
                user.fullName,
                currentSubscriptionStatus.plan.displayName,
                plan.displayName,
                plan.price,
                plan.currency,
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              );
              console.log('📈 Sending plan change email');
            } else {
              // New subscription email
              emailTemplate = emailTemplates.subscriptionCreated(
                user.fullName,
                plan.displayName,
                plan.price,
                plan.currency,
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              );
              console.log('🎉 Sending new subscription email');
            }
            
            await sendEmail(user.email, emailTemplate.subject, emailTemplate.html, 'subscription');
            console.log('✅ Subscription email sent to:', user.email);
          }
        } catch (emailError) {
          console.error('Error sending subscription email:', emailError);
        }
        
        // Redirect to success page (mobile app deep link or web page)
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?reference=${paymentReference}`);
      } else {
        console.warn('Payment verification failed (expected when user did not complete payment):', paymentResult.message);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/error?message=${encodeURIComponent(paymentResult.message || 'Payment verification failed')}`);
      }
    } catch (error) {
      console.error('Error handling Flutterwave callback:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/error?message=${encodeURIComponent(error.message || 'Error processing payment')}`);
    }
  }
}

module.exports = SubscriptionController;