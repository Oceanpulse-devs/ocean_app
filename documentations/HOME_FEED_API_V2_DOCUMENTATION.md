# Home Feed API v2 - Standardized Response Structure

**Last Updated:** January 20, 2025  
**Status:** ✅ **ACTIVE**  
**Cache Version:** `homeFeed:v2`

---

## 📋 **Overview**

The Home Feed API has been **completely standardized** to provide a consistent, predictable structure across all post types. This eliminates frontend parsing issues and ensures smooth UI rendering without "shaky screens" or layout shifts.

### **Key Improvements**

✅ **Consistent field names** across all post types (camelCase)  
✅ **Standardized user objects** with identical structure  
✅ **Unified media array format** (id, type, url, thumbnailUrl, order)  
✅ **Count fields renamed** (likes → likesCount, comments → commentsCount)  
✅ **Type-specific data nested** in dedicated objects (product, auction, etc.)  
✅ **Always present base fields** (no undefined/null surprises)  
✅ **Cache versioning** for smooth deployments

---

## 🔗 **Endpoint**

### **Get Home Feed**

```
GET /api/home-feed
```

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (integer, default: 1) - Page number for pagination
- `limit` (integer, default: 20, max: 20) - Items per page

**Headers:**
```
Authorization: Bearer <your_access_token>
```

---

## 📦 **Response Structure**

### **Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Home feed retrieved successfully",
  "data": {
    "posts": [
      {
        // Post objects - see detailed structures below
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 150,
      "hasPreviousPage": false,
      "hasNextPage": true
    }
  }
}
```

---

## 📝 **Post Type Structures**

All posts share these **common base fields**:

```json
{
  "id": "post_uuid",
  "type": "product|auction|group_buy|swap_deal|product_demand|general",
  "category": "product|auction|group_buy|swap_deal|product_demand|general",
  "contentType": "product|auction|group_buy|swap_deal|product_demand|post",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  
  "user": { /* standardized user object */ },
  "caption": "Post caption text or empty string",
  "media": [ /* standardized media array */ ],
  
  "likesCount": 45,
  "commentsCount": 12,
  "sharesCount": 8,
  "savesCount": 23,
  "timeAgo": "2 hours ago",
  "isLiked": true,
  "isSaved": false
}
```

---

### **1. Product Post**

```json
{
  "id": "post_uuid_product",
  "type": "product",
  "category": "product",
  "contentType": "product",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "Business Name or User Name",
    "businessName": "Tech Store",
    "avatar": "https://...",
    "verified": true,
    "role": "seller",
    "location": "Lagos, Nigeria"
  },
  
  "caption": "",
  
  "media": [
    {
      "id": "media_1",
      "type": "image",
      "url": "https://.../iphone13-1.jpg",
      "thumbnailUrl": "https://.../iphone13-1.jpg",
      "order": 0
    },
    {
      "id": "media_2",
      "type": "image",
      "url": "https://.../iphone13-2.jpg",
      "thumbnailUrl": "https://.../iphone13-2.jpg",
      "order": 1
    }
  ],
  
  "likesCount": 45,
  "commentsCount": 12,
  "sharesCount": 8,
  "savesCount": 23,
  "timeAgo": "2 hours ago",
  "isLiked": true,
  "isSaved": false,
  
  "productId": "product_uuid",
  
  "product": {
    "id": "product_uuid",
    "name": "iPhone 13 Pro",
    "brand": "Apple",
    "description": "Brand new iPhone 13 Pro with 256GB storage...",
    "category": "electronics_mobile_phones",
    "price": 450000,
    "currencyCode": "NGN",
    "images": [
      "https://.../iphone13-1.jpg",
      "https://.../iphone13-2.jpg"
    ],
    "metadata": {}
  }
}
```

---

### **2. Auction Post**

```json
{
  "id": "post_uuid_auction",
  "type": "auction",
  "category": "auction",
  "contentType": "auction",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "Seller Name",
    "businessName": "Luxury Watches NG",
    "avatar": "https://...",
    "verified": true,
    "role": "seller",
    "location": "Abuja, Nigeria"
  },
  
  "caption": "",
  
  "media": [
    {
      "id": "auction_media_1",
      "type": "image",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 0
    }
  ],
  
  "likesCount": 30,
  "commentsCount": 5,
  "sharesCount": 2,
  "savesCount": 15,
  "timeAgo": "5 hours ago",
  "isLiked": false,
  "isSaved": true,
  
  "auctionId": "auction_id",
  
  "auction": {
    "id": "auction_id",
    "productName": "Rare Watch",
    "brand": "Rolex",
    "category": "luxury_watches",
    "description": "Limited edition watch with original papers...",
    "startingBid": 100000,
    "currentBid": 125000,
    "currencyCode": "NGN",
    "endTime": "2024-01-20T18:00:00Z",
    "images": [
      "https://.../watch-1.jpg",
      "https://.../watch-2.jpg"
    ],
    "metadata": {}
  }
}
```

---

### **3. Group Buy / Bulk Purchase Post**

```json
{
  "id": "post_uuid_group_buy",
  "type": "group_buy",
  "category": "group_buy",
  "contentType": "group_buy",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "John Doe",
    "businessName": "Agro Hub",
    "avatar": "https://...",
    "verified": false,
    "role": "seller",
    "location": "Port Harcourt, Nigeria"
  },
  
  "caption": "",
  
  "media": [
    {
      "id": "groupbuy_media_1",
      "type": "image",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 0
    }
  ],
  
  "likesCount": 20,
  "commentsCount": 8,
  "sharesCount": 5,
  "savesCount": 10,
  "timeAgo": "1 day ago",
  "isLiked": false,
  "isSaved": false,
  
  "bulkPurchaseId": "group_buy_id",
  
  "groupBuy": {
    "id": "group_buy_id",
    "productName": "Bulk Rice Purchase",
    "brand": "Local Mill",
    "category": "food_grains",
    "description": "50kg bags of premium rice...",
    "pricePerUnit": 25000,
    "currencyCode": "NGN",
    "minBuyers": 10,
    "maxBuyers": 50,
    "currentBuyers": 18,
    "deadline": "2024-02-01T00:00:00Z",
    "images": [
      "https://.../rice-1.jpg"
    ],
    "metadata": {}
  }
}
```

---

### **4. Swap Deal Post**

```json
{
  "id": "post_uuid_swap",
  "type": "swap_deal",
  "category": "swap_deal",
  "contentType": "swap_deal",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "Business Name",
    "businessName": "Tech Store",
    "avatar": "https://...",
    "verified": true,
    "role": "seller",
    "location": "Lagos, Nigeria"
  },
  
  "caption": "",
  
  "media": [
    {
      "id": "swap_media_1",
      "type": "image",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 0
    }
  ],
  
  "likesCount": 18,
  "commentsCount": 4,
  "sharesCount": 2,
  "savesCount": 7,
  "timeAgo": "3 hours ago",
  "isLiked": false,
  "isSaved": false,
  
  "swapDealId": "swap_deal_uuid",
  
  "swapDeal": {
    "id": "swap_deal_uuid",
    "title": "Swap Deal: iPhone 12 for Samsung S21",
    "myItem": {
      "name": "iPhone 12",
      "brand": "Apple",
      "category": "electronics_mobile_phones",
      "condition": "Good",
      "images": [
        "https://.../iphone12-1.jpg",
        "https://.../iphone12-2.jpg"
      ]
    },
    "wantedItem": {
      "name": "Samsung S21",
      "category": "electronics_mobile_phones"
    },
    "preferredSwapCategory": "Electronics",
    "status": "active"
  }
}
```

---

### **5. Product Demand Post (Buyer Need)**

```json
{
  "id": "post_uuid_demand",
  "type": "product_demand",
  "category": "product_demand",
  "contentType": "product_demand",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "Jane Smith",
    "businessName": null,
    "avatar": "https://...",
    "verified": false,
    "role": "buyer",
    "location": "Ibadan, Nigeria"
  },
  
  "caption": "Product Demand: Looking for MacBook Pro",
  
  "media": [
    {
      "id": "demand_media_1",
      "type": "image",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 0
    }
  ],
  
  "likesCount": 10,
  "commentsCount": 2,
  "sharesCount": 1,
  "savesCount": 5,
  "timeAgo": "6 hours ago",
  "isLiked": false,
  "isSaved": false,
  
  "demandPostId": "buyer_need_id",
  
  "buyerNeed": {
    "id": "buyer_need_id",
    "title": "Looking for MacBook Pro",
    "description": "Need 2020 or later, 16GB RAM...",
    "category": "electronics_computers",
    "reachLimit": 5,
    "currentReach": 2,
    "reachExceeded": false,
    "expiresAt": "2024-02-15T00:00:00Z",
    "status": "active",
    "isFeatured": false
  }
}
```

---

### **6. General Post**

```json
{
  "id": "post_uuid_general",
  "type": "general",
  "category": "general",
  "contentType": "post",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  
  "user": {
    "id": "user_uuid",
    "name": "User Name",
    "businessName": null,
    "avatar": "https://...",
    "verified": false,
    "role": "user",
    "location": "Lagos, Nigeria"
  },
  
  "caption": "Just got this amazing product!",
  
  "media": [
    {
      "id": "general_media_1",
      "type": "image",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 0
    }
  ],
  
  "likesCount": 25,
  "commentsCount": 6,
  "sharesCount": 3,
  "savesCount": 12,
  "timeAgo": "1 hour ago",
  "isLiked": true,
  "isSaved": true
}
```

---

## 🔑 **Standardized Objects**

### **User Object** (Always Present)

Every post includes a standardized `user` object:

```json
{
  "id": "user_uuid",
  "name": "Display Name (businessName or fullName)",
  "businessName": "Business Name or null",
  "avatar": "https://... or 👤",
  "verified": true,
  "role": "seller|buyer|user|admin",
  "location": "City, Country or null"
}
```

**Field Sources:**
- `name`: Uses `businessName` if available, else `fullName`
- `businessName`: Direct from user table
- `avatar`: `profilePicture` or default emoji
- `verified`: Based on `accountStatus`
- `role`: From `accountType`
- `location`: From user profile

---

### **Media Array** (Always Present)

Every post includes a `media` array (empty array `[]` if no media):

```json
[
  {
    "id": "unique_media_id",
    "type": "image|video",
    "url": "https://full_resolution_url",
    "thumbnailUrl": "https://thumbnail_url",
    "order": 0
  }
]
```

**Field Sources:**
- `id`: Generated as `{postId}_media_{index}` or from media table
- `type`: Detected from file extension or media type field
- `url`: Full resolution media URL
- `thumbnailUrl`: Thumbnail URL (same as `url` if no thumbnail)
- `order`: Media position in sequence (0-indexed)

---

## 📊 **Count Fields**

All count fields now use the **"Count" suffix** for consistency:

| Old Field | New Field | Type |
|-----------|-----------|------|
| `likes` | `likesCount` | integer |
| `comments` | `commentsCount` | integer |
| `shares` | `sharesCount` | integer |
| `saves` | `savesCount` | integer |

**Note:** All count fields default to `0` if not available.

---

## 🎯 **Type-Specific ID Fields**

Each post type includes its source ID at the **top level** for easy routing:

| Post Type | ID Field | Example Value |
|-----------|----------|---------------|
| Product | `productId` | `"uuid_of_product"` |
| Auction | `auctionId` | `"uuid_of_auction"` |
| Group Buy | `bulkPurchaseId` | `"uuid_of_group_buy"` |
| Swap Deal | `swapDealId` | `"uuid_of_swap_deal"` |
| Product Demand | `demandPostId` | `"uuid_of_buyer_need"` |
| General | N/A | N/A |

**Usage Example:**

```dart
// Flutter - Navigate to product detail
if (post.type == 'product') {
  Navigator.push(
    context,
    ProductDetailPage(productId: post.productId)
  );
}
```

---

## 🏗️ **Type-Specific Data Nesting**

Type-specific data is now **nested in dedicated objects** for clarity:

| Post Type | Nested Object | Contains |
|-----------|---------------|----------|
| Product | `product` | Product details (name, price, brand, etc.) |
| Auction | `auction` | Auction details (bids, end time, etc.) |
| Group Buy | `groupBuy` | Group buy details (min/max buyers, deadline) |
| Swap Deal | `swapDeal` | Swap details (my item, wanted item) |
| Product Demand | `buyerNeed` | Demand details (reach limit, status) |
| General | N/A | N/A |

**Example Access:**

```dart
// Old way (inconsistent)
final price = post['price'];  // ❌ May not exist

// New way (consistent)
final price = post['product']['price'];  // ✅ Always exists for product posts
```

---

## ⚡ **Caching Strategy**

### **Cache Key Format**

```
homeFeed:v2:{page}:{limit}:{userId|guest}
```

**Example:**
```
homeFeed:v2:1:20:283fb777-77ec-41ba-b3a9-efbf7efce411
```

### **Cache Versioning**

The cache key includes `:v2:` to invalidate old cache entries when structure changes.

**TTL:** 5 minutes (300 seconds)

### **Cache Invalidation**

Cache is automatically invalidated on:
- New post creation
- Post updates
- Post deletion
- User likes/saves (for that specific user's cache)

---

## 🔧 **Frontend Integration Guide**

### **1. Parsing Posts**

```dart
// Parse a post from the feed
final post = feedData['posts'][index];

// Access common fields (always present)
final postId = post['id'];
final type = post['type'];
final caption = post['caption'];
final likesCount = post['likesCount'];
final isLiked = post['isLiked'];

// Access user (always present)
final userName = post['user']['name'];
final userAvatar = post['user']['avatar'];

// Access media (always present, may be empty array)
final media = post['media'] as List;
if (media.isNotEmpty) {
  final firstImage = media[0]['url'];
}
```

### **2. Handling Type-Specific Data**

```dart
switch (post['type']) {
  case 'product':
    final productId = post['productId'];
    final productName = post['product']['name'];
    final price = post['product']['price'];
    break;
    
  case 'auction':
    final auctionId = post['auctionId'];
    final currentBid = post['auction']['currentBid'];
    final endTime = post['auction']['endTime'];
    break;
    
  case 'group_buy':
    final groupBuyId = post['bulkPurchaseId'];
    final currentBuyers = post['groupBuy']['currentBuyers'];
    final minBuyers = post['groupBuy']['minBuyers'];
    break;
    
  case 'swap_deal':
    final swapId = post['swapDealId'];
    final myItem = post['swapDeal']['myItem'];
    final wantedItem = post['swapDeal']['wantedItem'];
    break;
    
  case 'product_demand':
    final demandId = post['demandPostId'];
    final reachLimit = post['buyerNeed']['reachLimit'];
    final currentReach = post['buyerNeed']['currentReach'];
    break;
    
  case 'general':
    // No type-specific data
    break;
}
```

### **3. Rendering Media**

```dart
Widget buildMediaCarousel(List media) {
  if (media.isEmpty) {
    return SizedBox.shrink();  // No media
  }
  
  return CarouselSlider(
    items: media.map((item) {
      if (item['type'] == 'video') {
        return VideoPlayer(url: item['url']);
      } else {
        return CachedNetworkImage(
          imageUrl: item['url'],
          placeholder: (context, url) => Image.network(item['thumbnailUrl']),
        );
      }
    }).toList(),
  );
}
```

### **4. No More Defensive Checks Needed**

```dart
// Old way (defensive programming)
final likes = post['likes'] ?? post['likesCount'] ?? 0;  // ❌ Messy
final userName = post['user']?['name'] ?? post['user']?['fullName'] ?? 'Unknown';  // ❌ Confusing

// New way (trust the structure)
final likes = post['likesCount'];  // ✅ Always exists
final userName = post['user']['name'];  // ✅ Always exists
```

---

## 🚨 **Error Handling**

### **Error Response**

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

### **Common Errors**

| Status Code | Message | Cause |
|-------------|---------|-------|
| 401 | Unauthorized | Missing or invalid token |
| 500 | Error retrieving home feed | Server error |

---

## ✅ **Testing Checklist**

### **Backend**
- [x] All post types return standardized structure
- [x] User object is consistent across all posts
- [x] Media array is always present (empty or populated)
- [x] Count fields use "Count" suffix
- [x] Type-specific IDs at top level
- [x] Type-specific data properly nested
- [x] Cache versioning works (`homeFeed:v2`)
- [x] `isLiked` and `isSaved` correctly set for authenticated users

### **Frontend**
- [ ] Feed loads without "shaky screen"
- [ ] All post types render correctly
- [ ] User avatars display properly
- [ ] Media carousels work smoothly
- [ ] Like/Save buttons reflect correct state
- [ ] Tap navigation uses correct IDs (productId, auctionId, etc.)
- [ ] Pagination works smoothly
- [ ] Empty states handled gracefully

---

## 🎉 **Migration Notes**

### **Breaking Changes**

1. **Count field names changed:**
   - `likes` → `likesCount`
   - `comments` → `commentsCount`
   - `shares` → `sharesCount`
   - `saves` → `savesCount`

2. **Media structure standardized:**
   - Old: Mixed formats (string URLs, objects with varying fields)
   - New: Consistent objects with `id`, `type`, `url`, `thumbnailUrl`, `order`

3. **Type-specific data nested:**
   - Old: Product data at post root level
   - New: Product data in `post.product` object

4. **User object standardized:**
   - Old: Varying fields across post types
   - New: Consistent `user` object with `id`, `name`, `businessName`, `avatar`, `verified`, `role`, `location`

### **Backwards Compatibility**

⚠️ **Frontend MUST update** to use new field names and structure.

The old structure is **no longer supported** as of this version (v2).

### **Deployment Steps**

1. ✅ Backend deployed with new structure (January 20, 2025)
2. ⏳ Frontend update required to match new structure
3. ⏳ Test in staging environment
4. ⏳ Deploy frontend update
5. ⏳ Monitor for issues

---

## 📞 **Support**

If you encounter issues with the new feed structure:

1. Check this documentation for expected structure
2. Verify your parsing logic matches the examples
3. Check for `null` handling on nested objects
4. Ensure you're using the correct field names (e.g., `likesCount` not `likes`)

---

## 📝 **Changelog**

### **Version 2.0 (January 20, 2025)**
- ✅ Standardized all post type structures
- ✅ Added consistent `user` object across all posts
- ✅ Standardized `media` array format
- ✅ Renamed count fields (likes → likesCount, etc.)
- ✅ Added type-specific IDs at top level
- ✅ Nested type-specific data in dedicated objects
- ✅ Implemented cache versioning (`homeFeed:v2`)
- ✅ Added `caption` field to all posts
- ✅ Fixed "shaky screen" UI issues

### **Version 1.0 (Legacy)**
- ❌ Inconsistent field names and structures
- ❌ Mixed media formats
- ❌ Varying user object structures
- ❌ Count fields without "Count" suffix

---

**End of Documentation**
