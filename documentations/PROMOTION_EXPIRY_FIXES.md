# Promotion System Expiry/Deletion Fixes

## Problem Summary
The promotion system endpoints (trending, spotlight, top placement) were showing deleted or expired items because they only filtered by `status: 'active'` but didn't check time-based expiry conditions like `distressExpiryDate`, `endTime`, or `deadline`.

## Root Cause
The core issue was in `rankingService.js` which provides trending, recommended, and similar items for all item types. It filtered by status but ignored time-based expiration fields.

## Fixes Applied

### 1. RankingService (Core Fix)
**File:** `ocean_server\src\services\rankingService.js`

Updated three methods to add time-based filters:
- `getTrendingItems()`
- `getRecommendedItems()`
- `getSimilarItems()`

**Changes:**
```javascript
// Added for distress_sale items
if (itemType === 'distress_sale') {
  whereClause.distressExpiryDate = {
    [Op.or]: [
      { [Op.gte]: new Date() },  // Not expired yet
      { [Op.is]: null }           // Or no expiry date set
    ]
  };
}

// Added for auction items
if (itemType === 'auction') {
  whereClause.endTime = {
    [Op.gt]: new Date()  // Only show auctions that haven't ended
  };
}

// Added for group_buy items
if (itemType === 'group_buy') {
  whereClause.deadline = {
    [Op.gt]: new Date()  // Only show group buys before deadline
  };
}
```

**Impact:** Fixes all trending, recommended, and similar item endpoints for:
- Distress sales
- Auctions
- Group buys

---

### 2. Distress Sale Controller
**File:** `ocean_server\src\controllers\distressSaleController.js`

Updated three methods:
- `getAllDistressSales()` - Line 310
- `getSpotlightDistressSales()` - Line 1260
- `getTopPlacementDistressSales()` - Line 1356

**Changes:**
Added distress expiry date filter to all where clauses:
```javascript
distressExpiryDate: {
  [Op.or]: [
    { [Op.gte]: new Date() },
    { [Op.is]: null }
  ]
}
```

**Endpoints Fixed:**
- `GET /api/distress-sales`
- `GET /api/distress-sales/trending` (via RankingService)
- `GET /api/distress-sales/spotlight`
- `GET /api/distress-sales/top-placement`
- `GET /api/distress-sales/similar/:id` (via RankingService)
- `GET /api/distress-sales/recommended` (via RankingService)

---

### 3. Auction Controller
**File:** `ocean_server\src\controllers\auctionController.js`

Updated two methods:
- `getSpotlightAuctions()` - Line 3274
- `getTopPlacementAuctions()` - Line 3367

**Changes:**
Added end time filter to all where clauses:
```javascript
endTime: {
  [Op.gt]: new Date()  // Only show auctions that haven't ended
}
```

**Endpoints Fixed:**
- `GET /api/auctions/trending` (via RankingService)
- `GET /api/auctions/spotlight`
- `GET /api/auctions/top-placement`
- `GET /api/auctions/similar/:id` (via RankingService)
- `GET /api/auctions/recommended` (via RankingService)

---

### 4. Group Buy Controller
**File:** `ocean_server\src\controllers\groupBuyController.js`

Updated two methods:
- `getSpotlightGroupBuys()` - Line 2231
- `getTopPlacementGroupBuys()` - Line 2325

**Changes:**
- Re-enabled `status: 'active'` filter (was previously removed)
- Added deadline filter:
```javascript
status: 'active',
deadline: {
  [Op.gt]: new Date()  // Only show group buys before deadline
}
```

**Endpoints Fixed:**
- `GET /api/group-buys/trending` (via RankingService)
- `GET /api/group-buys/spotlight`
- `GET /api/group-buys/top-placement`
- `GET /api/group-buys/similar/:id` (via RankingService)
- `GET /api/group-buys/recommended` (via RankingService)

---

### 5. Product Controller
**File:** `ocean_server\src\controllers\productController.js`

Updated two methods:
- `getSpotlightProducts()` - Line 2248
- `getTopPlacementProducts()` - Line 2356

**Changes:**
Added complex filter to exclude expired distress sales while allowing regular products:
```javascript
[Op.or]: [
  { isDistressSale: false },  // Regular products (no expiry)
  { isDistressSale: null },   // Regular products (no distress flag)
  { 
    // Distress sales that haven't expired
    isDistressSale: true,
    distressExpiryDate: {
      [Op.or]: [
        { [Op.gte]: new Date() },
        { [Op.is]: null }
      ]
    }
  }
]
```

**Endpoints Fixed:**
- `GET /api/products/trending` (via RankingService)
- `GET /api/products/spotlight`
- `GET /api/products/top-placement`
- `GET /api/products/similar/:id` (via RankingService)
- `GET /api/products/recommended` (via RankingService)

---

### 6. Swap Deal Controller
**File:** `ocean_server\src\controllers\swapDealController.js`

**No Changes Required:**
- Swap deals don't have an expiry date field in the database
- Already filtering by `status: 'active'` which is sufficient
- Methods `getSpotlightSwapDeals()` and `getTopPlacementSwapDeals()` are working correctly

**Endpoints Verified:**
- `GET /api/swap-deals/trending` (via RankingService)
- `GET /api/swap-deals/spotlight`
- `GET /api/swap-deals/top-placement`
- `GET /api/swap-deals/similar/:id` (via RankingService)
- `GET /api/swap-deals/recommended` (via RankingService)

---

## Testing Checklist

### Distress Sales
- [ ] `GET /api/distress-sales` - Should not show expired distress sales
- [ ] `GET /api/distress-sales/trending` - Should not show expired items
- [ ] `GET /api/distress-sales/spotlight` - Should not show expired items
- [ ] `GET /api/distress-sales/top-placement` - Should not show expired items

### Auctions
- [ ] `GET /api/auctions/trending` - Should not show ended auctions
- [ ] `GET /api/auctions/spotlight` - Should not show ended auctions
- [ ] `GET /api/auctions/top-placement` - Should not show ended auctions

### Group Buys
- [ ] `GET /api/group-buys/trending` - Should not show group buys past deadline
- [ ] `GET /api/group-buys/spotlight` - Should not show past deadline
- [ ] `GET /api/group-buys/top-placement` - Should not show past deadline

### Products
- [ ] `GET /api/products/trending` - Should show regular products and non-expired distress sales
- [ ] `GET /api/products/spotlight` - Should exclude expired distress sales
- [ ] `GET /api/products/top-placement` - Should exclude expired distress sales

---

## Database Fields Used

| Item Type | Expiry Field | Status Field | Additional Filters |
|-----------|--------------|--------------|-------------------|
| Product | N/A | `status` | `isAvailable: true` |
| Distress Sale | `distressExpiryDate` | `status` | `isAvailable: true`, `isDistressSale: true` |
| Auction | `endTime` | `status` | None |
| Group Buy | `deadline` | `status` | None |
| Swap Deal | N/A | `status` | None |

---

## Future Recommendations

1. **Background Jobs:** Ensure background jobs are updating status fields when items expire:
   - Distress sales: Set `status = 'inactive'` when `distressExpiryDate` passes
   - Auctions: Set `status = 'ended'` when `endTime` passes
   - Group buys: Set `status = 'failed'` or `'cancelled'` when `deadline` passes

2. **Database Indexes:** Add indexes on time-based fields for better query performance:
   ```sql
   CREATE INDEX idx_products_distress_expiry ON products(distressExpiryDate) WHERE isDistressSale = true;
   CREATE INDEX idx_auctions_end_time ON auctions(endTime);
   CREATE INDEX idx_group_buys_deadline ON group_buys(deadline);
   ```

3. **Soft Delete vs Hard Delete:** Consider implementing soft delete for all item types to maintain data integrity and analytics.

---

## Date Applied
January 23, 2026

## Files Modified
1. `ocean_server\src\services\rankingService.js`
2. `ocean_server\src\controllers\distressSaleController.js`
3. `ocean_server\src\controllers\auctionController.js`
4. `ocean_server\src\controllers\groupBuyController.js`
5. `ocean_server\src\controllers\productController.js`
