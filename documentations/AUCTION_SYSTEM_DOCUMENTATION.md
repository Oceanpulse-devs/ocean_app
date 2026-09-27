# 🏷️ Auction System Documentation

## Overview
The Auction System is a comprehensive bidding platform that allows sellers to create auctions and buyers to place bids. Only verified sellers can create auctions, while any authenticated user can bid.

## 🗄️ Database Models

### 1. Auction Model
**Table:** `auctions`

**Key Fields:**
- `id` (UUID) - Primary key
- `sellerId` (UUID) - Reference to seller
- `title` (String) - Auction title
- `description` (Text) - Detailed description
- `startingPrice` (Decimal) - Initial bid price
- `currentPrice` (Decimal) - Current highest bid
- `reservePrice` (Decimal) - Minimum price to sell (optional)
- `minimumBidIncrement` (Decimal) - Minimum bid increase
- `startTime` (DateTime) - When auction starts
- `endTime` (DateTime) - When auction ends
- `status` (ENUM) - draft, active, paused, ended, cancelled, sold
- `category` (String) - Product category
- `condition` (ENUM) - new, like_new, good, fair, poor
- `images` (JSON) - Array of image URLs
- `views` (Integer) - View count
- `totalBids` (Integer) - Total number of bids
- `uniqueBidders` (Integer) - Number of unique bidders
- `isReserveMet` (Boolean) - Whether reserve price is met
- `winnerId` (UUID) - Winning bidder
- `winningBidAmount` (Decimal) - Final winning bid
- `autoExtend` (Boolean) - Auto-extend on last-minute bids
- `tags` (JSON) - Search tags
- `shippingInfo` (JSON) - Shipping details
- `returnPolicy` (Text) - Return policy

### 2. AuctionBid Model
**Table:** `auctionbids`

**Key Fields:**
- `id` (UUID) - Primary key
- `auctionId` (UUID) - Reference to auction
- `bidderId` (UUID) - Reference to bidder
- `bidAmount` (Decimal) - Bid amount
- `isAutoBid` (Boolean) - Auto-bidding enabled
- `maxAutoBidAmount` (Decimal) - Maximum auto-bid amount
- `isWinningBid` (Boolean) - Currently winning bid
- `status` (ENUM) - active, outbid, won, cancelled
- `ipAddress` (String) - Bidder's IP
- `userAgent` (Text) - Browser info

### 3. AuctionWatcher Model
**Table:** `auctionwatchers`

**Key Fields:**
- `id` (UUID) - Primary key
- `auctionId` (UUID) - Reference to auction
- `userId` (UUID) - Reference to watcher
- `notificationsEnabled` (Boolean) - Notification preferences
- `lastViewedAt` (DateTime) - Last view timestamp

## 🚀 API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Get All Auctions
```
GET /api/auctions
```

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `status` (string) - Filter by status
- `category` (string) - Filter by category
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `condition` (string) - Filter by condition
- `location` (string) - Filter by location
- `search` (string) - Search in title/description/tags
- `sortBy` (string) - Sort field (default: endTime)
- `sortOrder` (string) - ASC or DESC (default: ASC)

**Response:**
```json
{
  "auctions": [...],
  "total": 100,
  "currentPage": 1,
  "totalPages": 5
}
```

#### 2. Get Auction Categories
```
GET /api/auctions/categories
```

**Response:**
```json
{
  "categories": [
    {
      "name": "Electronics",
      "count": 25
    }
  ]
}
```

#### 3. Get Single Auction
```
GET /api/auction/:auctionId
```

**Response:**
```json
{
  "auction": {
    "id": "uuid",
    "title": "iPhone 15 Pro",
    "description": "Brand new iPhone...",
    "currentPrice": 1200.00,
    "startingPrice": 1000.00,
    "reservePrice": 1100.00,
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-20T10:00:00Z",
    "status": "active",
    "totalBids": 15,
    "uniqueBidders": 8,
    "isReserveMet": true,
    "seller": {
      "user": {
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    },
    "bids": [...],
    "winner": null
  },
  "isWatching": false,
  "userBid": null
}
```

### Protected Endpoints (Authentication Required)

#### 4. Create Auction (Sellers Only)
```
POST /api/auctions
```

**Request Body:**
```json
{
  "title": "iPhone 15 Pro",
  "description": "Brand new iPhone 15 Pro, 256GB, Space Black",
  "startingPrice": 1000.00,
  "reservePrice": 1100.00,
  "minimumBidIncrement": 10.00,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-20T10:00:00Z",
  "category": "Electronics",
  "subcategory": "Smartphones",
  "condition": "new",
  "location": "Lagos, Nigeria",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "autoExtend": true,
  "autoExtendMinutes": 5,
  "tags": ["iphone", "smartphone", "apple"],
  "shippingInfo": {
    "cost": 50.00,
    "method": "Express Delivery",
    "estimatedDays": "2-3 days"
  },
  "returnPolicy": "7-day return policy with original packaging"
}
```

#### 5. Place Bid
```
POST /api/auction/:auctionId/bid
```

**Request Body:**
```json
{
  "bidAmount": 1250.00,
  "isAutoBid": false,
  "maxAutoBidAmount": 1500.00
}
```

**Response:**
```json
{
  "message": "Bid placed successfully",
  "bid": {
    "id": "uuid",
    "bidAmount": 1250.00,
    "isWinningBid": true,
    "status": "active"
  },
  "currentPrice": 1250.00
}
```

#### 6. Watch/Unwatch Auction
```
POST /api/auction/:auctionId/watch
```

**Response:**
```json
{
  "message": "Auction watched",
  "isWatching": true
}
```

#### 7. Update Auction (Sellers Only)
```
PUT /api/auction/:auctionId
```

**Request Body:** (Same as create, but only updatable fields)

#### 8. Cancel Auction (Sellers Only)
```
DELETE /api/auction/:auctionId
```

#### 9. Get User's Auctions (Sellers)
```
GET /api/user/auctions?status=active&page=1&limit=20
```

#### 10. Get User's Bids (Buyers)
```
GET /api/user/bids?status=active&page=1&limit=20
```

## 🎯 Key Features

### 1. **Seller-Only Auction Creation**
- Only verified sellers can create auctions
- Comprehensive validation for all auction fields
- Draft status for preparation before going live

### 2. **Advanced Bidding System**
- Minimum bid increment enforcement
- Reserve price protection
- Auto-bidding support
- Bid validation and conflict prevention
- Real-time price updates

### 3. **Auction Management**
- Multiple auction statuses (draft, active, paused, ended, cancelled, sold)
- Auto-extension on last-minute bids
- Comprehensive auction statistics
- View tracking and engagement metrics

### 4. **User Engagement**
- Watch/unwatch auctions
- Bid history tracking
- Outbid notifications
- Auction cancellation notifications

### 5. **Search and Filtering**
- Category-based filtering
- Price range filtering
- Condition filtering
- Location-based search
- Text search in title, description, and tags
- Multiple sorting options

### 6. **Security Features**
- Seller verification required
- Bid validation and fraud prevention
- IP tracking for bids
- User agent logging
- Reserve price protection

## 🧪 Testing with Postman

### 1. Create Auction (Seller)
```bash
POST http://localhost:5000/api/auctions
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "title": "MacBook Pro M3",
  "description": "Brand new MacBook Pro with M3 chip, 16GB RAM, 512GB SSD",
  "startingPrice": 2500.00,
  "reservePrice": 2700.00,
  "minimumBidIncrement": 50.00,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-25T10:00:00Z",
  "category": "Electronics",
  "subcategory": "Laptops",
  "condition": "new",
  "location": "Lagos, Nigeria",
  "images": [
    "https://example.com/macbook1.jpg",
    "https://example.com/macbook2.jpg"
  ],
  "autoExtend": true,
  "autoExtendMinutes": 5,
  "tags": ["macbook", "laptop", "apple", "m3"],
  "shippingInfo": {
    "cost": 100.00,
    "method": "Express Delivery",
    "estimatedDays": "3-5 days"
  },
  "returnPolicy": "14-day return policy with original packaging"
}
```

### 2. Get All Auctions
```bash
GET http://localhost:5000/api/auctions?status=active&category=Electronics&minPrice=1000&maxPrice=3000&page=1&limit=10
```

### 3. Place Bid (Buyer)
```bash
POST http://localhost:5000/api/auction/AUCTION_ID/bid
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "bidAmount": 2600.00,
  "isAutoBid": true,
  "maxAutoBidAmount": 3000.00
}
```

### 4. Watch Auction
```bash
POST http://localhost:5000/api/auction/AUCTION_ID/watch
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Get User's Auctions
```bash
GET http://localhost:5000/api/user/auctions?status=active
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 6. Get User's Bids
```bash
GET http://localhost:5000/api/user/bids?status=active
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔄 Business Logic

### 1. **Auction Lifecycle**
1. **Draft** → Seller creates auction
2. **Active** → Auction starts, bidders can bid
3. **Ended** → Auction time expires
4. **Sold** → Winner confirmed, payment processed
5. **Cancelled** → Seller cancels auction

### 2. **Bidding Rules**
- Minimum bid = current price + minimum increment
- Reserve price must be met for auction to be valid
- Sellers cannot bid on their own auctions
- Auto-bidding increases bid automatically up to max amount
- Last-minute bids can extend auction time (if enabled)

### 3. **Winner Selection**
- Highest bidder at auction end time
- Reserve price must be met
- Automatic winner assignment
- Notification to winner and seller

### 4. **Notifications**
- Outbid notifications to previous bidders
- Auction cancellation notifications
- Auction end notifications
- Winner selection notifications

## 🚀 Next Steps

1. **Payment Integration** - Connect with payment gateways
2. **Real-time Updates** - WebSocket for live bidding
3. **Auto-bidding Engine** - Automated bid processing
4. **Auction Analytics** - Detailed seller/buyer analytics
5. **Dispute Resolution** - Handle auction disputes
6. **Escrow Service** - Secure payment holding
7. **Shipping Integration** - Track delivery status

## 📊 Database Schema

```sql
-- Auctions table
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sellerId UUID NOT NULL REFERENCES sellers(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  startingPrice DECIMAL(10,2) NOT NULL,
  currentPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
  reservePrice DECIMAL(10,2),
  minimumBidIncrement DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  startTime TIMESTAMP NOT NULL,
  endTime TIMESTAMP NOT NULL,
  status ENUM('draft','active','paused','ended','cancelled','sold') DEFAULT 'draft',
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  condition ENUM('new','like_new','good','fair','poor') NOT NULL,
  location VARCHAR(255) NOT NULL,
  images JSON,
  views INTEGER DEFAULT 0,
  totalBids INTEGER DEFAULT 0,
  uniqueBidders INTEGER DEFAULT 0,
  isReserveMet BOOLEAN DEFAULT FALSE,
  winnerId UUID REFERENCES users(id),
  winningBidAmount DECIMAL(10,2),
  autoExtend BOOLEAN DEFAULT FALSE,
  autoExtendMinutes INTEGER DEFAULT 5,
  tags JSON,
  shippingInfo JSON,
  returnPolicy TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Auction bids table
CREATE TABLE auctionbids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auctionId UUID NOT NULL REFERENCES auctions(id),
  bidderId UUID NOT NULL REFERENCES users(id),
  bidAmount DECIMAL(10,2) NOT NULL,
  isAutoBid BOOLEAN DEFAULT FALSE,
  maxAutoBidAmount DECIMAL(10,2),
  isWinningBid BOOLEAN DEFAULT FALSE,
  status ENUM('active','outbid','won','cancelled') DEFAULT 'active',
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Auction watchers table
CREATE TABLE auctionwatchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auctionId UUID NOT NULL REFERENCES auctions(id),
  userId UUID NOT NULL REFERENCES users(id),
  notificationsEnabled BOOLEAN DEFAULT TRUE,
  lastViewedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_watcher (auctionId, userId)
);
```

---

**🎉 The Auction System is now ready for testing! Only verified sellers can create auctions, and all users can bid and watch auctions.** 