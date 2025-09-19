# Ocean App Admin API Reference

## Base URL
```
https://your-domain.com/api/admin
```

## Authentication
All admin endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this standard format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "error": string (only on error)
}
```

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Core Management

### User Management

#### Get All Users
```http
GET /users
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search term
- `status` (string, default: "all") - Filter by status

**Status Options:** `all`, `active`, `suspended`, `banned`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

#### Get User by ID
```http
GET /users/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

#### Suspend User
```http
PUT /users/{userId}/suspend
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

#### Activate User
```http
PUT /users/{userId}/activate
```

#### Ban User
```http
PUT /users/{userId}/ban
```

**Request Body:**
```json
{
  "reason": "Severe policy violation",
  "duration": 30
}
```

#### Delete User
```http
DELETE /users/{userId}
```

### Seller Management

#### Get All Sellers
```http
GET /sellers
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string, default: "all") - Filter by status
- `verificationStatus` (string, default: "all") - Filter by verification status

**Status Options:** `all`, `active`, `inactive`, `suspended`
**Verification Options:** `all`, `pending`, `approved`, `rejected`

#### Get Pending Sellers
```http
GET /sellers/pending
```

#### Approve Seller
```http
PUT /sellers/{sellerId}/approve
```

**Request Body:**
```json
{
  "notes": "All documents verified and approved"
}
```

#### Reject Seller
```http
PUT /sellers/{sellerId}/reject
```

**Request Body:**
```json
{
  "reason": "Incomplete documentation",
  "notes": "Please resubmit with complete business license"
}
```

#### Suspend Seller
```http
PUT /sellers/{sellerId}/suspend
```

**Request Body:**
```json
{
  "reason": "Policy violation",
  "duration": 7
}
```

---

## Analytics & Reporting

### Dashboard Data
```http
GET /dashboard
```

**Query Parameters:**
- `period` (string, default: "30d") - Time period

**Period Options:** `7d`, `30d`, `90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalSellers": 85,
      "totalProducts": 1200,
      "totalPosts": 3500
    },
    "growth": {
      "userGrowth": 15.5,
      "sellerGrowth": 8.2,
      "productGrowth": 22.1
    },
    "recentActivity": [...],
    "topCategories": [...],
    "revenue": {
      "total": 50000,
      "growth": 12.5
    }
  }
}
```

### Platform Analytics
```http
GET /analytics
```

**Query Parameters:**
- `period` (string, default: "30d") - Time period
- `type` (string, default: "overview") - Analytics type

**Type Options:** `overview`, `users`, `sellers`, `products`, `engagement`

### Generate Reports
```http
POST /reports
```

**Request Body:**
```json
{
  "type": "user_activity",
  "period": "30d",
  "format": "json",
  "includeCharts": true
}
```

**Report Types:**
- `user_activity` - User engagement and activity
- `seller_performance` - Seller metrics and performance
- `product_analytics` - Product performance and trends
- `financial_summary` - Revenue and transaction data
- `system_health` - System performance and health metrics

---

## System Administration

### System Configuration

#### Get System Configuration
```http
GET /config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "app": {
      "name": "Ocean App",
      "version": "1.0.0",
      "environment": "production"
    },
    "database": {
      "host": "localhost",
      "port": 3306,
      "name": "ocean_app_db"
    },
    "security": {
      "jwtExpiresIn": "7d",
      "bcryptRounds": 12
    },
    "features": {
      "emailVerification": true,
      "googleAuth": true,
      "notifications": true
    }
  }
}
```

#### Update System Configuration
```http
PUT /config
```

**Request Body:**
```json
{
  "config": {
    "security": {
      "bcryptRounds": 14,
      "rateLimitMax": 200
    },
    "upload": {
      "maxFileSize": 20971520
    }
  }
}
```

### System Health
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "memory": {
      "used": 52428800,
      "total": 1073741824,
      "percentage": 4.9
    },
    "database": {
      "status": "connected",
      "responseTime": "15ms",
      "connections": 5
    },
    "redis": {
      "status": "connected",
      "responseTime": "2ms"
    }
  }
}
```

### System Logs
```http
GET /logs
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 100) - Items per page
- `level` (string, default: "all") - Log level
- `source` (string, default: "all") - Log source
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)

**Level Options:** `all`, `error`, `warn`, `info`, `debug`
**Source Options:** `all`, `api`, `auth`, `database`, `email`, `upload`

### Cache Management

#### Clear System Cache
```http
POST /cache/clear
```

**Request Body:**
```json
{
  "cacheType": "all"
}
```

**Cache Types:** `all`, `redis`, `memory`, `file`

### Backup Management

#### Get Backup Management
```http
GET /backups
```

#### Create Backup
```http
POST /backups/create
```

**Request Body:**
```json
{
  "type": "full",
  "description": "Scheduled daily backup",
  "compression": true
}
```

**Backup Types:** `full`, `incremental`, `database_only`, `files_only`

#### Restore Backup
```http
POST /backups/{backupId}/restore
```

**Request Body:**
```json
{
  "confirm": true
}
```

---

## Security & Moderation

### Security Monitoring

#### Get Security Alerts
```http
GET /security/alerts
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `severity` (string, default: "all") - Severity level
- `status` (string, default: "all") - Status
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)

**Severity Options:** `all`, `low`, `medium`, `high`, `critical`
**Status Options:** `all`, `active`, `resolved`, `dismissed`

#### Get Suspicious Activities
```http
GET /security/activities
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `activityType` (string, default: "all") - Activity type
- `severity` (string, default: "all") - Severity level

**Activity Types:** `all`, `login_attempts`, `spam_posts`, `fake_accounts`, `suspicious_transactions`

#### Block Suspicious User
```http
POST /security/users/{userId}/block
```

**Request Body:**
```json
{
  "reason": "Suspicious activity detected",
  "duration": 30,
  "blockType": "account"
}
```

**Block Types:** `account`, `ip`, `email`

### Content Moderation

#### Get Moderation Queue
```http
GET /moderation/queue
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `type` (string, default: "all") - Content type
- `priority` (string, default: "all") - Priority level
- `status` (string, default: "pending") - Status

**Content Types:** `all`, `posts`, `products`, `comments`, `images`
**Priority Options:** `all`, `low`, `medium`, `high`, `urgent`
**Status Options:** `pending`, `in_review`, `approved`, `rejected`

#### Approve Content
```http
PUT /moderation/{contentId}/approve
```

**Request Body:**
```json
{
  "type": "post",
  "approvalNotes": "Content reviewed and approved"
}
```

#### Reject Content
```http
PUT /moderation/{contentId}/reject
```

**Request Body:**
```json
{
  "type": "post",
  "rejectionReason": "Inappropriate content",
  "rejectionNotes": "Content violates community guidelines"
}
```

#### Get Flagged Content
```http
GET /moderation/flagged
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `contentType` (string, default: "all") - Content type
- `flagType` (string, default: "all") - Flag type
- `status` (string, default: "all") - Status

**Content Types:** `all`, `posts`, `products`, `comments`, `users`
**Flag Types:** `all`, `spam`, `inappropriate`, `copyright`, `fake`

#### Resolve Flag
```http
PUT /moderation/flags/{flagId}/resolve
```

**Request Body:**
```json
{
  "resolution": "dismissed",
  "resolutionNotes": "Flag reviewed and dismissed"
}
```

**Resolution Types:** `dismissed`, `content_removed`, `user_warned`, `user_banned`

---

## Content Management

### Post Management

#### Get All Posts
```http
GET /content/posts
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string, default: "all") - Post status
- `contentType` (string, default: "all") - Content type
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "DESC") - Sort order
- `search` (string) - Search term
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)

**Status Options:** `all`, `published`, `draft`, `archived`, `deleted`
**Content Types:** `all`, `text`, `image`, `video`, `mixed`
**Sort Fields:** `createdAt`, `updatedAt`, `likesCount`, `commentsCount`

#### Get Post by ID
```http
GET /content/posts/{postId}
```

#### Update Post Status
```http
PUT /content/posts/{postId}/status
```

**Request Body:**
```json
{
  "status": "published",
  "adminNotes": "Post approved and published by admin"
}
```

#### Delete Post
```http
DELETE /content/posts/{postId}
```

**Request Body:**
```json
{
  "reason": "Post violates community guidelines",
  "permanent": false
}
```

#### Bulk Update Posts
```http
POST /content/posts/bulk-update
```

**Request Body:**
```json
{
  "postIds": ["post-1", "post-2", "post-3"],
  "action": "status",
  "value": "archived",
  "adminNotes": "Bulk archive of old posts"
}
```

**Bulk Actions:** `status`, `category`, `archive`, `delete`

### Product Management

#### Get All Products
```http
GET /content/products
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string, default: "all") - Product status
- `category` (string, default: "all") - Category ID
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "DESC") - Sort order
- `search` (string) - Search term
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)

**Status Options:** `all`, `active`, `inactive`, `pending`, `rejected`
**Sort Fields:** `createdAt`, `updatedAt`, `price`, `viewsCount`

#### Get Product by ID
```http
GET /content/products/{productId}
```

#### Update Product Status
```http
PUT /content/products/{productId}/status
```

**Request Body:**
```json
{
  "status": "active",
  "adminNotes": "Product approved and activated by admin"
}
```

### Category Management

#### Get All Categories
```http
GET /content/categories
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `status` (string, default: "all") - Category status
- `search` (string) - Search term
- `sortBy` (string, default: "name") - Sort field
- `sortOrder` (string, default: "ASC") - Sort order

**Status Options:** `all`, `active`, `inactive`
**Sort Fields:** `name`, `createdAt`, `productCount`

#### Create Category
```http
POST /content/categories
```

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "icon": "electronics-icon",
  "color": "#007bff",
  "parentId": null,
  "isActive": true
}
```

#### Update Category
```http
PUT /content/categories/{categoryId}
```

**Request Body:**
```json
{
  "name": "Electronics & Gadgets",
  "description": "Updated description for electronics category",
  "icon": "electronics-gadgets-icon",
  "color": "#28a745",
  "isActive": true
}
```

#### Delete Category
```http
DELETE /content/categories/{categoryId}
```

**Request Body:**
```json
{
  "reason": "Category no longer needed",
  "force": false
}
```

### Content Statistics
```http
GET /content/stats
```

**Query Parameters:**
- `period` (string, default: "30d") - Time period

**Period Options:** `7d`, `30d`, `90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "posts": {
      "total": 3500,
      "inRange": 450,
      "statusBreakdown": {
        "published": 3200,
        "draft": 200,
        "archived": 80,
        "deleted": 20
      },
      "contentTypeBreakdown": {
        "text": 2000,
        "image": 1000,
        "video": 400,
        "mixed": 100
      }
    },
    "products": {
      "total": 1200,
      "inRange": 150,
      "statusBreakdown": {
        "active": 1100,
        "inactive": 80,
        "pending": 15,
        "rejected": 5
      }
    },
    "categories": {
      "total": 25,
      "active": 23,
      "inactive": 2,
      "withProducts": 20,
      "withoutProducts": 5
    },
    "engagement": {
      "total": {
        "likes": 15000,
        "comments": 3500,
        "views": 50000
      },
      "inRange": {
        "likes": 2000,
        "comments": 450,
        "views": 6000
      }
    }
  }
}
```

---

## System Notifications

### Send Maintenance Notification
```http
POST /notifications/maintenance
```

**Request Body:**
```json
{
  "title": "Scheduled Maintenance",
  "message": "System will be down for maintenance from 2-4 AM EST",
  "scheduledAt": "2024-01-20T02:00:00Z",
  "duration": 120
}
```

### Send Feature Update Notification
```http
POST /notifications/feature-update
```

**Request Body:**
```json
{
  "title": "New Feature Available",
  "message": "Check out our new advanced search functionality!",
  "featureName": "Advanced Search",
  "targetAudience": "all"
}
```

### Send Security Alert
```http
POST /notifications/security-alert
```

**Request Body:**
```json
{
  "title": "Security Alert",
  "message": "Please update your password for security reasons",
  "severity": "high",
  "actionRequired": true
}
```

---

## Rate Limiting

Admin endpoints have the following rate limits:

- **General endpoints**: 100 requests per 15 minutes
- **Analytics endpoints**: 50 requests per 15 minutes
- **System administration**: 20 requests per 15 minutes
- **Bulk operations**: 10 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

Admin system supports webhooks for real-time notifications:

### Webhook Events
- `user.suspended` - User suspended
- `user.banned` - User banned
- `seller.approved` - Seller approved
- `seller.rejected` - Seller rejected
- `content.flagged` - Content flagged
- `security.alert` - Security alert triggered

### Webhook Configuration
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/admin",
  "events": ["user.suspended", "seller.approved"],
  "secret": "webhook_secret_key"
}
```

---

## SDKs and Libraries

### JavaScript/Node.js
```javascript
const OceanAdmin = require('@ocean-app/admin-sdk');

const admin = new OceanAdmin({
  baseUrl: 'https://your-domain.com/api/admin',
  token: 'your_jwt_token'
});

// Get all users
const users = await admin.users.getAll();

// Approve seller
await admin.sellers.approve('seller_id', {
  notes: 'All documents verified'
});
```

### Python
```python
from ocean_admin import OceanAdmin

admin = OceanAdmin(
    base_url='https://your-domain.com/api/admin',
    token='your_jwt_token'
)

# Get dashboard data
dashboard = admin.dashboard.get(period='30d')

# Create category
category = admin.categories.create({
    'name': 'Electronics',
    'description': 'Electronic devices'
})
```

---

## Postman Collection

A complete Postman collection is available with all admin endpoints:

1. Import the collection from `ocean-app-postman-collections/Ocean-Admin.postman_collection.json`
2. Set up environment variables:
   - `base_url`: Your API base URL
   - `admin_auth_token`: Your admin JWT token
3. Run the collection to test all endpoints

---

*This API reference is maintained by the Ocean App development team. For updates or corrections, please contact the development team.*
