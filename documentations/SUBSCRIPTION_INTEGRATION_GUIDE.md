# 🔧 **SUBSCRIPTION SYSTEM INTEGRATION GUIDE**

## 📋 **Quick Integration Steps**

This guide shows how to integrate subscription middleware into your existing controllers to enforce subscription limits and feature access.

---

## 🚀 **1. Add Routes to Server**

Add subscription routes to your main server file:

```javascript
// In server.js or your main app file
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const promotionalBoostRoutes = require('./src/routes/promotionalBoostRoutes');

// Add routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/boosts', promotionalBoostRoutes);
```

---

## 🛡️ **2. Protect Existing Endpoints**

### **Product Controller Integration**

```javascript
// In your product controller
const featureMiddleware = require('../middleware/featureMiddleware');

// Protect product creation
router.post('/', 
  authMiddleware, 
  featureMiddleware.productListingMiddleware, 
  createProduct
);

// Protect product updates (priority search)
router.put('/:id', 
  authMiddleware, 
  featureMiddleware.productUpdateMiddleware, 
  updateProduct
);
```

### **Group Buy Controller Integration**

```javascript
// In your group buy controller
const featureMiddleware = require('../middleware/featureMiddleware');

// Protect group buy creation
router.post('/', 
  authMiddleware, 
  featureMiddleware.groupBuyCreationMiddleware, 
  createGroupBuy
);

// Allow joining (no subscription required)
router.post('/:id/join', 
  authMiddleware, 
  featureMiddleware.groupBuyJoinMiddleware, 
  joinGroupBuy
);
```

### **Messaging Controller Integration**

```javascript
// In your messaging controller
const featureMiddleware = require('../middleware/featureMiddleware');

// Protect message sending
router.post('/', 
  authMiddleware, 
  featureMiddleware.messagingMiddleware, 
  sendMessage
);
```

### **Search Controller Integration**

```javascript
// In your search controller
const featureMiddleware = require('../middleware/featureMiddleware');

// Add search priority boost
router.get('/products', 
  authMiddleware, 
  featureMiddleware.searchPriorityMiddleware, 
  searchProducts
);
```

---

## 📊 **3. Update Controller Responses**

### **Add Subscription Info to Responses**

```javascript
// Example: Product creation response
const createProduct = async (req, res) => {
  try {
    // Your existing product creation logic
    const product = await Product.create(productData);
    
    // Add subscription info to response
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
      subscription: {
        plan: req.subscription.plan.display_name,
        remainingListings: req.subscription.usage ? 
          req.subscription.plan.max_listings - req.subscription.usage.listings_created : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};
```

### **Add Search Priority to Search Results**

```javascript
// Example: Search products response
const searchProducts = async (req, res) => {
  try {
    // Your existing search logic
    const products = await Product.findAll(searchQuery);
    
    // Add subscription info to response
    res.json({
      success: true,
      data: products,
      subscription: {
        searchPriority: req.searchPriority,
        hasVerifiedBadge: req.hasVerifiedBadge
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};
```

---

## 🔍 **4. Check Subscription Status**

### **Get User Subscription Status**

```javascript
const SubscriptionStatusChecker = require('../utils/subscriptionStatusChecker');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile data
    const user = await User.findByPk(userId);
    
    // Get subscription status
    const subscriptionStatus = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
    
    res.json({
      success: true,
      data: {
        user: user,
        subscription: subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting user profile',
      error: error.message
    });
  }
};
```

### **Check Action Eligibility**

```javascript
const SubscriptionStatusChecker = require('../utils/subscriptionStatusChecker');

const checkCanCreateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user can create products
    const eligibility = await SubscriptionStatusChecker.canPerformAction(userId, 'listings');
    
    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking eligibility',
      error: error.message
    });
  }
};
```

---

## 🎯 **5. Frontend Integration**

### **Handle Subscription Errors**

```javascript
// Frontend error handling
const createProduct = async (productData) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      // Handle subscription limit errors
      if (result.message.includes('reached your daily limit')) {
        showUpgradeModal(result.plan);
      } else if (result.message.includes('not available in your')) {
        showFeatureUpgradeModal(result.plan);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

### **Show Subscription Status**

```javascript
// Get subscription status for UI
const getSubscriptionStatus = async () => {
  try {
    const response = await fetch('/api/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      updateSubscriptionUI(result.data);
    }
  } catch (error) {
    console.error('Error getting subscription status:', error);
  }
};
```

---

## 🔄 **6. Cron Jobs & Maintenance**

### **Update Expired Subscriptions**

```javascript
// Add to your cron jobs
const subscriptionService = require('./src/services/subscriptionService');

// Run daily to update expired subscriptions
const updateExpiredSubscriptions = async () => {
  try {
    const updatedCount = await subscriptionService.updateExpiredSubscriptions();
    console.log(`Updated ${updatedCount} expired subscriptions`);
  } catch (error) {
    console.error('Error updating expired subscriptions:', error);
  }
};
```

### **Update Expired Boosts**

```javascript
// Add to your cron jobs
const PromotionalBoostController = require('./src/controllers/promotionalBoostController');

// Run hourly to update expired boosts
const updateExpiredBoosts = async () => {
  try {
    // Call the endpoint or use the service directly
    await PromotionalBoostController.updateExpiredBoosts();
  } catch (error) {
    console.error('Error updating expired boosts:', error);
  }
};
```

---

## 📝 **7. Testing**

### **Test Subscription Flow**

```javascript
// Test subscription creation
const testSubscription = async () => {
  // 1. Get available plans
  const plans = await fetch('/api/subscriptions/plans');
  
  // 2. Subscribe to a plan
  const subscription = await fetch('/api/subscriptions/subscribe', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ planId: 'wave' })
  });
  
  // 3. Confirm payment (mock)
  const payment = await fetch('/api/subscriptions/confirm-payment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ paymentReference: 'mock_123' })
  });
  
  // 4. Check subscription status
  const status = await fetch('/api/subscriptions/current', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Subscription test completed');
};
```

### **Test Feature Gating**

```javascript
// Test feature limits
const testFeatureLimits = async () => {
  // Try to create products beyond limit
  for (let i = 0; i < 10; i++) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: `Product ${i}`, price: 100 })
    });
    
    const result = await response.json();
    console.log(`Product ${i}:`, result.success ? 'Success' : result.message);
  }
};
```

---

## 🚨 **8. Error Handling**

### **Common Error Scenarios**

1. **No Active Subscription**
   - User tries to use paid features
   - Show subscription plans modal

2. **Limit Exceeded**
   - User reaches daily/monthly limits
   - Show upgrade options

3. **Feature Not Available**
   - User tries to use premium features
   - Show feature comparison

4. **Payment Failed**
   - Subscription remains pending
   - Show retry payment option

---

## ✅ **9. Checklist**

- [ ] Added subscription routes to server
- [ ] Protected existing endpoints with middleware
- [ ] Updated controller responses with subscription info
- [ ] Added subscription status checking
- [ ] Implemented frontend error handling
- [ ] Added cron jobs for maintenance
- [ ] Tested subscription flow
- [ ] Tested feature gating
- [ ] Documented integration

---

## 🎯 **Next Steps**

1. **Test Integration** - Verify all endpoints work correctly
2. **Frontend Updates** - Update UI to show subscription status
3. **Payment Provider** - Integrate real payment provider
4. **Analytics** - Add subscription analytics dashboard
5. **Admin Panel** - Create admin interface for subscription management

---

**Need Help?** Check the `SUBSCRIPTION_API_DOCUMENTATION.md` for detailed API reference.

