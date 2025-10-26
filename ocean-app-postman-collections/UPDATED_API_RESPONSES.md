# Updated API Responses - Postman Collection Reference

## 🎯 All API Responses Now Include Updated Structure

This document shows the updated response examples for all modified endpoints. Use these examples in your Postman collections.

---

## 1. POST /api/login

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "User successfully signed in.",
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "role": "buyer",
    "accountType": "buyer",
    "accountStatus": "active",
    "profilePicture": "https://example.com/profile.jpg",
    "username": "johndoe",
    "bio": "User bio text",
    "location": "New York, NY",
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Key Updates:**
- ✅ Added `success: true`
- ✅ Added `profilePicture`, `username`, `bio`, `location`, `emailVerified`

---

## 2. GET /api/profile

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "profilePicture": "https://example.com/profile.jpg",
    "coverPicture": "https://example.com/cover.jpg",
    "bio": "User bio text",
    "location": "New York, NY",
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

**Key Updates:**
- ✅ Added `success: true`
- ✅ Added `emailVerified`, `phoneNumber`, `website`, `updatedAt`

---

## 3. GET /api/products

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
        "quantity": 10,
        "images": ["https://example.com/image1.jpg"],
        "rating": 4.5,
        "ratingCount": 25,
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 100,
      "pages": 9
    }
  },
  "searchInfo": {
    "query": null,
    "filters": {}
  }
}
```

**Key Updates:**
- ✅ Added `success: true`
- ✅ Products wrapped in `data.products` array

---

## 4. POST /api/products

**Request Body (accepts both `name` and `title`):**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "currency": "USD",
  "category": "Electronics",
  "condition": "new",
  "quantity": 10,
  "images": [],
  "tags": ["tag1", "tag2"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "prod_123",
    "title": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "currency": "USD",
    "category": "Electronics",
    "condition": "new",
    "quantity": 10,
    "images": [],
    "status": "active"
  }
}
```

**Key Updates:**
- ✅ Accepts both `name` and `title` field names

---

## 5. GET /api/feed

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Feed retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "post_123",
        "userId": "user_123",
        "userName": "John Doe",
        "userProfilePicture": "https://...",
        "content": "Post content here",
        "images": ["https://..."],
        "category": "general",
        "likesCount": 150,
        "commentsCount": 25,
        "sharesCount": 10,
        "savesCount": 50,
        "isLiked": false,
        "isSaved": false,
        "createdAt": "2024-01-15T10:00:00Z"
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

**Key Updates:**
- ✅ Added `success: true`
- ✅ Pagination fields: `page` (was `currentPage`), `totalCount` (was `totalPosts`), `hasPreviousPage` (was `hasPrevPage`)

---

## 6. GET /api/notifications

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

**Key Updates:**
- ✅ Added `success: true`
- ✅ Field mappings: `isRead` → `read`, `message` → `body`, `metadata` → `data`

---

## 7. POST /api/forgot-password

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## 8. POST /api/verify-resetCode

**Request Body (accepts both field names):**
```json
{
  "email": "john.doe@example.com",
  "otp": "12345"
}
```

**OR**
```json
{
  "email": "john.doe@example.com",
  "resetCode": "12345"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code verified successfully."
}
```

---

## 9. POST /api/logout

**New Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📊 Summary of All Changes

### Response Structure
- ✅ All responses now include `success: true` flag (added by middleware)
- ✅ Consistent structure: `{success, message, data/user}`

### Field Additions
- ✅ Login: Added `profilePicture`, `username`, `bio`, `location`, `emailVerified`
- ✅ Profile: Added `emailVerified`, `phoneNumber`, `website`, `updatedAt`
- ✅ Products: Wrapped in `data.products` array
- ✅ Feed: Updated pagination field names
- ✅ Notifications: Field name mappings (`read`, `body`, `data`)

### Backward Compatibility
- ✅ Products endpoint accepts both `name` and `title`
- ✅ OTP endpoint accepts both `otp` and `resetCode`

---

## 🎯 Testing Priority

### High Priority (Core Features):
1. ✅ POST /api/login
2. ✅ GET /api/profile
3. ✅ GET /api/products
4. ✅ POST /api/products

### Medium Priority:
5. ✅ GET /api/feed
6. ✅ GET /api/notifications

### Low Priority:
7. ✅ POST /api/forgot-password
8. ✅ POST /api/verify-resetCode
9. ✅ POST /api/logout

---

**Status**: All core endpoints updated  
**Date**: Field mapping complete  
**Ready**: For testing

