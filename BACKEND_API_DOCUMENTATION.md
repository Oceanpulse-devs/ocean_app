# Ocean App Backend API Documentation

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Admin Management Endpoints](#admin-management-endpoints)
3. [Notification Endpoints](#notification-endpoints)
4. [Profile Endpoints](#profile-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Authentication Flow](#authentication-flow)

---

## Authentication Endpoints

### Base URL
```
http://localhost:3000
```

### 1. User Registration
**POST** `/api/signup`

Register a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "country": "United States",
  "state": "California",
  "agreeTerms": true
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountType": "buyer",
    "accountStatus": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- `fullName`: 2-50 characters
- `email`: Valid email format, unique
- `password`: 8+ chars, uppercase, lowercase, number, symbol
- `phoneNumber`: Valid phone format
- `address`: 10-200 characters
- `agreeTerms`: Must be true

### 2. User Login
**POST** `/api/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "StrongPass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountType": "buyer",
    "accountStatus": "active"
  },
  "token": "jwt_token_here"
}
```

**Security Features:**
- Account lockout after 5 failed attempts (15 min duration)
- HTTP-only cookie for token storage
- Session management with unique session IDs

### 3. Logout
**POST** `/api/logout`

Logout current user session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### 4. Logout All Devices
**POST** `/api/logout-all-devices`

Logout from all active sessions.

**Response (200):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

### 5. Active Sessions Count
**GET** `/api/active-sessions`

Get count of active sessions for current user.

**Response (200):**
```json
{
  "message": "Active sessions retrieved",
  "activeSessions": 2
}
```

### 6. Forgot Password
**POST** `/api/forgot-password`

Request password reset code.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset code sent to your email"
}
```

### 7. Verify Reset Code
**POST** `/api/verify-reset-code`

Verify password reset code.

**Request Body:**
```json
{
  "email": "john@example.com",
  "resetCode": "12345"
}
```

**Response (200):**
```json
{
  "message": "Reset code verified successfully",
  "resetToken": "temporary_token_for_reset"
}
```

### 8. Reset Password
**POST** `/api/reset-password`

Set new password after code verification.

**Request Body:**
```json
{
  "email": "john@example.com",
  "resetCode": "12345",
  "newPassword": "NewStrongPass123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Seller Registration Endpoints

### 9. Seller Registration
**POST** `/api/seller-registration`

Register as a seller (requires existing buyer account).

**Request Body:**
```json
{
  "businessName": "My Business",
  "businessAddress": "456 Business Ave",
  "category": "electronics",
  "documentType": "business_license",
  "documentNumber": "BL123456",
  "documentImage": "base64_encoded_image_or_url"
}
```

**Response (201):**
```json
{
  "message": "Seller application submitted successfully",
  "seller": {
    "id": "uuid",
    "businessName": "My Business",
    "category": "electronics",
    "verificationStatus": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- `businessName`: 3-100 characters, unique
- `businessAddress`: 10-200 characters
- `category`: Must be valid business category
- `documentType`: Must be valid document type
- `documentNumber`: 5-50 characters
- `documentImage`: Valid image format

---

## Admin Management Endpoints

### Authentication Required
All admin endpoints require admin role. Include JWT token in cookie.

### 10. Get Admin Dashboard Stats
**GET** `/api/admin/stats`

Get comprehensive admin dashboard statistics.

**Response (200):**
```json
{
  "message": "Admin stats retrieved successfully",
  "stats": {
    "totalSellers": 150,
    "pendingSellers": 25,
    "approvedSellers": 100,
    "rejectedSellers": 15,
    "suspendedSellers": 5,
    "activeSellers": 95,
    "totalUsers": 500,
    "activeUsers": 480,
    "suspendedUsers": 20,
    "buyers": 350,
    "sellers": 150,
    "approvalRate": "75.00",
    "suspensionRate": "3.75",
    "rejectionRate": "11.25",
    "statusBreakdown": {
      "pending": 25,
      "approved": 100,
      "rejected": 15,
      "suspended": 5,
      "active": 95
    },
    "userBreakdown": {
      "total": 500,
      "active": 480,
      "suspended": 20,
      "buyers": 350,
      "sellers": 150
    }
  }
}
```

### 11. Get Pending Sellers
**GET** `/api/admin/pending-sellers`

Get all sellers with pending verification status.

**Response (200):**
```json
{
  "message": "Pending sellers retrieved successfully",
  "sellers": [
    {
      "id": "uuid",
      "businessName": "New Business",
      "category": "electronics",
      "verificationStatus": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "documents": [
        {
          "documentType": "business_license",
          "documentNumber": "BL123456",
          "documentImage": "url",
          "status": "pending",
          "submittedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

### 12. Get All Sellers
**GET** `/api/admin/sellers?status=approved&category=electronics&page=1&limit=10`

Get all sellers with filtering and pagination.

**Query Parameters:**
- `status`: pending, approved, rejected, suspended, active
- `category`: business category
- `page`: page number (default: 1)
- `limit`: items per page (default: 10)

**Response (200):**
```json
{
  "message": "Sellers retrieved successfully",
  "sellers": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalSellers": 150,
    "sellersPerPage": 10
  }
}
```

### 13. Get Seller Details
**GET** `/api/admin/sellers/:sellerId`

Get detailed information about a specific seller.

**Response (200):**
```json
{
  "message": "Seller details retrieved successfully",
  "seller": {
    "id": "uuid",
    "businessName": "My Business",
    "category": "electronics",
    "verificationStatus": "approved",
    "verifiedAt": "2024-01-01T00:00:00.000Z",
    "documents": [...]
  }
}
```

### 14. Approve Seller
**POST** `/api/admin/approve-seller`

Approve a pending seller application.

**Request Body:**
```json
{
  "sellerId": "uuid",
  "adminNotes": "All documents verified successfully"
}
```

**Response (200):**
```json
{
  "message": "Seller approved successfully",
  "sellerId": "uuid"
}
```

### 15. Reject Seller
**POST** `/api/admin/reject-seller`

Reject a pending seller application.

**Request Body:**
```json
{
  "sellerId": "uuid",
  "rejectionReason": "Invalid business license",
  "adminNotes": "License expired"
}
```

**Response (200):**
```json
{
  "message": "Seller rejected successfully",
  "sellerId": "uuid",
  "rejectionReason": "Invalid business license"
}
```

### 16. Toggle Seller Status
**POST** `/api/admin/toggle-seller-status`

Suspend or activate a seller.

**Request Body:**
```json
{
  "sellerId": "uuid",
  "action": "suspend",
  "reason": "Policy violation"
}
```

**Response (200):**
```json
{
  "message": "Seller suspended successfully",
  "sellerId": "uuid",
  "action": "suspend",
  "reason": "Policy violation"
}
```

### 17. Get All Users
**GET** `/api/admin/users?status=active&accountType=buyer&page=1&limit=10`

Get all users with filtering and pagination.

**Query Parameters:**
- `status`: active, suspended
- `accountType`: buyer, seller, admin
- `page`: page number (default: 1)
- `limit`: items per page (default: 10)

**Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "accountType": "buyer",
      "accountStatus": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalUsers": 500,
    "usersPerPage": 10
  }
}
```

### 18. Get User Details
**GET** `/api/admin/users/:userId`

Get detailed information about a specific user.

**Response (200):**
```json
{
  "message": "User details retrieved successfully",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountType": "seller",
    "accountStatus": "active",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "country": "United States",
    "state": "California",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sellerDetails": {
      "id": "uuid",
      "businessName": "My Business",
      "category": "electronics",
      "verificationStatus": "approved",
      "documents": [...]
    }
  }
}
```

### 19. Toggle User Status
**POST** `/api/admin/toggle-user-status`

Suspend or activate any user (buyer or seller).

**Request Body:**
```json
{
  "userId": "uuid",
  "action": "suspend",
  "reason": "Inappropriate behavior"
}
```

**Response (200):**
```json
{
  "message": "User suspended successfully",
  "userId": "uuid",
  "userEmail": "john@example.com",
  "action": "suspend",
  "reason": "Inappropriate behavior"
}
```

---

## Notification Endpoints

### 20. Get User Notifications
**GET** `/api/notifications?page=1&limit=10&type=info&isRead=false`

Get user's notifications with filtering and pagination.

**Query Parameters:**
- `page`: page number (default: 1)
- `limit`: items per page (default: 10)
- `type`: info, success, warning, error, admin
- `category`: seller_application, account_status, password_reset, admin_action, system
- `isRead`: true/false

**Response (200):**
```json
{
  "message": "Notifications retrieved successfully",
  "notifications": [
    {
      "id": "uuid",
      "title": "Seller Application Approved",
      "message": "Your seller application has been approved!",
      "type": "success",
      "category": "seller_application",
      "isRead": false,
      "isEmailSent": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "sellerId": "uuid",
        "businessName": "My Business"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalNotifications": 25,
    "notificationsPerPage": 10
  }
}
```

### 21. Get Unread Count
**GET** `/api/notifications/unread-count`

Get count of unread notifications.

**Response (200):**
```json
{
  "message": "Unread count retrieved",
  "unreadCount": 5
}
```

### 22. Mark Notification as Read
**PUT** `/api/notifications/:notificationId/read`

Mark a specific notification as read.

**Response (200):**
```json
{
  "message": "Notification marked as read",
  "notificationId": "uuid"
}
```

### 23. Mark All Notifications as Read
**PUT** `/api/notifications/mark-all-read`

Mark all user notifications as read.

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 5
}
```

### 24. Delete Notification
**DELETE** `/api/notifications/:notificationId`

Delete a specific notification.

**Response (200):**
```json
{
  "message": "Notification deleted successfully",
  "notificationId": "uuid"
}
```

---

## Profile Endpoints

### 25. Get User Profile
**GET** `/api/profile`

Get current user's profile information.

**Response (200):**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountType": "seller",
    "accountStatus": "active",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "country": "United States",
    "state": "California",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "sellerDetails": {
    "id": "uuid",
    "businessName": "My Business",
    "category": "electronics",
    "verificationStatus": "approved",
    "verifiedAt": "2024-01-01T00:00:00.000Z",
    "documents": [...]
  }
}
```

---

## Data Models

### User Table
```javascript
{
  id: UUID (Primary Key),
  fullName: STRING(50),
  email: STRING(100) UNIQUE,
  password: STRING(255),
  phoneNumber: STRING(20),
  address: STRING(200),
  country: STRING(50),
  state: STRING(50),
  accountType: ENUM('buyer', 'seller', 'admin'),
  accountStatus: ENUM('active', 'suspended', 'deactivated'),
  agreeTerms: BOOLEAN,
  google_Id: STRING(100),
  facebook_Id: STRING(100),
  createdAt: DATE,
  updatedAt: DATE
}
```

### Sellers Table
```javascript
{
  id: UUID (Primary Key),
  userId: UUID (Foreign Key),
  businessName: STRING(100) UNIQUE,
  businessAddress: STRING(200),
  category: STRING(50),
  verificationStatus: ENUM('pending', 'approved', 'rejected', 'suspended', 'active'),
  isVerified: BOOLEAN,
  verifiedAt: DATE,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Seller Document
```javascript
{
  id: UUID (Primary Key),
  sellerId: UUID (Foreign Key),
  documentType: STRING(50),
  documentNumber: STRING(50),
  documentImage: STRING(255),
  status: ENUM('pending', 'approved', 'rejected'),
  submittedAt: DATE,
  verifiedAt: DATE,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Notification
```javascript
{
  id: UUID (Primary Key),
  userId: UUID (Foreign Key),
  title: STRING(100),
  message: TEXT,
  type: ENUM('info', 'success', 'warning', 'error', 'admin'),
  category: ENUM('seller_application', 'account_status', 'password_reset', 'admin_action', 'system'),
  isRead: BOOLEAN,
  isEmailSent: BOOLEAN,
  readAt: DATE,
  emailSentAt: DATE,
  metadata: JSON,
  createdAt: DATE,
  updatedAt: DATE
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

### Validation Error Example
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## Authentication Flow

### 1. Registration Flow
1. User submits registration form
2. Server validates input
3. Password is hashed with bcrypt
4. User account created with `accountType: 'buyer'`
5. JWT token generated and sent in HTTP-only cookie
6. User redirected to dashboard

### 2. Login Flow
1. User submits login credentials
2. Server validates email/password
3. Account status checked (suspended users blocked)
4. Failed attempts tracked (lockout after 5 attempts)
5. JWT token generated with session ID
6. Session stored in Redis
7. Token sent in HTTP-only cookie

### 3. Seller Registration Flow
1. Buyer logs in
2. Submits seller application with business details
3. Documents uploaded and validated
4. User `accountType` updated to `'pending-seller'`
5. Seller record created with `verificationStatus: 'pending'`
6. Admin notification sent
7. User receives confirmation notification

### 4. Admin Approval Flow
1. Admin reviews pending seller applications
2. Approves/rejects with notes
3. Seller status updated accordingly
4. User `accountType` updated to `'seller'` (if approved)
5. Notification sent to seller
6. Email notification sent (if configured)

### 5. Session Management
- Each login creates unique session ID
- Sessions stored in Redis with expiration
- Logout removes specific session
- Logout all devices clears all sessions
- Token verification checks session validity

---

## Security Features

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number, symbol
- Bcrypt hashing with salt rounds 10
- Account lockout after 5 failed attempts (15 min)

### Token Security
- JWT tokens with expiration
- HTTP-only cookies (prevents XSS)
- Session-based validation
- Automatic logout on session expiry

### Input Validation
- Email format validation
- Phone number format validation
- Business name uniqueness
- Document type validation
- File format validation

### Rate Limiting
- Login attempts tracked
- Password reset requests limited
- API rate limiting (configurable)

---

## Environment Variables

Required environment variables for the backend:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ocean_app

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Server
PORT=3000
NODE_ENV=development
```

---

## Testing with Postman

### Authentication Headers
For protected endpoints, include the JWT token in cookies:
```
Cookie: token=your_jwt_token_here
```

### Example Test Flow
1. **Register User**: `POST /api/signup`
2. **Login**: `POST /api/login` (save token from cookie)
3. **Get Profile**: `GET /api/profile`
4. **Register as Seller**: `POST /api/seller-registration`
5. **Admin Login**: `POST /api/login` (with admin account)
6. **Approve Seller**: `POST /api/admin/approve-seller`
7. **Get Notifications**: `GET /api/notifications`

### Sample Test Data
```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!",
  "phoneNumber": "+1234567890",
  "address": "123 Test St",
  "country": "United States",
  "state": "California",
  "agreeTerms": true
}
```

---

This documentation covers all the backend functionality we've implemented. The frontend team can use this as a reference for integrating with the API endpoints. 