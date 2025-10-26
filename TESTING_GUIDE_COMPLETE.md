# Complete Testing Guide - All Updated Endpoints

## ✅ Backend Controllers Updated (6/8 Complete)

### Already Updated in Code:
1. ✅ **Authentication Controller** - Login fields, OTP acceptance
2. ✅ **Profile Controller** - Missing fields added
3. ✅ **Products Controller** - Structure updated, accepts both field names
4. ✅ **Feed Controller** - Pagination fields renamed
5. ✅ **Notifications Controller** - Field mappings applied
6. ⚠️ **Market Survey Controllers** - NEED MANUAL TESTING

---

## 🎯 Testing Guide by Feature

### 1. AUTHENTICATION ENDPOINTS ✅

#### POST /api/login
**Expected Response:**
```json
{
  "success": true,
  "message": "User successfully signed in.",
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "role": "buyer",
    "accountType": "buyer",
    "accountStatus": "active",
    "profilePicture": "...",
    "username": "...",
    "bio": "...",
    "location": "...",
    "emailVerified": true
  },
  "token": "..."
}
```
**✅ READY TO TEST**

#### POST /api/verify-resetCode
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "12345"
}
```
**✅ Accepts both `otp` and `resetCode` - READY TO TEST**

---

### 2. PROFILE ENDPOINTS ✅

#### GET /api/profile
**Expected Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "...",
    "email": "...",
    "fullName": "...",
    "username": "...",
    "profilePicture": "...",
    "coverPicture": "...",
    "bio": "...",
    "location": "...",
    "website": "...",
    "phoneNumber": "...",
    "emailVerified": true,
    "updatedAt": "2024-01-15T10:00:00Z",
    "followersCount": 150,
    "followingCount": 200,
    "productsCount": 0
  }
}
```
**✅ READY TO TEST**

---

### 3. PRODUCTS ENDPOINTS ✅

#### GET /api/products
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],  // ✅ Wrapped in products array
    "pagination": {...}
  },
  "searchInfo": {...}
}
```
**✅ READY TO TEST**

#### POST /api/products
**Request (accepts both):**
```json
{
  "name": "Product",  // ✅ Frontend name
  "title": "Product", // ✅ Backend name
  ...
}
```
**✅ READY TO TEST**

---

### 4. FEED ENDPOINTS ✅

#### GET /api/feed
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "page": 1,              // ✅ Was: currentPage
      "totalCount": 100,       // ✅ Was: totalPosts
      "hasPreviousPage": false // ✅ Was: hasPrevPage
    }
  }
}
```
**✅ READY TO TEST**

---

### 5. NOTIFICATIONS ENDPOINTS ✅

#### GET /api/notifications
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "...",
        "read": false,    // ✅ Was: isRead
        "body": "...",    // ✅ Was: message
        "data": {...},    // ✅ Was: metadata
        "title": "..."
      }
    ]
  }
}
```
**✅ READY TO TEST**

---

### 6. MARKET SURVEY ENDPOINTS ⚠️ NEED TESTING

#### GET /api/auctions
**Expected Mapping:**
- `startingPrice` → `startingBid`
- `currentPrice` → `currentBid`

**How to Test:**
- Backend currently returns `startingPrice`, `currentPrice`
- Frontend expects `startingBid`, `currentBid`
- **Test if middleware handles this OR if frontend adapts**

#### GET /api/group-buy
**Expected Mapping:**
- `group_price` → `pricePerUnit`
- `deadline` → `endDate`

**How to Test:**
- Backend returns `group_price`, `deadline`
- Frontend expects `pricePerUnit`, `endDate`
- **Test current behavior**

#### GET /api/distress-sales
**Expected Mapping:**
- `title` → `productName`

**How to Test:**
- Backend returns `title`
- Frontend expects `productName`
- **Test current behavior**

#### GET /api/buyer-needs
**Expected Mapping:**
- `title` → `caption`

**How to Test:**
- Backend returns `title`
- Frontend expects `caption`
- **Test current behavior**

---

## 🎯 Testing Priority

### ✅ HIGH PRIORITY (Ready to Test Now):
1. POST /api/login
2. GET /api/profile
3. GET /api/products
4. POST /api/products
5. GET /api/feed
6. GET /api/notifications

### ⚠️ MEDIUM PRIORITY (Test Current Behavior):
7. GET /api/auctions
8. GET /api/group-buy
9. GET /api/distress-sales
10. GET /api/buyer-needs

---

## 📝 Testing Checklist

### Core Features (READY):
- [ ] Login returns all user fields
- [ ] Profile includes missing fields (emailVerified, phoneNumber, website, updatedAt)
- [ ] Products list has proper `data.products` structure
- [ ] Create product accepts both `name` and `title`
- [ ] Feed pagination uses correct field names
- [ ] Notifications use mapped field names (read, body, data)
- [ ] OTP verification accepts both `otp` and `resetCode`

### Market Survey (TEST & REPORT):
- [ ] Auctions - Check field names (startingPrice vs startingBid)
- [ ] Group buys - Check field names (group_price vs pricePerUnit)
- [ ] Distress sales - Check field names (title vs productName)
- [ ] Buyer needs - Check field names (title vs caption)

---

## 💡 Important Notes

### What's Updated:
✅ Backend controllers for core features
✅ Response wrapper middleware
✅ Field mapper utility created

### What Needs Testing:
⚠️ Market survey endpoints need manual testing
⚠️ Check if frontend can adapt OR if additional mappings needed

### Testing Strategy:
1. Test core features first (login, profile, products, feed)
2. Test market survey endpoints
3. Report any field name mismatches
4. We can add more mappings if needed

---

## 🚀 Ready to Start Testing!

**Status**: Core features 100% updated, Market survey needs testing  
**Recommendation**: Test core features first, then test market survey endpoints and report any issues

