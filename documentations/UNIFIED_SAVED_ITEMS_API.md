# Unified Saved Items API Documentation

## Overview

The Ocean App now uses a **unified saved items system** where all item types (products, posts, auctions, swap deals, group buys, distress sales) use the same endpoints and database table.

### What Changed?

**Before (OLD - Deprecated):**
```
POST /api/products/:productId/save       ❌ REMOVED
POST /api/posts/:postId/save             ❌ REMOVED  
GET /api/saved-products                  ❌ REMOVED
GET /api/saved-posts                     ❌ REMOVED
DELETE /api/saved-products/:id           ❌ REMOVED
DELETE /api/saved-posts/:id              ❌ REMOVED
```

**After (NEW - Current):**
```
POST /api/items/:itemId/save             ✅ NEW - Works for ALL item types
GET /api/saved-items                     ✅ NEW - Returns ALL saved items
DELETE /api/saved-items/:savedItemId     ✅ NEW - Deletes ANY saved item
GET /api/items/:itemId/is-saved          ✅ NEW - Check if item is saved
```

---

## Database Structure

### New Unified Table: `saved_items`

```sql
CREATE TABLE saved_items (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  item_type ENUM('product', 'post', 'auction', 'swap_deal', 'group_buy', 'distress_sale') NOT NULL,
  item_id CHAR(36) NOT NULL,
  collection_name VARCHAR(50) DEFAULT 'Favorites',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY (user_id, item_type, item_id),  -- User can't save same item twice
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Key Features:**
- ✅ One table for all item types
- ✅ `item_type` identifies what kind of item
- ✅ `item_id` is the actual item's UUID
- ✅ UNIQUE constraint prevents duplicate saves
- ✅ Cascading delete when user is deleted

---

## API Endpoints

### 1. Save/Unsave an Item (Toggle)

**Endpoint:** `POST /api/items/:itemId/save`

**Authentication:** Required (Bearer token)

**Parameters:**
- `itemId` (path): UUID of the item to save

**Request Body:**
```json
{
  "itemType": "product",           // REQUIRED: 'product', 'post', 'auction', 'swap_deal', 'group_buy', 'distress_sale'
  "collectionName": "Favorites"    // OPTIONAL: Collection name (default: 'Favorites')
}
```

**Success Response (Save):**
```json
{
  "success": true,
  "message": "product saved successfully",
  "data": {
    "isSaved": true
  }
}
```

**Success Response (Unsave):**
```json
{
  "success": true,
  "message": "product unsaved successfully",
  "data": {
    "isSaved": false
  }
}
```

**Error Responses:**
```json
// 400 - Missing itemType
{
  "success": false,
  "message": "itemType is required in request body"
}

// 400 - Invalid itemType
{
  "success": false,
  "message": "Invalid itemType. Must be one of: product, post, auction, swap_deal, group_buy, distress_sale"
}

// 404 - Item not found
{
  "success": false,
  "message": "product not found"
}
```

**Example Usage:**
```dart
// Flutter/Dart
final response = await apiClient.post(
  '/api/items/${product.id}/save',
  data: {
    'itemType': 'product',
    'collectionName': 'Wishlist'
  }
);

// JavaScript
const response = await fetch(`/api/items/${product.id}/save`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    itemType: 'product',
    collectionName: 'Favorites'
  })
});
```

---

### 2. Get All Saved Items

**Endpoint:** `GET /api/saved-items`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `itemType` (string, optional): Filter by type ('product', 'post', 'auction', 'swap_deal', 'group_buy', 'distress_sale')
- `collectionName` (string, optional): Filter by collection name

**Success Response:**
```json
{
  "success": true,
  "message": "Saved items retrieved successfully",
  "data": {
    "savedItems": [
      {
        "savedItemId": "uuid-1",        // ID for deletion
        "itemId": "product-uuid",       // Actual product ID
        "itemType": "product",
        "collectionName": "Favorites",
        "savedAt": "2024-01-15T10:30:00Z",
        "timeAgo": "2 hours ago",
        
        // Product-specific fields
        "title": "iPhone 13 Pro",
        "price": 450000,
        "currency": "NGN",
        "images": ["url1", "url2"],
        "description": "Brand new...",
        "condition": "New",
        "category": "Electronics",
        "location": "Lagos, Nigeria",
        "seller": {
          "id": "seller-user-uuid",
          "name": "Tech Store",
          "avatar": "https://...",
          "verified": true
        }
      },
      {
        "savedItemId": "uuid-2",
        "itemId": "auction-uuid",
        "itemType": "auction",
        "collectionName": "Favorites",
        "savedAt": "2024-01-14T18:00:00Z",
        "timeAgo": "1 day ago",
        
        // Auction-specific fields
        "title": "Rare Watch",
        "startingPrice": 100000,
        "currentPrice": 150000,
        "images": ["url1"],
        "description": "Limited edition...",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-20T10:00:00Z",
        "seller": {
          "id": "seller-uuid",
          "name": "Watch Collector",
          "avatar": "https://...",
          "verified": false
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 42,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Example Usage:**
```dart
// Get all saved items
final items = await apiClient.get('/api/saved-items?page=1&limit=20');

// Get only saved products
final products = await apiClient.get('/api/saved-items?itemType=product');

// Get items in specific collection
final wishlist = await apiClient.get('/api/saved-items?collectionName=Wishlist');
```

---

### 3. Delete Saved Item

**Endpoint:** `DELETE /api/saved-items/:savedItemId`

**Authentication:** Required (Bearer token)

**Parameters:**
- `savedItemId` (path): UUID of the saved record (NOT the item ID, but the savedItemId from GET response)

**Success Response:**
```json
{
  "success": true,
  "message": "Saved item removed successfully",
  "data": {
    "isSaved": false
  }
}
```

**Error Responses:**
```json
// 404 - Not found
{
  "success": false,
  "message": "Saved item not found"
}
```

**Example Usage:**
```dart
// From saved items list
final savedItemId = item['savedItemId'];  // Use savedItemId, NOT itemId
await apiClient.delete('/api/saved-items/$savedItemId');
```

---

### 4. Check If Item Is Saved

**Endpoint:** `GET /api/items/:itemId/is-saved`

**Authentication:** Required (Bearer token)

**Parameters:**
- `itemId` (path): UUID of the item to check

**Query Parameters:**
- `itemType` (string, required): Type of item ('product', 'post', etc.)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "isSaved": true,
    "savedItemId": "saved-record-uuid"
  }
}
```

**Example Usage:**
```dart
final result = await apiClient.get('/api/items/${product.id}/is-saved?itemType=product');
bool isSaved = result['data']['isSaved'];
```

---

## Frontend Implementation Guide

### Complete Example (Flutter/Dart)

```dart
class SavedItemsService {
  final ApiClient _apiClient;
  
  SavedItemsService(this._apiClient);
  
  /// Toggle save/unsave an item
  Future<bool> toggleSave(String itemId, String itemType, {String? collectionName}) async {
    try {
      final response = await _apiClient.post(
        '/api/items/$itemId/save',
        data: {
          'itemType': itemType,
          if (collectionName != null) 'collectionName': collectionName,
        },
      );
      return response['data']['isSaved'] as bool;
    } catch (e) {
      throw Exception('Failed to toggle save: $e');
    }
  }
  
  /// Get all saved items
  Future<List<Map<String, dynamic>>> getAllSaved({
    int page = 1,
    int limit = 20,
    String? itemType,
    String? collectionName,
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      if (itemType != null) 'itemType': itemType,
      if (collectionName != null) 'collectionName': collectionName,
    };
    
    final response = await _apiClient.get(
      '/api/saved-items',
      queryParameters: queryParams,
    );
    
    return List<Map<String, dynamic>>.from(
      response['data']['savedItems'] ?? []
    );
  }
  
  /// Delete a saved item
  Future<void> deleteSaved(String savedItemId) async {
    await _apiClient.delete('/api/saved-items/$savedItemId');
  }
  
  /// Check if item is saved
  Future<bool> isSaved(String itemId, String itemType) async {
    final response = await _apiClient.get(
      '/api/items/$itemId/is-saved',
      queryParameters: {'itemType': itemType},
    );
    return response['data']['isSaved'] as bool;
  }
}
```

### Usage in UI

```dart
class ProductDetailPage extends StatefulWidget {
  final String productId;
  
  @override
  _ProductDetailPageState createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  bool _isSaved = false;
  
  @override
  void initState() {
    super.initState();
    _checkIfSaved();
  }
  
  Future<void> _checkIfSaved() async {
    final saved = await savedItemsService.isSaved(
      widget.productId,
      'product'
    );
    setState(() => _isSaved = saved);
  }
  
  Future<void> _toggleSave() async {
    final newSavedState = await savedItemsService.toggleSave(
      widget.productId,
      'product',
      collectionName: 'Favorites'
    );
    setState(() => _isSaved = newSavedState);
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: Icon(
              _isSaved ? Icons.bookmark : Icons.bookmark_border
            ),
            onPressed: _toggleSave,
          ),
        ],
      ),
      // ... rest of UI
    );
  }
}
```

---

## Migration Guide

### For Existing Applications

If you have existing code using the old endpoints, here's how to migrate:

#### Old Code (Products)
```dart
// ❌ OLD - Don't use
await productService.toggleSaveProduct(productId);
await productService.getSavedProducts();
await productService.deleteSavedProduct(savedItemId);
```

#### New Code (Products)
```dart
// ✅ NEW - Use this
await savedItemsService.toggleSave(productId, 'product');
await savedItemsService.getAllSaved(itemType: 'product');
await savedItemsService.deleteSaved(savedItemId);
```

#### Old Code (Posts)
```dart
// ❌ OLD - Don't use
await postsService.toggleSavePost(postId);
await postsService.getSavedPosts();
await postsService.deleteSavedPost(savedItemId);
```

#### New Code (Posts)
```dart
// ✅ NEW - Use this
await savedItemsService.toggleSave(postId, 'post');
await savedItemsService.getAllSaved(itemType: 'post');
await savedItemsService.deleteSaved(savedItemId);
```

---

## Benefits of Unified System

### 1. Simplicity
- **Before**: 6+ different endpoints for products and posts
- **After**: 4 universal endpoints for all item types

### 2. Consistency
- Same API structure for all item types
- Easier to learn and remember
- Less code duplication

### 3. Maintainability
- Single controller to maintain
- Single model to update
- Single route file

### 4. Flexibility
- Easy to add new item types
- Consistent behavior across all types
- Simpler testing

---

## Support

For questions or issues:
- Backend: `ocean_server/src/controllers/savedItemsController.js`
- Routes: `ocean_server/src/routes/savedItemsRoutes.js`
- Model: `ocean_server/models/SavedItem.js`

**Last Updated:** 2024-01-20
