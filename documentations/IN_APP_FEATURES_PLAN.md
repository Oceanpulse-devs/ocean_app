# Ocean App - In-App Features & API Plan

## 🎯 **Core App Concept**
A marketplace app with social features combining:
- **Feed System**: Mixed posts from buyers (wants) and sellers (products)
- **Products Page**: Searchable product listings
- **Auction System**: Bidding functionality
- **Direct Messaging**: WhatsApp-style chat system
- **Contact List**: Recent chat contacts

---

## 📱 **Main App Features**

### **1. Feed System**
- **Buyer Posts**: "I need X product" → Sellers message them
- **Seller Posts**: Product listings → Buyers message them
- **Mixed Feed**: Chronological posts from both user types
- **Categories**: Filter posts by product categories
- **Search**: Find specific posts/products

### **2. Products Page**
- **Product Listings**: All seller products in one place
- **Search & Filter**: Find specific products
- **Categories**: Browse by product type
- **Seller Info**: View seller details and ratings
- **Message Button**: Direct contact with seller

### **3. Auction System**
- **Create Auction**: Sellers set products for bidding
- **Place Bids**: Buyers bid on auction items
- **Auction Management**: Duration, minimum bids, auto-close
- **Winner Selection**: Highest bidder wins
- **Payment Integration**: Secure transaction handling

### **4. Messaging System**
- **Direct Messages**: One-on-one chat between users
- **Contact List**: Recent chat contacts (WhatsApp style)
- **Message Notifications**: Real-time updates
- **Media Sharing**: Images, files in messages
- **Chat History**: Persistent message storage

---

## 🗄️ **Database Models Needed**

### **1. Posts Table**
```javascript
{
  id: UUID (Primary Key),
  userId: UUID (Foreign Key to UserTable),
  postType: ENUM('buyer_post', 'seller_post'),
  title: STRING(100),
  description: TEXT,
  category: STRING(50),
  images: JSON, // Array of image URLs
  location: STRING(100),
  price: DECIMAL(10,2), // For seller posts
  isActive: BOOLEAN,
  views: INTEGER,
  createdAt: DATE,
  updatedAt: DATE
}
```

### **2. Products Table**
```javascript
{
  id: UUID (Primary Key),
  sellerId: UUID (Foreign Key to SellersTable),
  title: STRING(100),
  description: TEXT,
  category: STRING(50),
  subcategory: STRING(50),
  price: DECIMAL(10,2),
  currency: STRING(3), // USD, EUR, etc.
  condition: ENUM('new', 'like_new', 'good', 'fair', 'poor'),
  images: JSON, // Array of image URLs
  location: STRING(100),
  isAvailable: BOOLEAN,
  views: INTEGER,
  createdAt: DATE,
  updatedAt: DATE
}
```

### **3. Auctions Table**
```javascript
{
  id: UUID (Primary Key),
  sellerId: UUID (Foreign Key to SellersTable),
  productId: UUID (Foreign Key to ProductsTable),
  title: STRING(100),
  description: TEXT,
  startingBid: DECIMAL(10,2),
  currentBid: DECIMAL(10,2),
  minimumIncrement: DECIMAL(10,2),
  startDate: DATE,
  endDate: DATE,
  status: ENUM('upcoming', 'active', 'ended', 'cancelled'),
  winnerId: UUID (Foreign Key to UserTable),
  totalBids: INTEGER,
  views: INTEGER,
  createdAt: DATE,
  updatedAt: DATE
}
```

### **4. Bids Table**
```javascript
{
  id: UUID (Primary Key),
  auctionId: UUID (Foreign Key to AuctionsTable),
  bidderId: UUID (Foreign Key to UserTable),
  bidAmount: DECIMAL(10,2),
  bidTime: DATE,
  isWinningBid: BOOLEAN,
  createdAt: DATE
}
```

### **5. Conversations Table**
```javascript
{
  id: UUID (Primary Key),
  participant1Id: UUID (Foreign Key to UserTable),
  participant2Id: UUID (Foreign Key to UserTable),
  lastMessageId: UUID (Foreign Key to MessagesTable),
  lastMessageTime: DATE,
  unreadCount1: INTEGER, // For participant1
  unreadCount2: INTEGER, // For participant2
  isActive: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

### **6. Messages Table**
```javascript
{
  id: UUID (Primary Key),
  conversationId: UUID (Foreign Key to ConversationsTable),
  senderId: UUID (Foreign Key to UserTable),
  messageType: ENUM('text', 'image', 'file', 'location'),
  content: TEXT,
  mediaUrl: STRING(255), // For images/files
  isRead: BOOLEAN,
  readAt: DATE,
  createdAt: DATE
}
```

---

## 🔌 **API Endpoints Structure**

### **Posts Management**
```
POST   /api/posts                    # Create new post
GET    /api/posts                    # Get feed (with filters)
GET    /api/posts/:postId            # Get specific post
PUT    /api/posts/:postId            # Update post
DELETE /api/posts/:postId            # Delete post
GET    /api/posts/user/:userId       # Get user's posts
POST   /api/posts/:postId/view       # Increment view count
```

### **Products Management**
```
POST   /api/products                 # Create product listing
GET    /api/products                 # Get products (with search/filters)
GET    /api/products/:productId      # Get specific product
PUT    /api/products/:productId      # Update product
DELETE /api/products/:productId      # Delete product
GET    /api/products/seller/:sellerId # Get seller's products
POST   /api/products/:productId/view # Increment view count
```

### **Auction System**
```
POST   /api/auctions                 # Create auction
GET    /api/auctions                 # Get auctions (with filters)
GET    /api/auctions/:auctionId      # Get specific auction
PUT    /api/auctions/:auctionId      # Update auction
DELETE /api/auctions/:auctionId      # Cancel auction
POST   /api/auctions/:auctionId/bid  # Place bid
GET    /api/auctions/:auctionId/bids # Get auction bids
GET    /api/auctions/user/:userId    # Get user's auctions
```

### **Messaging System**
```
POST   /api/conversations            # Start new conversation
GET    /api/conversations            # Get user's conversations
GET    /api/conversations/:conversationId # Get conversation details
POST   /api/conversations/:conversationId/messages # Send message
GET    /api/conversations/:conversationId/messages # Get messages
PUT    /api/messages/:messageId/read # Mark message as read
DELETE /api/conversations/:conversationId # Delete conversation
```

---

## 🎨 **Frontend Design Requirements**

### **Feed Page Design**
```json
{
  "postCard": {
    "header": {
      "userAvatar": "string",
      "userName": "string",
      "userType": "buyer|seller",
      "postTime": "datetime",
      "location": "string"
    },
    "content": {
      "title": "string",
      "description": "string",
      "images": ["array of urls"],
      "category": "string",
      "price": "number (for seller posts)"
    },
    "actions": {
      "messageButton": "Contact Seller/Buyer",
      "likeButton": "boolean",
      "shareButton": "boolean",
      "reportButton": "boolean"
    },
    "stats": {
      "views": "number",
      "messages": "number"
    }
  }
}
```

### **Products Page Design**
```json
{
  "productCard": {
    "header": {
      "sellerAvatar": "string",
      "sellerName": "string",
      "sellerRating": "number",
      "location": "string"
    },
    "content": {
      "productImages": ["array of urls"],
      "title": "string",
      "price": "number",
      "condition": "string",
      "category": "string"
    },
    "actions": {
      "messageButton": "Contact Seller",
      "favoriteButton": "boolean",
      "shareButton": "boolean"
    }
  },
  "filters": {
    "category": "dropdown",
    "priceRange": "slider",
    "condition": "checkboxes",
    "location": "input",
    "sortBy": "dropdown"
  }
}
```

### **Auction Page Design**
```json
{
  "auctionCard": {
    "header": {
      "sellerInfo": "object",
      "timeRemaining": "countdown",
      "status": "active|ended|upcoming"
    },
    "content": {
      "productImages": ["array of urls"],
      "title": "string",
      "description": "string",
      "currentBid": "number",
      "totalBids": "number",
      "minimumIncrement": "number"
    },
    "actions": {
      "bidButton": "Place Bid",
      "watchButton": "boolean",
      "messageButton": "Contact Seller"
    }
  }
}
```

### **Messaging Page Design**
```json
{
  "conversationList": {
    "contactCard": {
      "userAvatar": "string",
      "userName": "string",
      "userType": "buyer|seller",
      "lastMessage": "string",
      "lastMessageTime": "datetime",
      "unreadCount": "number",
      "onlineStatus": "boolean"
    }
  },
  "chatInterface": {
    "header": {
      "userInfo": "object",
      "onlineStatus": "boolean",
      "moreOptions": "menu"
    },
    "messages": {
      "messageBubble": {
        "content": "string",
        "timestamp": "datetime",
        "isOwn": "boolean",
        "isRead": "boolean",
        "messageType": "text|image|file"
      }
    },
    "inputArea": {
      "textInput": "string",
      "attachButton": "file picker",
      "sendButton": "boolean"
    }
  }
}
```

---

## 🚀 **Development Roadmap**

### **Phase 1: Core Posts & Products**
1. Create Posts and Products models
2. Implement CRUD operations for posts
3. Implement CRUD operations for products
4. Add search and filtering functionality
5. Create basic feed system

### **Phase 2: Messaging System**
1. Create Conversations and Messages models
2. Implement conversation management
3. Add real-time messaging (WebSocket)
4. Create contact list functionality
5. Add message notifications

### **Phase 3: Auction System**
1. Create Auctions and Bids models
2. Implement auction creation and management
3. Add bidding functionality
4. Create auction winner selection
5. Add auction notifications

### **Phase 4: Advanced Features**
1. Add image upload functionality
2. Implement user ratings and reviews
3. Add advanced search filters
4. Create recommendation system
5. Add payment integration

---

## 📋 **Next Steps**

1. **Confirm the database models** - Are these the right fields?
2. **Prioritize features** - Which should we build first?
3. **Start with Posts system** - This seems like the foundation
4. **Create the API endpoints** - Following RESTful principles
5. **Add proper validation** - Input sanitization and security
6. **Implement real-time features** - WebSocket for messaging

**Ready to start building? Which feature would you like to tackle first?** 🎯 