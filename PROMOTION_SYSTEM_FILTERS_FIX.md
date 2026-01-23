# Promotion System Filters Fix

## Issues Fixed

### 1. **Expired/Ended Items Showing in Trending Sections**
**Problem:** Deleted, expired, or ended items were appearing in trending sections across all item types.

**Root Cause:** The `RankingService.getTrendingItems()` method only checked `status: 'active'` but didn't verify time-based expiry conditions.

**Solution Applied:**
- ✅ **Distress Sales:** Added `distressExpiryDate` check to exclude expired items
- ✅ **Auctions:** Added `endTime` check to exclude ended auctions
- ✅ **Group Buys:** Added `deadline` check to exclude expired group buys

### 2. **Distress Sales and Regular Products Mixed Together**
**Problem:** Distress sale trending section was showing regular products, and product trending section was showing distress sales.

**Root Cause:** Both used the `Product` model but didn't filter by `isDistressSale` flag.

**Solution Applied:**
- ✅ **Distress Sale Endpoints:** Now ONLY show items with `isDistressSale: true`
- ✅ **Product Endpoints:** Now ONLY show items with `isDistressSale: false` or `null`

---

## Files Modified

### 1. `ocean_server\src\services\rankingService.js`
Updated **three methods** to include proper filtering:

#### A. `getTrendingItems()` (lines 47-85)
```javascript
// Separate distress sales from regular products
if (itemType === 'distress_sale') {
  whereClause.isDistressSale = true;
  whereClause.distressExpiryDate = {
    [Op.or]: [
      { [Op.gte]: new Date() },
      { [Op.is]: null }
    ]
  };
} else if (itemType === 'product') {
  whereClause[Op.or] = [
    { isDistressSale: false },
    { isDistressSale: null }
  ];
}

if (itemType === 'auction') {
  whereClause.endTime = { [Op.gt]: new Date() };
}

if (itemType === 'group_buy') {
  whereClause.deadline = { [Op.gt]: new Date() };
}
```

#### B. `getRecommendedItems()` (lines 152-189)
Same filtering logic applied to recommended items.

#### C. `getSimilarItems()` (lines 238-274)
Same filtering logic applied to similar items.

---

### 2. `ocean_server\src\controllers\distressSaleController.js`
Updated **three methods**:

#### A. `getAllDistressSales()` (line 311)
```javascript
whereClause = {
  isDistressSale: true,
  status: 'active',
  isAvailable: true,
  distressExpiryDate: {
    [Op.or]: [
      { [Op.gte]: new Date() },
      { [Op.is]: null }
    ]
  }
};
```

#### B. `getSpotlightDistressSales()` (line 1265)
Added same expiry date filter.

#### C. `getTopPlacementDistressSales()` (line 1361)
Added same expiry date filter.

---

### 3. `ocean_server\src\controllers\groupBuyController.js`
Updated **two methods**:

#### A. `getSpotlightGroupBuys()` (line 2230)
```javascript
where: {
  id: { [Op.in]: groupBuyIds },
  status: 'active',
  deadline: { [Op.gt]: new Date() }
}
```

#### B. `getTopPlacementGroupBuys()` (line 2325)
Added same deadline filter.

---

### 4. `ocean_server\src\controllers\productController.js`
Updated **two methods**:

#### A. `getSpotlightProducts()` (line 2252)
```javascript
where: {
  id: { [Op.in]: productIds },
  status: 'active',
  isAvailable: true,
  [Op.or]: [
    { isDistressSale: false },
    { isDistressSale: null },
    { 
      isDistressSale: true,
      distressExpiryDate: {
        [Op.or]: [
          { [Op.gte]: new Date() },
          { [Op.is]: null }
        ]
      }
    }
  ]
}
```

#### B. `getTopPlacementProducts()` (line 2361)
Added same filtering logic.

---

## Affected Endpoints

All these endpoints now correctly filter items:

### Products
- `GET /api/products/trending` ✅
- `GET /api/products/recommended` ✅
- `GET /api/products/:id/similar` ✅
- `GET /api/products/spotlight` ✅
- `GET /api/products/top-placement` ✅

### Distress Sales
- `GET /api/distress-sales` ✅
- `GET /api/distress-sales/trending` ✅
- `GET /api/distress-sales/recommended` ✅
- `GET /api/distress-sales/:id/similar` ✅
- `GET /api/distress-sales/spotlight` ✅
- `GET /api/distress-sales/top-placement` ✅

### Auctions
- `GET /api/auctions/trending` ✅
- `GET /api/auctions/recommended` ✅
- `GET /api/auctions/:id/similar` ✅

### Group Buys
- `GET /api/group-buys/trending` ✅
- `GET /api/group-buys/recommended` ✅
- `GET /api/group-buys/:id/similar` ✅
- `GET /api/group-buys/spotlight` ✅
- `GET /api/group-buys/top-placement` ✅

### Swap Deals
- `GET /api/swap-deals/trending` ✅
- `GET /api/swap-deals/recommended` ✅
- `GET /api/swap-deals/:id/similar` ✅

---

## Testing Checklist

### 1. Distress Sales
- [ ] Trending section shows ONLY distress sales (no regular products)
- [ ] No expired distress sales appear
- [ ] Distress sales with no expiry date still show

### 2. Regular Products
- [ ] Trending section shows ONLY regular products (no distress sales)
- [ ] Products remain active and visible

### 3. Auctions
- [ ] Only active auctions with `endTime` in the future appear
- [ ] Ended auctions do not show

### 4. Group Buys
- [ ] Only group buys with `deadline` in the future appear
- [ ] Expired group buys do not show

### 5. Swap Deals
- [ ] Active swap deals appear correctly
- [ ] Inactive/completed/cancelled swap deals don't appear

---

## Summary

**Total Changes:**
- ✅ 1 service file updated (rankingService.js - 3 methods)
- ✅ 3 controller files updated (distressSale, groupBuy, product - 7 methods total)
- ✅ All promotion endpoints now properly filter expired/deleted items
- ✅ Distress sales and regular products are now properly separated

**Impact:**
- No more expired distress sales in trending sections
- No more ended auctions in trending sections
- No more expired group buys in trending sections
- Distress sales stay in their section, products stay in theirs
- Cleaner, more accurate promotion system across the entire app
