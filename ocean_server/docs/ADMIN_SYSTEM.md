# Ocean App Admin System Documentation

## Overview

The Ocean App Admin System is a comprehensive administrative interface that provides complete control over the platform. It includes user management, seller management, analytics, system administration, security monitoring, and content management capabilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core Management](#core-management)
4. [Analytics & Reporting](#analytics--reporting)
5. [System Administration](#system-administration)
6. [Security & Moderation](#security--moderation)
7. [Content Management](#content-management)
8. [API Reference](#api-reference)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 16+ 
- MySQL 8.0+
- Redis 6.0+
- Admin user account with proper permissions

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations
5. Start the server: `npm start`

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ocean_app_db
DB_USER=your_username
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Authentication

### Admin Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "admin_id",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

### Using the Token

Include the JWT token in the Authorization header for all admin requests:

```http
Authorization: Bearer your_jwt_token_here
```

## Core Management

### User Management

#### Get All Users

```http
GET /api/admin/users?page=1&limit=20&search=&status=all
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term for name, username, or email
- `status`: Filter by status (all, active, suspended, banned)

#### Get User by ID

```http
GET /api/admin/users/{userId}
```

#### Suspend User

```http
PUT /api/admin/users/{userId}/suspend
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

#### Activate User

```http
PUT /api/admin/users/{userId}/activate
```

#### Ban User

```http
PUT /api/admin/users/{userId}/ban
Content-Type: application/json

{
  "reason": "Severe policy violation",
  "duration": 30
}
```

#### Delete User

```http
DELETE /api/admin/users/{userId}
```

### Seller Management

#### Get All Sellers

```http
GET /api/admin/sellers?page=1&limit=20&status=all&verificationStatus=all
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (all, active, inactive, suspended)
- `verificationStatus`: Filter by verification (all, pending, approved, rejected)

#### Get Pending Sellers

```http
GET /api/admin/sellers/pending
```

#### Approve Seller

```http
PUT /api/admin/sellers/{sellerId}/approve
Content-Type: application/json

{
  "notes": "All documents verified and approved"
}
```

#### Reject Seller

```http
PUT /api/admin/sellers/{sellerId}/reject
Content-Type: application/json

{
  "reason": "Incomplete documentation",
  "notes": "Please resubmit with complete business license"
}
```

#### Suspend Seller

```http
PUT /api/admin/sellers/{sellerId}/suspend
Content-Type: application/json

{
  "reason": "Policy violation",
  "duration": 7
}
```

## Analytics & Reporting

### Dashboard Data

```http
GET /api/admin/dashboard?period=30d
```

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)

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
    "revenue": {...}
  }
}
```

### Platform Analytics

```http
GET /api/admin/analytics?period=30d&type=overview
```

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)
- `type`: Analytics type (overview, users, sellers, products, engagement)

### Generate Reports

```http
POST /api/admin/reports
Content-Type: application/json

{
  "type": "user_activity",
  "period": "30d",
  "format": "json",
  "includeCharts": true
}
```

**Report Types:**
- `user_activity`: User engagement and activity
- `seller_performance`: Seller metrics and performance
- `product_analytics`: Product performance and trends
- `financial_summary`: Revenue and transaction data
- `system_health`: System performance and health metrics

## System Administration

### System Configuration

#### Get System Configuration

```http
GET /api/admin/config
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
PUT /api/admin/config
Content-Type: application/json

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
GET /api/admin/health
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
GET /api/admin/logs?page=1&limit=100&level=all&source=all
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)
- `level`: Log level (all, error, warn, info, debug)
- `source`: Log source (all, api, auth, database, email, upload)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

### Cache Management

#### Clear System Cache

```http
POST /api/admin/cache/clear
Content-Type: application/json

{
  "cacheType": "all"
}
```

**Cache Types:**
- `all`: Clear all caches
- `redis`: Clear Redis cache only
- `memory`: Clear memory cache only
- `file`: Clear file cache only

### Backup Management

#### Get Backup Management

```http
GET /api/admin/backups
```

#### Create Backup

```http
POST /api/admin/backups/create
Content-Type: application/json

{
  "type": "full",
  "description": "Scheduled daily backup",
  "compression": true
}
```

**Backup Types:**
- `full`: Complete system backup
- `incremental`: Incremental backup
- `database_only`: Database backup only
- `files_only`: File system backup only

#### Restore Backup

```http
POST /api/admin/backups/{backupId}/restore
Content-Type: application/json

{
  "confirm": true
}
```

## Security & Moderation

### Security Monitoring

#### Get Security Alerts

```http
GET /api/admin/security/alerts?page=1&limit=50&severity=all&status=all
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `severity`: Severity level (all, low, medium, high, critical)
- `status`: Status (all, active, resolved, dismissed)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### Get Suspicious Activities

```http
GET /api/admin/security/activities?page=1&limit=50&activityType=all&severity=all
```

**Query Parameters:**
- `activityType`: Activity type (all, login_attempts, spam_posts, fake_accounts, suspicious_transactions)
- `severity`: Severity level (all, low, medium, high, critical)

#### Block Suspicious User

```http
POST /api/admin/security/users/{userId}/block
Content-Type: application/json

{
  "reason": "Suspicious activity detected",
  "duration": 30,
  "blockType": "account"
}
```

**Block Types:**
- `account`: Block user account
- `ip`: Block IP address
- `email`: Block email address

### Content Moderation

#### Get Moderation Queue

```http
GET /api/admin/moderation/queue?page=1&limit=20&type=all&priority=all&status=pending
```

**Query Parameters:**
- `type`: Content type (all, posts, products, comments, images)
- `priority`: Priority level (all, low, medium, high, urgent)
- `status`: Status (pending, in_review, approved, rejected)

#### Approve Content

```http
PUT /api/admin/moderation/{contentId}/approve
Content-Type: application/json

{
  "type": "post",
  "approvalNotes": "Content reviewed and approved"
}
```

#### Reject Content

```http
PUT /api/admin/moderation/{contentId}/reject
Content-Type: application/json

{
  "type": "post",
  "rejectionReason": "Inappropriate content",
  "rejectionNotes": "Content violates community guidelines"
}
```

#### Get Flagged Content

```http
GET /api/admin/moderation/flagged?page=1&limit=20&contentType=all&flagType=all&status=all
```

**Query Parameters:**
- `contentType`: Content type (all, posts, products, comments, users)
- `flagType`: Flag type (all, spam, inappropriate, copyright, fake)
- `status`: Status (all, active, resolved, dismissed)

#### Resolve Flag

```http
PUT /api/admin/moderation/flags/{flagId}/resolve
Content-Type: application/json

{
  "resolution": "dismissed",
  "resolutionNotes": "Flag reviewed and dismissed"
}
```

**Resolution Types:**
- `dismissed`: Flag dismissed as invalid
- `content_removed`: Content removed due to violation
- `user_warned`: User warned about violation
- `user_banned`: User banned for violation

## Content Management

### Post Management

#### Get All Posts

```http
GET /api/admin/content/posts?page=1&limit=20&status=all&contentType=all&sortBy=createdAt&sortOrder=DESC
```

**Query Parameters:**
- `status`: Post status (all, published, draft, archived, deleted)
- `contentType`: Content type (all, text, image, video, mixed)
- `sortBy`: Sort field (createdAt, updatedAt, likesCount, commentsCount)
- `sortOrder`: Sort order (ASC, DESC)
- `search`: Search in content and title
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### Get Post by ID

```http
GET /api/admin/content/posts/{postId}
```

#### Update Post Status

```http
PUT /api/admin/content/posts/{postId}/status
Content-Type: application/json

{
  "status": "published",
  "adminNotes": "Post approved and published by admin"
}
```

#### Delete Post

```http
DELETE /api/admin/content/posts/{postId}
Content-Type: application/json

{
  "reason": "Post violates community guidelines",
  "permanent": false
}
```

#### Bulk Update Posts

```http
POST /api/admin/content/posts/bulk-update
Content-Type: application/json

{
  "postIds": ["post-1", "post-2", "post-3"],
  "action": "status",
  "value": "archived",
  "adminNotes": "Bulk archive of old posts"
}
```

**Bulk Actions:**
- `status`: Update status
- `category`: Assign category
- `archive`: Archive posts
- `delete`: Delete posts

### Product Management

#### Get All Products

```http
GET /api/admin/content/products?page=1&limit=20&status=all&category=all&sortBy=createdAt&sortOrder=DESC
```

**Query Parameters:**
- `status`: Product status (all, active, inactive, pending, rejected)
- `category`: Category ID
- `sortBy`: Sort field (createdAt, updatedAt, price, viewsCount)
- `sortOrder`: Sort order (ASC, DESC)
- `search`: Search in title and description
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### Get Product by ID

```http
GET /api/admin/content/products/{productId}
```

#### Update Product Status

```http
PUT /api/admin/content/products/{productId}/status
Content-Type: application/json

{
  "status": "active",
  "adminNotes": "Product approved and activated by admin"
}
```

### Category Management

#### Get All Categories

```http
GET /api/admin/content/categories?page=1&limit=50&status=all&search=&sortBy=name&sortOrder=ASC
```

**Query Parameters:**
- `status`: Category status (all, active, inactive)
- `search`: Search in name and description
- `sortBy`: Sort field (name, createdAt, productCount)
- `sortOrder`: Sort order (ASC, DESC)

#### Create Category

```http
POST /api/admin/content/categories
Content-Type: application/json

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
PUT /api/admin/content/categories/{categoryId}
Content-Type: application/json

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
DELETE /api/admin/content/categories/{categoryId}
Content-Type: application/json

{
  "reason": "Category no longer needed",
  "force": false
}
```

### Content Statistics

#### Get Content Statistics

```http
GET /api/admin/content/stats?period=30d
```

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

## API Reference

### Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Response data (if success)
  "error": "Error details" // Error information (if failed)
}
```

### Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server error

### Pagination

Most list endpoints support pagination:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

### Filtering

Many endpoints support filtering via query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `status`: Filter by status
- `startDate`: Start date filter
- `endDate`: End date filter
- `sortBy`: Sort field
- `sortOrder`: Sort order (ASC, DESC)

## Testing

### Running Tests

```bash
# Run all admin tests
npm run test:admin

# Run specific test types
npm run test:admin -- --performance
npm run test:admin -- --security
npm run test:admin -- --all
```

### Test Coverage

The admin system includes comprehensive tests for:

- **Authentication**: Login, token validation, role-based access
- **User Management**: CRUD operations, status changes, bulk operations
- **Seller Management**: Approval workflow, status management
- **Analytics**: Dashboard data, reporting, statistics
- **System Administration**: Configuration, health monitoring, logs
- **Security**: Access control, input validation, SQL injection prevention
- **Content Management**: Posts, products, categories, moderation
- **Performance**: Response times, load testing

### Test Data

Tests use isolated test data that is created and cleaned up automatically:

- Test admin user with proper permissions
- Test regular users for various scenarios
- Test sellers in different verification states
- Test posts, products, and categories
- Mock data for analytics and reporting

## Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: Getting 401 Unauthorized errors
**Solution**: 
- Verify JWT token is valid and not expired
- Check that user has admin role
- Ensure token is included in Authorization header

#### Permission Errors

**Problem**: Getting 403 Forbidden errors
**Solution**:
- Verify user has admin role
- Check admin permissions in database
- Ensure proper authentication

#### Database Connection Issues

**Problem**: Database connection errors
**Solution**:
- Check database credentials in environment variables
- Verify database server is running
- Check network connectivity

#### Performance Issues

**Problem**: Slow response times
**Solution**:
- Check database query performance
- Monitor server resources
- Review caching configuration
- Check for database locks

### Logging

Admin actions are logged for audit purposes:

- User management actions
- Seller approval/rejection
- Content moderation decisions
- System configuration changes
- Security-related actions

### Monitoring

Monitor these key metrics:

- **Response Times**: API endpoint performance
- **Error Rates**: Failed requests and errors
- **Database Performance**: Query times and connections
- **Memory Usage**: Server resource utilization
- **Active Users**: Concurrent admin sessions

### Support

For additional support:

1. Check the logs for error details
2. Review the API documentation
3. Test with Postman collection
4. Check system health endpoint
5. Contact the development team

## Security Considerations

### Access Control

- All admin endpoints require authentication
- JWT tokens must be valid and not expired
- Users must have admin role to access admin features
- Sensitive operations require additional confirmation

### Data Protection

- All user data is encrypted in transit (HTTPS)
- Sensitive data is encrypted at rest
- Admin actions are logged for audit
- Personal data handling follows privacy regulations

### Input Validation

- All inputs are validated and sanitized
- SQL injection prevention measures in place
- XSS protection for all text inputs
- File upload restrictions and validation

### Rate Limiting

- API endpoints have rate limiting
- Admin endpoints have higher limits
- Suspicious activity is automatically flagged
- IP-based blocking for repeated violations

## Best Practices

### Admin Operations

1. **Always verify actions** before performing destructive operations
2. **Use bulk operations** for efficiency when managing multiple items
3. **Document reasons** for administrative actions
4. **Monitor system health** regularly
5. **Keep backups** before major changes

### Security

1. **Use strong passwords** for admin accounts
2. **Enable two-factor authentication** when available
3. **Regular security audits** of admin actions
4. **Monitor access logs** for suspicious activity
5. **Keep system updated** with latest security patches

### Performance

1. **Use pagination** for large datasets
2. **Implement caching** where appropriate
3. **Monitor database performance**
4. **Optimize queries** for better performance
5. **Use bulk operations** for efficiency

---

*This documentation is maintained by the Ocean App development team. For updates or corrections, please contact the development team.*
