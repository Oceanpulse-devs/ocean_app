# Saved Items API - Response Structure & Usage Guide

## Endpoint
**GET** `/api/saved-items`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category

---

## Response Structure

```json
{
  "message": "All saved items retrieved successfully",
  "data": {
    "savedItems": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Saved Item Object Structure

Each item in the `savedItems` array contains the following fields:

### Universal Fields (All Item Types)

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `id` | UUID | **The actual item ID** (product/auction/post/etc.) | ✅ **Use for NAVIGATION** (opening item details) |
| `savedItemId` | UUID | **The saved record ID** (SavedProduct/SavedPost table) | ✅ **Use for DELETION** (removing from saved) |
| `type` | String | Item type: `product`, `distress_sale`, `auction`, `swap_deal`, `group_buy`, `post` | Type indicator |
| `name` | String | Item title/name | Display |
| `images` | Array | Array of image URLs | Display |
| `description` | String | Item description | Display |
| `timeAgo` | String | Time since saved (e.g., "2 hours ago") | Display |
| `isSaved` | Boolean | Always `true` (for saved items) | UI state |
| `savedDate` | String | Date saved (YYYY-MM-DD) | Display |
| `sourceId` | UUID | **DEPRECATED** - Same as `savedItemId` | ⚠️ Use `savedItemId` instead |

### Type-Specific Fields

#### Products (`type: "product"`)
```json
{
  "id": "product-uuid",              // ✅ Use for navigation: /products/:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-products/:savedItemId
  "productId": "product-uuid",       // Same as id (redundant, for clarity)
  "type": "product",
  "name": "iPhone 13 Pro",
  "price": "NGN 450000",
  "originalPrice": null,
  "condition": "New",
  "category": "Electronics",
  "location": "Lagos, Nigeria",
  "seller": {
    "id": "seller-user-uuid",
    "name": "Tech Store",
    "avatar": "https://...",
    "verified": true,
    "rating": 4.5
  },
  "images": ["url1", "url2"],
  "description": "Brand new...",
  "likes": 45
}
```

#### Distress Sales (`type: "distress_sale"`)
```json
{
  "id": "product-uuid",              // ✅ Use for navigation: /products/:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-products/:savedItemId
  "productId": "product-uuid",
  "type": "distress_sale",
  // ... same structure as product
}
```

#### Auctions (`type: "auction"`)
```json
{
  "id": "auction-uuid",              // ✅ Use for navigation: /auctions/:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-posts/:savedItemId
  "auctionId": "auction-uuid",       // Same as id (redundant, for clarity)
  "postId": "post-uuid",             // Original post ID
  "type": "auction",
  "name": "Rare Watch",
  "price": "NGN 100000",             // Starting/current price
  "currentBid": "NGN 150000",        // Current bid amount
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-20T10:00:00Z",
  // ... other fields
}
```

#### Swap Deals (`type: "swap_deal"`)
```json
{
  "id": "swap-deal-uuid",            // ✅ Use for navigation: /swap-deals/:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-posts/:savedItemId
  "swapDealId": "swap-deal-uuid",    // Same as id (redundant, for clarity)
  "postId": "post-uuid",
  "type": "swap_deal",
  "name": "iPhone 12 for Samsung S21",
  "price": null,                     // Swap deals don't have prices
  // ... other fields
}
```

#### Group Buys (`type: "group_buy"`)
```json
{
  "id": "group-buy-uuid",            // ✅ Use for navigation: /bulk-purchase-detail-:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-posts/:savedItemId
  "groupBuyId": "group-buy-uuid",    // Same as id (redundant, for clarity)
  "postId": "post-uuid",
  "type": "group_buy",
  "name": "Bulk Rice Purchase",
  "price": "NGN 25000",
  // ... other fields
}
```

#### Posts (`type: "post"`)
```json
{
  "id": "post-uuid",                 // ✅ Use for navigation: /posts/:id
  "savedItemId": "saved-uuid",       // ✅ Use for deletion: DELETE /api/saved-posts/:savedItemId
  "postId": "post-uuid",             // Same as id (redundant, for clarity)
  "type": "post",
  "name": "Just got this amazing...",
  "price": null,
  // ... other fields
}
```

---

## Implementation Guide

### ✅ Correct Usage

#### 1. **Navigation (Opening Item Details)**

Use the `id` field to navigate to item details:

```dart
void navigateToItem(Map<String, dynamic> item) {
  final type = item['type'];
  final id = item['id'];  // ✅ Use 'id' for navigation
  
  switch (type) {
    case 'product':
    case 'distress_sale':
      context.push('/products/$id');
      break;
    case 'auction':
      context.push('/auctions/$id');
      break;
    case 'swap_deal':
      context.push('/swap-deals/$id');
      break;
    case 'group_buy':
      context.push('/bulk-purchase-detail-$id');
      break;
    case 'post':
      context.push('/posts/$id');
      break;
  }
}
```

#### 2. **Deletion (Removing from Saved)**

Use the `savedItemId` field to delete saved items:

```dart
Future<void> removeSavedItem(Map<String, dynamic> item) async {
  final type = item['type'];
  final savedItemId = item['savedItemId'];  // ✅ Use 'savedItemId' for deletion
  
  if (type == 'product' || type == 'distress_sale') {
    // DELETE /api/saved-products/:savedItemId
    await productService.deleteSavedProduct(savedItemId);
  } else if (type == 'auction' || type == 'swap_deal' || 
             type == 'group_buy' || type == 'post') {
    // DELETE /api/saved-posts/:savedItemId
    await postsService.deleteSavedPost(savedItemId);
  }
}
```

---

## Delete Endpoints

### Delete Saved Product
**DELETE** `/api/saved-products/:savedItemId`

**Parameters:**
- `savedItemId` (path): The `savedItemId` from the saved item object

**Response:**
```json
{
  "success": true,
  "message": "Saved product removed successfully",
  "data": {
    "isSaved": false
  }
}
```

### Delete Saved Post
**DELETE** `/api/saved-posts/:savedItemId`

**Parameters:**
- `savedItemId` (path): The `savedItemId` from the saved item object

**Response:**
```json
{
  "success": true,
  "message": "Saved post removed successfully",
  "data": {
    "isSaved": false
  }
}
```

---

## Migration Notes

### What Changed?

**Before:**
- `id` was the product/auction/post ID (used for both navigation and deletion)
- `sourceId` was the saved record ID
- ❌ Deletion was broken because frontend sent wrong ID

**After:**
- `id` is the product/auction/post ID ✅ (navigation)
- `savedItemId` is the saved record ID ✅ (deletion)
- `sourceId` is deprecated (same as `savedItemId`, kept for backwards compatibility)

### Update Required

**Change this:**
```dart
// ❌ OLD - Using sourceId for deletion
final savedItemId = item['sourceId'];
await deleteSavedProduct(savedItemId);
```

**To this:**
```dart
// ✅ NEW - Using savedItemId for deletion
final savedItemId = item['savedItemId'];
await deleteSavedProduct(savedItemId);
```

**Keep this (no change needed):**
```dart
// ✅ CORRECT - Using id for navigation
final itemId = item['id'];
context.push('/products/$itemId');
```

---

## Error Handling

### Common Errors

#### 404 Not Found
```json
{
  "success": false,
  "message": "Saved post not found"
}
```

**Cause:** The saved item has already been deleted or doesn't exist.

**Handling:** Treat as success (item is already removed) and update UI accordingly.

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to delete this saved item"
}
```

**Cause:** The saved item belongs to a different user.

**Handling:** Show error to user and reload saved items list.

---

## Testing Checklist

- [ ] Can navigate to product details by tapping saved product
- [ ] Can navigate to auction details by tapping saved auction
- [ ] Can navigate to swap deal details by tapping saved swap deal
- [ ] Can navigate to group buy details by tapping saved group buy
- [ ] Can navigate to post details by tapping saved post
- [ ] Can delete saved products (receives success response)
- [ ] Can delete saved auctions (receives success response)
- [ ] Can delete saved swap deals (receives success response)
- [ ] Can delete saved group buys (receives success response)
- [ ] Can delete saved posts (receives success response)
- [ ] UI updates correctly after deletion
- [ ] Handles 404 errors gracefully (treats as already deleted)
- [ ] Handles 403 errors gracefully (shows permission error)

---

## Questions?

If you encounter any issues or have questions about the implementation, please contact the backend team.

**Last Updated:** 2024-01-19
