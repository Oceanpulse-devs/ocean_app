# Frontend API Integration Guide

## 🚀 **Quick Start**

### **1. Backend Servers**
Make sure both servers are running:

```bash
# Main backend server (port 5000)
cd ocean_server
npm start

# Messaging server (port 5002)  
cd ocean_message_server
npm start
```

### **2. Frontend Development**
```bash
cd frontend
npm run dev
```

---

## 📁 **API Files Structure**

```
frontend/src/lib/api/
├── base.ts              # Shared API request function
├── auth.ts              # Authentication endpoints
├── feed.ts              # Feed and posts
├── products.ts          # Product listings
├── auctions.ts          # Auction system
├── follow.ts            # Follow system
├── notifications.ts     # Notifications
└── messaging.ts         # Real-time messaging
```

---

## 🔐 **Authentication Flow**

### **Signup Process**
```typescript
import { signup } from '$lib/api/auth';

const userData = {
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  agreeTerms: true
};

try {
  const response = await signup(userData);
  // Redirect to feed on success
} catch (error) {
  // Handle error
}
```

### **Login Process**
```typescript
import { login } from '$lib/api/auth';

const credentials = {
  email: 'john@example.com',
  password: 'SecurePass123!'
};

try {
  const response = await login(credentials);
  // JWT cookie is automatically set
  // Redirect to feed
} catch (error) {
  // Handle error
}
```

### **Logout Process**
```typescript
import { logout } from '$lib/api/auth';

await logout(); // Clears JWT cookie
// Redirect to login
```

---

## 📰 **Feed System**

### **Get Feed Posts**
```typescript
import { getFeed } from '$lib/api/feed';

const feed = await getFeed({
  page: 1,
  limit: 10,
  region: 'US',
  country: 'United States'
});
```

### **Create Post**
```typescript
import { createPost } from '$lib/api/feed';

const postData = {
  postType: 'product',
  content: 'Check out this amazing product!',
  productName: 'iPhone 15',
  brand: 'Apple',
  price: 999,
  location: 'New York',
  tags: ['electronics', 'phone'],
  media: [file1, file2] // File objects
};

await createPost(postData);
```

### **Like/Save Posts**
```typescript
import { toggleLike, toggleSave } from '$lib/api/feed';

await toggleLike(postId);
await toggleSave(postId);
```

---

## 🛍️ **Products System**

### **Get Products**
```typescript
import { getProducts } from '$lib/api/products';

const products = await getProducts({
  page: 1,
  limit: 20,
  search: 'iPhone',
  category: 'Electronics',
  minPrice: 100,
  maxPrice: 1000,
  sortBy: 'price',
  sortOrder: 'ASC'
});
```

### **Create Product (Seller Only)**
```typescript
import { createProduct } from '$lib/api/products';

const productData = {
  title: 'iPhone 15 Pro',
  description: 'Latest iPhone model',
  price: 999,
  currency: 'USD',
  brand: 'Apple',
  category: 'Electronics',
  condition: 'new',
  location: 'New York',
  images: [file1, file2] // File objects
};

await createProduct(productData);
```

---

## 🏷️ **Auction System**

### **Get Auctions**
```typescript
import { getAuctions } from '$lib/api/auctions';

const auctions = await getAuctions({
  page: 1,
  limit: 10,
  status: 'active',
  category: 'Electronics',
  minPrice: 50,
  maxPrice: 500
});
```

### **Place Bid**
```typescript
import { placeBid } from '$lib/api/auctions';

await placeBid(auctionId, {
  bidAmount: 150,
  isAutoBid: false
});
```

### **Create Auction (Seller Only)**
```typescript
import { createAuction } from '$lib/api/auctions';

const auctionData = {
  title: 'Vintage Watch Auction',
  description: 'Rare vintage timepiece',
  startingPrice: 100,
  reservePrice: 200,
  minimumBidIncrement: 10,
  startTime: '2024-01-15T10:00:00Z',
  endTime: '2024-01-20T18:00:00Z',
  category: 'Jewelry',
  condition: 'good',
  location: 'Los Angeles',
  autoExtend: true,
  images: [file1, file2]
};

await createAuction(auctionData);
```

---

## 👥 **Follow System**

### **Follow/Unfollow Users**
```typescript
import { followUser, unfollowUser } from '$lib/api/follow';

await followUser(targetUserId);
await unfollowUser(targetUserId);
```

### **Get Followers/Following**
```typescript
import { getFollowers, getFollowing } from '$lib/api/follow';

const followers = await getFollowers(userId, {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});

const following = await getFollowing(userId);
```

---

## 💬 **Messaging System**

### **Get Conversations**
```typescript
import { getConversations } from '$lib/api/messaging';

const conversations = await getConversations({
  page: 1,
  limit: 20,
  type: 'direct'
});
```

### **Send Message**
```typescript
import { sendMessage } from '$lib/api/messaging';

await sendMessage(conversationId, {
  type: 'text',
  content: 'Hello! How are you?'
});
```

### **Create Conversation**
```typescript
import { createConversation } from '$lib/api/messaging';

await createConversation({
  type: 'direct',
  participantIds: ['user1', 'user2']
});
```

---

## 🔔 **Notifications**

### **Get Notifications**
```typescript
import { getUserNotifications } from '$lib/api/notifications';

const notifications = await getUserNotifications({
  page: 1,
  limit: 20,
  category: 'auction',
  isRead: false
});
```

### **Mark as Read**
```typescript
import { markNotificationAsRead } from '$lib/api/notifications';

await markNotificationAsRead(notificationId);
```

---

## 🌐 **Real-time Features**

### **WebSocket Connection (Messaging)**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5002', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send message
socket.emit('send_message', {
  conversationId: 'conv123',
  content: 'Hello!',
  type: 'text'
});
```

---

## ⚙️ **Configuration**

### **API Base URLs**
- **Main API**: `http://localhost:5000/api`
- **Messaging API**: `http://localhost:5002/api`

### **Environment Variables**
Create `.env` file in frontend directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_MESSAGING_API_BASE_URL=http://localhost:5002/api
```

---

## 🐛 **Error Handling**

### **Standard Error Response**
```typescript
try {
  const response = await apiFunction();
} catch (error: any) {
  const errorMessage = error.message || 'An error occurred';
  // Show error to user
}
```

### **Network Error Handling**
```typescript
if (!navigator.onLine) {
  // Show offline message
}

// Handle connection errors
if (error.message.includes('Failed to fetch')) {
  // Show network error
}
```

---

## 🔒 **Security**

### **JWT Token Management**
- Tokens are automatically handled via HTTP-only cookies
- No need to manually store tokens in localStorage
- Automatic token refresh handled by backend

### **CORS Configuration**
- Backend is configured to accept requests from `http://localhost:5173` (SvelteKit dev server)
- Update CORS settings in backend for production

---

## 📱 **Mobile Considerations**

### **File Upload**
```typescript
// Handle file selection
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (files) {
    // Process files for upload
  }
};
```

### **Image Optimization**
```typescript
// Compress images before upload
const compressImage = async (file: File) => {
  // Use canvas to resize/compress
  // Return compressed file
};
```

---

## 🧪 **Testing**

### **Test API Connection**
```typescript
// Test if backend is reachable
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    console.log('Backend connected:', response.ok);
  } catch (error) {
    console.error('Backend not reachable:', error);
  }
};
```

---

## 📚 **Next Steps**

1. **Start both backend servers**
2. **Start frontend development server**
3. **Test authentication flow**
4. **Implement real-time messaging**
5. **Add error boundaries**
6. **Implement offline support**
7. **Add loading states**
8. **Implement infinite scroll**

---

## 🆘 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**: Check backend CORS configuration
2. **JWT Issues**: Ensure cookies are being sent
3. **File Upload**: Check file size limits
4. **WebSocket**: Verify messaging server is running
5. **TypeScript Errors**: Add `lang="ts"` to script tags

### **Debug Commands**
```bash
# Check if servers are running
curl http://localhost:5000/api/health
curl http://localhost:5002/api/health

# Check network requests in browser dev tools
# Network tab -> XHR/Fetch requests
``` 