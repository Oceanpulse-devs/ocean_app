# 🌊 OCEAN BACKEND COMPLETE API DOCUMENTATION

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Environment](#base-url--environment)
4. [API Endpoints](#api-endpoints)
   - [Authentication Routes](#authentication-routes)
   - [User Management](#user-management)
   - [Feed System](#feed-system)
   - [Products & Marketplace](#products--marketplace)
   - [Auction System](#auction-system)
   - [Messaging System](#messaging-system)
   - [Follow System](#follow-system)
   - [Notifications](#notifications)
   - [Group Buy System](#group-buy-system)
   - [Swap Deals](#swap-deals)
   - [Buyer Needs Board](#buyer-needs-board)
   - [Market Analytics](#market-analytics)
   - [Distress Sales](#distress-sales)
   - [Heavy Distributors](#heavy-distributors)
   - [Seller Verification](#seller-verification)
   - [Admin Routes](#admin-routes)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [WebSocket Events](#websocket-events)
9. [File Upload](#file-upload)
10. [Testing](#testing)

---

## 🌟 Overview

The Ocean Backend is a comprehensive marketplace platform built with Node.js, Express, and MySQL. It provides APIs for:

- **User Management**: Registration, authentication, profiles
- **Marketplace**: Product listings, search, categories
- **Social Features**: Feed, follows, messaging
- **Advanced Commerce**: Auctions, group buys, swap deals
- **Trust Systems**: Seller verification, ratings
- **Analytics**: Market insights, user behavior tracking

---

## 🔐 Authentication

### JWT Token Structure
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": "24h"
}
```

### Authorization Header
```
Authorization: Bearer <jwt_token>
```

### Token Refresh
```
POST /api/auth/refresh-token
Authorization: Bearer <refresh_token>
```

---

## 🌐 Base URL & Environment

### Development
```
http://localhost:3000
```

### Production
```
https://api.ocean-marketplace.com
```

### API Version
```
/api/v1 (default) or /api
```

---

## 🚀 API Endpoints

---

### 🔑 Authentication Routes

#### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+2348012345678",
  "accountType": "buyer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid",
    "email": "john@example.com",
    "accountType": "buyer",
    "verificationRequired": true
  }
}
```

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "accountType": "buyer",
      "isVerified": false
    }
  }
}
```

#### 3. Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "verificationCode": "123456"
}
```

#### 4. Password Reset Request
```http
POST /api/auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### 5. Password Reset
```http
POST /api/auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

---

### 👤 User Management

#### 1. Get User Profile
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "accountType": "buyer",
    "isVerified": false,
    "profilePicture": "https://example.com/avatar.jpg",
    "bio": "User bio here",
    "location": "Lagos, Nigeria",
    "dateOfBirth": "1990-01-01",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 2. Update User Profile
```http
PUT /api/profile/update
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "bio": "Updated bio",
  "location": "Abuja, Nigeria",
  "dateOfBirth": "1990-01-01"
}
```

#### 3. Get User by ID
```http
GET /api/profile/:userId
Authorization: Bearer <jwt_token>
```

#### 4. Upload Profile Picture
```http
POST /api/profile/upload-picture
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `profilePicture`: Image file (jpg, png, gif)

---

### 📰 Feed System

#### 1. Get Feed Posts
```http
GET /api/feed
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 10)
- `category`: Filter by category
- `userId`: Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "content": "Post content here",
        "images": ["image1.jpg", "image2.jpg"],
        "author": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "profilePicture": "avatar.jpg"
        },
        "likes": 25,
        "comments": 10,
        "shares": 5,
        "createdAt": "2024-01-15T10:00:00Z",
        "isLiked": false,
        "isSaved": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalPosts": 50,
      "postsPerPage": 10
    }
  }
}
```

#### 2. Create Post
```http
POST /api/feed/create
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `content`: Post text content
- `images`: Array of image files (optional)
- `category`: Post category (optional)

#### 3. Like/Unlike Post
```http
POST /api/feed/:postId/like
Authorization: Bearer <jwt_token>
```

#### 4. Comment on Post
```http
POST /api/feed/:postId/comment
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Comment text here"
}
```

#### 5. Share Post
```http
POST /api/feed/:postId/share
Authorization: Bearer <jwt_token>
```

#### 6. Save Post
```http
POST /api/feed/:postId/save
Authorization: Bearer <jwt_token>
```

---

### 🛒 Products & Marketplace

#### 1. Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Products per page (default: 20)
- `category`: Filter by category
- `subcategory`: Filter by subcategory
- `brand`: Filter by brand
- `condition`: Filter by condition (new, used, refurbished)
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `location`: Filter by location
- `sortBy`: Sort field (price, date, rating)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "title": "iPhone 13 Pro",
        "description": "Product description",
        "price": 299999.99,
        "originalPrice": 349999.99,
        "category": "Electronics",
        "subcategory": "Smartphones",
        "brand": "Apple",
        "condition": "new",
        "images": ["image1.jpg", "image2.jpg"],
        "seller": {
          "id": "uuid",
          "businessName": "Tech Store",
          "rating": 4.5,
          "isVerified": true
        },
        "location": "Lagos, Nigeria",
        "createdAt": "2024-01-15T10:00:00Z",
        "views": 150,
        "isSaved": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalProducts": 200,
      "productsPerPage": 20
    }
  }
}
```

#### 2. Get Product by ID
```http
GET /api/products/:productId
Authorization: Bearer <jwt_token> (optional)
```

#### 3. Create Product
```http
POST /api/products/create
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Product title
- `description`: Product description
- `price`: Product price
- `category`: Product category
- `subcategory`: Product subcategory
- `brand`: Product brand
- `condition`: Product condition
- `location`: Product location
- `images`: Array of product images

#### 4. Update Product
```http
PUT /api/products/:productId
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 5. Delete Product
```http
DELETE /api/products/:productId
Authorization: Bearer <jwt_token>
```

#### 6. Search Products
```http
GET /api/products/search
```

**Query Parameters:**
- `q`: Search query
- `category`: Filter by category
- `location`: Filter by location
- `priceRange`: Price range filter

#### 7. Get Product Categories
```http
GET /api/products/categories
```

#### 8. Get Saved Products
```http
GET /api/products/saved
Authorization: Bearer <jwt_token>
```

---

### 🏷️ Auction System

#### 1. Get All Auctions
```http
GET /api/auctions
```

**Query Parameters:**
- `status`: Filter by status (active, ended, upcoming)
- `category`: Filter by category
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "title": "iPhone 13 Pro",
          "images": ["image1.jpg"]
        },
        "startingBid": 250000.00,
        "currentBid": 275000.00,
        "reservePrice": 300000.00,
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-20T10:00:00Z",
        "status": "active",
        "totalBids": 15,
        "seller": {
          "id": "uuid",
          "businessName": "Tech Store"
        },
        "timeLeft": "4 days 23 hours"
      }
    ]
  }
}
```

#### 2. Get Auction by ID
```http
GET /api/auctions/:auctionId
```

#### 3. Create Auction
```http
POST /api/auctions/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "uuid",
  "startingBid": 250000.00,
  "reservePrice": 300000.00,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-20T10:00:00Z",
  "description": "Auction description"
}
```

#### 4. Place Bid
```http
POST /api/auctions/:auctionId/bid
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bidAmount": 280000.00
}
```

#### 5. Get Auction Bids
```http
GET /api/auctions/:auctionId/bids
```

#### 6. Watch Auction
```http
POST /api/auctions/:auctionId/watch
Authorization: Bearer <jwt_token>
```

---

### 💬 Messaging System

#### 1. Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "participants": [
          {
            "id": "uuid",
            "firstName": "John",
            "lastName": "Doe",
            "profilePicture": "avatar.jpg"
          }
        ],
        "lastMessage": {
          "content": "Hello, is this still available?",
          "timestamp": "2024-01-15T10:00:00Z",
          "senderId": "uuid"
        },
        "unreadCount": 2,
        "product": {
          "id": "uuid",
          "title": "iPhone 13 Pro",
          "image": "image1.jpg"
        }
      }
    ]
  }
}
```

#### 2. Get Messages in Conversation
```http
GET /api/messages/conversations/:conversationId
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Messages per page

#### 3. Send Message
```http
POST /api/messages/send
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "Message content",
  "type": "text"
}
```

#### 4. Start Conversation
```http
POST /api/messages/start-conversation
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipientId": "uuid",
  "productId": "uuid",
  "initialMessage": "Hello, I'm interested in your product"
}
```

#### 5. Mark Messages as Read
```http
PUT /api/messages/conversations/:conversationId/read
Authorization: Bearer <jwt_token>
```

---

### 👥 Follow System

#### 1. Follow User
```http
POST /api/follow/:userId
Authorization: Bearer <jwt_token>
```

#### 2. Unfollow User
```http
DELETE /api/follow/:userId
Authorization: Bearer <jwt_token>
```

#### 3. Get Followers
```http
GET /api/follow/:userId/followers
```

**Query Parameters:**
- `page`: Page number
- `limit`: Followers per page

#### 4. Get Following
```http
GET /api/follow/:userId/following
```

**Query Parameters:**
- `page`: Page number
- `limit`: Following per page

#### 5. Check Follow Status
```http
GET /api/follow/:userId/status
Authorization: Bearer <jwt_token>
```

---

### 🔔 Notifications

#### 1. Get Notifications
```http
GET /api/notifications
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Notifications per page
- `type`: Filter by type
- `unreadOnly`: Filter unread only (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "new_message",
        "title": "New Message",
        "message": "John Doe sent you a message",
        "data": {
          "conversationId": "uuid",
          "senderId": "uuid"
        },
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

#### 2. Mark Notification as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer <jwt_token>
```

#### 3. Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <jwt_token>
```

#### 4. Delete Notification
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer <jwt_token>
```

#### 5. Get Notification Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <jwt_token>
```

#### 6. Update Notification Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "types": {
    "new_message": true,
    "new_follower": true,
    "auction_update": true,
    "price_drop": false
  }
}
```

---

### 👥 Group Buy System

#### 1. Get Group Buys
```http
GET /api/group-buy
```

**Query Parameters:**
- `status`: Filter by status (active, completed, cancelled)
- `category`: Filter by category
- `location`: Filter by location
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "groupBuys": [
      {
        "id": "uuid",
        "product": {
          "title": "iPhone 13 Pro",
          "image": "image1.jpg"
        },
        "originalPrice": 350000.00,
        "groupPrice": 300000.00,
        "minParticipants": 5,
        "currentParticipants": 3,
        "maxParticipants": 10,
        "deadline": "2024-01-25T10:00:00Z",
        "status": "active",
        "organizer": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "timeLeft": "9 days 23 hours"
      }
    ]
  }
}
```

#### 2. Create Group Buy
```http
POST /api/group-buy/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "uuid",
  "originalPrice": 350000.00,
  "groupPrice": 300000.00,
  "minParticipants": 5,
  "maxParticipants": 10,
  "deadline": "2024-01-25T10:00:00Z",
  "description": "Group buy description"
}
```

#### 3. Join Group Buy
```http
POST /api/group-buy/:groupId/join
Authorization: Bearer <jwt_token>
```

#### 4. Leave Group Buy
```http
DELETE /api/group-buy/:groupId/leave
Authorization: Bearer <jwt_token>
```

#### 5. Get Group Buy Details
```http
GET /api/group-buy/:groupId
```

#### 6. Get Group Buy Participants
```http
GET /api/group-buy/:groupId/participants
```

---

### 🔄 Swap Deals

#### 1. Get Swap Deals
```http
GET /api/swap-deals
```

**Query Parameters:**
- `status`: Filter by status (active, completed, cancelled)
- `category`: Filter by category
- `location`: Filter by location
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "swapDeals": [
      {
        "id": "uuid",
        "offeredProduct": {
          "title": "iPhone 13 Pro",
          "image": "image1.jpg"
        },
        "wantedProduct": "Samsung Galaxy S21",
        "description": "Looking to swap my iPhone for a Samsung",
        "status": "active",
        "owner": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "location": "Lagos, Nigeria",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

#### 2. Create Swap Deal
```http
POST /api/swap-deals/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "offeredProductId": "uuid",
  "wantedProduct": "Samsung Galaxy S21",
  "description": "Looking to swap my iPhone for a Samsung",
  "location": "Lagos, Nigeria"
}
```

#### 3. Make Swap Offer
```http
POST /api/swap-deals/:dealId/offer
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "offeredProductId": "uuid",
  "message": "I have this product to swap"
}
```

#### 4. Accept Swap Offer
```http
POST /api/swap-deals/:dealId/accept/:offerId
Authorization: Bearer <jwt_token>
```

#### 5. Reject Swap Offer
```http
POST /api/swap-deals/:dealId/reject/:offerId
Authorization: Bearer <jwt_token>
```

#### 6. Get Swap Deal Details
```http
GET /api/swap-deals/:dealId
```

---

### 📮 Buyer Needs Board

#### 1. Get Buyer Needs
```http
GET /api/buyer-needs
```

**Query Parameters:**
- `status`: Filter by status (open, fulfilled, closed)
- `category`: Filter by category
- `location`: Filter by location
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "buyerNeeds": [
      {
        "id": "uuid",
        "title": "Looking for iPhone 13 Pro",
        "description": "Need iPhone 13 Pro in good condition",
        "category": "Electronics",
        "subcategory": "Smartphones",
        "budget": {
          "min": 250000.00,
          "max": 300000.00
        },
        "location": "Lagos, Nigeria",
        "status": "open",
        "buyer": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "responses": 5,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

#### 2. Create Buyer Need
```http
POST /api/buyer-needs/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Looking for iPhone 13 Pro",
  "description": "Need iPhone 13 Pro in good condition",
  "category": "Electronics",
  "subcategory": "Smartphones",
  "budget": {
    "min": 250000.00,
    "max": 300000.00
  },
  "location": "Lagos, Nigeria",
  "deadline": "2024-01-25T10:00:00Z"
}
```

#### 3. Respond to Buyer Need
```http
POST /api/buyer-needs/:needId/respond
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "I have an iPhone 13 Pro for sale",
  "productId": "uuid",
  "price": 280000.00
}
```

#### 4. Get Buyer Need Responses
```http
GET /api/buyer-needs/:needId/responses
```

#### 5. Close Buyer Need
```http
PUT /api/buyer-needs/:needId/close
Authorization: Bearer <jwt_token>
```

---

### 📊 Market Analytics

#### 1. Get Market Insights
```http
GET /api/market-analytics/insights
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `category`: Filter by category
- `location`: Filter by location
- `timeframe`: Time period (7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "trendingProducts": [
      {
        "product": "iPhone 13 Pro",
        "searchVolume": 1500,
        "priceTrend": "increasing",
        "demand": "high"
      }
    ],
    "priceAnalysis": {
      "averagePrice": 320000.00,
      "priceRange": {
        "min": 250000.00,
        "max": 400000.00
      },
      "priceChange": "+5.2%"
    },
    "demandInsights": {
      "hotCategories": ["Electronics", "Fashion"],
      "seasonalTrends": ["Summer items trending up"]
    }
  }
}
```

#### 2. Get Search Analytics
```http
GET /api/market-analytics/search
Authorization: Bearer <jwt_token>
```

#### 3. Get User Behavior Analytics
```http
GET /api/market-analytics/user-behavior
Authorization: Bearer <jwt_token>
```

---

### 🚨 Distress Sales

#### 1. Get Distress Sales
```http
GET /api/distress-sales/all
```

**Query Parameters:**
- `urgency`: Filter by urgency (low, medium, high, urgent)
- `category`: Filter by category
- `location`: Filter by location
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "distressSales": [
      {
        "id": "uuid",
        "product": {
          "title": "iPhone 13 Pro",
          "image": "image1.jpg"
        },
        "originalPrice": 350000.00,
        "currentPrice": 280000.00,
        "discountPercentage": 20,
        "urgencyLevel": "high",
        "distressReason": "Moving to another city",
        "expiryDate": "2024-01-20T10:00:00Z",
        "seller": {
          "id": "uuid",
          "businessName": "Tech Store"
        },
        "timeLeft": "4 days 23 hours"
      }
    ]
  }
}
```

#### 2. Create Distress Sale
```http
POST /api/distress-sales/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "uuid",
  "originalPrice": 350000.00,
  "discountPercentage": 20,
  "urgencyLevel": "high",
  "distressReason": "Moving to another city",
  "expiryDate": "2024-01-20T10:00:00Z"
}
```

#### 3. Get Distress Sale Stats
```http
GET /api/distress-sales/stats
```

#### 4. Convert to Regular Sale
```http
PUT /api/distress-sales/:saleId/convert
Authorization: Bearer <jwt_token>
```

---

### 🚚 Heavy Distributors

#### 1. Get All Distributors
```http
GET /api/heavy-distributors/all
```

**Query Parameters:**
- `businessType`: Filter by business type
- `category`: Filter by product category
- `location`: Filter by location
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "distributors": [
      {
        "id": "uuid",
        "businessName": "Tech Distributors Ltd",
        "businessType": "wholesaler",
        "productCategories": ["Electronics", "Computers"],
        "productBrands": ["Apple", "Samsung", "HP"],
        "minimumOrderQuantity": 10,
        "minimumOrderValue": 500000.00,
        "paymentTerms": "Net 30",
        "deliveryOptions": ["Express", "Standard"],
        "coverageAreas": ["Lagos", "Abuja", "Port Harcourt"],
        "rating": 4.8,
        "totalOrders": 150,
        "isVerified": true,
        "contactInfo": {
          "phone": "+2348012345678",
          "email": "info@techdist.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalDistributors": 50,
      "distributorsPerPage": 10
    }
  }
}
```

#### 2. Search Distributors
```http
GET /api/heavy-distributors/search
```

**Query Parameters:**
- `q`: Search query
- `businessType`: Filter by business type
- `category`: Filter by product category
- `location`: Filter by location
- `minOrderValue`: Minimum order value
- `page`: Page number
- `limit`: Items per page

#### 3. Get Distributor by ID
```http
GET /api/heavy-distributors/:distributorId
```

#### 4. Create Distributor Listing
```http
POST /api/heavy-distributors/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "businessName": "Tech Distributors Ltd",
  "businessType": "wholesaler",
  "productCategories": ["Electronics", "Computers"],
  "productBrands": ["Apple", "Samsung", "HP"],
  "minimumOrderQuantity": 10,
  "minimumOrderValue": 500000.00,
  "paymentTerms": "Net 30",
  "deliveryOptions": ["Express", "Standard"],
  "coverageAreas": ["Lagos", "Abuja", "Port Harcourt"],
  "contactInfo": {
    "phone": "+2348012345678",
    "email": "info@techdist.com"
  },
  "businessAddress": "123 Business Street, Lagos",
  "operatingHours": "9 AM - 6 PM",
  "certifications": ["ISO 9001", "NAFDAC"],
  "yearsInBusiness": 5,
  "employeeCount": 25,
  "annualRevenue": "100M+"
}
```

#### 5. Update Distributor Listing
```http
PUT /api/heavy-distributors/:distributorId
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 6. Delete Distributor Listing
```http
DELETE /api/heavy-distributors/:distributorId
Authorization: Bearer <jwt_token>
```

#### 7. Get Distributor Stats
```http
GET /api/heavy-distributors/:distributorId/stats
```

#### 8. Submit Distributor Inquiry
```http
POST /api/heavy-distributors/:distributorId/inquiry
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "inquiryType": "product_inquiry",
  "message": "I'm interested in bulk iPhone orders",
  "expectedQuantity": 50,
  "budget": 25000000.00,
  "urgency": "high",
  "preferredContact": "email"
}
```

#### 9. Get Distributor Reviews
```http
GET /api/heavy-distributors/:distributorId/reviews
```

**Query Parameters:**
- `page`: Page number
- `limit`: Reviews per page
- `rating`: Filter by rating (1-5)

#### 10. Submit Distributor Review
```http
POST /api/heavy-distributors/:distributorId/review
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent service and quality products",
  "orderId": "uuid",
  "recommend": true
}
```

---

### 🏆 Seller Verification

#### 1. Get Verification Requirements
```http
GET /api/seller-verification/requirements
```

**Query Parameters:**
- `category`: Business category (basic, business, premium)
- `country`: Country code for country-specific requirements

**Response:**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "basic": [
        {
          "type": "NIN",
          "required": true,
          "description": "National Identification Number"
        }
      ]
    },
    "minimumScore": 70,
    "processingTime": "5-7 business days",
    "nextSteps": [
      "Submit required documents",
      "Wait for admin review"
    ]
  }
}
```

#### 2. Submit Verification Application
```http
POST /api/seller-verification/submit
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "businessName": "My Business Name",
  "businessAddress": "123 Business Street",
  "country": "Nigeria",
  "state": "Lagos",
  "category": "business",
  "documents": [
    {
      "documentType": "BusinessCertificate",
      "documentNumber": "BN123456",
      "documentImage": "https://example.com/cert.jpg",
      "documentBackImage": "https://example.com/cert_back.jpg",
      "documentExpiryDate": "2025-12-31",
      "documentIssuingAuthority": "Corporate Affairs Commission",
      "documentCountry": "Nigeria"
    }
  ]
}
```

#### 3. Get Verification Status
```http
GET /api/seller-verification/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "My Business Name",
    "verificationStatus": "pending",
    "verificationScore": 75,
    "verificationLevel": "basic",
    "documentsSubmitted": 3,
    "documentsApproved": 2,
    "benefits": [
      "Verified seller badge",
      "Enhanced product visibility"
    ],
    "nextSteps": [
      "Wait for admin review (5-7 business days)"
    ],
    "documents": [
      {
        "id": "uuid",
        "documentType": "BusinessCertificate",
        "status": "approved",
        "documentScore": 30
      }
    ]
  }
}
```

#### 4. Admin Review Verification
```http
POST /api/seller-verification/admin/review
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "uuid",
  "action": "approve",
  "notes": "All documents verified successfully",
  "documentReviews": [
    {
      "documentId": "uuid",
      "status": "approved",
      "notes": "Document is valid and current"
    }
  ]
}
```

**Actions:**
- `approve`: Approve the verification
- `reject`: Reject with reason
- `suspend`: Temporarily suspend
- `request_more_info`: Request additional documents

#### 5. Get Verification Statistics
```http
GET /api/seller-verification/admin/stats
Authorization: Bearer <jwt_token>
```

---

### 👨‍💼 Admin Routes

#### 1. Get Pending Sellers
```http
GET /api/admin/pending-sellers
Authorization: Bearer <jwt_token>
```

#### 2. Get All Sellers
```http
GET /api/admin/sellers
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status`: Filter by verification status
- `category`: Filter by business category
- `page`: Page number
- `limit`: Sellers per page

#### 3. Get Seller Details
```http
GET /api/admin/sellers/:sellerId
Authorization: Bearer <jwt_token>
```

#### 4. Approve Seller
```http
POST /api/admin/approve-seller
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "uuid",
  "adminNotes": "All documents verified successfully"
}
```

#### 5. Reject Seller
```http
POST /api/admin/reject-seller
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "uuid",
  "rejectionReason": "Documents are unclear",
  "adminNotes": "Please provide clearer document images"
}
```

#### 6. Toggle Seller Status
```http
POST /api/admin/toggle-seller-status
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "uuid",
  "action": "suspend",
  "reason": "Violation of terms of service"
}
```

#### 7. Get All Users
```http
GET /api/admin/users
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `accountType`: Filter by account type
- `status`: Filter by user status
- `page`: Page number
- `limit`: Users per page

#### 8. Get User Details
```http
GET /api/admin/users/:userId
Authorization: Bearer <jwt_token>
```

#### 9. Toggle User Status
```http
POST /api/admin/toggle-user-status
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "uuid",
  "action": "suspend",
  "reason": "Suspicious activity detected"
}
```

#### 10. Get Admin Statistics
```http
GET /api/admin/stats
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalSellers": 250,
    "totalProducts": 5000,
    "totalAuctions": 150,
    "totalGroupBuys": 75,
    "totalSwapDeals": 100,
    "totalDistressSales": 50,
    "totalDistributors": 30,
    "pendingVerifications": 25,
    "revenueStats": {
      "totalRevenue": 50000000.00,
      "monthlyRevenue": 5000000.00,
      "topCategories": ["Electronics", "Fashion", "Home"]
    }
  }
}
```

---

## 📊 Data Models

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  accountType ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
  isVerified BOOLEAN DEFAULT FALSE,
  profilePicture TEXT,
  bio TEXT,
  location VARCHAR(255),
  dateOfBirth DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  sellerId UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  originalPrice DECIMAL(10,2),
  discountPercentage DECIMAL(5,2),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  condition ENUM('new', 'used', 'refurbished'),
  images JSON,
  location VARCHAR(255),
  status ENUM('active', 'sold', 'inactive') DEFAULT 'active',
  isDistressSale BOOLEAN DEFAULT FALSE,
  urgencyLevel ENUM('low', 'medium', 'high', 'urgent'),
  distressReason VARCHAR(255),
  distressExpiryDate DATETIME,
  views INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sellerId) REFERENCES sellers(id)
);
```

### Sellers Table
```sql
CREATE TABLE sellers (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  businessName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  businessAddress TEXT NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  category VARCHAR(100),
  isVerified BOOLEAN DEFAULT FALSE,
  verificationStatus ENUM('pending', 'rejected', 'approved', 'suspended', 'active', 'expired') DEFAULT 'pending',
  verifiedAt DATETIME,
  verificationExpiresAt DATETIME,
  verificationLevel ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
  verificationScore INT DEFAULT 0,
  verificationNotes TEXT,
  rejectionReason TEXT,
  documentsSubmitted INT DEFAULT 0,
  documentsApproved INT DEFAULT 0,
  lastVerificationCheck DATETIME,
  verifiedSellerBenefits JSON,
  trustScore INT DEFAULT 0,
  rating FLOAT DEFAULT 0.0,
  totalSales INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Seller Documents Table
```sql
CREATE TABLE seller_documents (
  id UUID PRIMARY KEY,
  sellerId UUID NOT NULL,
  documentType ENUM('NIN', 'DriversLicense', 'Passport', 'BusinessCertificate', 'BusinessLicense', 'TaxCertificate', 'BankStatement', 'UtilityBill', 'InsuranceCertificate', 'Other') NOT NULL,
  documentNumber VARCHAR(255),
  documentImage TEXT NOT NULL,
  documentBackImage TEXT,
  documentExpiryDate DATE,
  documentIssuingAuthority VARCHAR(255),
  documentCountry VARCHAR(100),
  status ENUM('pending', 'approved', 'rejected', 'expired', 'under_review') DEFAULT 'pending',
  submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  verifiedAt DATETIME,
  verifiedBy UUID,
  verificationNotes TEXT,
  rejectionReason TEXT,
  documentScore INT DEFAULT 0,
  isExpired BOOLEAN DEFAULT FALSE,
  requiresRenewal BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sellerId) REFERENCES sellers(id)
);
```

### Heavy Distributors Table
```sql
CREATE TABLE heavy_distributors (
  id UUID PRIMARY KEY,
  supplierId UUID NOT NULL,
  businessName VARCHAR(200) NOT NULL,
  businessType ENUM('manufacturer', 'wholesaler', 'distributor', 'retailer', 'importer', 'exporter') NOT NULL,
  productCategories JSON,
  productBrands JSON,
  minimumOrderQuantity INT,
  minimumOrderValue DECIMAL(12,2),
  paymentTerms VARCHAR(100),
  deliveryOptions JSON,
  coverageAreas JSON,
  contactInfo JSON,
  businessAddress TEXT,
  operatingHours VARCHAR(100),
  certifications JSON,
  yearsInBusiness INT,
  employeeCount INT,
  annualRevenue VARCHAR(50),
  rating FLOAT DEFAULT 0.0,
  totalOrders INT DEFAULT 0,
  isVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplierId) REFERENCES sellers(id)
);
```

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "Technical error details",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or expired token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `DATABASE_ERROR`: Database operation failed
- `FILE_UPLOAD_ERROR`: File upload failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## 🚦 Rate Limiting

### Rate Limits by Endpoint Type
- **Public endpoints**: 100 requests per hour
- **Protected endpoints**: 1000 requests per hour
- **Admin endpoints**: 500 requests per hour
- **File upload endpoints**: 50 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642233600
```

---

## 🔌 WebSocket Events

### Connection Events
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt_token_here'
  }
});

// Connection established
socket.on('connect', () => {
  console.log('Connected to Ocean WebSocket');
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});
```

### Real-time Events
```javascript
// New message received
socket.on('new_message', (data) => {
  console.log('New message:', data);
});

// New notification
socket.on('new_notification', (data) => {
  console.log('New notification:', data);
});

// Auction update
socket.on('auction_update', (data) => {
  console.log('Auction update:', data);
});

// Group buy update
socket.on('group_buy_update', (data) => {
  console.log('Group buy update:', data);
});

// Price drop alert
socket.on('price_drop', (data) => {
  console.log('Price drop:', data);
});
```

### Emitting Events
```javascript
// Join a room (e.g., auction room)
socket.emit('join_room', {
  roomId: 'auction_123',
  type: 'auction'
});

// Leave a room
socket.emit('leave_room', {
  roomId: 'auction_123'
});

// Send typing indicator
socket.emit('typing', {
  conversationId: 'conv_123',
  isTyping: true
});
```

---

## 📁 File Upload

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Videos**: MP4, MOV, AVI (max 100MB)

### File Upload Endpoints
```http
POST /api/upload/image
POST /api/upload/document
POST /api/upload/video
```

### Upload Response
```json
{
  "success": true,
  "data": {
    "filename": "product_image_123.jpg",
    "url": "https://cdn.ocean.com/uploads/product_image_123.jpg",
    "size": 2048576,
    "mimeType": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### File Size Limits
- **Profile pictures**: 5MB
- **Product images**: 10MB
- **Documents**: 25MB
- **Videos**: 100MB

---

## 🧪 Testing

### Test Environment
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "User Registration"

# Run tests in watch mode
npm run test:watch
```

### API Testing with Postman
1. **Import Collection**: Use the provided Postman collection
2. **Set Environment Variables**:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: JWT token from login
3. **Run Tests**: Execute the collection with test scripts

### Test Data
```bash
# Seed database with test data
npm run seed:test

# Clear test data
npm run seed:clear
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/ocean-marketplace/backend.git
cd ocean-backend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Seed database
npm run seed

# Start development server
npm run dev
```

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ocean_marketplace
DB_USER=root
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
```

---

## 📚 Additional Resources

### Documentation Links
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Changelog](./API_CHANGELOG.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Support & Contact
- **Technical Support**: tech@ocean-marketplace.com
- **API Issues**: api@ocean-marketplace.com
- **Documentation**: docs@ocean-marketplace.com

### Community & Updates
- **GitHub**: https://github.com/ocean-marketplace
- **Discord**: https://discord.gg/ocean-marketplace
- **Blog**: https://blog.ocean-marketplace.com

---

## 📝 Changelog

### Version 1.0.0 (2024-01-15)
- ✅ Initial API release
- ✅ User authentication system
- ✅ Product marketplace
- ✅ Auction system
- ✅ Messaging system
- ✅ Follow system
- ✅ Notification system
- ✅ Group buy system
- ✅ Swap deals
- ✅ Buyer needs board
- ✅ Market analytics
- ✅ Distress sales
- ✅ Heavy distributors
- ✅ Seller verification system

---

*This documentation is maintained by the Ocean Development Team. Last updated: January 15, 2024*