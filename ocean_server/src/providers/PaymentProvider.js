const axios = require('axios');

/**
 * Payment Provider Interface
 * 
 * Abstract interface for payment providers with Paystack implementation
 * and stubs for other providers (Stripe, Flutterwave)
 */

class PaymentProviderInterface {
  /**
   * Create a payment intent
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} paymentData - Payment details
   * @returns {Object} Payment intent with reference and checkout URL
   */
  async createPaymentIntent(userId, planId, paymentData) {
    throw new Error('createPaymentIntent must be implemented by provider');
  }

  /**
   * Verify payment status
   * @param {string} paymentReference - Payment reference
   * @returns {Object} Payment verification result
   */
  async verifyPayment(paymentReference) {
    throw new Error('verifyPayment must be implemented by provider');
  }

  /**
   * Verify webhook signature
   * @param {string} provider - Provider name
   * @param {Object} webhookData - Webhook payload
   * @param {Object} headers - Request headers
   * @returns {boolean} Signature validity
   */
  async verifyWebhookSignature(provider, webhookData, headers) {
    throw new Error('verifyWebhookSignature must be implemented by provider');
  }

  /**
   * Process webhook
   * @param {string} provider - Provider name
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processing result
   */
  async processWebhook(provider, webhookData) {
    throw new Error('processWebhook must be implemented by provider');
  }

  /**
   * Create a subscription (recurring billing)
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} subscriptionData - Subscription details (email, name, phone, currency, flutterwavePlanId)
   * @returns {Object} Subscription details with subscription ID and checkout URL
   */
  async createSubscription(userId, planId, subscriptionData) {
    throw new Error('createSubscription must be implemented by provider');
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Flutterwave subscription ID
   * @returns {Object} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    throw new Error('cancelSubscription must be implemented by provider');
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Flutterwave subscription ID
   * @returns {Object} Subscription details
   */
  async getSubscription(subscriptionId) {
    throw new Error('getSubscription must be implemented by provider');
  }
}

/**
 * Mock Payment Provider
 * 
 * Development/testing payment provider that simulates payment flows
 * without requiring real payment processing
 */
class MockPaymentProvider extends PaymentProviderInterface {
  
  async createPaymentIntent(userId, planId, paymentData) {
    try {
      // Generate mock payment reference
      const reference = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return {
        success: true,
        reference: reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        checkoutUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/mock/${reference}`,
        expiresAt: expiresAt,
        status: 'pending'
      };
    } catch (error) {
      console.error('Mock payment provider error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentReference) {
    try {
      // Mock payment verification - always succeeds for development
      if (paymentReference.startsWith('mock_') || paymentReference.startsWith('test_')) {
        return {
          success: true,
          status: 'success',
          userId: 'mock_user_id', // This would be extracted from the reference in real implementation
          planId: 1, // This would be extracted from the reference in real implementation
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          amount: 1500,
          currency: 'NGN'
        };
      }

      return {
        status: 'failed',
        reason: 'Invalid payment reference'
      };
    } catch (error) {
      console.error('Mock payment verification error:', error);
      return {
        status: 'failed',
        reason: error.message
      };
    }
  }

  async verifyWebhookSignature(provider, webhookData, headers) {
    try {
      // Mock webhook verification - always succeeds for development
      console.log(`Mock webhook verification for ${provider}:`, {
        hasSignature: !!headers['x-webhook-signature'],
        hasData: !!webhookData
      });
      
      return true; // Always return true for mock
    } catch (error) {
      console.error('Mock webhook verification error:', error);
      return false;
    }
  }

  async processWebhook(provider, webhookData) {
    try {
      // Mock webhook processing
      console.log(`Mock webhook processing for ${provider}:`, webhookData);
      
      // Simulate successful payment
      return {
        success: true,
        paymentStatus: 'success',
        userId: 'mock_user_id',
        planId: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 1500,
        currency: 'NGN'
      };
    } catch (error) {
      console.error('Mock webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Paystack Payment Provider Implementation
 */
class PaystackProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.baseUrl = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
  }

  /**
   * Create a payment intent with Paystack
   */
  async createPaymentIntent(userId, planId, paymentData) {
    try {
      console.log('Creating Paystack payment intent:', {
        userId,
        planId,
        email: paymentData.email,
        paystackPlanCode: paymentData.paystackPlanCode,
        amount: paymentData.amount,
        amountInKobo: paymentData.amount * 100,
        currency: paymentData.currency
      });

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await axios.post(`${this.baseUrl}/transaction/initialize`, {
        email: paymentData.email,
        plan: paymentData.paystackPlanCode, // Use plan code for subscription
        amount: paymentData.amount * 100, // Still need amount in kobo
        currency: 'NGN',
        callback_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/subscriptions/callback/paystack`,
        metadata: {
          userId: userId,
          planId: planId,
          paystackPlanCode: paymentData.paystackPlanCode,
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: userId
            },
            {
              display_name: 'Plan ID',
              variable_name: 'plan_id',
              value: planId
            },
            {
              display_name: 'Paystack Plan Code',
              variable_name: 'paystack_plan_code',
              value: paymentData.paystackPlanCode
            }
          ]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/',
          'Connection': 'keep-alive'
        }
      });

      console.log('Paystack API response status:', response.status);
      const result = response.data;
      console.log('Paystack API response:', result);
      
      if (result.status) {
        return {
          success: true,
          reference: result.data.reference,
          checkoutUrl: result.data.authorization_url,
          accessCode: result.data.access_code,
          amount: paymentData.amount,
          currency: paymentData.currency,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to create payment intent'
        };
      }
    } catch (error) {
      console.error('Paystack payment intent error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Paystack API error response:', error.response.data);
        return {
          success: false,
          message: `Paystack API error: ${error.response.status} ${error.response.statusText}`,
          details: error.response.data
        };
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received from Paystack API');
        return {
          success: false,
          message: 'No response received from Paystack API',
          error: error.message
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          message: 'Error creating payment intent',
          error: error.message
        };
      }
    }
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(paymentReference) {
    try {
      console.log('Verifying payment with Paystack:', paymentReference);
      
      const response = await fetch(`${this.baseUrl}/transaction/verify/${paymentReference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Paystack API response status:', response.status);
      
      if (!response.ok) {
        console.log('Paystack API error:', response.status, response.statusText);
        return {
          success: false,
          status: 'failed',
          message: `Paystack API error: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      console.log('Paystack verification result:', result);
      
      if (result.status && result.data.status === 'success') {
        // Get the plan ID from the plan name if needed
        let planId = result.data.metadata?.planId;
        
        // If planId is a string (plan name), convert it to integer ID
        if (typeof planId === 'string') {
          const { SubscriptionPlan } = require('../../models');
          const plan = await SubscriptionPlan.findOne({
            where: { name: planId }
          });
          if (plan) {
            planId = plan.id;
          }
        }
        
        return {
          success: true,
          status: 'success',
          userId: result.data.metadata?.userId,
          planId: planId,
          amount: result.data.amount / 100, // Convert from kobo
          reference: result.data.reference,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: result.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      
      // If it's a JSON parse error, it means we got HTML instead of JSON
      if (error.message.includes('Unexpected token')) {
        console.log('Received HTML response instead of JSON - check Paystack configuration');
        return {
          success: false,
          status: 'error',
          message: 'Invalid API response - check Paystack configuration'
        };
      }
      
      return {
        success: false,
        status: 'error',
        message: 'Error verifying payment',
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature (handled in controller)
   */
  async verifyWebhookSignature(provider, webhookData, headers) {
    // This is handled in the controller using HMAC SHA512
    return true;
  }

  /**
   * Process webhook (handled in controller)
   */
  async processWebhook(provider, webhookData) {
    // This is handled in the controller
    return { success: true };
  }
}

/**
 * Stripe Payment Provider (Stub)
 * 
 * Stub implementation for Stripe payment processing
 * To be implemented when Stripe integration is needed
 */
class StripePaymentProvider extends PaymentProviderInterface {
  
  async createPaymentIntent(userId, planId, paymentData) {
    try {
      // TODO: Implement Stripe payment intent creation
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({...});
      
      throw new Error('Stripe payment provider not implemented yet');
    } catch (error) {
      console.error('Stripe payment provider error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentReference) {
    try {
      // TODO: Implement Stripe payment verification
      throw new Error('Stripe payment verification not implemented yet');
    } catch (error) {
      console.error('Stripe payment verification error:', error);
      throw error;
    }
  }

  async verifyWebhookSignature(provider, webhookData, headers) {
    try {
      // TODO: Implement Stripe webhook signature verification
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const signature = headers['stripe-signature'];
      // const event = stripe.webhooks.constructEvent(webhookData, signature, process.env.STRIPE_WEBHOOK_SECRET);
      
      throw new Error('Stripe webhook verification not implemented yet');
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      return false;
    }
  }

  async processWebhook(provider, webhookData) {
    try {
      // TODO: Implement Stripe webhook processing
      throw new Error('Stripe webhook processing not implemented yet');
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      throw error;
    }
  }
}

/**
 * Paystack Payment Provider (Stub)
 * 
 * Stub implementation for Paystack payment processing
 * To be implemented when Paystack integration is needed
 */
class PaystackPaymentProvider extends PaymentProviderInterface {
  
  async createPaymentIntent(userId, planId, paymentData) {
    try {
      // TODO: Implement Paystack payment intent creation
      // const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
      // const response = await paystack.transaction.initialize({...});
      
      throw new Error('Paystack payment provider not implemented yet');
    } catch (error) {
      console.error('Paystack payment provider error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentReference) {
    try {
      // TODO: Implement Paystack payment verification
      throw new Error('Paystack payment verification not implemented yet');
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      throw error;
    }
  }

  async verifyWebhookSignature(provider, webhookData, headers) {
    try {
      // TODO: Implement Paystack webhook signature verification
      // const crypto = require('crypto');
      // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(webhookData).digest('hex');
      // return hash === headers['x-paystack-signature'];
      
      throw new Error('Paystack webhook verification not implemented yet');
    } catch (error) {
      console.error('Paystack webhook verification error:', error);
      return false;
    }
  }

  async processWebhook(provider, webhookData) {
    try {
      // TODO: Implement Paystack webhook processing
      throw new Error('Paystack webhook processing not implemented yet');
    } catch (error) {
      console.error('Paystack webhook processing error:', error);
      throw error;
    }
  }
}

/**
 * Flutterwave Payment Provider Implementation
 * 
 * Implements payment processing using Flutterwave API
 * Supports: Card payments, Virtual Accounts, Google Pay
 */
class FlutterwaveProvider extends PaymentProviderInterface {
  constructor() {
    super();
    // Removed tokenManager - not used, we use SECRET_KEY directly for API calls
    this.baseUrl = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';
    this.publicKey = process.env.FLW_PUBLIC_KEY;
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET; // For webhook verification
  }

  /**
   * Create a payment intent with Flutterwave
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} paymentData - Payment details
   * @returns {Object} Payment intent with reference and checkout URL
   */
  async createPaymentIntent(userId, planId, paymentData) {
    try {
      // Use SECRET_KEY directly (not OAuth token) as per Flutterwave documentation
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured. Please set FLW_SECRET_KEY in environment variables.');
      }

      // Validate SECRET_KEY format (should start with FLWSECK_TEST- or FLWSECK-)
      if (!this.secretKey.startsWith('FLWSECK_TEST-') && !this.secretKey.startsWith('FLWSECK-')) {
        console.error('⚠️ Invalid SECRET_KEY format. Should start with FLWSECK_TEST- (sandbox) or FLWSECK- (production)');
        console.error('Current key format:', this.secretKey.substring(0, 15) + '...');
        throw new Error('Invalid Flutterwave SECRET_KEY format. Please check your FLW_SECRET_KEY environment variable.');
      }

      console.log('Creating Flutterwave payment intent:', {
        userId,
        planId,
        email: paymentData.email,
        amount: paymentData.amount,
        currency: paymentData.currency,
        secretKeyFormat: this.secretKey.substring(0, 15) + '...', // Log first 15 chars only
        secretKeyLength: this.secretKey.length
      });

      // Generate unique transaction reference
      const txRef = `OCEAN_SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert amount to number
      const amount = typeof paymentData.amount === 'string' 
        ? parseFloat(paymentData.amount) 
        : (typeof paymentData.amount === 'number' ? paymentData.amount : 0);
      
      if (amount <= 0) {
        throw new Error('Invalid payment amount. Amount must be greater than 0.');
      }

      // Fix redirect URL to prevent double slashes
      const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
      const redirectUrl = `${baseUrl}/api/subscriptions/callback/flutterwave`;

      // Prepare payment request (simplified structure as per guide)
      const paymentRequest = {
        tx_ref: txRef,
        amount: amount,
        currency: paymentData.currency || 'NGN',
        redirect_url: redirectUrl,
        customer: {
          email: paymentData.email,
          name: paymentData.name || 'Customer',
          ...(paymentData.phone && { phonenumber: paymentData.phone })
        },
        customizations: {
          title: `Ocean Subscription - ${paymentData.planName || 'Plan'}`,
          description: `Subscription payment for ${paymentData.planName || 'plan'}`,
          ...(process.env.APP_LOGO_URL && { logo: process.env.APP_LOGO_URL })
        },
        meta: {
          userId: userId,
          planId: planId,
          planName: paymentData.planName || '',
          billingPeriod: paymentData.billingPeriod || 'monthly'
        }
      };

      console.log('Making Flutterwave API request:', {
        url: `${this.baseUrl}/payments`,
        method: 'POST',
        hasSecretKey: !!this.secretKey,
        secretKeyPrefix: this.secretKey.substring(0, 15) + '...',
        baseUrl: this.baseUrl
      });

      // Make API request using SECRET_KEY (not OAuth token)
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey.trim()}`, // Trim any whitespace
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('Flutterwave API response received:', {
        status: response.status,
        dataStatus: response.data?.status,
        hasData: !!response.data?.data,
        responseKeys: Object.keys(response.data || {}),
        link: response.data?.data?.link,
        flwRef: response.data?.data?.flw_ref
      });

      if (response.data.status === 'success') {
        const paymentResponse = response.data.data;
        
        console.log('Payment response data:', {
          hasLink: !!paymentResponse.link,
          link: paymentResponse.link,
          flwRef: paymentResponse.flw_ref,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency
        });
        
        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Return SDK-ready payment data
        return {
          success: true,
          reference: txRef,
          flwRef: paymentResponse.flw_ref, // Flutterwave reference
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          // SDK payment data (for inline payment form)
          paymentData: {
            tx_ref: txRef,
            amount: paymentResponse.amount,
            currency: paymentResponse.currency,
            publicKey: this.publicKey, // Public key for SDK initialization
            customer: {
              email: paymentData.email,
              name: paymentData.name || 'Customer',
              phone_number: paymentData.phone || ''
            },
            paymentOptions: 'card,googlepay',
            customizations: {
              title: `Ocean Subscription - ${paymentData.planName || 'Plan'}`,
              description: `Subscription payment for ${paymentData.planName || 'plan'}`,
              logo: process.env.APP_LOGO_URL || ''
            },
            meta: {
              userId: userId,
              planId: planId,
              planName: paymentData.planName || '',
              billingPeriod: paymentData.billingPeriod || 'monthly'
            }
          },
          // Fallback: Standard Checkout URL (for web or if SDK fails)
          checkoutUrl: paymentResponse.link,
          expiresAt: expiresAt,
          status: 'pending'
        };
      } else {
        console.error('Flutterwave API returned non-success status:', response.data);
        throw new Error(response.data.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Flutterwave payment intent error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      });
      
      // Extract more detailed error message
      let errorMessage = 'Error creating payment intent';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Verify payment with Flutterwave
   * @param {string} paymentReference - Payment reference (tx_ref or flw_ref)
   * @returns {Object} Payment verification result
   */
  async verifyPayment(paymentReference) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      console.log('Verifying Flutterwave payment:', paymentReference);
      console.log('Using base URL:', this.baseUrl);

      // Try to verify with the provided reference
      // Flutterwave accepts both tx_ref and flw_ref
      let response;
      try {
        response = await axios.get(
          `${this.baseUrl}/transactions/${paymentReference}/verify`,
          {
            headers: {
              'Authorization': `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          }
        );
      } catch (verifyError) {
        // If verification fails, log detailed error
        console.error('Flutterwave verification request failed:', {
          message: verifyError.message,
          response: verifyError.response?.data,
          status: verifyError.response?.status,
          statusText: verifyError.response?.statusText,
          url: verifyError.config?.url
        });
        
        // If it's a "not found" error (404 or 400), provide helpful message
        if (verifyError.response?.status === 404 || verifyError.response?.status === 400) {
          return {
            success: false,
            status: 'error',
            message: `No transaction found for reference: ${paymentReference}. Please check the payment reference.`,
            error: verifyError.response?.data || verifyError.message
          };
        }
        throw verifyError;
      }

      if (response.data.status === 'success') {
        const transaction = response.data.data;
        
        console.log('Transaction verified successfully:', {
          tx_ref: transaction.tx_ref,
          flw_ref: transaction.flw_ref,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          hasMeta: !!transaction.meta
        });
        
        return {
          success: true,
          status: transaction.status === 'successful' ? 'success' : transaction.status,
          reference: transaction.tx_ref,
          flwRef: transaction.flw_ref,
          amount: transaction.amount,
          currency: transaction.currency,
          userId: transaction.meta?.userId,
          planId: transaction.meta?.planId,
          paidAt: transaction.created_at
        };
      } else {
        console.warn('Flutterwave verification returned non-success status:', response.data);
        return {
          success: false,
          status: 'failed',
          message: response.data.message || 'Payment verification failed',
          data: response.data
        };
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        reference: paymentReference
      });
      return {
        success: false,
        status: 'error',
        message: error.response?.data?.message || error.message || 'Error verifying payment',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a subscription (recurring billing) with Flutterwave
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} subscriptionData - Subscription details
   * @returns {Object} Subscription details with subscription ID and checkout URL
   */
  async createSubscription(userId, planId, subscriptionData) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      const { getFlutterwavePlanId } = require('../utils/flutterwavePlanHelper');
      const flutterwavePlanId = subscriptionData.flutterwavePlanId || 
        getFlutterwavePlanId(subscriptionData.planName, subscriptionData.currency || 'NGN');

      if (!flutterwavePlanId) {
        throw new Error(`Flutterwave plan ID not found for plan: ${subscriptionData.planName} (${subscriptionData.currency || 'NGN'})`);
      }

      // Generate unique transaction reference
      const txRef = `OCEAN_SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get redirect URL for payment callback
      const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
      const redirectUrl = `${baseUrl}/api/subscriptions/callback/flutterwave`;

      // Use Flutterwave /payments endpoint with payment_plan field (recommended approach)
      // This creates a payment that subscribes the customer to the recurring plan
      const paymentRequest = {
        tx_ref: txRef,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'NGN',
        payment_plan: parseInt(flutterwavePlanId), // Plan ID as integer (e.g., 152253, 228797)
        redirect_url: redirectUrl,
        customer: {
          email: subscriptionData.email,
          name: subscriptionData.name || 'Customer',
          ...(subscriptionData.phone && { phonenumber: subscriptionData.phone })
        },
        customizations: {
          title: `Ocean Subscription - ${subscriptionData.planName || 'Plan'}`,
          description: `Subscription payment for ${subscriptionData.planName || 'plan'}`,
          ...(process.env.APP_LOGO_URL && { logo: process.env.APP_LOGO_URL })
        },
        meta: {
          userId: userId,
          planId: planId,
          planName: subscriptionData.planName || '',
          tx_ref: txRef
        }
      };

      console.log('Creating Flutterwave subscription payment:', {
        userId,
        planId,
        flutterwavePlanId,
        paymentPlan: parseInt(flutterwavePlanId),
        email: subscriptionData.email,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency
      });

      // Make API request to create payment with subscription plan
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const paymentData = response.data.data;
        
        return {
          success: true,
          subscriptionId: paymentData.id?.toString() || txRef, // Use payment ID as subscription reference
          checkoutUrl: paymentData.link, // Checkout URL for customer to complete payment
          reference: paymentData.tx_ref || txRef,
          amount: paymentData.amount || subscriptionData.amount,
          currency: paymentData.currency || subscriptionData.currency,
          status: 'pending', // Will be activated after payment
          createdAt: new Date().toISOString()
        };
      } else {
        throw new Error(response.data.message || 'Failed to create subscription payment');
      }
    } catch (error) {
      console.error('Flutterwave subscription creation error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        secretKeyPrefix: this.secretKey ? this.secretKey.substring(0, 20) + '...' : 'NOT SET',
        secretKeyLength: this.secretKey ? this.secretKey.length : 0
      });
      
      // Provide helpful error message for 401
      if (error.response?.status === 401) {
        throw new Error('Flutterwave authentication failed. Please check your FLW_SECRET_KEY in .env file. Make sure it matches your Flutterwave dashboard.');
      }
      
      throw error;
    }
  }

  /**
   * Cancel a Flutterwave subscription
   * @param {string} subscriptionId - Flutterwave subscription ID
   * @returns {Object} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      console.log('Cancelling Flutterwave subscription:', subscriptionId);

      // Make API request to cancel subscription
      const response = await axios.put(
        `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          message: 'Subscription cancelled successfully',
          subscriptionId: subscriptionId
        };
      } else {
        throw new Error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Flutterwave subscription cancellation error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Flutterwave subscription details
   * @param {string} subscriptionId - Flutterwave subscription ID
   * @returns {Object} Subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      // Make API request to get subscription
      const response = await axios.get(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const subscription = response.data.data;
        
        return {
          success: true,
          subscriptionId: subscription.id.toString(),
          status: subscription.status,
          amount: subscription.amount,
          currency: subscription.currency,
          planToken: subscription.plan_token,
          nextPaymentDate: subscription.next_payment_date,
          createdAt: subscription.created_at
        };
      } else {
        throw new Error(response.data.message || 'Failed to get subscription');
      }
    } catch (error) {
      console.error('Flutterwave get subscription error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} provider - Provider name
   * @param {Object} webhookData - Webhook payload
   * @param {Object} headers - Request headers
   * @returns {boolean} Signature validity
   */
  async verifyWebhookSignature(provider, webhookData, headers) {
    try {
      // Flutterwave webhook verification uses verif-hash header
      const signature = headers['verif-hash'];
      
      if (!signature || !this.webhookSecret) {
        console.warn('⚠️ Flutterwave webhook signature or webhook secret missing');
        return false;
      }

      // Flutterwave sends the signature in the verif-hash header
      // It should match your webhook secret (FLUTTERWAVE_WEBHOOK_SECRET)
      return signature === this.webhookSecret;
    } catch (error) {
      console.error('Flutterwave webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook
   * @param {string} provider - Provider name
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processing result
   */
  async processWebhook(provider, webhookData) {
    try {
      console.log('Processing Flutterwave webhook:', {
        event: webhookData.event,
        dataKeys: webhookData.data ? Object.keys(webhookData.data) : []
      });

      const event = webhookData.event;
      const data = webhookData.data;

      // Handle charge.completed events (card payments, Google Pay, etc.)
      if (event === 'charge.completed' && data.status === 'successful') {
        return {
          success: true,
          paymentStatus: 'success',
          reference: data.tx_ref,
          flwRef: data.flw_ref,
          userId: data.meta?.userId,
          planId: data.meta?.planId,
          amount: data.amount,
          currency: data.currency,
          paidAt: data.created_at
        };
      } else if (event === 'charge.completed' && data.status === 'failed') {
        return {
          success: false,
          paymentStatus: 'failed',
          reference: data.tx_ref,
          message: data.processor_response || 'Payment failed'
        };
      }

      // Handle virtual account payment events
      if (event === 'virtual-account-credit' || event === 'transfer.completed') {
        // Virtual account received payment
        return {
          success: true,
          paymentStatus: 'success',
          reference: data.tx_ref || data.reference,
          flwRef: data.flw_ref,
          userId: data.meta?.userId,
          planId: data.meta?.planId,
          amount: data.amount,
          currency: data.currency || 'NGN',
          paidAt: data.created_at || new Date().toISOString(),
          paymentMethod: 'virtual_account'
        };
      }

      // Handle subscription renewal events
      if (event === 'subscription.charged' || event === 'subscription.renewed') {
        // Subscription was successfully charged/renewed
        return {
          success: true,
          paymentStatus: 'success',
          subscriptionId: data.subscription?.id?.toString() || data.id?.toString(),
          reference: data.tx_ref || data.reference,
          flwRef: data.flw_ref,
          userId: data.meta?.userId,
          planId: data.meta?.planId,
          amount: data.amount,
          currency: data.currency || 'NGN',
          paidAt: data.created_at || new Date().toISOString(),
          nextBillingDate: data.next_payment_date,
          paymentMethod: 'subscription',
          eventType: 'subscription_renewal'
        };
      }

      // Handle subscription cancellation events
      if (event === 'subscription.cancelled' || event === 'subscription.deactivated') {
        return {
          success: true,
          paymentStatus: 'cancelled',
          subscriptionId: data.subscription?.id?.toString() || data.id?.toString(),
          userId: data.meta?.userId,
          planId: data.meta?.planId,
          eventType: 'subscription_cancelled'
        };
      }

      // Handle subscription activation events
      if (event === 'subscription.activated' || event === 'subscription.created') {
        return {
          success: true,
          paymentStatus: 'active',
          subscriptionId: data.subscription?.id?.toString() || data.id?.toString(),
          userId: data.meta?.userId,
          planId: data.meta?.planId,
          eventType: 'subscription_activated'
        };
      }

      // Handle other events
      console.log(`Unhandled Flutterwave webhook event: ${event}`);
      return {
        success: false,
        message: `Unhandled webhook event: ${event}`
      };
    } catch (error) {
      console.error('Flutterwave webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create virtual account for payment
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} paymentData - Payment details
   * @returns {Object} Virtual account details
   */
  async createVirtualAccount(userId, planId, paymentData) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      console.log('Creating Flutterwave virtual account:', {
        userId,
        planId,
        email: paymentData.email
      });

      // Generate unique reference
      const txRef = `OCEAN_VA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const request = {
        email: paymentData.email,
        is_permanent: false, // Temporary account for this subscription
        tx_ref: txRef,
        firstname: paymentData.firstname || 'Customer',
        lastname: paymentData.lastname || '',
        phonenumber: paymentData.phone || '',
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        meta: {
          userId: userId,
          planId: planId,
          planName: paymentData.planName || ''
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/virtual-account-numbers`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`, // Use SECRET_KEY directly
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        const accountData = response.data.data;
        
        return {
          success: true,
          accountNumber: accountData.account_number,
          bankName: accountData.bank_name,
          reference: txRef,
          flwRef: accountData.flw_ref,
          expiresAt: accountData.expires_at
        };
      } else {
        throw new Error(response.data.message || 'Failed to create virtual account');
      }
    } catch (error) {
      console.error('Flutterwave virtual account creation error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error creating virtual account'
      };
    }
  }

  /**
   * Check virtual account payment status
   * @param {string} accountNumber - Virtual account number
   * @param {string} bankName - Bank name
   * @returns {Object} Payment status and transaction details
   */
  async checkVirtualAccountStatus(accountNumber, bankName) {
    try {
      if (!this.secretKey) {
        throw new Error('Flutterwave SECRET_KEY not configured');
      }

      console.log('Checking Flutterwave virtual account status:', {
        accountNumber,
        bankName
      });

      // Flutterwave doesn't have a direct API to check virtual account status
      // Instead, we check transactions for the account
      // We'll use the virtual account webhook events, but also provide a manual check method
      // This method can be used for polling or manual verification

      // For now, return a structure that indicates we need to rely on webhooks
      // In production, you might want to query transactions by account number
      return {
        success: true,
        accountNumber: accountNumber,
        bankName: bankName,
        status: 'pending', // Status will be updated via webhook
        message: 'Virtual account status should be monitored via webhooks. Use webhook events for real-time updates.'
      };
    } catch (error) {
      console.error('Flutterwave virtual account status check error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error checking virtual account status'
      };
    }
  }

  /**
   * Verify virtual account transaction
   * @param {string} txRef - Transaction reference
   * @returns {Object} Transaction verification result
   */
  async verifyVirtualAccountTransaction(txRef) {
    try {
      // Use the standard verifyPayment method
      return await this.verifyPayment(txRef);
    } catch (error) {
      console.error('Flutterwave virtual account transaction verification error:', error);
      return {
        success: false,
        message: error.message || 'Error verifying virtual account transaction'
      };
    }
  }
}

/**
 * Payment Provider Factory
 * 
 * Factory class to get the appropriate payment provider based on configuration
 */
class PaymentProviderFactory {
  
  static getProvider(providerName = 'flutterwave') {
    switch (providerName.toLowerCase()) {
      case 'flutterwave':
        return new FlutterwaveProvider();
      case 'mock':
        return new MockPaymentProvider();
      default:
        // Default to Flutterwave if unknown provider
        console.warn(`Unknown payment provider: ${providerName}. Defaulting to Flutterwave.`);
        return new FlutterwaveProvider();
    }
  }
}

/**
 * Main Payment Provider Export
 * 
 * Default export that uses the configured provider
 */
const PaymentProvider = PaymentProviderFactory.getProvider(process.env.PAYMENT_PROVIDER || 'flutterwave');

module.exports = {
  PaymentProvider,
  PaymentProviderFactory,
  PaymentProviderInterface,
  MockPaymentProvider,
  FlutterwaveProvider
};
