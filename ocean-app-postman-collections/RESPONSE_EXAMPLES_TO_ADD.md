# Response Examples to Add to Postman Collections

## 📋 This file contains example responses you can add to Postman

When you test in Postman, you'll see these responses from the backend. Add these as "examples" in your Postman collections.

---

## 1. POST /api/login

**Example Response (200 OK):**
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
    "bio": "User bio",
    "location": "New York",
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. GET /api/products

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "title": "Product Name",
        "description": "Description",
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
  "searchInfo": {}
}
```

---

## 3. GET /api/auctions (UPDATED FIELD NAMES)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "auc_123",
      "title": "Vintage Watch",
      "description": "Description",
      "startingBid": 100.00,     // ✅ UPDATED from "startingPrice"
      "currentBid": 150.00,      // ✅ UPDATED from "currentPrice"
      "minimumIncrement": 10.00,
      "endTime": "2024-01-20T10:00:00Z",
      "status": "active",
      "images": ["https://..."],
      "category": "electronics"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## 4. GET /api/group-buy (UPDATED FIELD NAMES)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "gb_123",
      "title": "Product Name",
      "description": "Description",
      "pricePerUnit": 50.00,     // ✅ UPDATED from "group_price"
      "targetQuantity": 100,
      "currentQuantity": 75,
      "endDate": "2024-01-20T10:00:00Z",  // ✅ UPDATED from "deadline"
      "status": "active",
      "images": ["https://..."]
    }
  ],
  "pagination": {...}
}
```

---

## 5. GET /api/buyer-needs (UPDATED FIELD NAME)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "bn_123",
      "caption": "Looking for product",  // ✅ UPDATED from "title"
      "description": "Description",
      "category": "Electronics",
      "budget_min": 50,
      "budget_max": 100,
      "urgency": "high",
      "location": "New York",
      "current_reach": 5,
      "reach_limit": 10
    }
  ],
  "pagination": {...}
}
```

---

## 6. GET /api/distress-sales (UPDATED FIELD NAME)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ds_123",
      "productName": "Product Name",  // ✅ UPDATED from "title"
      "description": "Description",
      "price": 70.00,
      "originalPrice": 100.00,
      "discountPercentage": 30,
      "urgencyLevel": "high",
      "expiryTime": "2024-01-20T10:00:00Z",
      "images": ["https://..."],
      "status": "active"
    }
  ],
  "pagination": {...}
}
```

---

## 7. GET /api/notifications (UPDATED FIELD NAMES)

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "like",
        "read": false,     // ✅ UPDATED from "isRead"
        "body": "Someone liked your post",  // ✅ UPDATED from "message"
        "data": {           // ✅ UPDATED from "metadata"
          "postId": "post_123"
        },
        "title": "New like",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

## 8. GET /api/profile

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "profilePicture": "https://...",
    "coverPicture": "https://...",
    "bio": "User bio",
    "location": "New York",
    "website": "https://johndoe.com",
    "phoneNumber": "+1234567890",
    "emailVerified": true,
    "updatedAt": "2024-01-15T10:00:00Z",
    "role": "buyer",
    "accountType": "buyer",
    "accountStatus": "active",
    "followersCount": 150,
    "followingCount": 200,
    "productsCount": 0
  }
}
```

---

## 📝 How to Use These Examples in Postman

1. Make a request to any endpoint
2. When you get the response, click "Save Response" button
3. Select "Save as Example"
4. Postman will save this as an example response
5. This helps other developers see what to expect

---

## ✅ Summary of Field Name Changes

| Endpoint | Old Field Name | New Field Name | Status |
|----------|---------------|----------------|--------|
| Auctions | `startingPrice` | `startingBid` | ✅ Updated |
| Auctions | `currentPrice` | `currentBid` | ✅ Updated |
| Group Buy | `group_price` | `pricePerUnit` | ✅ Updated |
| Group Buy | `deadline` | `endDate` | ✅ Updated |
| Buyer Needs | `title` | `caption` | ✅ Updated |
| Distress Sales | `title` | `productName` | ✅ Updated |
| Notifications | `isRead` | `read` | ✅ Updated |
| Notifications | `message` | `body` | ✅ Updated |
| Notifications | `metadata` | `data` | ✅ Updated |

---

**All backend controllers updated. Ready for testing!**

