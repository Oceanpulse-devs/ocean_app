✅ Phase 1: Foundation & core components [COMPLETED]
Goal: Set up models and reusable promotion widgets
Tasks:
✅ Update Flutter Product model
✅ Add promotion fields: isBoosted, boostExpiresAt, isTopPlaced, topPlacementExpiresAt, isSpotlighted, spotlightExpiresAt, visibilityScore, lastScoreUpdate
✅ File: flutter-ocean/lib/core/models/product_model.dart
✅ Create PromotionBadge widget
✅ Reusable badge component
✅ Types: Boosted, Top Placement, Featured, Trending
✅ File: flutter-ocean/lib/core/widgets/promotion_badge.dart
✅ Add badges to ProductCard
✅ Overlay on product image (top-right)
✅ Support all card types (grid, list, feed, etc.)
✅ File: flutter-ocean/lib/core/widgets/product_card.dart
Deliverables: ✅ Product model updated, ✅ PromotionBadge widget created, ✅ ProductCard shows badges

⚠️ NOTE: Run `flutter pub run build_runner build --delete-conflicting-outputs` to regenerate product_model.g.dart

✅ Phase 2: Homepage promotion sections [COMPLETED]
Goal: Add promotion sections to the homepage
Tasks:
✅ Featured Products Carousel (Spotlight Engine)
✅ Horizontal scrolling carousel
✅ File: flutter-ocean/lib/features/home/presentation/widgets/featured_products_carousel.dart
✅ Integration: Add to home_page.dart after stories section
✅ Service method: getFeaturedProducts() added to product_service.dart
✅ Provider: featuredProductsProvider created
✅ Trending Products Section (Ranking Engine)
✅ Grid layout with "🔥 Trending Now" header
✅ File: flutter-ocean/lib/features/home/presentation/widgets/trending_products_section.dart
✅ Integration: Add to home_page.dart after tab switcher
✅ Service method: getTrendingProducts() added to product_service.dart
✅ Provider: trendingProductsProvider created
✅ Recommended for You Section (Ranking Engine)
✅ Personalized grid
✅ File: flutter-ocean/lib/features/home/presentation/widgets/recommended_products_section.dart
✅ Integration: Add to home_page.dart after trending section
✅ Service method: getRecommendedProducts() added to product_service.dart
✅ Provider: recommendedProductsProvider created
✅ Promotion fields added to _mapBackendProductToModel
Deliverables: ✅ 3 new homepage sections with promotion content, ✅ Service methods and providers created

✅ Phase 3: Products page enhancements [COMPLETED]
Goal: Add promotion sections and sorting to the products page
Tasks:
✅ Top Placement Section
✅ Premium section at top of grid (horizontal carousel)
✅ File: flutter-ocean/lib/features/products/presentation/widgets/top_placement_section.dart
✅ Integration: Add to products_page.dart before main grid
✅ Provider: topPlacementProductsProvider created with dummy data
✅ Sponsored Products Section
✅ Category-specific sponsored block (grid layout)
✅ File: flutter-ocean/lib/features/products/presentation/widgets/sponsored_products_section.dart
✅ Integration: Add between top placement and main grid
✅ Provider: sponsoredProductsProvider created with dummy data
✅ Ranking-based sorting
✅ Added ProductSortOption enum (relevance, price, newest, trending)
✅ Sort dropdown with icons in products_page.dart
✅ Default sort: "Relevance" (visibility score)
✅ Sorting method _sortProducts() implemented
✅ Promoted Search Results
✅ Section for promoted search results (grid layout)
✅ File: flutter-ocean/lib/features/products/presentation/widgets/promoted_search_results.dart
✅ Integration: Add to search results view (shown when searching)
✅ Provider: promotedSearchResultsProvider created with dummy data
Deliverables: ✅ Top placement section, ✅ Sponsored section, ✅ Sorting dropdown, ✅ Promoted search results section

✅ Phase 4: Product detail page [COMPLETED]
Goal: Add recommendation sections to product detail page
Tasks:
✅ Similar Products Section
✅ Horizontal scroll of similar products
✅ File: flutter-ocean/lib/features/products/presentation/widgets/similar_products_section.dart
✅ Integration: Add after product details, before AR section
✅ Provider: similarProductsProvider created with dummy data
✅ Trending in Category Section
✅ Grid of trending products in same category
✅ File: flutter-ocean/lib/features/products/presentation/widgets/trending_category_section.dart
✅ Integration: Add after similar products
✅ Provider: trendingCategoryProductsProvider created with dummy data
✅ Excludes current product from results
✅ Recommended for You Section
✅ Personalized recommendations (only for logged-in users)
✅ File: flutter-ocean/lib/features/products/presentation/widgets/recommended_detail_section.dart
✅ Integration: Add after AR section, before seller section
✅ Provider: recommendedProductsProvider (reused from Phase 2)
✅ Excludes current product from results
Deliverables: ✅ 3 recommendation sections on product detail page

✅ Phase 5: Auction pages [COMPLETED]
Goal: Add promotion sections to auction listing and detail pages
Tasks:
✅ Trending Auctions Section (Listing Page)
✅ Horizontal carousel at top of auctions listing page
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/trending_auctions_listing_section.dart
✅ Integration: Add to auctions_page.dart before main grid
✅ Provider: trendingCategoryAuctionsProvider created with dummy data
✅ Similar Auctions Section (Detail Page)
✅ Horizontal scroll of similar auctions
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/similar_auctions_section.dart
✅ Integration: Add after auction details, before AR section
✅ Provider: similarAuctionsProvider created with dummy data
✅ Converts Auction to Product for display using ProductCard
✅ Recommended Auctions for You Section (Detail Page)
✅ Grid layout of personalized recommendations
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/recommended_auctions_section.dart
✅ Integration: Add after seller/feedback section
✅ Provider: recommendedAuctionsProvider created with dummy data
✅ Excludes current auction from results
✅ Converts Auction to Product for display using ProductCard
Deliverables: ✅ Trending section on listing page, ✅ Similar and Recommended sections on detail page
✅ Phase 6: Swap deal pages [COMPLETED]
Goal: Add promotion sections to swap deal listing and detail pages
Tasks:
✅ Trending Swap Deals Section (Listing Page)
✅ Horizontal carousel at top of swap deals listing page
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/trending_swap_deals_listing_section.dart
✅ Integration: Add to swap_deals_page.dart before main grid
✅ Provider: trendingCategorySwapDealsProvider created with dummy data
✅ Similar Swap Deals Section (Detail Page)
✅ Horizontal carousel of similar swap deals
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/similar_swap_deals_section.dart
✅ Integration: Add after product details, before AR section
✅ Provider: similarSwapDealsProvider created with dummy data
✅ Recommended Swap Deals Section (Detail Page)
✅ Grid layout of recommended swap deals
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/recommended_swap_deals_section.dart
✅ Integration: Add after seller/feedback section
✅ Provider: recommendedSwapDealsProvider created with dummy data
✅ Excludes current swap deal from results
✅ Converts SwapDeal to Product for display using ProductCard
Deliverables: ✅ Trending section on listing page, ✅ Similar and Recommended sections on detail page
nice✅ Phase 7: Group buy & distress sale detail pages [COMPLETED]
Goal: Add promotion sections to group buy and distress sale detail pages
Tasks:
✅ Similar Group Buys Section
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/similar_group_buys_section.dart
✅ Integration: Add to bulk_purchase_detail_page.dart after product details, before AR section
✅ Provider: similarGroupBuysProvider created with dummy data
✅ Trending Group Buys Section (Listing Page)
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/trending_group_buys_listing_section.dart
✅ Integration: Add to bulk_purchases_page.dart before main grid
✅ Provider: trendingCategoryGroupBuysProvider created with dummy data
✅ Recommended Group Buys Section
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/recommended_group_buys_section.dart
✅ Integration: Add to bulk_purchase_detail_page.dart after seller/feedback section
✅ Provider: recommendedGroupBuysProvider created with dummy data
✅ Similar Distress Sales Section
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/similar_distress_sales_section.dart
✅ Integration: Add to distress_sale_detail_page.dart after product details, before AR section
✅ Provider: similarDistressSalesProvider created with dummy data
✅ Trending Distress Sales Section (Listing Page)
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/trending_distress_sales_listing_section.dart
✅ Integration: Add to distress_sales_page.dart before main grid
✅ Provider: trendingCategoryDistressSalesProvider created with dummy data
✅ Recommended Distress Sales Section
✅ File: flutter-ocean/lib/features/market_survey/presentation/widgets/recommended_distress_sales_section.dart
✅ Integration: Add to distress_sale_detail_page.dart after seller/feedback section
✅ Provider: recommendedDistressSalesProvider created with dummy data
✅ Fixed GridView aspect ratios (0.75 -> 0.65 for bulk purchases, 0.7 -> 0.65 for distress sales)
✅ Added shrinkWrap and NeverScrollableScrollPhysics to GridViews in listing pages
Deliverables: ✅ 6 sections across 2 listing pages and 2 detail pages, ✅ GridView fixes applied
✅ Phase 8: Listing pages (auctions, swap deals, group buys, distress sales) [COMPLETED]
Goal: Add top placement and sponsored sections to listing pages
Tasks:
✅ Top Placement Sections (4 widgets)
✅ Auctions, Swap Deals, Group Buys, Distress Sales
✅ Files: top_placement_auctions_section.dart, top_placement_swap_deals_section.dart, top_placement_group_buys_section.dart, top_placement_distress_sales_section.dart
✅ Integration: Added to all 4 listing pages before trending sections
✅ Providers: topPlacementAuctionsProvider, topPlacementSwapDealsProvider, topPlacementGroupBuysProvider, topPlacementDistressSalesProvider created with dummy data
✅ Sponsored Sections (4 widgets)
✅ Auctions, Swap Deals, Group Buys, Distress Sales
✅ Files: sponsored_auctions_section.dart, sponsored_swap_deals_section.dart, sponsored_group_buys_section.dart, sponsored_distress_sales_section.dart
✅ Integration: Added to all 4 listing pages between top placement and trending sections
✅ Providers: sponsoredAuctionsProvider, sponsoredSwapDealsProvider, sponsoredGroupBuysProvider, sponsoredDistressSalesProvider created with dummy data
✅ Promotion badges on item cards
✅ Badges already showing on all card types from Phase 1 (ProductCard includes PromotionBadge overlay)
✅ Badges display for: Boosted, Top Placement, Featured, Trending
✅ Works on: auction cards, swap deal cards, group buy cards, distress sale cards, and all product cards
Deliverables: ✅ Top placement and sponsored sections on all 4 listing pages, ✅ Badges verified on all item cards
✅ Phase 9: Profile & management pages [COMPLETED]
Goal: Add promotion management and analytics to seller profile
Tasks:
✅ Promotion Analytics Dashboard
✅ File: flutter-ocean/lib/features/profile/presentation/pages/promotion_analytics_page.dart
✅ Shows summary cards (Active Boosts, Top Placements, Spotlights, Total Spent)
✅ Displays average performance metrics (Views, Clicks, Messages increase)
✅ Lists recent promotions with performance data
✅ Promotion Management Section
✅ File: flutter-ocean/lib/features/profile/presentation/pages/promotion_management_page.dart
✅ Three tabs: My Products, Active Promotions, Promotion Plans
✅ Product grid with promotion status indicators
✅ Filter products by promotion type
✅ Manage active promotions (view analytics, cancel)
✅ View subscription plan details and upgrade options
✅ Visibility Score Display Widget
✅ File: flutter-ocean/lib/features/profile/presentation/widgets/visibility_score_widget.dart
✅ Compact and full view modes
✅ Color-coded score display (Excellent, Very Good, Good, Fair, Low)
✅ Optional score breakdown visualization
✅ Progress indicator for score visualization
✅ Promotion Providers
✅ File: flutter-ocean/lib/features/profile/providers/promotion_provider.dart
✅ promotionAnalyticsProvider for analytics data (dummy data)
✅ promotionManagementProvider for management data (dummy data)
✅ sellerPromotedProductsProvider placeholder for seller's promoted products
✅ Integration
✅ Promotion Management card added to seller Profile page (ProfilePage)
✅ Routes added for seller promotion pages: /seller/promotion-analytics and /seller/promotion-management
✅ Profile page buttons wired to new routes (Analytics & Manage)
Deliverables: ✅ Promotion management and analytics in profile, ✅ Visibility score widget, ✅ All providers created, ✅ Routes and profile integration completed
Summary
Phase 1: Foundation (models + badges) — 1-2 days
Phase 2: Homepage sections — 2-3 days
Phase 3: Products page — 2-3 days
Phase 4: Product detail page — 1-2 days
Phase 5: Auction detail page — 1 day
Phase 6: Swap deal detail page — 1 day
Phase 7: Group buy & distress sale detail pages — 1-2 days
Phase 8: Listing pages — 2-3 days
Phase 9: Profile & management — 2-3 days
Total estimated time: 13-20 days