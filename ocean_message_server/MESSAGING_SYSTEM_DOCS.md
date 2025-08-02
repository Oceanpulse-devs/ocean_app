# 🌊 Ocean Messaging System Documentation

## 📋 Overview

The Ocean Messaging System is a real-time messaging microservice that handles direct messages (DMs) between buyers and sellers. It's built as a separate microservice for scalability and maintainability.

**Key Features:**
- ✅ Real-time messaging with Socket.IO
- ✅ Direct and group conversations
- ✅ Message reactions and replies
- ✅ Media message support
- ✅ Read receipts and typing indicators
- ✅ Message search and history
- ✅ Online/offline status tracking

---

## 🏗️ Architecture

### Server Setup
- **Port**: 5002 (configurable)
- **Database**: MySQL (shared with main server)
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens (shared with main server)

### Database Tables
```
conversations
├── id (UUID)
├── type (direct/group)
├── name (group only)
├── description (group only)
├── created_at
└── updated_at

conversation_participants
├── id
├── conversation_id
├── user_id
├── role (owner/admin/member)
├── joined_at
└── last_read_at

messages
├── id (UUID)
├── conversation_id
├── sender_id
├── content
├── type (text/image/video/file)
├── media_url
├── reply_to_id
├── created_at
└── updated_at

message_reactions
├── id
├── message_id
├── user_id
├── reaction (emoji)
└── created_at
```

---

## 🔌 API Endpoints

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. User Management

#### Get Online Users
```http
GET /api/users/online?page=1&limit=20
```
**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "fullName": "John Doe",
        "username": "johndoe",
        "isOnline": true,
        "lastSeenAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

#### Search Users
```http
GET /api/users/search?q=john&page=1&limit=20
```
**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "fullName": "John Doe",
        "username": "johndoe",
        "isOnline": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### Get Recent Contacts
```http
GET /api/users/recent/contacts?limit=10
```
**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "userId": "uuid",
        "fullName": "John Doe",
        "lastMessage": "Hello there!",
        "lastMessageAt": "2024-01-15T10:30:00Z",
        "unreadCount": 2
      }
    ]
  }
}
```

### 2. Conversations

#### Get My Conversations
```http
GET /api/conversations?page=1&limit=20
```
**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-uuid",
        "type": "direct",
        "name": null,
        "description": null,
        "participants": [
          {
            "userId": "user-uuid",
            "fullName": "John Doe",
            "isOnline": true
          }
        ],
        "lastMessage": {
          "content": "Hello!",
          "senderId": "user-uuid",
          "createdAt": "2024-01-15T10:30:00Z"
        },
        "unreadCount": 2,
        "createdAt": "2024-01-15T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

#### Create Direct Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "type": "direct",
  "participants": ["user-uuid-1", "user-uuid-2"]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv-uuid",
      "type": "direct",
      "participants": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### Create Group Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "type": "group",
  "name": "Project Team",
  "description": "Team discussion group",
  "participants": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```

#### Get Conversation Details
```http
GET /api/conversations/{conversationId}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv-uuid",
      "type": "direct",
      "name": null,
      "description": null,
      "participants": [...],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### Mark Conversation as Read
```http
PUT /api/conversations/{conversationId}/read
```

### 3. Messages

#### Get Messages
```http
GET /api/conversations/{conversationId}/messages?page=1&limit=50
```
**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-uuid",
        "content": "Hello!",
        "type": "text",
        "senderId": "user-uuid",
        "senderName": "John Doe",
        "replyTo": null,
        "reactions": [
          {
            "reaction": "👍",
            "count": 2,
            "users": ["user-uuid-1", "user-uuid-2"]
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

#### Send Text Message
```http
POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{
  "content": "Hello! This is a test message",
  "type": "text"
}
```

#### Send Reply Message
```http
POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{
  "content": "This is a reply",
  "type": "text",
  "replyToId": "original-message-uuid"
}
```

#### Send Media Message
```http
POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{
  "content": "Check out this image!",
  "type": "image",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image/jpeg"
}
```

#### Delete Message
```http
DELETE /api/conversations/{conversationId}/messages/{messageId}
```

#### Add Message Reaction
```http
POST /api/conversations/{conversationId}/messages/{messageId}/reactions
Content-Type: application/json

{
  "reaction": "👍"
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
// Connect to WebSocket
const socket = io('http://localhost:5002', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client Events (Send)

#### Join Conversation
```javascript
socket.emit('join_conversation', {
  conversationId: 'conv-uuid'
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  conversationId: 'conv-uuid',
  content: 'Hello!',
  type: 'text'
});
```

#### Typing Indicator
```javascript
socket.emit('typing_start', {
  conversationId: 'conv-uuid'
});

socket.emit('typing_stop', {
  conversationId: 'conv-uuid'
});
```

#### Mark as Read
```javascript
socket.emit('mark_read', {
  conversationId: 'conv-uuid'
});
```

### Server Events (Receive)

#### New Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // data: { message, conversationId }
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // data: { userId, conversationId, isTyping }
});
```

#### Message Read
```javascript
socket.on('message_read', (data) => {
  console.log('Message read:', data);
  // data: { conversationId, userId, timestamp }
});
```

#### User Online/Offline
```javascript
socket.on('user_status_change', (data) => {
  console.log('User status:', data);
  // data: { userId, isOnline, lastSeenAt }
});
```

#### New Reaction
```javascript
socket.on('new_reaction', (data) => {
  console.log('New reaction:', data);
  // data: { messageId, userId, reaction }
});
```

---

## 📱 Mobile Integration Guide

### 1. Authentication Flow
```javascript
// 1. Login to main server
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token } = await loginResponse.json();

// 2. Connect to messaging server
const socket = io('http://localhost:5002', {
  auth: { token }
});
```

### 2. Conversation List Screen
```javascript
// Get conversations
const conversations = await fetch('http://localhost:5002/api/conversations', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Listen for new messages
socket.on('new_message', (data) => {
  // Update conversation list with new message
  updateConversationList(data);
});
```

### 3. Chat Screen
```javascript
// Join conversation
socket.emit('join_conversation', { conversationId });

// Send message
const sendMessage = (content) => {
  socket.emit('send_message', {
    conversationId,
    content,
    type: 'text'
  });
};

// Listen for incoming messages
socket.on('new_message', (data) => {
  if (data.conversationId === currentConversationId) {
    // Add message to chat
    addMessageToChat(data.message);
  }
});
```

### 4. Real-time Features
```javascript
// Typing indicator
let typingTimeout;
const onTyping = () => {
  socket.emit('typing_start', { conversationId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId });
  }, 3000);
};

// Listen for typing
socket.on('user_typing', (data) => {
  if (data.userId !== currentUserId) {
    showTypingIndicator(data.userId);
  }
});
```

---

## 🧪 Testing Examples

### Postman Collection Setup
1. Import the provided Postman collection
2. Set environment variables:
   - `base_url`: `http://localhost:5002`
   - `token`: Your JWT token from main server
   - `conversationId`: Will be set after creating conversation
   - `userId`: Target user ID for testing

### Quick Test Flow
1. **Get token** from main server login
2. **Search users** to find someone to message
3. **Create conversation** with that user
4. **Send message** in the conversation
5. **Get messages** to verify it worked

### WebSocket Testing
```javascript
// Test in browser console
const socket = io('http://localhost:5002', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected to messaging server');
});

socket.emit('join_conversation', { conversationId: 'test-conv-id' });
```

---

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=j@123098
DB_NAME=ocean_app_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=development
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=25000
WS_HEARTBEAT_TIMEOUT=5000

# Message Configuration
MAX_MESSAGE_LENGTH=1000
MESSAGE_RETENTION_DAYS=365
```

### Database Setup
The messaging server uses the same database as the main server. Tables will be created automatically when the server starts.

---

## 🚀 Deployment Notes

### Production Considerations
1. **SSL/TLS**: Use HTTPS for WebSocket connections
2. **Load Balancing**: Multiple messaging server instances
3. **Redis Cluster**: For session management across instances
4. **Database Optimization**: Indexes on frequently queried fields
5. **Rate Limiting**: Prevent spam and abuse
6. **Message Encryption**: End-to-end encryption for sensitive messages

### Scaling Strategy
- **Horizontal Scaling**: Multiple messaging server instances
- **Database Sharding**: By user ID or conversation ID
- **Message Queuing**: Redis for message persistence
- **CDN**: For media file delivery

---

## 📞 Support

For questions or issues:
1. Check server logs for detailed error messages
2. Verify JWT token is valid and not expired
3. Ensure database connection is working
4. Check WebSocket connection status
5. Verify all required environment variables are set

The messaging system is now ready for integration with your mobile frontend! 🎉 