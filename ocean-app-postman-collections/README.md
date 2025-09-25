# 🚀 **OCEAN POSTMAN COLLECTIONS - UPDATED WITH SUBSCRIPTION SYSTEM**

## 📋 **Overview**

The Ocean Postman collections have been updated to include the complete subscription system and promotional boost functionality. All collections now support subscription-aware features and include new dedicated collections for subscription management.

---

## 🆕 **NEW COLLECTIONS ADDED**

### **1. Ocean-Subscription-System.postman_collection.json**
**Complete subscription management API endpoints:**

#### **📊 Subscription Plans**
- `GET /api/subscriptions/plans` - Get all available subscription plans
- `GET /api/subscriptions/plans/:id` - Get specific plan details

#### **👤 User Subscriptions**
- `POST /api/subscriptions/subscribe` - Subscribe to a plan
- `PUT /api/subscriptions/change` - Change subscription plan
- `PUT /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/status` - Get subscription status
- `GET /api/subscriptions/history` - Get subscription history

#### **📈 Usage Tracking**
- `GET /api/subscriptions/usage` - Get current usage
- `GET /api/subscriptions/usage/history` - Get usage history

#### **📊 Analytics**
- `GET /api/subscriptions/analytics` - Get subscription analytics
- `GET /api/subscriptions/revenue` - Get revenue analytics (admin)

#### **💳 Payment Webhooks**
- `POST /api/subscriptions/webhooks/payment` - Handle payment webhooks

### **2. Ocean-Promotional-Boosts.postman_collection.json**
**Complete promotional boost management API endpoints:**

#### **🎯 Boost Management**
- `POST /api/promotional-boosts` - Create promotional boost
- `GET /api/promotional-boosts` - Get user boosts
- `GET /api/promotional-boosts/:id` - Get boost details
- `PUT /api/promotional-boosts/:id/cancel` - Cancel boost

#### **🔍 Boost Discovery**
- `GET /api/promotional-boosts/boosted` - Get boosted items
- `GET /api/promotional-boosts/boosted?type=product` - Get boosted products
- `GET /api/promotional-boosts/boosted?type=auction` - Get boosted auctions
- `GET /api/promotional-boosts/boosted?type=group_buy` - Get boosted group buys
- `GET /api/promotional-boosts/boosted?type=swap_deal` - Get boosted swap deals

#### **📊 Boost Analytics**
- `GET /api/promotional-boosts/analytics` - Get boost analytics
- `GET /api/promotional-boosts/stats` - Get boost statistics
- `GET /api/promotional-boosts/performance` - Get boost performance

#### **📋 Boost Status**
- `GET /api/promotional-boosts/status/:type/:id` - Check item boost status
- `GET /api/promotional-boosts/active` - Get active boosts
- `GET /api/promotional-boosts/expired` - Get expired boosts

---

## 🔄 **UPDATED EXISTING COLLECTIONS**

### **1. Ocean-Products.postman_collection.json**
**Enhanced with subscription-aware features:**

#### **🔍 Subscription-Aware Search**
- **Get All Products** - Now includes subscription-aware search parameters
- **Get Trending Products** - New endpoint with subscription prioritization
- **Enhanced Parameters:**
  - `sortBy` - Sort by relevance, price, newest, popular
  - `search` - Search query
  - `category` - Filter by category
  - `minPrice`/`maxPrice` - Price range filters
  - `condition` - Filter by condition
  - `location` - Filter by location

#### **🎯 Subscription Benefits Applied:**
- Boosted products appear first in search results
- Verified sellers get priority ranking
- Trust scores affect search ranking
- Subscription status influences results

### **2. Ocean-Auctions.postman_collection.json**
**Enhanced with subscription-aware features:**

#### **🔍 Subscription-Aware Search**
- **Get All Auctions** - Now includes subscription-aware search parameters
- **Enhanced Parameters:**
  - `status` - Filter by status (active, draft, ended)
  - `sortBy` - Sort by endTime, price, views, newest
  - `search` - Search query
  - `category` - Filter by category
  - `minPrice`/`maxPrice` - Price range filters
  - `condition` - Filter by condition
  - `location` - Filter by location

#### **🎯 Subscription Benefits Applied:**
- Boosted auctions appear first in search results
- Verified sellers get priority ranking
- Trust scores affect search ranking
- Subscription status influences results

---

## 🎯 **SUBSCRIPTION-AWARE FEATURES**

### **1. Enhanced Search Results**
All search endpoints now provide subscription-aware results:
- **Boosted Items First** - Promoted items appear at the top
- **Verified Seller Priority** - Verified sellers get higher ranking
- **Trust Score Integration** - Seller trust scores affect ranking
- **Subscription Status Awareness** - Search adapts to user's subscription

### **2. Subscription Limits Enforcement**
All creation endpoints now enforce subscription limits:
- **Product Creation** - Limited by subscription plan
- **Auction Creation** - Limited by subscription plan
- **Group Buy Creation** - Limited by subscription plan
- **Swap Deal Creation** - Limited by subscription plan

### **3. Usage Tracking**
All actions are tracked against subscription limits:
- **Real-time Tracking** - Usage incremented immediately
- **Daily Limits** - Enforced per subscription plan
- **Monthly Limits** - Enforced per subscription plan
- **Usage Analytics** - Available via API endpoints

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Environment Variables**
Set up these variables in your Postman environment:

```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "your_jwt_token_here"
}
```

### **2. Authentication**
Most endpoints require authentication:
- Add `Authorization: Bearer {{auth_token}}` header
- Get token from login endpoint in Authentication collection

### **3. Subscription Testing**
To test subscription features:
1. **Create a user account** (Authentication collection)
2. **Subscribe to a plan** (Subscription System collection)
3. **Test subscription limits** (Try creating items)
4. **Create promotional boosts** (Promotional Boosts collection)
5. **Test subscription-aware search** (Products/Auctions collections)

---

## 📊 **SUBSCRIPTION PLANS AVAILABLE**

### **Free Plan (Drift)**
- ✅ Basic product listings (limited)
- ✅ Basic search functionality
- ❌ No promotional boosts
- ❌ No priority search

### **Paid Plans (Wave, Tide, Surge)**
- ✅ Increased listing limits
- ✅ Promotional boost capabilities
- ✅ Priority search ranking
- ✅ Verified seller badges
- ✅ Advanced features access

---

## 🎯 **TESTING SCENARIOS**

### **1. Subscription Management**
```bash
# 1. Get available plans
GET /api/subscriptions/plans

# 2. Subscribe to Wave plan
POST /api/subscriptions/subscribe
{
  "plan_id": 2,
  "payment_method": "card",
  "payment_reference": "pay_123456789",
  "auto_renew": true
}

# 3. Check subscription status
GET /api/subscriptions/status

# 4. Check usage
GET /api/subscriptions/usage
```

### **2. Promotional Boosts**
```bash
# 1. Create a product boost
POST /api/promotional-boosts
{
  "boost_type": "product",
  "target_id": "123",
  "boost_duration_hours": 24,
  "boost_reason": "Promote new product"
}

# 2. Get boosted items
GET /api/promotional-boosts/boosted?type=product

# 3. Check boost analytics
GET /api/promotional-boosts/analytics
```

### **3. Subscription-Aware Search**
```bash
# 1. Search products (boosted items appear first)
GET /api/products?search=laptop&sortBy=relevance

# 2. Search auctions (verified sellers get priority)
GET /api/auctions?search=phone&sortBy=endTime

# 3. Get trending products
GET /api/products/trending?limit=10&days=7
```

---

## 📈 **ANALYTICS ENDPOINTS**

### **Subscription Analytics**
- `GET /api/subscriptions/analytics` - Overall subscription analytics
- `GET /api/subscriptions/revenue` - Revenue analytics (admin)
- `GET /api/subscriptions/usage` - Usage analytics

### **Boost Analytics**
- `GET /api/promotional-boosts/analytics` - Boost performance analytics
- `GET /api/promotional-boosts/stats` - Boost statistics
- `GET /api/promotional-boosts/performance` - Detailed boost metrics

---

## 🚀 **READY FOR TESTING**

The Ocean Postman collections are now fully updated with:

- ✅ **Complete Subscription System** - All subscription management APIs
- ✅ **Promotional Boost System** - All boost management APIs
- ✅ **Subscription-Aware Search** - Enhanced search with subscription benefits
- ✅ **Usage Tracking** - Complete usage tracking and analytics
- ✅ **Analytics & Reporting** - Comprehensive analytics endpoints
- ✅ **Payment Integration** - Payment webhook handling
- ✅ **Admin Features** - Admin analytics and management

**The Ocean Subscription System is ready for comprehensive testing!** 🎉

All collections are production-ready and include:
- Complete API documentation
- Example requests and responses
- Subscription-aware features
- Boost management capabilities
- Analytics and reporting
- Error handling examples

Start testing the subscription system with these updated collections! 🚀

