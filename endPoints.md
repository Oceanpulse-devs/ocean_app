# Ocean App - Complete API Endpoints Documentation

## Ocean Server (Port 5000) - Main Backend API

### **Authentication & User Management**
**Base Path:** `/api`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/signup` | User registration | No |
| POST | `/api/login` | User login | No |
| POST | `/api/logout` | User logout | No |
| POST | `/api/logout-all-devices` | Logout from all devices | Yes |
| GET | `/api/active-sessions` | Get active sessions | Yes |
| POST | `/api/verify-email` | Verify email address | No |
| POST | `/api/resend-verification` | Resend verification email | No |
| POST | `/api/forgot-password` | Forgot password | No |
| POST | `/api/verify-resetCode` | Verify reset code | No |
| POST | `/api/reset-password` | Reset password | No |
| POST | `/api/seller-registration` | Seller registration with file upload | Yes |
| GET | `/api/messaging-token` | Get messaging token | Yes |
| GET | `/api/auth/google` | Google OAuth login | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| GET | `/api/auth/google/failure` | Google OAuth failure | No |

### **Profile Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/profile` | Get current user profile | Yes |
| GET | `/api/users/:userId` | Get user profile by ID | Yes |
| GET | `/api/user/:userId` | Public user profile (for messaging server) | No |
| PUT | `/api/profile` | Update profile with file upload | Yes |

### **Products**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/categories` | Get all categories | No |
| GET | `/api/categories/system` | Get system categories | No |
| GET | `/api/products/seller/:sellerId` | Get seller products | No |
| GET | `/api/product/:productId` | Get single product | No |
| POST | `/api/products` | Create product with file upload | Yes |
| PUT | `/api/products/:productId` | Update product | Yes |
| DELETE | `/api/products/:productId` | Delete product | Yes |
| POST | `/api/products/:productId/save` | Save/unsave product | Yes |
| GET | `/api/saved-products` | Get saved products | Yes |
| GET | `/api/saved-items` | Get all saved items | Yes |
| GET | `/api/my-products` | Get my products | Yes |
| POST | `/api/categories/custom` | Create custom category | Yes |
| GET | `/api/categories/custom` | Get custom categories | Yes |
| DELETE | `/api/categories/custom/:categoryId` | Delete custom category | Yes |
| GET | `/api/categories/search` | Search categories | No |
| GET | `/api/categories/analytics` | Get category analytics | No |
| GET | `/api/categories/trending` | Get trending categories | No |

### **Auctions**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/auctions` | Get all auctions | No |
| GET | `/api/auctions/categories` | Get auction categories | No |
| GET | `/api/auction/:auctionId` | Get single auction | No |
| POST | `/api/auctions` | Create auction with file upload | Yes |
| POST | `/api/auction/:auctionId/bid` | Place bid | Yes |
| POST | `/api/auction/:auctionId/watch` | Watch/unwatch auction | Yes |
| PUT | `/api/auction/:auctionId` | Update auction with file upload | Yes |
| DELETE | `/api/auction/:auctionId` | Cancel auction | Yes |
| GET | `/api/user/auctions` | Get user auctions | Yes |
| GET | `/api/user/bids` | Get user bids | Yes |

### **Feed & Posts**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/test` | Test feed routes | No |
| GET | `/api/home-feed` | Get home feed | Yes |
| GET | `/api/feed` | Get general feed | No |
| GET | `/api/posts/:postId` | Get single post | No |
| GET | `/api/search` | Search posts | No |
| POST | `/api/posts` | Create post with file upload | Yes |
| PUT | `/api/posts/:postId` | Update post with file upload | Yes |
| DELETE | `/api/posts/:postId` | Delete post | Yes |
| POST | `/api/posts/:postId/like` | Like/unlike post | Yes |
| POST | `/api/posts/:postId/save` | Save/unsave post | Yes |
| GET | `/api/saved-posts` | Get saved posts | Yes |
| POST | `/api/posts/:postId/comments` | Create comment | Yes |
| GET | `/api/posts/:postId/comments` | Get comments | No |
| PUT | `/api/comments/:commentId` | Update comment | Yes |
| DELETE | `/api/comments/:commentId` | Delete comment | Yes |
| GET | `/api/users/:userId/posts` | Get user posts | No |

### **Follow System**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/follow` | Follow user | Yes |
| POST | `/api/unfollow` | Unfollow user | Yes |
| GET | `/api/users/:userId/followers` | Get user followers | No |
| GET | `/api/users/:userId/following` | Get user following | No |
| GET | `/api/follow/:userId/followers` | Alternative followers endpoint | No |
| GET | `/api/follow/:userId/following` | Alternative following endpoint | No |
| GET | `/api/users/:targetUserId/follow-status` | Check follow status | Yes |
| GET | `/api/users/:userId/follow-stats` | Get follow statistics | No |
| GET | `/api/users/:userId/mutual-followers` | Get mutual followers | Yes |

### **Notifications**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/notifications` | Get user notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| PUT | `/api/notifications/:notificationId/read` | Mark notification as read | Yes |
| PUT | `/api/notifications/mark-all-read` | Mark all notifications as read | Yes |
| DELETE | `/api/notifications/:notificationId` | Delete notification | Yes |

### **Seller Verification**
**Base Path:** `/api/seller-verification`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/requirements` | Get verification requirements | No |
| POST | `/submit` | Submit verification with file upload | Yes |
| GET | `/status` | Get verification status | Yes |
| POST | `/admin/review` | Admin review verification | Yes (Admin) |
| GET | `/admin/stats` | Get verification statistics | Yes (Admin) |

### **Subscriptions**
**Base Path:** `/api/subscriptions`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/plans` | Get available plans | No |
| GET | `/current` | Get current subscription | Yes |
| POST | `/subscribe` | Subscribe to plan | Yes |
| POST | `/change-plan` | Change subscription plan | Yes |
| POST | `/cancel` | Cancel subscription | Yes |
| GET | `/usage` | Get usage statistics | Yes |
| GET | `/check/:actionType` | Check action eligibility | Yes |
| GET | `/analytics` | Get subscription analytics | Yes |
| POST | `/boosts` | Create promotional boost | Yes |
| GET | `/boosts` | Get promotional boosts | Yes |
| POST | `/confirm-payment` | Confirm payment | Yes |
| POST | `/webhooks/paystack` | Paystack webhook | No |
| GET | `/webhooks/paystack` | Test webhook endpoint | No |
| GET | `/test-paystack` | Test Paystack integration | No |
| GET | `/debug-subscriptions` | Debug subscriptions | Yes |
| POST | `/cancel-all-active` | Cancel all active subscriptions | Yes |
| GET | `/callback/paystack` | Payment callback | No |

### **Group Buy**
**Base Path:** `/api/group-buy`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/create` | Create group buy | Yes |
| GET | `/all` | Get all group buys | Yes |
| GET | `/:id` | Get group buy by ID | Yes |
| PUT | `/:id` | Update group buy | Yes |
| DELETE | `/:id` | Delete group buy | Yes |
| POST | `/:id/join` | Join group buy | Yes |
| DELETE | `/:id/leave` | Leave group buy | Yes |
| GET | `/user/me` | Get user group buys | Yes |
| PUT | `/:id/successful` | Mark group buy successful | Yes |
| GET | `/stats/overview` | Get group buy statistics | Yes |

### **Swap Deals**
**Base Path:** `/api/swap-deals`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/create` | Create swap deal with file upload | Yes |
| GET | `/all` | Get all swap deals | Yes |
| GET | `/:id` | Get swap deal by ID | Yes |
| PUT | `/:id` | Update swap deal | Yes |
| PUT | `/:id/cancel` | Cancel swap deal | Yes |
| POST | `/:swapDealId/propose` | Propose swap with file upload | Yes |
| PUT | `/proposals/:proposalId/accept` | Accept proposal | Yes |
| PUT | `/proposals/:proposalId/reject` | Reject proposal | Yes |
| GET | `/user/my-deals` | Get user swap deals | Yes |
| GET | `/user/my-proposals` | Get user proposals | Yes |
| GET | `/stats/overview` | Get swap deal statistics | Yes |

### **Buyer Needs**
**Base Path:** `/api/buyer-needs`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/create` | Create buyer need | Yes |
| GET | `/all` | Get all buyer needs | Yes |
| GET | `/:id` | Get buyer need by ID | Yes |
| PUT | `/:id` | Update buyer need | Yes |
| DELETE | `/:id` | Delete buyer need | Yes |
| PUT | `/:id/cancel` | Cancel buyer need | Yes |
| PUT | `/:id/fulfill` | Mark buyer need fulfilled | Yes |
| GET | `/user/me` | Get user buyer needs | Yes |
| GET | `/stats/overview` | Get buyer need statistics | Yes |
| POST | `/:id/increment-reach` | Increment reach | Yes |
| GET | `/:id/reach-status` | Get reach status | Yes |
| POST | `/:buyer_need_id/responses` | Create response | Yes |
| GET | `/:buyer_need_id/responses` | Get responses by buyer need | Yes |
| GET | `/responses/:id` | Get response by ID | Yes |
| PUT | `/responses/:id` | Update response | Yes |
| PUT | `/responses/:id/accept` | Accept response | Yes |
| PUT | `/responses/:id/reject` | Reject response | Yes |
| PUT | `/responses/:id/withdraw` | Withdraw response | Yes |
| PUT | `/responses/:id/read` | Mark response as read | Yes |
| PUT | `/responses/:id/feedback` | Provide feedback | Yes |
| GET | `/seller/responses` | Get seller responses | Yes |

### **Market Analytics**
**Base Path:** `/api/market-analytics`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/track` | Track metric | Yes |
| GET | `/overview` | Get market overview | Yes |
| GET | `/category/:category_id` | Get category analytics | Yes |
| GET | `/search` | Get search analytics | Yes |
| GET | `/user-behavior` | Get user behavior analytics | Yes |
| GET | `/trends` | Get market trends | Yes |
| GET | `/category/:category_id/performance` | Get category performance | Yes |
| GET | `/search/queries` | Get search queries | Yes |
| GET | `/user-behavior/patterns` | Get user behavior patterns | Yes |
| GET | `/trends/forecast` | Get market trends forecast | Yes |

### **Advanced Notifications**
**Base Path:** `/api/advanced-notifications`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/create` | Create notification | Yes |
| GET | `/user/:userId` | Get user notifications | Yes |
| PUT | `/:notificationId/read` | Mark as read | Yes |
| PUT | `/mark-multiple-read` | Mark multiple as read | Yes |
| DELETE | `/:notificationId` | Delete notification | Yes |
| GET | `/stats/:userId` | Get notification statistics | Yes |
| POST | `/from-template` | Create from template | Yes |
| POST | `/bulk-create` | Bulk create notifications | Yes |
| GET | `/preferences/:userId` | Get user preferences | Yes |
| PUT | `/preferences/:userId` | Update user preferences | Yes |
| PUT | `/preferences/:userId/bulk` | Update multiple preferences | Yes |
| DELETE | `/preferences/:userId/:notificationType` | Delete user preference | Yes |
| GET | `/preferences/:userId/defaults` | Get default preferences | Yes |
| POST | `/preferences/:userId/initialize` | Initialize user preferences | Yes |
| GET | `/preferences/:userId/summary` | Get preferences summary | Yes |
| POST | `/templates` | Create notification template | Yes |
| GET | `/templates` | Get all templates | Yes |
| GET | `/templates/:templateId` | Get template by ID | Yes |
| PUT | `/templates/:templateId` | Update template | Yes |
| POST | `/templates/:templateId/version` | Create template version | Yes |
| DELETE | `/templates/:templateId` | Delete template | Yes |
| GET | `/templates/versions/:templateName` | Get template versions | Yes |
| PUT | `/templates/:templateId/activate` | Activate template version | Yes |
| GET | `/templates/stats` | Get template statistics | Yes |

### **Distress Sales**
**Base Path:** `/api/distress-sales`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/all` | Get all distress sales | No |
| GET | `/stats` | Get distress sale statistics | No |
| GET | `/:id` | Get distress sale by ID | No |
| POST | `/create` | Create distress sale with file upload | Yes |
| PUT | `/:id` | Update distress sale with file upload | Yes |
| DELETE | `/:id` | Delete distress sale | Yes |
| PUT | `/:id/convert` | Convert to distress sale | Yes |

### **Heavy Distributors**
**Base Path:** `/api/heavy-distributors`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/all` | Get all distributors | No |
| GET | `/search` | Search distributors | No |
| GET | `/:id` | Get distributor by ID | No |
| GET | `/:id/stats` | Get distributor statistics | No |
| POST | `/create` | Create distributor | Yes |
| PUT | `/:id` | Update distributor | Yes |
| DELETE | `/:id` | Delete distributor | Yes |
| POST | `/inquiry` | Create inquiry | Yes |
| GET | `/:distributorId/inquiries` | Get distributor inquiries | Yes |

### **Stories**
**Base Path:** `/api/stories`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/` | Create story with file upload | Yes |
| GET | `/all` | Get all stories | Yes |
| GET | `/my` | Get my stories | Yes |
| GET | `/user/:userId` | Get user stories | Yes |
| POST | `/:storyId/view` | View story | Yes |
| GET | `/:storyId/viewers` | Get story viewers | Yes |
| DELETE | `/:storyId` | Delete story | Yes |

### **Admin Routes**
**Base Path:** `/api/admin`

#### **System Maintenance**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/maintenance/schedule` | Schedule maintenance | Yes (Admin) |
| POST | `/maintenance/complete` | Complete maintenance | Yes (Admin) |
| POST | `/maintenance/emergency` | Emergency maintenance | Yes (Admin) |
| POST | `/feature-update` | Send feature update | Yes (Admin) |
| POST | `/app-update` | Send app update | Yes (Admin) |
| POST | `/security-alert` | Send security alert | Yes (Admin) |
| GET | `/system-health` | Get system health | Yes (Admin) |

#### **Seller Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/sellers` | Get all sellers | Yes (Admin) |
| GET | `/sellers/pending` | Get pending sellers | Yes (Admin) |
| GET | `/sellers/search` | Search sellers | Yes (Admin) |
| GET | `/sellers/stats` | Get seller statistics | Yes (Admin) |
| GET | `/sellers/:id` | Get seller by ID | Yes (Admin) |
| PUT | `/sellers/:id/approve` | Approve seller | Yes (Admin) |
| PUT | `/sellers/:id/reject` | Reject seller | Yes (Admin) |
| PUT | `/sellers/:id/suspend` | Suspend seller | Yes (Admin) |
| PUT | `/sellers/:id/activate` | Activate seller | Yes (Admin) |
| DELETE | `/sellers/:id` | Delete seller | Yes (Admin) |

#### **User Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/users` | Get all users | Yes (Admin) |
| GET | `/users/search` | Search users | Yes (Admin) |
| GET | `/users/stats` | Get user statistics | Yes (Admin) |
| GET | `/users/:id` | Get user by ID | Yes (Admin) |
| GET | `/users/:id/activity` | Get user activity | Yes (Admin) |
| PUT | `/users/:id/suspend` | Suspend user | Yes (Admin) |
| PUT | `/users/:id/activate` | Activate user | Yes (Admin) |
| PUT | `/users/:id/ban` | Ban user | Yes (Admin) |
| PUT | `/users/:id/unban` | Unban user | Yes (Admin) |
| DELETE | `/users/:id` | Delete user | Yes (Admin) |

#### **Analytics & Reporting**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/dashboard` | Get dashboard data | Yes (Admin) |
| GET | `/analytics` | Get platform analytics | Yes (Admin) |
| GET | `/stats` | Get platform statistics | Yes (Admin) |
| POST | `/reports` | Generate reports | Yes (Admin) |
| GET | `/activity` | Get system activity | Yes (Admin) |
| GET | `/performance` | Get performance metrics | Yes (Admin) |

#### **System Administration**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/config` | Get system config | Yes (Admin) |
| PUT | `/config` | Update system config | Yes (Admin) |
| GET | `/logs` | Get system logs | Yes (Admin) |
| GET | `/health` | Get system health | Yes (Admin) |
| POST | `/cache/clear` | Clear system cache | Yes (Admin) |
| POST | `/services/restart` | Restart system services | Yes (Admin) |
| GET | `/backups` | Get backup management | Yes (Admin) |
| POST | `/backups/create` | Create backup | Yes (Admin) |
| POST | `/backups/:backupId/restore` | Restore backup | Yes (Admin) |
| DELETE | `/backups/:backupId` | Delete backup | Yes (Admin) |

#### **Security & Moderation**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/security/alerts` | Get security alerts | Yes (Admin) |
| GET | `/security/activities` | Get suspicious activities | Yes (Admin) |
| GET | `/security/stats` | Get security statistics | Yes (Admin) |
| POST | `/security/users/:userId/block` | Block suspicious user | Yes (Admin) |
| GET | `/moderation/queue` | Get moderation queue | Yes (Admin) |
| PUT | `/moderation/:id/approve` | Approve content | Yes (Admin) |
| PUT | `/moderation/:id/reject` | Reject content | Yes (Admin) |
| GET | `/moderation/flagged` | Get flagged content | Yes (Admin) |
| PUT | `/moderation/flags/:id/resolve` | Resolve flag | Yes (Admin) |

#### **Content Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/content/posts` | Get all posts | Yes (Admin) |
| GET | `/content/posts/:id` | Get post by ID | Yes (Admin) |
| PUT | `/content/posts/:id/status` | Update post status | Yes (Admin) |
| DELETE | `/content/posts/:id` | Delete post | Yes (Admin) |
| POST | `/content/posts/bulk-update` | Bulk update posts | Yes (Admin) |
| GET | `/content/products` | Get all products | Yes (Admin) |
| GET | `/content/products/:id` | Get product by ID | Yes (Admin) |
| PUT | `/content/products/:id/status` | Update product status | Yes (Admin) |
| GET | `/content/categories` | Get all categories | Yes (Admin) |
| POST | `/content/categories` | Create category | Yes (Admin) |
| PUT | `/content/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/content/categories/:id` | Delete category | Yes (Admin) |
| GET | `/content/stats` | Get content statistics | Yes (Admin) |

---

## Ocean Message Server (Port 5001) - Messaging & Real-time Communication

### **Messages**
**Base Path:** `/api/messages`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/:conversationId` | Get messages for conversation | Yes |
| POST | `/` | Send message | Yes |
| PUT | `/:messageId` | Edit message | Yes |
| DELETE | `/:messageId` | Delete message | Yes |
| POST | `/:messageId/reactions` | Add reaction to message | Yes |
| DELETE | `/:messageId/reactions/:reaction` | Remove reaction from message | Yes |

### **Conversations**
**Base Path:** `/api/conversations`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/` | Get user's conversations | Yes |
| POST | `/` | Create new conversation | Yes |
| GET | `/:conversationId` | Get single conversation | Yes |
| PUT | `/:conversationId` | Update conversation | Yes |
| POST | `/:conversationId/participants` | Add participant | Yes |
| DELETE | `/:conversationId/participants/:userId` | Remove participant | Yes |
| POST | `/:conversationId/read` | Mark conversation as read | Yes |

### **Users**
**Base Path:** `/api/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/online` | Get online users | Yes |
| GET | `/search` | Search users | Yes |
| GET | `/:userId` | Get user profile | Yes |
| GET | `/recent/contacts` | Get recent contacts | Yes |
| GET | `/stats/conversations` | Get conversation statistics | Yes |

### **WebSocket Events**
The message server also handles real-time WebSocket connections for:
- Real-time messaging
- Online status updates
- Typing indicators
- Message delivery confirmations
- Notification delivery

---

## Summary

**Total Endpoints:**
- **Ocean Server (Main Backend):** ~200+ endpoints
- **Ocean Message Server:** ~15 endpoints
- **Total:** ~215+ API endpoints

**Key Features Covered:**
- Authentication & User Management
- Product & Auction Management
- Social Features (Feed, Follow, Stories)
- Seller Verification & Management
- Subscription System
- Group Buying & Swap Deals
- Buyer Needs & Responses
- Market Analytics
- Advanced Notifications
- Real-time Messaging
- Admin Panel & System Management
- File Upload Support (Images/Videos)
- Payment Integration (Paystack)
- WebSocket Real-time Communication

**Health Check Endpoints:**
- `GET /health` - Ocean Server health check
- `GET /api/mobile/health` - Mobile app health check
