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
      if (paymentReference.startsWith('mock_')) {
        return {
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
 * Payment Provider Factory
 * 
 * Factory class to get the appropriate payment provider based on configuration
 */
class PaymentProviderFactory {
  
  static getProvider(providerName = 'mock') {
    switch (providerName.toLowerCase()) {
      case 'stripe':
        return new StripePaymentProvider();
      case 'paystack':
        return new PaystackProvider();
      case 'mock':
      default:
        return new MockPaymentProvider();
    }
  }
}

/**
 * Main Payment Provider Export
 * 
 * Default export that uses the configured provider
 */
const PaymentProvider = PaymentProviderFactory.getProvider(process.env.PAYMENT_PROVIDER || 'paystack');

module.exports = {
  PaymentProvider,
  PaymentProviderFactory,
  PaymentProviderInterface,
  MockPaymentProvider,
  StripePaymentProvider,
  PaystackProvider
};
