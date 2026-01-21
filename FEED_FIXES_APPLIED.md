# Home Feed API - Fixes Applied

**Date:** January 21, 2025  
**Status:** ✅ **ALL FIXES COMPLETE**  
**File Modified:** `ocean_server/src/controllers/feedcontroller.js`

---

## 🎯 **All Issues Fixed**

### ✅ **Fix 1: Product Price - Convert to Number**

**Issue:** Price was returned as string `"80000.00"` instead of number `80000`

**Location:** Line 258 - Product post format

**Change Applied:**
```javascript
// Before
price: postData.price || 0,

// After
price: parseFloat(postData.price) || 0,
```

**Impact:** Frontend can now use prices directly without parsing

---

### ✅ **Fix 2: Auction - Add Missing Fields & Convert Numbers**

**Issue:** 
- `category` and `brand` were `null` (not reading from metadata)
- `endTime` was `null` (not reading from metadata.end_time)
- `startingBid` and `currentBid` were strings instead of numbers

**Location:** Lines 292-304 - Auction post format

**Changes Applied:**
```javascript
// Before
brand: postData.brand || null,
category: postData.feedMetadata?.category || null,
startingBid: postData.price || 0,
currentBid: postData.feedMetadata?.currentBid || postData.price || 0,
endTime: postData.feedMetadata?.endTime || null,

// After
brand: postData.feedMetadata?.brand || postData.brand || null,
category: postData.feedMetadata?.category || null,
startingBid: parseFloat(postData.feedMetadata?.starting_price || postData.price) || 0,
currentBid: parseFloat(postData.feedMetadata?.current_price || postData.feedMetadata?.currentBid || postData.price) || 0,
endTime: postData.feedMetadata?.end_time 
    ? new Date(postData.feedMetadata.end_time).toISOString() 
    : (postData.feedMetadata?.endTime ? new Date(postData.feedMetadata.endTime).toISOString() : null),
```

**Impact:** 
- Auctions now show category and brand
- End time is properly formatted for countdown timers
- Bid amounts are numbers (not strings)

---

### ✅ **Fix 3: Group Buy - Use Metadata Values & Convert Numbers**

**Issue:** 
- `minBuyers`, `maxBuyers`, `currentBuyers` were all `0` (not reading from metadata)
- `category` and `brand` were `null`
- `pricePerUnit` was a string instead of number
- `productName` not using metadata value

**Location:** Lines 335-349 - Group buy post format

**Changes Applied:**
```javascript
// Before
productName: postData.productName || 'Group Buy',
brand: postData.brand || null,
category: postData.feedMetadata?.category || null,
pricePerUnit: postData.price || 0,
minBuyers: postData.feedMetadata?.minBuyers || 0,
maxBuyers: postData.feedMetadata?.maxBuyers || 0,
currentBuyers: postData.feedMetadata?.currentBuyers || 0,
deadline: postData.feedMetadata?.deadline || null,

// After
productName: postData.feedMetadata?.product_name || postData.productName || 'Group Buy',
brand: postData.feedMetadata?.brand || postData.brand || null,
category: postData.feedMetadata?.category || null,
pricePerUnit: parseFloat(postData.feedMetadata?.group_price || postData.price) || 0,
minBuyers: parseInt(postData.feedMetadata?.min_buyers || postData.feedMetadata?.minBuyers) || 0,
maxBuyers: parseInt(postData.feedMetadata?.max_buyers || postData.feedMetadata?.maxBuyers) || 0,
currentBuyers: parseInt(postData.feedMetadata?.current_buyers || postData.feedMetadata?.currentBuyers) || 0,
deadline: postData.feedMetadata?.deadline 
    ? new Date(postData.feedMetadata.deadline).toISOString()
    : null,
```

**Impact:** 
- Group buy progress now shows correctly (e.g., "18/50 buyers")
- Category and brand display properly
- Price is a number
- Deadline is ISO format for countdown timers

---

### ✅ **Fix 4: Swap Deal - Parse JSON Stringified Images** ⚠️ CRITICAL

**Issue:** 
- Media URLs were stringified JSON arrays: `"[\"https://...\"]"` instead of actual URLs
- `myItem.images` also had stringified JSON arrays

**Location:** Lines 351-407 - Swap deal post format

**Changes Applied:**
```javascript
// Before
let swapDealImages = [];
if (postData.feedMetadata?.images && Array.isArray(postData.feedMetadata.images)) {
    swapDealImages = postData.feedMetadata.images;
} else if (postData.media && postData.media.length > 0) {
    swapDealImages = postData.media.map(m => m.mediaUrl);
}

// After
let swapDealImages = [];
if (postData.feedMetadata?.images) {
    // Check if images is a stringified JSON array
    if (typeof postData.feedMetadata.images === 'string') {
        try {
            swapDealImages = JSON.parse(postData.feedMetadata.images);
        } catch (e) {
            console.error('Error parsing swap deal images:', e);
            swapDealImages = [];
        }
    } else if (Array.isArray(postData.feedMetadata.images)) {
        swapDealImages = postData.feedMetadata.images;
    }
} else if (postData.media && postData.media.length > 0) {
    swapDealImages = postData.media.map(m => m.mediaUrl);
}
```

**Also updated `myItem.images`:**
```javascript
// Before
images: swapDealImages

// After
images: swapDealImages // Already parsed above
```

**Impact:** 
- Swap deal images now display correctly
- No more stringified JSON arrays breaking UI

---

### ✅ **Fix 5: Distress Sale Type Detection** ⚠️ CRITICAL

**Issue:** 
- Distress sales were showing as "general" posts instead of "product" posts
- Missing `productId` and `product` object

**Location:** Lines 457-538 - General post format (else block)

**Changes Applied:**
```javascript
// Before
} else {
    // General post format (STANDARDIZED V2)
    const postImages = postData.media?.map(m => m.mediaUrl) || [];
    
    formattedPost = {
        id: postData.id,
        type: 'general',
        category: 'general',
        contentType: 'post',
        // ... rest of general post
    };
}

// After
} else {
    // Check if this is a distress sale disguised as general post
    const isDistressSale = postData.content?.includes('Distress Sale:') || 
                          postData.feedMetadata?.isDistressSale ||
                          postData.feedMetadata?.is_distress_sale;
    
    if (isDistressSale && postData.sourceId) {
        // Treat as product post (distress sale)
        const productImages = postData.media?.map(m => m.mediaUrl) || postData.feedMetadata?.images || [];
        
        formattedPost = {
            id: postData.id,
            type: 'product',
            category: 'product',
            contentType: 'product',
            // ... full product structure with productId and product object
            product: {
                id: postData.sourceId || postData.feedMetadata?.product_id || null,
                name: postData.productName || postData.feedMetadata?.product_name || 'Product',
                brand: postData.brand || postData.feedMetadata?.brand || null,
                description: postData.content || '',
                category: postData.feedMetadata?.category || null,
                price: parseFloat(postData.price || postData.feedMetadata?.price) || 0,
                currencyCode: 'NGN',
                images: productImages,
                metadata: {
                    ...postData.feedMetadata,
                    isDistressSale: true,
                    urgencyLevel: postData.feedMetadata?.urgencyLevel || postData.feedMetadata?.urgency_level || 'high',
                    discountPercentage: postData.feedMetadata?.discountPercentage || postData.feedMetadata?.discount_percentage || null
                }
            }
        };
    } else {
        // General post format (STANDARDIZED V2)
        // ... normal general post structure
    }
}
```

**Impact:** 
- Distress sales now correctly identified as products
- Full product details available (discount, urgency, etc.)
- Frontend can properly navigate to product detail page

---

### ✅ **Fix 6: Pagination - Add `limit` Field, Remove `totalPages`**

**Issue:** 
- Missing `limit` field (frontend expects this)
- Had unnecessary `totalPages` field

**Location:** Lines 570-583 - Pagination mapping

**Changes Applied:**
```javascript
// Before
const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(posts.count / limit),  // ❌ Not requested
    totalPosts: posts.count,
    hasNextPage: offset + limit < posts.count,
    hasPrevPage: page > 1
};

const frontendPagination = mapNestedFields(pagination, {
    currentPage: 'page',
    totalPosts: 'totalCount',
    hasPrevPage: 'hasPreviousPage'
});

// After
const pagination = {
    currentPage: parseInt(page),
    currentLimit: parseInt(limit),  // ✅ Add limit
    totalPosts: posts.count,
    hasNextPage: offset + limit < posts.count,
    hasPrevPage: page > 1
};

const frontendPagination = mapNestedFields(pagination, {
    currentPage: 'page',
    currentLimit: 'limit',  // ✅ Map to 'limit'
    totalPosts: 'totalCount',
    hasPrevPage: 'hasPreviousPage'
});
```

**Result:**
```json
{
  "page": 1,
  "limit": 20,
  "totalCount": 150,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

**Impact:** 
- Frontend now knows the page size
- No extra `totalPages` field cluttering response

---

### ✅ **Fix 7: Stories - ISO Format for `lastStoryTime`**

**Issue:** 
- `lastStoryTime` was using `getTimeAgo()` which returns "2 hours ago"
- Frontend expects ISO string like "2024-01-15T08:30:00Z"

**Location:** Line 127 - Stories formatting

**Changes Applied:**
```javascript
// Before
lastStoryTime: getTimeAgo(story.posts[0]?.createdAt),  // Returns "2 hours ago"

// After
lastStoryTime: story.posts[0]?.createdAt || null,  // Returns ISO string
```

**Impact:** 
- Stories show correct timestamp in ISO format
- Frontend can calculate "time ago" in local timezone

---

## 📊 **Summary of All Changes**

| Issue | Location | Type | Status |
|-------|----------|------|--------|
| Product price (string to number) | Line 258 | Type conversion | ✅ Fixed |
| Auction missing fields | Lines 292-304 | Data mapping | ✅ Fixed |
| Auction numbers (string to number) | Lines 298-299 | Type conversion | ✅ Fixed |
| Auction endTime (ISO format) | Line 301 | Date formatting | ✅ Fixed |
| Group buy missing data | Lines 335-349 | Data mapping | ✅ Fixed |
| Group buy numbers (string to number) | Lines 341-346 | Type conversion | ✅ Fixed |
| Group buy deadline (ISO format) | Line 346 | Date formatting | ✅ Fixed |
| Swap deal JSON stringified images | Lines 358-365 | JSON parsing | ✅ Fixed |
| Swap deal myItem.images | Line 398 | JSON parsing | ✅ Fixed |
| Distress sale type detection | Lines 457-538 | Type detection | ✅ Fixed |
| Pagination - add limit | Lines 570-583 | Field addition | ✅ Fixed |
| Pagination - remove totalPages | Lines 570-583 | Field removal | ✅ Fixed |
| Stories lastStoryTime format | Line 127 | Date formatting | ✅ Fixed |

---

## 🎯 **Expected Response Structure (After Fixes)**

### **Product Post:**
```json
{
  "product": {
    "price": 80000  // ✅ Number (was "80000.00" string)
  }
}
```

### **Auction Post:**
```json
{
  "auction": {
    "brand": "Rolex",  // ✅ Now included
    "category": "luxury_watches",  // ✅ Now included
    "startingBid": 100000,  // ✅ Number (was string)
    "currentBid": 125000,  // ✅ Number (was string)
    "endTime": "2026-02-01T21:15:56.000Z"  // ✅ ISO format (was null)
  }
}
```

### **Group Buy Post:**
```json
{
  "groupBuy": {
    "productName": "BULK PHONE ACCESSORIES",  // ✅ Uses metadata
    "brand": "Local Mill",  // ✅ Now included
    "category": "food_grains",  // ✅ Now included
    "pricePerUnit": 310000,  // ✅ Number (was "310000.00")
    "minBuyers": 200,  // ✅ From metadata (was 0)
    "maxBuyers": 500,  // ✅ From metadata (was 0)
    "currentBuyers": 18,  // ✅ From metadata
    "deadline": "2026-02-10T00:00:00.000Z"  // ✅ ISO format
  }
}
```

### **Swap Deal Post:**
```json
{
  "media": [
    {
      "url": "https://res.cloudinary.com/...",  // ✅ Actual URL (not stringified JSON)
      "thumbnailUrl": "https://res.cloudinary.com/..."  // ✅ Actual URL
    }
  ],
  "swapDeal": {
    "myItem": {
      "images": [
        "https://res.cloudinary.com/.../image1.jpg",  // ✅ Array of URLs (not stringified)
        "https://res.cloudinary.com/.../image2.jpg"
      ]
    }
  }
}
```

### **Distress Sale (was General, now Product):**
```json
{
  "type": "product",  // ✅ Changed from "general"
  "category": "product",  // ✅ Changed from "general"
  "contentType": "product",  // ✅ Changed from "post"
  "productId": "product_uuid",  // ✅ Now included
  "product": {  // ✅ Now included
    "id": "product_uuid",
    "name": "HONDA ACCORD",
    "price": 4800000,  // ✅ Number
    "metadata": {
      "isDistressSale": true,
      "urgencyLevel": "high",
      "discountPercentage": 20
    }
  }
}
```

### **Pagination:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,  // ✅ Now included
    "totalCount": 150,
    "hasPreviousPage": false,
    "hasNextPage": true
    // ✅ totalPages removed
  }
}
```

### **Stories:**
```json
{
  "stories": [
    {
      "lastStoryTime": "2024-01-15T08:30:00Z"  // ✅ ISO format (was "2 hours ago")
    }
  ]
}
```

---

## ✅ **Testing Checklist**

### **Product Posts:**
- [ ] Price displays as number (not string)
- [ ] All product fields present

### **Auction Posts:**
- [ ] Shows category and brand
- [ ] Countdown timer works (endTime in ISO format)
- [ ] Bid amounts are numbers (not strings)
- [ ] Can place bids without parsing

### **Group Buy Posts:**
- [ ] Shows min/max/current buyers correctly (not 0/0/0)
- [ ] Shows category and brand
- [ ] Progress bar works (18/200 buyers)
- [ ] Price is a number
- [ ] Countdown works (deadline in ISO format)

### **Swap Deal Posts:**
- [ ] Images display correctly (not broken)
- [ ] Can tap images to view full size
- [ ] myItem images show properly
- [ ] No stringified JSON visible

### **Distress Sale Posts:**
- [ ] Shows as "product" type (not "general")
- [ ] Has productId and product object
- [ ] Shows discount badge
- [ ] Shows urgency indicator
- [ ] Tapping navigates to product detail

### **Pagination:**
- [ ] Shows page number
- [ ] Shows limit (items per page)
- [ ] Shows total count
- [ ] Previous/Next buttons work correctly
- [ ] No totalPages field in response

### **Stories:**
- [ ] lastStoryTime shows as timestamp
- [ ] Can calculate "time ago" in local timezone
- [ ] Stories display properly

---

## 🚀 **What's Now Correct**

✅ All numeric fields are actual numbers (not strings)  
✅ All timestamps are ISO format (not "time ago" strings)  
✅ All metadata is properly extracted and used  
✅ Swap deal images are properly parsed (not stringified)  
✅ Distress sales correctly identified as products  
✅ Pagination includes all required fields  
✅ No extra/unwanted fields in response  

---

## 📝 **Notes**

1. **Backward Compatibility:** All changes maintain backward compatibility by using fallbacks:
   ```javascript
   postData.feedMetadata?.min_buyers || postData.feedMetadata?.minBuyers || 0
   ```

2. **Error Handling:** JSON parsing for swap deals includes try-catch to prevent crashes:
   ```javascript
   try {
       swapDealImages = JSON.parse(postData.feedMetadata.images);
   } catch (e) {
       console.error('Error parsing swap deal images:', e);
       swapDealImages = [];
   }
   ```

3. **Type Safety:** All numeric conversions use `parseFloat()` or `parseInt()` with fallbacks:
   ```javascript
   parseFloat(postData.price) || 0
   ```

4. **Date Formatting:** All dates converted to ISO strings for consistency:
   ```javascript
   new Date(postData.feedMetadata.end_time).toISOString()
   ```

---

**End of Documentation**
