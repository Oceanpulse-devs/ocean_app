# Frontend Integration Plan - Removing Dummy Data & Connecting to Backend

This document outlines the plan to connect all frontend promotion features to the backend API and remove all dummy data.

---

## 📋 CURRENT STATE

### ✅ Already Implemented (Frontend):
- All promotion UI components and widgets
- All promotion sections on listing and detail pages
- Promotion badges and visual indicators
- Promotion analytics and management pages
- All providers created (currently using dummy data)

### ❌ Needs Implementation:
- API service methods for all promotion endpoints
- Replace all dummy data providers with real API calls
- Connect to backend promotion endpoints

---

## 🎯 FRONTEND INTEGRATION PHASES

### ✅ Phase 1: Create Promotion API Service [COMPLETED]
**Goal:** Create a dedicated service for promotion-related API calls

**Tasks:**
1. ✅ Create `promotion_service.dart` in `flutter-ocean/lib/core/services/`
   - ✅ `getPromotionAnalytics({int? days})` → `GET /api/promotions/analytics?days=30`
   - ✅ `getPromotionManagement()` → Uses `/api/subscriptions/current` for subscription info
   - ✅ `getSellerPromotedProducts(String sellerId)` → Uses `ProductService.getProducts()`
   - ✅ `_getRecentPromotions()` → `GET /api/promotions/analytics/recent?limit=10`

**Files:**
- ✅ `flutter-ocean/lib/core/services/promotion_service.dart` (created)

**Deliverables:**
- ✅ PromotionService class created
- ✅ All promotion analytics endpoints connected
- ✅ Service provider created (`promotionServiceProvider`)
- ✅ Maps backend responses to frontend models (PromotionAnalytics, PromotionPerformance)

---

### ✅ Phase 2: Update Product Service with Promotion Endpoints [COMPLETED]
**Goal:** Add promotion endpoints to ProductService

**Tasks:**
1. ✅ Add methods to `product_service.dart`:
   - ✅ `getTrendingProducts({String? category})` → Already existed
   - ✅ `getSimilarProducts(String productId, {int limit = 10})` → `GET /api/products/:id/similar`
   - ✅ `getRecommendedProducts(String userId)` → Already existed
   - ✅ `getSpotlightProducts({String? category, String slotType = 'homepage', int limit = 20})` → `GET /api/products/spotlight`
   - ✅ `getTopPlacementProducts({String? category, String? placementType, int limit = 20})` → `GET /api/products/top-placement`
   - ✅ Updated `getFeaturedProducts()` to use `getSpotlightProducts()` internally

**Files:**
- ✅ `flutter-ocean/lib/core/services/product_service.dart`

**Deliverables:**
- ✅ All product promotion endpoints added
- ✅ Methods return proper Product models with promotion fields
- ✅ All methods use `_mapBackendProductToModel()` for consistent mapping
- ✅ Error handling and logging implemented

---

### ✅ Phase 3: Update Auction Service with Promotion Endpoints [COMPLETED]
**Goal:** Add promotion endpoints to AuctionService

**Tasks:**
1. ✅ Add methods to `auction_service.dart`:
   - ✅ `getTrendingAuctions({String? category, int limit = 20})` → `GET /api/auctions/trending?category=X&limit=20`
   - ✅ `getSimilarAuctions(String auctionId, {int limit = 10})` → `GET /api/auctions/:id/similar?limit=10`
   - ✅ `getSpotlightAuctions({String? category, String slotType = 'homepage', int limit = 20})` → `GET /api/auctions/spotlight`
   - ✅ `getTopPlacementAuctions({String? category, String? placementType, int limit = 20})` → `GET /api/auctions/top-placement`

**Files:**
- ✅ `flutter-ocean/lib/core/services/auction_service.dart`

**Deliverables:**
- ✅ All auction promotion endpoints added
- ✅ Methods return proper Auction models with promotion fields
- ✅ All methods use `_mapBackendAuctionToModel()` for consistent mapping
- ✅ Error handling and logging implemented

---

### ✅ Phase 4: Update Swap Deal Service with Promotion Endpoints [COMPLETED]
**Goal:** Add promotion endpoints to SwapDealService

**Tasks:**
1. ✅ Add methods to `swap_deal_service.dart`:
   - ✅ `getTrendingSwapDeals({String? category, int limit = 20})` → `GET /api/swap-deals/trending?category=X&limit=20`
   - ✅ `getSimilarSwapDeals(String swapDealId, {int limit = 10})` → `GET /api/swap-deals/:id/similar?limit=10`
   - ✅ `getSpotlightSwapDeals({String? category, String slotType = 'homepage', int limit = 20})` → `GET /api/swap-deals/spotlight`
   - ✅ `getTopPlacementSwapDeals({String? category, String? placementType, int limit = 20})` → `GET /api/swap-deals/top-placement`

**Files:**
- ✅ `flutter-ocean/lib/core/services/swap_deal_service.dart`

**Deliverables:**
- ✅ All swap deal promotion endpoints added
- ✅ Methods return proper SwapDeal models with promotion fields
- ✅ All methods use `SwapDeal.fromJson()` for consistent mapping
- ✅ Error handling and logging implemented

---

### ✅ Phase 5: Update Group Buy Service with Promotion Endpoints [COMPLETED]
**Goal:** Add promotion endpoints to GroupBuyService

**Tasks:**
1. ✅ Add methods to `group_buy_service.dart`:
   - ✅ `getTrendingGroupBuys({String? category, int limit = 20})` → `GET /api/group-buys/trending?category=X&limit=20`
   - ✅ `getSimilarGroupBuys(String groupBuyId, {int limit = 10})` → `GET /api/group-buys/:id/similar?limit=10`
   - ✅ `getSpotlightGroupBuys({String? category, String slotType = 'homepage', int limit = 20})` → `GET /api/group-buys/spotlight`
   - ✅ `getTopPlacementGroupBuys({String? category, String? placementType, int limit = 20})` → `GET /api/group-buys/top-placement`

**Files:**
- ✅ `flutter-ocean/lib/core/services/group_buy_service.dart`

**Deliverables:**
- ✅ All group buy promotion endpoints added
- ✅ Methods return `List<Map<String, dynamic>>` (consistent with existing GroupBuyService pattern)
- ✅ Providers will convert to GroupBuy models using `GroupBuy.fromJson()`
- ✅ Error handling and logging implemented

---

### ✅ Phase 6: Update Distress Sale Service with Promotion Endpoints [COMPLETED]
**Goal:** Add promotion endpoints to DistressSaleService

**Tasks:**
1. ✅ Add methods to `distress_sale_service.dart`:
   - ✅ `getTrendingDistressSales({String? category, int limit = 20})` → `GET /api/distress-sales/trending?category=X&limit=20`
   - ✅ `getSimilarDistressSales(String distressSaleId, {int limit = 10})` → `GET /api/distress-sales/:id/similar?limit=10`
   - ✅ `getSpotlightDistressSales({String? category, String slotType = 'homepage', int limit = 20})` → `GET /api/distress-sales/spotlight`
   - ✅ `getTopPlacementDistressSales({String? category, String? placementType, int limit = 20})` → `GET /api/distress-sales/top-placement`

**Files:**
- ✅ `flutter-ocean/lib/core/services/distress_sale_service.dart`

**Deliverables:**
- ✅ All distress sale promotion endpoints added
- ✅ Methods return `List<Map<String, dynamic>>` (consistent with existing DistressSaleService pattern)
- ✅ Providers will convert to DistressSale models using `DistressSale.fromJson()`
- ✅ Error handling and logging implemented

---

### Phase 7: Replace Product Provider Dummy Data
**Goal:** Connect product providers to real API

**Tasks:**
1. Update `products_provider.dart`:
   - Replace `trendingProductsProvider` → use `ProductService.getTrendingProducts()`
   - Replace `similarProductsProvider` → use `ProductService.getSimilarProducts()`
   - Replace `recommendedProductsProvider` → use `ProductService.getRecommendedProducts()`
   - Replace `topPlacementProductsProvider` → use `ProductService.getTopPlacementProducts()`
   - Remove all `_dummyTrendingProducts`, `_dummySimilarProducts`, `_dummyRecommendedProducts`, `_dummyTopPlacementProducts`

**Files:**
- `flutter-ocean/lib/core/providers/products_provider.dart`

**Deliverables:**
- ✅ All product providers connected to API
- ✅ All dummy data removed
- ✅ Error handling and loading states maintained

---

### Phase 8: Replace Auction Provider Dummy Data
**Goal:** Connect auction providers to real API

**Tasks:**
1. Update `auctions_provider.dart`:
   - Replace `similarAuctionsProvider` → use `AuctionService.getSimilarAuctions()`
   - Replace `trendingCategoryAuctionsProvider` → use `AuctionService.getTrendingAuctions()`
   - Replace `recommendedAuctionsProvider` → use `AuctionService.getRecommendedAuctions()` (if exists)
   - Replace `topPlacementAuctionsProvider` → use `AuctionService.getTopPlacementAuctions()`
   - Remove all `_dummySimilarAuctions`, `_dummyTrendingAuctions`, `_dummyTopPlacementAuctions`

**Files:**
- `flutter-ocean/lib/core/providers/auctions_provider.dart`

**Deliverables:**
- ✅ All auction providers connected to API
- ✅ All dummy data removed
- ✅ Error handling and loading states maintained

---

### Phase 9: Replace Swap Deal Provider Dummy Data
**Goal:** Connect swap deal providers to real API

**Tasks:**
1. Update `swap_deals_provider.dart`:
   - Replace `similarSwapDealsProvider` → use `SwapDealService.getSimilarSwapDeals()`
   - Replace `trendingCategorySwapDealsProvider` → use `SwapDealService.getTrendingSwapDeals()`
   - Replace `recommendedSwapDealsProvider` → use `SwapDealService.getRecommendedSwapDeals()` (if exists)
   - Replace `topPlacementSwapDealsProvider` → use `SwapDealService.getTopPlacementSwapDeals()`
   - Replace `sponsoredSwapDealsProvider` → use `SwapDealService.getSpotlightSwapDeals()`
   - Remove all `_dummySimilarSwapDeals`, `_dummyTrendingSwapDeals`, `_dummyTopPlacementSwapDeals`, `_dummySponsoredSwapDeals`

**Files:**
- `flutter-ocean/lib/features/market_survey/providers/swap_deals_provider.dart`

**Deliverables:**
- ✅ All swap deal providers connected to API
- ✅ All dummy data removed
- ✅ Error handling and loading states maintained

---

### Phase 10: Replace Group Buy Provider Dummy Data
**Goal:** Connect group buy providers to real API

**Tasks:**
1. Update `group_buy_provider.dart`:
   - Replace `similarGroupBuysProvider` → use `GroupBuyService.getSimilarGroupBuys()`
   - Replace `trendingCategoryGroupBuysProvider` → use `GroupBuyService.getTrendingGroupBuys()`
   - Replace `recommendedGroupBuysProvider` → use `GroupBuyService.getRecommendedGroupBuys()` (if exists)
   - Replace `topPlacementGroupBuysProvider` → use `GroupBuyService.getTopPlacementGroupBuys()`
   - Replace `sponsoredGroupBuysProvider` → use `GroupBuyService.getSpotlightGroupBuys()`
   - Remove all `_dummySimilarGroupBuys`, `_dummyTrendingGroupBuys`, `_dummyTopPlacementGroupBuys`, `_dummySponsoredGroupBuys`

**Files:**
- `flutter-ocean/lib/features/market_survey/providers/group_buy_provider.dart`

**Deliverables:**
- ✅ All group buy providers connected to API
- ✅ All dummy data removed
- ✅ Error handling and loading states maintained

---

### Phase 11: Replace Distress Sale Provider Dummy Data
**Goal:** Connect distress sale providers to real API

**Tasks:**
1. Update `distress_sales_provider.dart`:
   - Replace `similarDistressSalesProvider` → use `DistressSaleService.getSimilarDistressSales()`
   - Replace `trendingCategoryDistressSalesProvider` → use `DistressSaleService.getTrendingDistressSales()`
   - Replace `recommendedDistressSalesProvider` → use `DistressSaleService.getRecommendedDistressSales()` (if exists)
   - Replace `topPlacementDistressSalesProvider` → use `DistressSaleService.getTopPlacementDistressSales()`
   - Replace `sponsoredDistressSalesProvider` → use `DistressSaleService.getSpotlightDistressSales()`
   - Remove all `_dummySimilarDistressSales`, `_dummyTrendingDistressSales`, `_dummyTopPlacementDistressSales`, `_dummySponsoredDistressSales`

**Files:**
- `flutter-ocean/lib/core/providers/distress_sales_provider.dart`

**Deliverables:**
- ✅ All distress sale providers connected to API
- ✅ All dummy data removed
- ✅ Error handling and loading states maintained

---

### Phase 12: Replace Promotion Provider Dummy Data
**Goal:** Connect promotion analytics and management to real API

**Tasks:**
1. Update `promotion_provider.dart`:
   - Replace `promotionAnalyticsProvider` → use `PromotionService.getPromotionAnalytics()`
   - Replace `promotionManagementProvider` → use `PromotionService.getPromotionManagement()`
   - Replace `sellerPromotedProductsProvider` → use `PromotionService.getSellerPromotedProducts()` or `ProductService.getProducts(sellerId: X, promoted: true)`
   - Remove all dummy data structures
   - Update models to match backend response format

**Files:**
- `flutter-ocean/lib/features/profile/providers/promotion_provider.dart`

**Deliverables:**
- ✅ All promotion providers connected to API
- ✅ All dummy data removed
- ✅ Models updated to match backend format
- ✅ Error handling and loading states maintained

---

## 📊 SUMMARY

**Total Phases:** 12

**Dummy Data to Remove:**
- Products: `_dummyTrendingProducts`, `_dummySimilarProducts`, `_dummyRecommendedProducts`, `_dummyTopPlacementProducts`
- Auctions: `_dummySimilarAuctions`, `_dummyTrendingAuctions`, `_dummyTopPlacementAuctions`
- Swap Deals: `_dummySimilarSwapDeals`, `_dummyTrendingSwapDeals`, `_dummyTopPlacementSwapDeals`, `_dummySponsoredSwapDeals`
- Group Buys: `_dummySimilarGroupBuys`, `_dummyTrendingGroupBuys`, `_dummyTopPlacementGroupBuys`, `_dummySponsoredGroupBuys`
- Distress Sales: `_dummySimilarDistressSales`, `_dummyTrendingDistressSales`, `_dummyTopPlacementDistressSales`, `_dummySponsoredDistressSales`
- Promotions: All dummy analytics data in `promotion_provider.dart`

**New Services to Create:**
- `promotion_service.dart` (new)

**Services to Update:**
- `product_service.dart`
- `auction_service.dart`
- `swap_deal_service.dart`
- `group_buy_service.dart`
- `distress_sale_service.dart`

**Providers to Update:**
- `products_provider.dart`
- `auctions_provider.dart`
- `swap_deals_provider.dart`
- `group_buy_provider.dart`
- `distress_sales_provider.dart`
- `promotion_provider.dart`

---

## 🔗 BACKEND ENDPOINTS REFERENCE

### Promotion Analytics
- `GET /api/promotions/analytics` - Overall analytics
- `GET /api/promotions/analytics/boost` - Boost analytics
- `GET /api/promotions/analytics/top-placement` - Top placement analytics
- `GET /api/promotions/analytics/spotlight` - Spotlight analytics
- `GET /api/promotions/analytics/performance` - Performance comparison
- `GET /api/promotions/analytics/recent` - Recent promotions

### Products
- `GET /api/products/trending?category=X` - Trending products
- `GET /api/products/:id/similar` - Similar products
- `GET /api/products/recommended?userId=X` - Recommended products
- `GET /api/products/spotlight?category=X` - Spotlight products
- `GET /api/products/top-placement?category=X` - Top placement products

### Auctions
- `GET /api/auctions/trending?category=X` - Trending auctions
- `GET /api/auctions/:id/similar` - Similar auctions
- `GET /api/auctions/spotlight?category=X` - Spotlight auctions
- `GET /api/auctions/top-placement?category=X` - Top placement auctions

### Swap Deals
- `GET /api/swap-deals/trending?category=X` - Trending swap deals
- `GET /api/swap-deals/:id/similar` - Similar swap deals
- `GET /api/swap-deals/spotlight?category=X` - Spotlight swap deals
- `GET /api/swap-deals/top-placement?category=X` - Top placement swap deals

### Group Buys
- `GET /api/group-buys/trending?category=X` - Trending group buys
- `GET /api/group-buys/:id/similar` - Similar group buys
- `GET /api/group-buys/spotlight?category=X` - Spotlight group buys
- `GET /api/group-buys/top-placement?category=X` - Top placement group buys

### Distress Sales
- `GET /api/distress-sales/trending?category=X` - Trending distress sales
- `GET /api/distress-sales/:id/similar` - Similar distress sales
- `GET /api/distress-sales/spotlight?category=X` - Spotlight distress sales
- `GET /api/distress-sales/top-placement?category=X` - Top placement distress sales

---

## ⚠️ NOTES

- All API calls should include proper error handling
- Loading states should be maintained during API calls
- Empty states should be handled gracefully
- Response models should match backend format exactly
- Category parameters are optional (null = all categories)
- User ID parameters are required for personalized recommendations

---

## 📝 ESTIMATED TIME

- Phase 1: Promotion Service - 2-3 hours
- Phase 2-6: Service Updates (5 phases) - 5-8 hours
- Phase 7-12: Provider Updates (6 phases) - 6-10 hours
- **Total estimated time: 13-21 hours (2-3 days)**
