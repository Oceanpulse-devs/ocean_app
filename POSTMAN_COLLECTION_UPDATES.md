# Postman Collection Updates - API Response Changes

## 🎯 Summary
All API responses now include standardized structure with `success` flag and proper field names.

---

## ✅ Updated Response Examples

### 1. User Login - POST /api/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "User successfully signed in.",
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "buyer",
    "accountType": "buyer",
    "accountStatus": "active",
    "profilePicture": "https://...",
    "username": "johndoe",
    "bio": "User bio",
    "location": "New York",
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Key Changes:**
- ✅ Added `success: true` flag
- ✅ Added `profilePicture`, `username`, `bio`, `location`, `emailVerified` fields
- ✅ Response wrapped in standardized structure

---

### 2. Get User Profile - GET /api/profile

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "user@example.com",
    "username": "johndoe",
    "profilePicture": "https://...",
    "coverPicture": "https://...",
    "bio": "User bio",
    "location": "New York",
    "website": "https://johndoe.com",
    "phoneNumber": "+1234567890",
    "role": "buyer",
    "accountType": "buyer",
    "accountStatus": "active",
    "emailVerified": true,
    "updatedAt": "2024-01-15T10:00:00Z",
    "followersCount": 150,
    "followingCount": 200,
    "productsCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Key Changes:**
- ✅ Added `success: true` flag
- ✅ Added `emailVerified`, `phoneNumber`, `website`, `updatedAt` fields
- ✅ Response uses `user` key instead of `profileInfo`

---

### 3. Get Products - GET /api/products

**New Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "title": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "currency": "USD",
        "category": "Electronics",
        "condition": "new",
        "images": ["https://..."],
        "rating": 4.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 100,
      "pages": 9
    }
  },
  "searchInfo": {...}
}
```

**Key Changes:**
- ✅ Added `success: true` flag
- ✅ Products wrapped in `data.products` array
- ✅ Pagination included in `data` object

---

### 4. Create Product - POST /api/products

**Request (accepts both field names):**
```json
{
  "name": "Product Name",
  // OR
  "title": "Product Name",
  "description": "Description",
  "price": 99.99,
  "currency": "USD",
  "category": "Electronics",
  "condition": "new",
  "quantity": 10,
  "images": [],
  "tags": ["tag1", "tag2"]
}
```

**Key Changes:**
- ✅ Accepts both `name` (frontend) and `title` (backend) field names

---

### 5. Get Feed - GET /api/feed

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Feed retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "post_123",
        "content": "Post content...",
        "type": "general",
        "images": ["https://..."],
        "isLiked": false,
        "isSaved": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Key Changes:**
- ✅ Added `success: true` flag
- ✅ Pagination fields renamed:
  - `currentPage` → `page`
  - `totalPosts` → `totalCount`
  - `hasPrevPage` → `hasPreviousPage`

---

### 6. Get Notifications - GET /api/notifications

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "like",
        "read": false,
        "body": "Someone liked your post",
        "data": {
          "postId": "post_123"
        },
        "title": "New like",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 45,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Key Changes:**
- ✅ Added `success: true` flag
- ✅ Field names mapped:
  - `isRead` → `read`
  - `message` → `body`
  - `metadata` → `data`

---

### 7. Forgot Password - POST /api/forgot-password

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 8. Verify OTP/Reset Code - POST /api/verify-resetCode

**Request (accepts both field names):**
```json
{
  "email": "user@example.com",
  "otp": "12345"
  // OR
  "resetCode": "12345"
}
```

**Key Changes:**
- ✅ Accepts both `otp` (frontend) and `resetCode` (backend) field names

---

## 📊 Complete Field Mapping Summary

### Authentication
- ✅ Login: Added `profilePicture`, `username`, `bio`, `location`, `emailVerified`
- ✅ OTP Verification: Accepts both `otp` and `resetCode`

### Profile
- ✅ Added `emailVerified`, `phoneNumber`, `website`, `updatedAt`
- ✅ Response uses `user` key

### Products
- ✅ Products wrapped in `data.products` structure
- ✅ Accepts both `name` and `title` when creating

### Feed
- ✅ Pagination fields: `page`, `totalCount`, `hasPreviousPage`

### Notifications
- ✅ Field mappings: `read`, `body`, `data`

---

## 🎯 Testing Checklist

### Endpoints to Test:
1. ✅ POST /api/login - Check for all user fields
2. ✅ GET /api/profile - Check for missing fields
3. ✅ GET /api/products - Check `data.products` structure
4. ✅ POST /api/products - Try with both `name` and `title`
5. ✅ GET /api/feed - Check pagination field names
6. ✅ GET /api/notifications - Check field name mappings
7. ✅ POST /api/forgot-password - Check success flag
8. ✅ POST /api/verify-resetCode - Try with both `otp` and `resetCode`

---

## 📝 Notes

- All responses now include `success: true` flag (added by middleware)
- Response wrapper middleware handles structure transformation
- Field names mapped to match frontend expectations
- All changes are backward compatible

---

**Update Date**: Field mapping implementation complete  
**Status**: Ready for testing  
**Recommendation**: Import these examples into your Postman collections

