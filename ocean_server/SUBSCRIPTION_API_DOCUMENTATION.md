# 📋 **OCEAN SUBSCRIPTION SYSTEM API DOCUMENTATION**

## 🚀 **Overview**

The Ocean Subscription System provides comprehensive subscription management with feature gating, usage tracking, and promotional boosts. This API is designed to be payment-provider agnostic, supporting multiple payment providers through a unified interface.

## 🔐 **Authentication**

All endpoints (except public ones) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📊 **Subscription Plans**

| Plan | Price | Listings | Group Buys | DMs/Day | Features |
|------|-------|----------|------------|---------|----------|
| **Drift** | ₦1,500/month | 2 | 0 | 1 | Basic features |
| **Wave** | ₦3,000/month | 5 | 1 | 4 | Highlighted search |
| **Tide** | ₦5,500/month | 100 | 10 | 20 | Verified badge, AR |
| **Surge** | ₦7,000/month | Unlimited | Unlimited | Unlimited | All features |

---

## 🛒 **SUBSCRIPTION MANAGEMENT**

### **Get Available Plans**
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "drift",
      "displayName": "Drift",
      "price": 1500.00,
      "currency": "NGN",
      "billingPeriod": "monthly",
      "features": ["Basic chat with buyers", "Join group buys"],
      "description": "Perfect for new sellers getting started",
      "limits": {
        "maxListings": 2,
        "maxGroupBuys": 0,
        "maxDailyDms": 1
      },
      "capabilities": {
        "canCreateGroupBuy": false,
        "hasVerifiedBadge": false,
        "hasPrioritySearch": false
      }
    }
  ]
}
```

### **Get Current Subscription**
```http
GET /api/subscriptions/current
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription status retrieved successfully",
  "data": {
    "hasActiveSubscription": true,
    "plan": {
      "id": 2,
      "name": "wave",
      "displayName": "Wave",
      "price": 3000.00,
      "currency": "NGN"
    },
    "status": "active",
    "limits": {
      "maxListings": 5,
      "maxGroupBuys": 1,
      "maxDailyDms": 4
    },
    "usage": {
      "listingsCreated": 2,
      "groupBuysCreated": 0,
      "dmsSent": 1
    },
    "expiresAt": "2024-02-20T10:30:00.000Z"
  }
}
```

### **Subscribe to Plan**
```http
POST /api/subscriptions/subscribe
```

**Body:**
```json
{
  "planId": "wave",
  "paymentMethod": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully. Complete payment to activate.",
  "data": {
    "subscription": {
      "id": 123,
      "status": "pending",
      "plan": {
        "name": "Wave",
        "price": 3000.00,
        "currency": "NGN"
      },
      "startDate": "2024-01-20T10:30:00.000Z",
      "endDate": "2024-02-20T10:30:00.000Z"
    },
    "payment": {
      "reference": "mock_1642675800000_abc123def",
      "amount": 3000.00,
      "currency": "NGN",
      "checkoutUrl": "http://localhost:3000/payment/mock/mock_1642675800000_abc123def",
      "expiresAt": "2024-01-21T10:30:00.000Z"
    }
  }
}
```

### **Change Plan**
```http
POST /api/subscriptions/change-plan
```

**Body:**
```json
{
  "planId": "tide"
}
```

### **Cancel Subscription**
```http
POST /api/subscriptions/cancel
```

**Body:**
```json
{
  "reason": "User requested cancellation"
}
```

---

## 📈 **USAGE & ANALYTICS**

### **Get Usage Statistics**
```http
GET /api/subscriptions/usage?days=7
```

**Response:**
```json
{
  "success": true,
  "message": "Usage statistics retrieved successfully",
  "data": {
    "hasSubscription": true,
    "stats": {
      "totals": {
        "listingsCreated": 5,
        "groupBuysCreated": 1,
        "dmsSent": 12
      },
      "dailyBreakdown": [
        {
          "date": "2024-01-20",
          "listingsCreated": 2,
          "groupBuysCreated": 0,
          "dmsSent": 3
        }
      ]
    },
    "period": 7
  }
}
```

### **Check Action Eligibility**
```http
GET /api/subscriptions/check/listings
```

**Response:**
```json
{
  "success": true,
  "message": "Action eligibility checked successfully",
  "data": {
    "allowed": true,
    "reason": "Action allowed",
    "remaining": 3,
    "plan": {
      "name": "Wave",
      "price": 3000.00,
      "currency": "NGN"
    }
  }
}
```

### **Get Subscription Analytics**
```http
GET /api/subscriptions/analytics?days=30
```

---

## 🚀 **PROMOTIONAL BOOSTS**

### **Create Promotional Boost**
```http
POST /api/subscriptions/boosts
```

**Body:**
```json
{
  "boostType": "product",
  "targetId": "product-uuid-here",
  "durationHours": 24,
  "reason": "Promoting new product launch"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Promotional boost created successfully",
  "data": {
    "id": 456,
    "boostType": "product",
    "targetId": "product-uuid-here",
    "durationHours": 24,
    "startTime": "2024-01-20T10:30:00.000Z",
    "endTime": "2024-01-21T10:30:00.000Z",
    "status": "active"
  }
}
```

### **Get Promotional Boosts**
```http
GET /api/subscriptions/boosts?status=active&page=1&limit=10
```

### **Get Boost Details**
```http
GET /api/subscriptions/boosts/:id
```

### **Cancel Boost**
```http
DELETE /api/subscriptions/boosts/:id
```

---

## 💳 **PAYMENT PROCESSING**

### **Confirm Payment (Manual)**
```http
POST /api/subscriptions/confirm-payment
```

**Body:**
```json
{
  "paymentReference": "mock_1642675800000_abc123def"
}
```

### **Payment Webhook**
```http
POST /api/webhooks/payments/:provider
```

**Providers:** `stripe`, `paystack`, `mock`

---

## 🛡️ **FEATURE GATING MIDDLEWARE**

The subscription system includes middleware for feature gating. Here's how to integrate:

### **Product Creation**
```javascript
const featureMiddleware = require('./src/middleware/featureMiddleware');

// Protect product creation endpoint
app.post('/products', featureMiddleware.productListingMiddleware, createProduct);
```

### **Group Buy Creation**
```javascript
// Protect group buy creation endpoint
app.post('/group-buys', featureMiddleware.groupBuyCreationMiddleware, createGroupBuy);
```

### **Messaging**
```javascript
// Protect messaging endpoint
app.post('/messages', featureMiddleware.messagingMiddleware, sendMessage);
```

---

## 📊 **ERROR RESPONSES**

### **Subscription Limit Exceeded**
```json
{
  "success": false,
  "message": "You have reached your daily limit of 5 listings. Upgrade your plan for more access.",
  "usage": {
    "listingsCreated": 5,
    "groupBuysCreated": 0
  },
  "plan": {
    "name": "Wave",
    "price": 3000.00,
    "currency": "NGN"
  }
}
```

### **Feature Not Available**
```json
{
  "success": false,
  "message": "This feature is not available in your Wave plan. Upgrade to access this feature.",
  "plan": {
    "name": "Wave",
    "price": 3000.00,
    "currency": "NGN"
  }
}
```

### **No Active Subscription**
```json
{
  "success": false,
  "message": "No active subscription. Please subscribe to access this feature.",
  "usage": null,
  "plan": null
}
```

---

## 🔧 **PAYMENT PROVIDER INTEGRATION**

### **Current Providers**

1. **Mock Provider** (Default)
   - For development and testing
   - Always returns successful payments
   - No real payment processing

2. **Stripe** (Stub)
   - Ready for implementation
   - Supports cards and digital wallets
   - Global payment processing

3. **Paystack** (Stub)
   - Ready for implementation
   - Nigeria-focused
   - Local payment methods

### **Adding New Provider**

1. Extend `PaymentProviderInterface`
2. Implement provider-specific methods
3. Add to `PaymentProviderFactory`
4. Update environment configuration

---

## 🚀 **GETTING STARTED**

### **1. Set Environment Variables**
```bash
PAYMENT_PROVIDER=mock
FRONTEND_URL=http://localhost:3000
```

### **2. Run Migration**
```bash
node run-subscription-migration.js
```

### **3. Integrate Middleware**
```javascript
const featureMiddleware = require('./src/middleware/featureMiddleware');

// Add to your routes
app.use('/api/subscriptions', require('./src/routes/subscriptionRoutes'));
app.use('/api/boosts', require('./src/routes/promotionalBoostRoutes'));
```

### **4. Test Subscription Flow**
1. Get available plans
2. Subscribe to a plan
3. Confirm payment (manual)
4. Check subscription status
5. Test feature gating

---

## 📝 **NOTES**

- All prices are in Nigerian Naira (NGN)
- Usage limits reset daily at midnight
- Subscription status is checked in real-time
- Webhook endpoints require proper signature verification
- Mock provider is for development only
- Production requires real payment provider integration

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready (with Mock Provider)

