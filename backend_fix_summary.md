# Backend Fix Summary

> **Generated from:** `api_model_differences.md`  
> **Date:** 2024  
> **Status:** ✅ Response wrapper middleware is ALREADY IMPLEMENTED - fixes 90% of structure issues  
> **Remaining:** Field name mappings and pagination standardization

---

## 🔐 Authentication Endpoints

### POST /api/verify-resetCode (OTP Verification)

- **Rename (Request):** `resetCode` → `otp` OR accept both field names
- **Location:** `ocean_server/src/controllers/authcontroller.js` line 272

### POST /api/login

- **Add Fields (Response):** `profilePicture`, `username`, `bio`, `location`, `emailVerified`  
- **Location:** `ocean_server/src/controllers/authcontroller.js` line 151-155

### POST /api/logout

- **Already handled by middleware** ✅

### POST /api/forgot-password

- **Already handled by middleware** ✅

---

## 👤 User Management Endpoints

### GET /api/profile

- **Rename (Response):** `profileInfo` → `user` (at root level)
- **Add Fields:** `emailVerified`, `phoneNumber`, `website`, `updatedAt`
- **Location:** `ocean_server/src/controllers/profilecontroller.js` line 311-318

### PUT /api/profile

- **Needs verification** - structure check required

---

## 📰 Posts & Content Endpoints

### GET /api/feed

- **Rename (Response):** 
  - `content` → `caption` (post content field)
  - `type` → `category` (post type field)
  - `images[]` → `media[]` (restructure array with `{id, type, url, thumbnailUrl}`)
- **Rename (Pagination):**
  - `currentPage` → `page`
  - `totalPosts` → `totalCount`
  - `hasPrevPage` → `hasPreviousPage`
- **Location:** `ocean_server/src/controllers/feedcontroller.js` line 374-382

---

## 📦 Products Endpoints

### GET /api/products

- **Wrap Data:** Return `data: { products: [...], pagination: {...} }` instead of `data: [...]`
- **Rename (Response):** `title` → `name` (product name field)
- **Location:** `ocean_server/src/controllers/productController.js` line 62-67

### POST /api/products

- **Rename (Request):** `title` → `name` (accept both)
- **Location:** Request body mapping needed in controller

---

## 📊 Market Survey Endpoints

### GET /api/distress-sales

- **Rename (Response):** `title` → `productName`
- **Wrap Response:** Ensure `data: { distressSales: [...], pagination: {...} }`

### GET /api/auctions

- **Rename (Response):** 
  - `startingPrice` → `startingBid`
  - `currentPrice` → `currentBid`
- **Wrap Response:** Ensure `data: { auctions: [...], pagination: {...} }`

### GET /api/group-buy (Bulk Purchases)

- **Rename (Response):** 
  - `group_price` → `pricePerUnit`
  - `deadline` → `endDate`
- **Wrap Response:** Ensure `data: { bulkPurchases: [...], pagination: {...} }`

### GET /api/swap-deals

- **Rename (Response):** `productToSwap` → `myProductName`
- **Wrap Response:** Ensure `data: { swapDeals: [...], pagination: {...} }`

### GET /api/buyer-needs (Demand Posts)

- **Rename (Response):** `title` → `caption`
- **Wrap Response:** Ensure `data: { demandPosts: [...], pagination: {...} }`

---

## 🔔 Notifications Endpoints

### GET /api/notifications

- **Rename (Response):** 
  - `message` → `body`
  - `isRead` → `read`
  - `metadata` → `data`
- **Wrap Response:** Ensure `data: { notifications: [...], pagination: {...} }`

---

## 💳 Subscriptions Endpoints

### POST /api/subscriptions/subscribe

- **Needs verification** - payment integration check required

---

## 🔄 Global Summary Tables

### 🔁 Global Rename Summary

| Backend Field | Frontend Field | Endpoint | Type |
|---------------|----------------|----------|------|
| `resetCode` | `otp` | POST /api/verify-resetCode | Request |
| `profileInfo` | `user` | GET /api/profile | Response Root |
| `content` | `caption` | GET /api/feed (posts) | Response |
| `type` | `category` | GET /api/feed (posts) | Response |
| `currentPage` | `page` | Pagination (all endpoints) | Response |
| `totalPosts` | `totalCount` | Pagination (all endpoints) | Response |
| `hasPrevPage` | `hasPreviousPage` | Pagination (all endpoints) | Response |
| `title` | `name` | Products endpoints | Response/Request |
| `title` | `productName` | Distress sales | Response |
| `startingPrice` | `startingBid` | Auctions | Response |
| `currentPrice` | `currentBid` | Auctions | Response |
| `group_price` | `pricePerUnit` | Group buys | Response |
| `deadline` | `endDate` | Group buys | Response |
| `productToSwap` | `myProductName` | Swap deals | Response |
| `title` | `caption` | Buyer needs | Response |
| `message` | `body` | Notifications | Response |
| `isRead` | `read` | Notifications | Response |
| `metadata` | `data` | Notifications | Response |

---

### ➕ Fields to Add

#### Login Response (/api/login)
- `profilePicture` (string, nullable)
- `username` (string, nullable)
- `bio` (string, nullable)
- `location` (string, nullable)
- `emailVerified` (boolean)

#### Profile Response (/api/profile)
- `emailVerified` (boolean)
- `phoneNumber` (string, nullable)
- `website` (string, nullable)
- `updatedAt` (string, ISO date)

---

### 🏗️ Structure Changes Required

#### Products GET Response
**Current:**
```json
{
  "success": true,
  "data": [...],  // ❌ Direct array
  "pagination": {...}
}
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "products": [...],  // ✅ Wrapped in object
    "pagination": {...}
  }
}
```

#### Feed Response - Media Structure
**Current:**
```json
{
  "images": ["url1", "url2"]  // ❌ Simple array
}
```

**Expected:**
```json
{
  "media": [
    { "id": "...", "type": "image", "url": "...", "thumbnailUrl": "..." }
  ]  // ✅ Array of objects
}
```

#### Pagination Fields
**Current:**
```json
{
  "currentPage": 1,
  "totalPosts": 100,
  "hasPrevPage": false
}
```

**Expected:**
```json
{
  "page": 1,           // ✅ Renamed
  "totalCount": 100,   // ✅ Renamed
  "hasPreviousPage": false  // ✅ Renamed
}
```

---

## ⚙️ Type Adjustments

No type mismatches identified - all fields use appropriate data types (strings, numbers, booleans, objects).

---

## 📊 Priority Breakdown

### 🔴 High Priority (Critical for Frontend Integration)
1. **GET /api/products** - Wrap response in `products` key
2. **GET /api/profile** - Add missing fields (`emailVerified`, `phoneNumber`, `website`, `updatedAt`)
3. **POST /api/login** - Add missing user fields
4. **GET /api/feed** - Map pagination field names
5. **Notifications** - Field name mapping (`message` → `body`, `isRead` → `read`, `metadata` → `data`)

### 🟡 Medium Priority (Affects UI Display)
1. All **field name renaming** across market survey endpoints
2. Feed media structure transformation
3. OTP verification field name acceptance

### 🟢 Low Priority (Cosmetic)
1. Pagination field standardization (can be handled in frontend if needed)
2. Message server verification

---

## ✅ Already Fixed by Middleware

These issues are **automatically resolved** by the response wrapper middleware:

- ✅ Adding `success: true/false` to all responses
- ✅ Wrapping responses in `{success, message, data}` structure
- ✅ Logout response format
- ✅ Forgot password response format
- ✅ Error response formatting
- ✅ Most authentication endpoints

**Middleware Location:** `ocean_server/src/middleware/responseWrapper.js`

---

## 🎯 Quick Reference

### Files That Need Updates:
1. `ocean_server/src/controllers/authcontroller.js` - Login fields, OTP field
2. `ocean_server/src/controllers/profilecontroller.js` - Profile fields, root rename
3. `ocean_server/src/controllers/feedcontroller.js` - Field mappings, pagination
4. `ocean_server/src/controllers/productController.js` - Response wrapping, field rename
5. Market survey controllers - Field renaming and response wrapping
6. Notification controller - Field renaming

### Estimated Changes: 
- **25+ field renames**
- **3-5 structure wrapping changes** 
- **5-10 missing fields to add**
- **0 type changes** (all types match)

---

## 💡 Recommended Implementation Approach

### Option 1: Update Controllers Directly (Faster)
- Modify each controller to return the expected field names
- Pros: Direct, explicit changes
- Cons: More files to modify

### Option 2: Create Field Mapping Layer (Scalable)
- Create a transformation utility that maps backend fields to frontend
- Pros: Centralized, reusable
- Cons: Additional abstraction layer

### Option 3: Hybrid Approach (Recommended)
- Use middleware for structure (✅ Already done)
- Create field mapping utility for naming differences
- Update critical endpoints directly (profile, login)

**Current Recommendation:** Option 3 - Leverage middleware + field mapping utility for scalability.

Implementation

Step 3: Update controllers in order:



Products
Feed/posts
Auctions
Group buys
Swap deals
Buyer needs
Notifications
Step 4: Verify integration