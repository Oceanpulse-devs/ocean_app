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

### **3. Ocean-Stories.postman_collection.json**
**Complete stories feature API endpoints with follower privacy:**

#### **📱 Story Management**
- `POST /api/stories` - Create new story with file upload (24-hour expiration)
- `GET /api/stories/my` - Get your own stories with analytics
- `DELETE /api/stories/:id` - Delete your own story

#### **👀 Story Viewing**
- `GET /api/stories/all` - Get all stories from users you follow
- `GET /api/stories/user/:userId` - Get specific user's stories (if you follow them)
- `POST /api/stories/:id/view` - Mark story as viewed

#### **📊 Story Analytics**
- `GET /api/stories/:id/viewers` - Get story viewers (only story owner)

#### **🔒 Privacy Features**
- **Follower-Only Access** - Stories only visible to followers
- **View Tracking** - Track who viewed your stories
- **Auto-Expiration** - Stories expire after 24 hours
- **Owner Analytics** - Only story owners can see viewer analytics
- **File Upload** - Direct image/video upload via Cloudinary

### **4. Ocean-BuyerNeeds.postman_collection.json** ⭐ **UPDATED WITH REACH FEATURE**
**Complete buyer needs management with new reach control system:**

#### **📋 Buyer Needs CRUD**
- `POST /api/buyer-needs/create` - Create buyer need with reach limit
- `GET /api/buyer-needs/all` - Get all buyer needs with reach status
- `GET /api/buyer-needs/:id` - Get specific buyer need details
- `PUT /api/buyer-needs/:id` - Update buyer need
- `DELETE /api/buyer-needs/:id` - Delete buyer need

#### **🎯 Reach Management** ⭐ **NEW**
- `POST /api/buyer-needs/:id/increment-reach` - Increment reach count
- `GET /api/buyer-needs/:id/reach-status` - Get reach status and contact availability

#### **💬 Buyer Need Responses**
- `POST /api/buyer-needs/:id/responses` - Create response to buyer need
- `GET /api/buyer-needs/:id/responses` - Get all responses
- `PUT /api/buyer-needs/responses/:id/accept` - Accept response
- `PUT /api/buyer-needs/responses/:id/reject` - Reject response

#### **🔒 Reach Control Features** ⭐ **NEW**
- **Contact Limit** - Set how many people can contact you
- **Auto-Increment** - Reach count increases when contacted via buyer needs page
- **Contact Button Control** - Button disappears when limit reached
- **Reach Status Tracking** - Real-time reach status monitoring

### **5. Ocean-Messaging.postman_collection.json** ⭐ **UPDATED WITH REFERENCE CONTEXT**
**Complete messaging system with reference context tracking:**

#### **💬 Message Management**
- `POST /api/messages` - Send message with reference context
- `GET /api/messages/:conversationId` - Get conversation messages
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

#### **🔗 Reference Context Messages** ⭐ **NEW**
- **Buyer Need Messages** - Messages with buyer need reference (increment reach)
- **Product Messages** - Messages with product reference (no reach increment)
- **Swap Deal Messages** - Messages with swap deal reference
- **Auction Messages** - Messages with auction reference
- **Distress Sale Messages** - Messages with distress sale reference

#### **📊 Cross-Server Communication** ⭐ **NEW**
- **Reach Increment** - Automatic reach increment for buyer need messages
- **Reference Tracking** - Messages store reference information
- **Context Preservation** - Rich context in notifications
- **Error Resilience** - Message sending succeeds even if reach increment fails

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

### **4. Stories Feature**
```bash
# 1. Create a story (with file upload)
POST /api/stories
Content-Type: multipart/form-data
- media: [image/video file]
- caption: "Check out this amazing product!"
- background_color: "#FF5733"
- text_color: "#FFFFFF"
- font_family: "Arial"

# 2. Get all stories from users you follow
GET /api/stories/all

# 3. View a story (increments view count)
POST /api/stories/story-id/view

# 4. Get your own stories with analytics
GET /api/stories/my

# 5. Get story viewers (only story owner)
GET /api/stories/story-id/viewers
```

### **5. Reach Feature** ⭐ **NEW**
```bash
# 1. Create a post (automatically creates buyer need)
POST /api/posts
{
  "content": "Looking for a vintage guitar",
  "reach_limit": 3,
  "category_id": "550e8400-e29b-41d4-a716-446655440000"
}

# 2. Check buyer need reach status
GET /api/buyer-needs/buyer-need-id/reach-status

# 3. Send buyer need message (increments reach)
POST /api/messages
{
  "conversationId": "conversation-id",
  "content": "I'm interested in your buyer need!",
  "referenceType": "buyer_need",
  "referenceId": "buyer-need-id",
  "buyerNeedId": "buyer-need-id"
}

# 4. Check reach increment
GET /api/buyer-needs/buyer-need-id/reach-status

# 5. Send product message (no reach increment)
POST /api/messages
{
  "conversationId": "conversation-id",
  "content": "Is this product available?",
  "referenceType": "product",
  "referenceId": "product-id"
}
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
- ✅ **Stories Feature** - Complete stories system with follower privacy
- ✅ **Reach Feature** ⭐ **NEW** - Automatic buyer need creation with contact limits
- ✅ **Reference Context Messaging** ⭐ **NEW** - Rich message context tracking
- ✅ **Cross-Server Communication** ⭐ **NEW** - Seamless integration between servers

**The Ocean Subscription System is ready for comprehensive testing!** 🎉

All collections are production-ready and include:
- Complete API documentation
- Example requests and responses
- Subscription-aware features
- Boost management capabilities
- Analytics and reporting
- Error handling examples

Start testing the subscription system with these updated collections! 🚀

