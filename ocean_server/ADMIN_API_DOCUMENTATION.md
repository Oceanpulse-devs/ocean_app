# Ocean Platform - Admin API Documentation

**Base URL:** `http://localhost:3000/api/admin` (or your deployed URL)

**Authentication:** All endpoints require admin authentication
- **Header:** `Authorization: Bearer YOUR_TOKEN`
- **Role:** `admin` (required)

---

## 1. System Maintenance Routes

### 1.1 Schedule Maintenance
**POST** `/maintenance/schedule`

**Request Body:**
```json
{
  "title": "Scheduled Maintenance",
  "message": "System will be under maintenance tomorrow at 2 AM",
  "scheduledTime": "2025-01-15T02:00:00Z",
  "estimatedDuration": "2 hours",
  "affectedServices": ["Payments", "Messaging"],
  "maintenanceType": "scheduled"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance notification sent successfully",
  "data": {
    "notificationCount": 1500,
    "scheduledTime": "2025-01-15T02:00:00Z",
    "estimatedDuration": "2 hours",
    "affectedServices": ["Payments", "Messaging"]
  }
}
```

---

### 1.2 Complete Maintenance
**POST** `/maintenance/complete`

**Request Body:**
```json
{
  "message": "Maintenance completed successfully",
  "actualDuration": "1.5 hours",
  "affectedServices": ["Payments", "Messaging"],
  "maintenanceType": "scheduled"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance completion notification sent successfully",
  "data": {
    "notificationCount": 1500,
    "actualDuration": "1.5 hours",
    "affectedServices": ["Payments", "Messaging"]
  }
}
```

---

### 1.3 Emergency Maintenance
**POST** `/maintenance/emergency`

**Request Body:**
```json
{
  "title": "Emergency Maintenance",
  "message": "Emergency system maintenance in progress",
  "affectedServices": ["All services"],
  "estimatedDuration": "30 minutes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency maintenance notification sent successfully",
  "data": {
    "notificationCount": 1500,
    "affectedServices": ["All services"],
    "estimatedDuration": "30 minutes"
  }
}
```

---

## 2. Feature & App Update Routes

### 2.1 Send Feature Update
**POST** `/feature-update`

**Request Body:**
```json
{
  "title": "New Feature Update",
  "message": "Check out our new bidding feature!",
  "featureName": "Advanced Bidding",
  "featureDescription": "New bidding system with real-time updates",
  "updateType": "feature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature update notification sent successfully",
  "data": {
    "notificationCount": 5000,
    "featureName": "Advanced Bidding"
  }
}
```

---

### 2.2 Send App Update
**POST** `/app-update`

**Request Body:**
```json
{
  "title": "App Update Available",
  "message": "New version available in the store",
  "version": "2.0.0",
  "updateType": "major",
  "features": ["New UI", "Bug fixes"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "App update notification sent successfully",
  "data": {
    "notificationCount": 5000,
    "version": "2.0.0"
  }
}
```

---

## 3. Security & System Health

### 3.1 Security Alert
**POST** `/security-alert`

**Request Body:**
```json
{
  "title": "Security Alert",
  "message": "Please update your password",
  "alertType": "security_breach",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Security alert sent successfully",
  "data": {
    "notificationCount": 10000
  }
}
```

---

### 3.2 Get System Health
**GET** `/system-health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "memory": {
      "used": 512,
      "total": 2048
    },
    "database": {
      "status": "connected",
      "responseTime": 25
    },
    "services": {
      "redis": "connected",
      "email": "connected"
    }
  }
}
```

---

## 4. Seller Management Routes

### 4.1 Get All Sellers
**GET** `/sellers?page=1&limit=20&status=approved&category=electronics&country=nigeria&search=business&sortBy=createdAt&sortOrder=DESC`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `status` - Filter by status (pending/approved/rejected)
- `category` - Filter by seller category
- `country` - Filter by seller country
- `search` - Search term
- `sortBy` - Sort field (createdAt/businessName)
- `sortOrder` - ASC/DESC

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

---

### 4.2 Get Pending Sellers
**GET** `/sellers/pending?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 35,
      "itemsPerPage": 20
    }
  }
}
```

---

### 4.3 Search Sellers
**GET** `/sellers/search?query=electronics&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [...],
    "pagination": {...}
  }
}
```

---

### 4.4 Get Seller Stats
**GET** `/sellers/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "approved": 85,
    "pending": 10,
    "rejected": 5,
    "verified": 60
  }
}
```

---

### 4.5 Get Seller by ID
**GET** `/sellers/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "businessName": "...",
    "user": {...},
    "documents": [...]
  }
}
```

---

### 4.6 Approve Seller
**PUT** `/sellers/:id/approve`

**Request Body:**
```json
{
  "verificationLevel": "basic",
  "verificationNotes": "All documents verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller approved successfully",
  "data": {
    "seller": {...}
  }
}
```

---

### 4.7 Reject Seller
**PUT** `/sellers/:id/reject`

**Request Body:**
```json
{
  "rejectionReason": "Incomplete documentation",
  "rejectionNotes": "ID verification failed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller rejected",
  "data": {...}
}
```

---

### 4.8 Suspend Seller
**PUT** `/sellers/:id/suspend`

**Request Body:**
```json
{
  "suspensionReason": "Policy violation",
  "suspensionDuration": 7
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller suspended successfully"
}
```

---

### 4.9 Activate Seller
**PUT** `/sellers/:id/activate`

**Response:**
```json
{
  "success": true,
  "message": "Seller activated successfully"
}
```

---

### 4.10 Delete Seller
**DELETE** `/sellers/:id`

**Response:**
```json
{
  "success": true,
  "message": "Seller deleted successfully"
}
```

---

## 5. User Management Routes

### 5.1 Get All Users
**GET** `/users?page=1&limit=20&accountType=seller&accountStatus=active&country=nigeria&search=john&sortBy=createdAt&sortOrder=DESC`

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

---

### 5.2 Search Users
**GET** `/users/search?query=john&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

---

### 5.3 Get User Stats
**GET** `/users/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5000,
    "active": 4500,
    "suspended": 100,
    "banned": 50,
    "buyers": 3000,
    "sellers": 1500
  }
}
```

---

### 5.4 Get User by ID
**GET** `/users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "fullName": "...",
    "seller": {...},
    "products": [...],
    "posts": [...]
  }
}
```

---

### 5.5 Get User Activity
**GET** `/users/:id/activity`

**Response:**
```json
{
  "success": true,
  "data": {
    "logins": [...],
    "posts": [...],
    "products": [...],
    "recentActivity": [...]
  }
}
```

---

### 5.6 Suspend User
**PUT** `/users/:id/suspend`

**Request Body:**
```json
{
  "suspensionReason": "Policy violation",
  "suspensionDuration": 7
}
```

**Response:**
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

---

### 5.7 Activate User
**PUT** `/users/:id/activate`

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### 5.8 Ban User
**PUT** `/users/:id/ban`

**Request Body:**
```json
{
  "banReason": "Repeated violations"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User banned successfully"
}
```

---

### 5.9 Unban User
**PUT** `/users/:id/unban`

**Response:**
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

---

### 5.10 Delete User
**DELETE** `/users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 6. Analytics & Reporting Routes

### 6.1 Get Dashboard Data
**GET** `/dashboard?period=30d`

**Query Parameters:**
- `period` - 7d, 30d, 90d, 1y

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "overview": {
      "totalUsers": 5000,
      "totalSellers": 1500,
      "totalProducts": 10000,
      "totalTransactions": 5000,
      "totalRevenue": 500000
    },
    "growth": {
      "newUsers": 500,
      "newSellers": 100,
      "newProducts": 2000,
      "revenueGrowth": 15
    },
    "engagement": {...},
    "charts": {...}
  }
}
```

---

### 6.2 Get Platform Analytics
**GET** `/analytics?period=30d&category=electronics&country=nigeria&metric=all`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {...},
    "sellers": {...},
    "products": {...},
    "transactions": {...}
  }
}
```

---

### 6.3 Get Platform Stats
**GET** `/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5000,
    "totalSellers": 1500,
    "totalProducts": 10000,
    "totalTransactions": 5000
  }
}
```

---

### 6.4 Generate Reports
**POST** `/reports`

**Request Body:**
```json
{
  "reportType": "user_activity",
  "format": "pdf",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  }
}
```

---

### 6.5 Get System Activity
**GET** `/activity?limit=50`

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [...]
  }
}
```

---

### 6.6 Get Performance Metrics
**GET** `/performance`

**Response:**
```json
{
  "success": true,
  "data": {
    "responseTime": 120,
    "uptime": 99.9,
    "errorRate": 0.1
  }
}
```

---

## 7. System Administration Routes

### 7.1 Get System Config
**GET** `/config`

**Response:**
```json
{
  "success": true,
  "data": {
    "maxFileSize": "10MB",
    "allowedFileTypes": ["jpg", "png", "pdf"],
    "sessionTimeout": 3600
  }
}
```

---

### 7.2 Update System Config
**PUT** `/config`

**Request Body:**
```json
{
  "maxFileSize": "15MB",
  "sessionTimeout": 7200
}
```

**Response:**
```json
{
  "success": true,
  "message": "Config updated successfully"
}
```

---

### 7.3 Get System Logs
**GET** `/logs?limit=100&level=error`

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...]
  }
}
```

---

### 7.4 Get System Health (Advanced)
**GET** `/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {...},
    "redis": {...},
    "services": {...}
  }
}
```

---

### 7.5 Clear System Cache
**POST** `/cache/clear`

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

---

### 7.6 Restart System Services
**POST** `/services/restart`

**Response:**
```json
{
  "success": true,
  "message": "Services restarted successfully"
}
```

---

## 8. Backup Management

### 8.1 Get Backups
**GET** `/backups`

**Response:**
```json
{
  "success": true,
  "data": {
    "backups": [...]
  }
}
```

---

### 8.2 Create Backup
**POST** `/backups/create`

**Request Body:**
```json
{
  "backupType": "full",
  "description": "Monthly backup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully"
}
```

---

### 8.3 Restore Backup
**POST** `/backups/:backupId/restore`

**Response:**
```json
{
  "success": true,
  "message": "Backup restored successfully"
}
```

---

### 8.4 Delete Backup
**DELETE** `/backups/:backupId`

**Response:**
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

---

## 9. Security & Moderation Routes

### 9.1 Get Security Alerts
**GET** `/security/alerts`

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [...]
  }
}
```

---

### 9.2 Get Suspicious Activities
**GET** `/security/activities`

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [...]
  }
}
```

---

### 9.3 Get Security Stats
**GET** `/security/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "threatsDetected": 10,
    "blockedUsers": 5,
    "suspiciousActivities": 50
  }
}
```

---

### 9.4 Block Suspicious User
**POST** `/security/users/:userId/block`

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### 9.5 Get Moderation Queue
**GET** `/moderation/queue`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": [...]
  }
}
```

---

### 9.6 Approve Content
**PUT** `/moderation/:id/approve`

**Response:**
```json
{
  "success": true,
  "message": "Content approved"
}
```

---

### 9.7 Reject Content
**PUT** `/moderation/:id/reject`

**Request Body:**
```json
{
  "reason": "Violates community guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content rejected"
}
```

---

### 9.8 Get Flagged Content
**GET** `/moderation/flagged`

**Response:**
```json
{
  "success": true,
  "data": {
    "flagged": [...]
  }
}
```

---

### 9.9 Resolve Flag
**PUT** `/moderation/flags/:id/resolve`

**Response:**
```json
{
  "success": true,
  "message": "Flag resolved"
}
```

---

## 10. Content Management Routes

### 10.1 Get All Posts
**GET** `/content/posts?page=1&limit=20&status=published&contentType=image&sortBy=createdAt&sortOrder=DESC&search=keyword&startDate=2025-01-01&endDate=2025-01-31`

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {...}
  }
}
```

---

### 10.2 Get Post by ID
**GET** `/content/posts/:id`

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

### 10.3 Update Post Status
**PUT** `/content/posts/:id/status`

**Request Body:**
```json
{
  "status": "archived",
  "adminNotes": "Moved to archived"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post status updated"
}
```

---

### 10.4 Delete Post
**DELETE** `/content/posts/:id`

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### 10.5 Bulk Update Posts
**POST** `/content/posts/bulk-update`

**Request Body:**
```json
{
  "postIds": ["id1", "id2", "id3"],
  "status": "archived"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Posts updated successfully",
  "updated": 3
}
```

---

### 10.6 Get All Products
**GET** `/content/products?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {...}
  }
}
```

---

### 10.7 Get Product by ID
**GET** `/content/products/:id`

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

### 10.8 Update Product Status
**PUT** `/content/products/:id/status`

**Request Body:**
```json
{
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product status updated"
}
```

---

### 10.9 Get All Categories
**GET** `/content/categories`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [...]
  }
}
```

---

### 10.10 Create Category
**POST** `/content/categories`

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {...}
}
```

---

### 10.11 Update Category
**PUT** `/content/categories/:id`

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

---

### 10.12 Delete Category
**DELETE** `/content/categories/:id`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

### 10.13 Get Content Stats
**GET** `/content/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 10000,
    "totalProducts": 5000,
    "totalCategories": 50
  }
}
```

---

## Summary

This documentation covers **70+ admin endpoints** organized into 10 major categories:

1. **System Maintenance** - Maintenance notifications
2. **Feature Updates** - App and feature announcements
3. **System Health** - Health monitoring and alerts
4. **Seller Management** - CRUD operations for sellers
5. **User Management** - CRUD operations for users
6. **Analytics & Reporting** - Platform analytics and insights
7. **System Administration** - Configuration and logs
8. **Backup Management** - Backup and restore operations
9. **Security & Moderation** - Content moderation and security
10. **Content Management** - Posts, products, and categories

All endpoints require:
- **Authentication:** Bearer token in Authorization header
- **Role:** Admin role required
- **Base Path:** `/api/admin`


