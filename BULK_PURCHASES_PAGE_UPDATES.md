# BulkPurchasesPage - Required Updates

The file has been partially updated but needs method signatures and content updates.

## Updates Made So Far ✅
1. Added `GroupBuyService` import
2. Added state variables: `_groupBuys`, `_isLoading`, `_error`
3. Added `_fetchGroupBuys()` method to load from backend
4. Updated `build()` to show loading/error states
5. Updated `GridView` and `ListView` itemCount to use `_groupBuys.length`
6. Started updating `_buildBulkPurchaseGridCard` signature

## Still Need to Update:

### 1. `_buildBulkPurchaseGridCard` - Update to use groupBuy object
- Line 239: onTap -> `_navigateToBulkPurchaseDetail(groupBuyId)`
- Line 242-243: Image.network -> Use `productImage` variable
- Line 269: _getProductName(index) -> `productName`
- Line 276: _getBulkPurchasePrice(index) -> `pricePerUnit`
- Line 293: _getSellerName(index) -> Need seller name from backend
- Line 305: _getDeadline(index) -> `daysLeft`
- Add else case for Image.network ternary

### 2. `_buildBulkPurchaseListCard` - Similar updates needed
- Change signature from `int index` to `Map<String, dynamic> groupBuy`
- Update all helper method calls to use real data
- Update navigation

### 3. `_navigateToBulkPurchaseDetail` - Update signature
- Change from `int index` to `String groupBuyId`
- Use `context.push('/bulk-purchase-detail-$groupBuyId')` or just `context.push('/bulk-purchase-detail/$groupBuyId')`

### 4. Remove old helper methods
- Keep only if needed for filtering

The backend is ready and returning data. The frontend just needs to map it to the UI components.

