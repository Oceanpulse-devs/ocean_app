# Ocean Promotion System - Core Implementation Plan

This document outlines the **4 core promotion engines** selected for Ocean marketplace, how they integrate with our subscription plans, their impact on seller performance, and the UI components required to support them.

---

## 🎯 THE 4 CORE PROMOTION ENGINES

### 1. Enhanced Boost Engine (Bump-Up Engine) ⭐ MOST IMPORTANT

**What it does:**
- Moves a seller's product back to the top of category feeds, search results, and home feeds
- Supports single boosts or auto-reboost (every 6h, 12h, or 24h)
- Provides boost analytics (views, clicks, messages during boost period)
- Offers boost packages: 1-day, 3-day, 7-day options
- Supports location-specific boosting (target specific states/cities)

**Why it's critical:**
- Highest seller demand (most used promotion type)
- Drives instant visibility (product jumps from page 10 → page 1)
- Fastest way to help sellers move inventory
- Easy to build and monetize
- Works exceptionally well for crowded categories (Phones, Laptops, Cars, Electronics)

**Impact on Seller Products/Sales:**
- **5× to 20× more views** during boost period
- **3× to 5× more chat requests** from interested buyers
- **2× to 4× higher conversion rate** compared to non-boosted listings
- Products stay visible longer, reducing time-to-sale
- Auto-reboost ensures continuous visibility without manual intervention

---

### 2. Ranking/Scoring Engine (The Brain of the System) 🧠

**What it does:**
- Calculates a visibility score for every product on the platform
- Multi-factor scoring algorithm considers:
  - **Promotion weight** (boosted = +300 points, top placement = +500 points)
  - **Seller reputation** (verified seller = +100, trust score = +50)
  - **Media quality** (video = +50, 5+ images = +30, AR model = +40)
  - **Engagement metrics** (views, saves, messages, likes)
  - **Freshness** (newer listings = higher score, decays over time)
  - **Location match** (buyer location matches seller = +20)
  - **Category relevance** (exact match = +30)
- Dynamic ranking recalculates scores every hour
- Category-specific ranking weights (different factors matter per category)

**Why it's critical:**
- Foundation for all other promotion engines
- Ensures fair visibility distribution
- Makes boosts and placements effective
- Without this, promotions won't work properly (system can't decide rankings)

**Impact on Seller Products/Sales:**
- **10× to 40× more visibility** for high-scoring products
- Paid promotions add significant multipliers (+300% for boosts)
- Verified sellers get automatic priority (encourages verification)
- Quality listings (videos, many images) get rewarded organically
- Creates a merit-based system that rewards good sellers

---

### 3. Top Placement Engine (Premium Top Ads) 💎

**What it does:**
- Moves a product to a **fixed top slot** in category pages and search results
- Products stay at the top for a set duration (3 days, 7 days, 14 days)
- Always shows **before all non-promoted listings**
- Category-specific placement (choose specific categories)
- Visual "Top Placement" badge on product cards
- Placement analytics (track performance vs regular listings)

**Why it's critical:**
- Highest revenue driver (sellers pay premium for guaranteed top position)
- Produces the **highest conversion rate** of all promotion types
- Premium feature that differentiates business sellers from casual sellers
- High-demand categories (cars, electronics, property) generate huge revenue

**Impact on Seller Products/Sales:**
- **Massive visibility** (always first in category/search)
- **Highest conversion rate** (buyers see it first, trust it more)
- **Premium positioning** creates brand-like visibility
- **Guaranteed placement** for days, not just hours
- Best for high-value items where sellers want maximum exposure

---

### 4. Spotlight Engine (Featured/Sponsored Slots) ✨

**What it does:**
- Shows promoted items in **special dedicated sections**:
  - **Homepage "Featured Products"** carousel/section
  - **Category "Sponsored"** block at top of category pages
  - **Search "Promoted Results"** above organic results
- Spotlight rotation (multiple products rotate in spotlight slots)
- Spotlight analytics (track impressions, clicks, engagement)
- Visual "Featured" or "Sponsored" badge on product cards

**Why it's critical:**
- Extra monetization channel (doesn't interfere with organic feed)
- High visibility for sellers (brand-like exposure)
- Products appear multiple times in user journey
- More expensive but very effective for brand building

**Impact on Seller Products/Sales:**
- **Brand-like visibility** (appears in premium sections)
- **Multiple touchpoints** (homepage, category, search)
- **Higher trust** (users associate featured with quality)
- **Better engagement** (dedicated sections get more attention)
- Best for sellers building brand awareness

---

## 📊 SUBSCRIPTION PLAN INTEGRATION

### DRIFT Plan (₦1,500/month) - Startup Plan

**Boost Engine:**
- ❌ No promotional boosts included
- ❌ Cannot purchase individual boosts
- ✅ Products ranked by base score only (no promotion multiplier)

**Ranking Engine:**
- ✅ Base visibility score only
- ✅ No promotion multipliers
- ✅ Organic ranking based on: freshness, engagement, media quality, location
- ⚠️ Lower priority than paid subscribers

**Top Placement:**
- ❌ Not available

**Spotlight:**
- ❌ Not available

**Overall Impact:**
- Very limited exposure in search
- Products appear after all paid subscribers
- Relies entirely on organic engagement and quality
- Best for testing the platform or very low-volume sellers

---

### WAVE Plan (₦3,000/month) - Basic Plan

**Boost Engine:**
- ✅ **1 free promotional boost per month** (24-hour duration)
- ✅ Can purchase additional boosts (₦500-₦2,000 depending on duration)
- ✅ Single boost only (no auto-reboost)
- ✅ Basic boost analytics

**Ranking Engine:**
- ✅ Base score + **1.5× boost multiplier** when boosted
- ✅ Highlighted in searches (visual indicator)
- ✅ Standard ranking when not boosted

**Top Placement:**
- ❌ Not available

**Spotlight:**
- ❌ Not available

**Overall Impact:**
- Moderate visibility boost when using monthly free boost
- Better than Drift but still limited
- Good for casual sellers who want occasional visibility
- Can purchase additional boosts for important listings

---

### TIDE Plan (₦5,500/month) - Business Plan

**Boost Engine:**
- ✅ **3 promotional boosts per month** (can choose duration: 1-day, 3-day, 7-day)
- ✅ Can purchase additional boosts at discounted rates
- ✅ **Auto-reboost available** (every 6h, 12h, or 24h)
- ✅ Advanced boost analytics (views, clicks, messages, conversion tracking)
- ✅ Location-specific boosting (target specific states/cities)

**Ranking Engine:**
- ✅ Base score + **2× boost multiplier** when boosted
- ✅ **Verified seller badge bonus** (+100 points)
- ✅ Priority visibility in buyer searches
- ✅ Higher base score due to verified status

**Top Placement:**
- ✅ **1 top placement per month** (7-day duration)
- ✅ Can purchase additional top placements
- ✅ Category-specific placement available

**Spotlight:**
- ✅ **1 spotlight slot per month** (7-day duration)
- ✅ Can purchase additional spotlight slots
- ✅ Available for homepage, category, or search spotlight

**Overall Impact:**
- Significant visibility boost with multiple promotion options
- Verified badge adds trust and priority
- Can combine boosts + top placement + spotlight for maximum exposure
- Best for serious sellers and small businesses
- Good ROI for sellers moving 10+ products per month

---

### SURGE Plan (₦7,000/month) - Enterprise Plan

**Boost Engine:**
- ✅ **Unlimited promotional boosts** (no monthly limit)
- ✅ All boost durations available (1-day, 3-day, 7-day)
- ✅ **Auto-reboost enabled by default** (configurable intervals)
- ✅ Premium boost analytics dashboard
- ✅ Location-specific boosting (unlimited)
- ✅ Priority boost processing (boosts activate faster)

**Ranking Engine:**
- ✅ Base score + **3× boost multiplier** when boosted
- ✅ **All bonuses active**: verified badge, trust score, media quality
- ✅ **Top ranking in search & feeds** (always prioritized)
- ✅ Maximum visibility score possible

**Top Placement:**
- ✅ **Unlimited top placements** (no monthly limit)
- ✅ All duration options (3-day, 7-day, 14-day)
- ✅ **Priority placement** in all categories
- ✅ Can place multiple products simultaneously

**Spotlight:**
- ✅ **Unlimited spotlight slots** (no monthly limit)
- ✅ **Priority placement** in all spotlight sections
- ✅ Can feature multiple products simultaneously
- ✅ Premium spotlight positions (homepage hero section)

**Overall Impact:**
- Maximum visibility and exposure
- All products posted are automatically promotional boost eligible
- Top priority customer service
- Best for stores, businesses, and high-volume sellers
- Unlimited promotion options = unlimited growth potential
- Highest ROI for sellers moving 50+ products per month

---

## 📈 IMPACT ON SELLER PERFORMANCE

### Sales Metrics Improvement

**Boost Engine Impact:**
- **Views:** +500% to +2000% during boost period
- **Chat Requests:** +300% to +500% increase
- **Conversion Rate:** +200% to +400% improvement
- **Time to Sale:** 40-60% reduction in days to sell

**Ranking Engine Impact:**
- **Organic Visibility:** +1000% to +4000% for high-scoring products
- **Search Position:** Move from page 5+ to page 1-2
- **Engagement:** +200% to +500% for verified sellers
- **Trust:** Verified badge increases buyer confidence by 60%

**Top Placement Impact:**
- **Views:** +1000% to +3000% increase
- **Conversion Rate:** +400% to +800% (highest of all engines)
- **Brand Recognition:** +300% increase in seller profile visits
- **ROI:** Best for high-value items (₦50,000+)

**Spotlight Impact:**
- **Brand Awareness:** +500% increase in seller recognition
- **Multiple Touchpoints:** Products seen 3-5× more in user journey
- **Premium Perception:** +400% increase in buyer trust
- **Engagement:** +300% increase in saves and shares

### Combined Promotion Strategy

**Best Practice for Sellers:**
1. **TIDE Plan sellers:** Use 1 boost + 1 top placement + 1 spotlight per month for maximum impact
2. **SURGE Plan sellers:** Combine unlimited boosts with strategic top placements and spotlight for brand building
3. **High-value items:** Prioritize top placement (best ROI)
4. **New listings:** Use boost to get initial visibility
5. **Seasonal items:** Use spotlight for maximum brand exposure

---

## 🎨 UI IMPACT & IMPLEMENTATION GUIDE

This section details what currently exists in the Flutter frontend and what needs to be added/modified to support the 4 promotion engines.

---

### 📱 HOMEPAGE (`flutter-ocean/lib/features/home/presentation/pages/home_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Stories section at top (horizontal scroll)
- Tab switcher (Products / Ads)
- Product feed with `PostCard` widgets
- Video feed tab
- Pull-to-refresh functionality
- Infinite scroll pagination

#### ❌ **NEEDS TO BE ADDED:**

**1. Featured Products Carousel (Spotlight Engine)**
- **Location:** Insert after stories section, before tab switcher
- **File:** Create new widget `flutter-ocean/lib/features/home/presentation/widgets/featured_products_carousel.dart`
- **Design:** 
  - Horizontal scrolling `PageView` or `ListView.builder` with 5-8 products
  - Product cards with "Featured" badge overlay
  - Auto-rotate every 5 seconds (optional)
  - "View All Featured" button at end
- **Data Source:** Backend endpoint `/api/products/spotlight?type=homepage`
- **Integration:** Add as `SliverToBoxAdapter` in `_buildProductTabScrollView` method

**2. Trending Products Section (Ranking Engine)**
- **Location:** Insert after tab switcher, before main feed
- **File:** Create new widget `flutter-ocean/lib/features/home/presentation/widgets/trending_products_section.dart`
- **Design:**
  - Section header: "🔥 Trending Now" with subtitle
  - Grid layout (2 columns mobile, 3-4 desktop) using existing `ProductCard`
  - Show top 6-12 products by visibility score
  - "Trending" badge on each product card
- **Data Source:** Backend endpoint `/api/products/trending?limit=12`
- **Integration:** Add as `SliverToBoxAdapter` before `SliverList` in feed

**3. Recommended for You Section (Ranking Engine)**
- **Location:** Insert after trending section, before main feed
- **File:** Create new widget `flutter-ocean/lib/features/home/presentation/widgets/recommended_products_section.dart`
- **Design:**
  - Section header: "✨ Recommended for You"
  - Personalized grid based on user behavior
  - Uses existing `ProductCard` widget
- **Data Source:** Backend endpoint `/api/products/recommended?userId={id}`
- **Integration:** Add as `SliverToBoxAdapter` before main feed

---

### 🛍️ PRODUCTS PAGE (`flutter-ocean/lib/features/products/presentation/pages/products_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Search bar with debouncing
- Category/subcategory filter chips (horizontal scroll)
- Filter bottom sheet (price, condition, location, AR model)
- Product grid using `ProductCard` widget
- Client-side filtering logic
- Empty state with "View Buyers Search Insights" button

#### ❌ **NEEDS TO BE ADDED:**

**1. Top Placement Section (Top Placement Engine)**
- **Location:** Very top of products grid, above all other products
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/top_placement_section.dart`
- **Design:**
  - Distinct card style with gold/premium border
  - "Top Placement" badge overlay
  - Limit: 3-5 top-placed products per category
  - Horizontal scroll or grid (2-3 products visible)
  - Different background color to stand out
- **Data Source:** Backend endpoint `/api/products/top-placement?category={category}`
- **Integration:** 
  - Add before `_buildGridView` in `build` method
  - Only show when category filter is active
  - Use conditional rendering: `if (_selectedCategory != null) TopPlacementSection(...)`

**2. Sponsored Block (Spotlight Engine)**
- **Location:** Below top placement, above organic grid
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/sponsored_products_section.dart`
- **Design:**
  - Section header: "⭐ Sponsored Products" or "Featured in [Category]"
  - Grid or carousel of 4-6 sponsored products
  - "Sponsored" badge on each product card
- **Data Source:** Backend endpoint `/api/products/spotlight?type=category&category={category}`
- **Integration:** Add between top placement and main grid

**3. Ranking-Based Sorting (Ranking Engine)**
- **Location:** Modify existing grid sorting
- **File:** Modify `products_page.dart` and `products_provider.dart`
- **Changes:**
  - Add sorting dropdown/button in filter bar
  - Default sort: "Relevance" (uses visibility score)
  - Options: "Relevance", "Price: Low to High", "Price: High to Low", "Newest", "Trending"
  - Backend should return products sorted by visibility score by default
- **Integration:** 
  - Modify `_fetchProducts` to accept `sortBy` parameter
  - Update `productsProvider.fetchProducts` to include sorting

**4. Promotion Badges on Product Cards**
- **Location:** Modify `ProductCard` widget
- **File:** `flutter-ocean/lib/core/widgets/product_card.dart`
- **Changes:**
  - Add promotion badge overlay in `_buildGridCard` method
  - Show badges based on product promotion status:
    - "Boosted" (orange/yellow) - if `product.isBoosted == true`
    - "Top Placement" (gold) - if `product.isTopPlaced == true`
    - "Featured" (blue) - if `product.isSpotlighted == true`
    - "Trending" (red/orange) - if `product.visibilityScore > threshold`
  - Position: Top-right corner of product image
  - Use `Stack` with `Positioned` widget

---

### 🔍 SEARCH RESULTS (Currently integrated in `products_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Search bar with real-time filtering
- Search results displayed in same grid as category products
- Client-side search filtering

#### ❌ **NEEDS TO BE ADDED:**

**1. Promoted Results Section (Spotlight Engine)**
- **Location:** Top of search results, above organic results
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/promoted_search_results.dart`
- **Design:**
  - Section header: "⭐ Promoted Results"
  - Horizontal scroll or compact grid of 3-5 promoted products
  - "Promoted" badge on each product
  - Only show if search query matches spotlight products
- **Data Source:** Backend endpoint `/api/products/search?q={query}&promoted=true`
- **Integration:**
  - Add conditional rendering in `_buildGridView` method
  - Show when `_activeSearch != null && promotedProducts.isNotEmpty`

**2. Ranking-Based Search Results (Ranking Engine)**
- **Location:** Modify search results sorting
- **File:** Modify `products_page.dart`
- **Changes:**
  - Backend should return search results sorted by relevance score (visibility score + search match)
  - Add boost/trending indicators to search result cards
- **Integration:** Backend handles sorting, frontend displays badges

---

### 📄 PRODUCT DETAIL PAGE (`flutter-ocean/lib/features/products/presentation/pages/product_detail_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Hero image section with `PageView` for image gallery
- Product header card (name, price, condition)
- Call seller button
- Pricing section
- Product details card
- AR section card (if AR model exists)
- Seller information + feedback card (`_buildSellerSectionCard`)
- Bottom action bar (Message Seller, Save, Share buttons)

#### ❌ **NEEDS TO BE ADDED:**

**1. Similar Products Section (Ranking Engine)**
- **Location:** Insert after product details card, before AR section
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/similar_products_section.dart`
- **Design:**
  - Section header: "Similar Products" or "You May Also Like"
  - Horizontal scrolling `ListView` with 6-10 products
  - Uses existing `ProductCard` with `ProductCardType.list` or custom compact card
  - Show promotion badges on each product
- **Data Source:** Backend endpoint `/api/products/${productId}/similar?limit=10`
- **Algorithm:** Same category/subcategory, similar price range, same location, high visibility score
- **Integration:** Add as new `Card` widget in `SliverToBoxAdapter` content

**2. Trending in Category Section (Ranking Engine)**
- **Location:** Insert after similar products, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/trending_category_section.dart`
- **Design:**
  - Section header: "🔥 Trending in [Category]"
  - Grid of 4-6 products from same category
  - Uses existing `ProductCard` widget
  - Show "Trending" badge on high-scoring products
- **Data Source:** Backend endpoint `/api/products/trending?category=${product.category}&limit=6`
- **Integration:** Add as new `Card` widget in detail page

**3. Recommended for You Section (Ranking Engine)**
- **Location:** Insert after trending section, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/products/presentation/widgets/recommended_detail_section.dart`
- **Design:**
  - Section header: "✨ Recommended for You"
  - Personalized grid based on user profile
  - Uses existing `ProductCard` widget
- **Data Source:** Backend endpoint `/api/products/recommended?userId={id}&limit=6`
- **Integration:** Add as new `Card` widget in detail page

---

### 🔨 AUCTION DETAIL PAGE (`flutter-ocean/lib/features/market_survey/presentation/pages/auction_detail_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Hero image section with image gallery
- Auction header (title, current bid, time remaining)
- Bidding section with bid modal
- Recent bids list
- Seller information + feedback card (`_buildSellerSectionCard`)

#### ❌ **NEEDS TO BE ADDED:**

**1. Similar Auctions Section (Ranking Engine)**
- **Location:** Insert before `_buildSellerSectionCard`, after auction details
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/similar_auctions_section.dart`
- **Design:**
  - Section header: "Similar Auctions" or "You May Also Like"
  - Horizontal scrolling `ListView` with 6-10 auctions
  - Uses compact auction cards showing: image, title, current bid, time remaining
  - Show promotion badges if auction is boosted/featured
- **Data Source:** Backend endpoint `/api/auctions/${auctionId}/similar?limit=10`
- **Algorithm:** Same category, similar price range, active auctions, high visibility score
- **Integration:** Add as new `Card` widget before seller section

**2. Trending Auctions Section (Ranking Engine)**
- **Location:** Insert after similar auctions, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/trending_auctions_section.dart`
- **Design:**
  - Section header: "🔥 Trending Auctions"
  - Grid of 4-6 trending auctions from same category
  - Show "Trending" badge on high-scoring auctions
- **Data Source:** Backend endpoint `/api/auctions/trending?category=${category}&limit=6`
- **Integration:** Add as new `Card` widget before seller section

---

### 🔄 SWAP DEAL DETAIL PAGE (`flutter-ocean/lib/features/market_survey/presentation/pages/swap_deal_detail_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Hero image section with image gallery
- Swap deal header (initiator item, wanted item)
- Proposals section
- AR model section (if available)
- Seller information + feedback card (`_buildSellerSectionCard`)

#### ❌ **NEEDS TO BE ADDED:**

**1. Similar Swap Deals Section (Ranking Engine)**
- **Location:** Insert before `_buildSellerSectionCard`, after proposals section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/similar_swap_deals_section.dart`
- **Design:**
  - Section header: "Similar Swap Deals" or "You May Also Like"
  - Horizontal scrolling `ListView` with 6-10 swap deals
  - Compact swap deal cards showing: image, items, status
  - Show promotion badges if swap deal is boosted/featured
- **Data Source:** Backend endpoint `/api/swap-deals/${swapDealId}/similar?limit=10`
- **Algorithm:** Same category, similar items, active deals, high visibility score
- **Integration:** Add as new `Card` widget before seller section

**2. Trending Swap Deals Section (Ranking Engine)**
- **Location:** Insert after similar swap deals, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/trending_swap_deals_section.dart`
- **Design:**
  - Section header: "🔥 Trending Swap Deals"
  - Grid of 4-6 trending swap deals
  - Show "Trending" badge on high-scoring deals
- **Data Source:** Backend endpoint `/api/swap-deals/trending?limit=6`
- **Integration:** Add as new `Card` widget before seller section

---

### 👥 BULK PURCHASE DETAIL PAGE (`flutter-ocean/lib/features/market_survey/presentation/pages/bulk_purchase_detail_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Hero image section with image gallery
- Group buy header (product name, group price, target quantity)
- Participants section
- Join/Leave group buy functionality
- Seller information + feedback section (`SellerFeedbackSection`)

#### ❌ **NEEDS TO BE ADDED:**

**1. Similar Group Buys Section (Ranking Engine)**
- **Location:** Insert before `SellerFeedbackSection`, after participants section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/similar_group_buys_section.dart`
- **Design:**
  - Section header: "Similar Group Buys" or "You May Also Like"
  - Horizontal scrolling `ListView` with 6-10 group buys
  - Compact group buy cards showing: image, product name, group price, progress
  - Show promotion badges if group buy is boosted/featured
- **Data Source:** Backend endpoint `/api/group-buys/${bulkPurchaseId}/similar?limit=10`
- **Algorithm:** Same category, similar price range, active group buys, high visibility score
- **Integration:** Add as new `Card` widget before seller section

**2. Trending Group Buys Section (Ranking Engine)**
- **Location:** Insert after similar group buys, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/trending_group_buys_section.dart`
- **Design:**
  - Section header: "🔥 Trending Group Buys"
  - Grid of 4-6 trending group buys from same category
  - Show "Trending" badge on high-scoring group buys
- **Data Source:** Backend endpoint `/api/group-buys/trending?category=${category}&limit=6`
- **Integration:** Add as new `Card` widget before seller section

---

### 🔥 DISTRESS SALE DETAIL PAGE (`flutter-ocean/lib/features/market_survey/presentation/pages/distress_sale_detail_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Hero image section with image gallery
- Distress sale header (product name, original price, distress price, discount)
- Countdown timer
- AR model section (if available)
- Seller information + feedback card (`_buildSellerSectionCard`)

#### ❌ **NEEDS TO BE ADDED:**

**1. Similar Distress Sales Section (Ranking Engine)**
- **Location:** Insert before `_buildSellerSectionCard`, after AR section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/similar_distress_sales_section.dart`
- **Design:**
  - Section header: "Similar Distress Sales" or "You May Also Like"
  - Horizontal scrolling `ListView` with 6-10 distress sales
  - Compact distress sale cards showing: image, product name, distress price, discount %
  - Show promotion badges if distress sale is boosted/featured
- **Data Source:** Backend endpoint `/api/distress-sales/${distressSaleId}/similar?limit=10`
- **Algorithm:** Same category, similar price range, active sales, high visibility score
- **Integration:** Add as new `Card` widget before seller section

**2. Trending Distress Sales Section (Ranking Engine)**
- **Location:** Insert after similar distress sales, before seller section
- **File:** Create new widget `flutter-ocean/lib/features/market_survey/presentation/widgets/trending_distress_sales_section.dart`
- **Design:**
  - Section header: "🔥 Trending Distress Sales"
  - Grid of 4-6 trending distress sales from same category
  - Show "Trending" badge on high-scoring sales
- **Data Source:** Backend endpoint `/api/distress-sales/trending?category=${category}&limit=6`
- **Integration:** Add as new `Card` widget before seller section

---

### 📋 LISTING PAGES (Auctions, Swap Deals, Bulk Purchases, Distress Sales)

#### ✅ **CURRENTLY EXISTS:**
- Grid/list views of items
- Filtering capabilities
- Search functionality

#### ❌ **NEEDS TO BE ADDED:**

**1. Top Placement Sections for Each Type**
- **Files:**
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/top_placement_auctions_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/top_placement_swap_deals_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/top_placement_group_buys_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/top_placement_distress_sales_section.dart`
- **Location:** Top of each listing page, above organic listings
- **Design:** Similar to products page top placement section
- **Data Source:** Backend endpoints for each type:
  - `/api/auctions/top-placement?category={category}`
  - `/api/swap-deals/top-placement`
  - `/api/group-buys/top-placement?category={category}`
  - `/api/distress-sales/top-placement?category={category}`

**2. Sponsored Sections for Each Type (Spotlight Engine)**
- **Files:**
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/sponsored_auctions_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/sponsored_swap_deals_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/sponsored_group_buys_section.dart`
  - `flutter-ocean/lib/features/market_survey/presentation/widgets/sponsored_distress_sales_section.dart`
- **Location:** Below top placement, above organic listings
- **Design:** Similar to products page sponsored section
- **Data Source:** Backend endpoints for each type with `spotlight=true` parameter

**3. Promotion Badges on Item Cards**
- **Files:** Modify existing card widgets for each type:
  - Auction cards (in `auctions_page.dart`)
  - Swap deal cards (in `swap_deals_page.dart`)
  - Group buy cards (in `bulk_purchases_page.dart`)
  - Distress sale cards (in `distress_sales_page.dart`)
- **Changes:** Add promotion badge overlay similar to `ProductCard`
- **Badge Types:** Boosted, Top Placement, Featured, Trending

---

### 🎴 PRODUCT CARD WIDGET (`flutter-ocean/lib/core/widgets/product_card.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Multiple card types: `grid`, `list`, `feed`, `distressSale`, `auction`, `uploaded`, `swap`, `profile`
- Product image display with `CachedNetworkImage`
- Price display with currency symbol
- Product name
- Condition chip (for auction/swap cards)
- Seller info display
- Stats row (views, likes) for profile cards
- Popup menu for edit/delete actions
- AR model indicator (implicit via `arModel` field)

#### ❌ **NEEDS TO BE ADDED:**

**1. Promotion Badge Overlay**
- **Location:** Top-right corner of product image in all card types
- **File:** Modify `product_card.dart`
- **Changes:**
  - Add new method `_buildPromotionBadge()` that returns badge widget
  - Badge types:
    - **Boosted:** Orange/yellow badge with rocket icon (🔥 or 🚀)
    - **Top Placement:** Gold badge with crown icon (👑)
    - **Featured/Spotlight:** Blue badge with star icon (⭐)
    - **Trending:** Red/orange badge with fire icon (🔥)
  - Use `Stack` with `Positioned` widget in image section
  - Badge should be small but visible (24-32px)
- **Integration:**
  - Add to `_buildGridCard`, `_buildListCard`, `_buildFeedCard` methods
  - Check product model fields: `isBoosted`, `isTopPlaced`, `isSpotlighted`, `visibilityScore`
  - Priority: Top Placement > Featured > Boosted > Trending

**2. Verified Seller Badge**
- **Location:** Next to seller name or as overlay on seller avatar
- **File:** Modify `_buildSellerInfo` and `_buildSellerAvatar` methods
- **Changes:**
  - Green checkmark icon next to seller name
  - Or small verified badge overlay on avatar
  - Only show if seller is verified
- **Integration:** Check seller profile `isVerified` field

**3. Promotion Info Tooltip (Optional)**
- **Location:** Long-press on promotion badge
- **File:** Add tooltip widget
- **Changes:**
  - Show boost expiration time
  - Show placement duration remaining
  - Show visibility score (optional, for transparency)
- **Integration:** Use `Tooltip` or `showDialog` on badge tap

**4. Product Model Updates**
- **File:** `flutter-ocean/lib/core/models/product_model.dart`
- **Changes:** Add new optional fields:
  ```dart
  final bool? isBoosted;
  final DateTime? boostExpiresAt;
  final bool? isTopPlaced;
  final DateTime? topPlacementExpiresAt;
  final bool? isSpotlighted;
  final DateTime? spotlightExpiresAt;
  final double? visibilityScore;
  final bool? sellerVerified;
  ```

---

### 👤 PROFILE PAGE (`flutter-ocean/lib/features/profile/presentation/pages/profile_page.dart`)

#### ✅ **CURRENTLY EXISTS:**
- Profile header with cover picture and profile picture
- Business info card (editable inline)
- Tab controller for different content types (Products, Videos, Auctions, etc.)
- Product grid using `ProductCard` with `ProductCardType.profile`
- Stats display (views, likes) on profile cards

#### ❌ **NEEDS TO BE ADDED:**

**1. Promotion Analytics Dashboard**
- **Location:** New tab or section in profile page
- **File:** Create new page `flutter-ocean/lib/features/profile/presentation/pages/promotion_analytics_page.dart`
- **Design:**
  - Overview cards: Active boosts, Top placements, Spotlight slots
  - Performance metrics: Views, Clicks, Messages during promotion
  - Charts: Boost performance over time
  - ROI calculator: Revenue from promotions vs cost
- **Data Source:** Backend endpoint `/api/boosts/analytics?userId={id}`
- **Integration:** Add new tab in profile page or navigate from menu

**2. Promotion Management Section**
- **Location:** New page or modal
- **File:** Create new page `flutter-ocean/lib/features/profile/presentation/pages/promotion_management_page.dart`
- **Design:**
  - List of user's products
  - "Boost" button on each product
  - "Top Placement" purchase option
  - "Spotlight" request option
  - Active promotions list with cancel option
  - Auto-reboost toggle (for TIDE/SURGE plans)
- **Data Source:** Backend endpoints for creating/managing promotions
- **Integration:** Add navigation from profile page or product detail page

**3. Visibility Score Display**
- **Location:** In product detail view or promotion management
- **File:** Create widget `flutter-ocean/lib/features/profile/presentation/widgets/visibility_score_widget.dart`
- **Design:**
  - Current product visibility scores
  - Score breakdown (showing each factor)
  - Tips to improve score
  - Comparison with category average
- **Data Source:** Backend endpoint `/api/products/${productId}/visibility-score`
- **Integration:** Show in promotion management or product detail page

---

### 🎨 NEW WIDGETS TO CREATE

**1. Promotion Badge Widget**
- **File:** `flutter-ocean/lib/core/widgets/promotion_badge.dart`
- **Purpose:** Reusable badge component for all promotion types
- **Props:** `PromotionType` enum, `expiresAt` DateTime, `onTap` callback

**2. Featured Products Carousel**
- **File:** `flutter-ocean/lib/features/home/presentation/widgets/featured_products_carousel.dart`
- **Purpose:** Horizontal scrolling carousel for spotlight products

**3. Trending Products Section**
- **File:** `flutter-ocean/lib/features/home/presentation/widgets/trending_products_section.dart`
- **Purpose:** Grid section showing trending products

**4. Recommended Products Section**
- **File:** `flutter-ocean/lib/features/home/presentation/widgets/recommended_products_section.dart`
- **Purpose:** Personalized product recommendations

**5. Top Placement Section**
- **File:** `flutter-ocean/lib/features/products/presentation/widgets/top_placement_section.dart`
- **Purpose:** Premium top-placed products display

**6. Sponsored Products Section**
- **File:** `flutter-ocean/lib/features/products/presentation/widgets/sponsored_products_section.dart`
- **Purpose:** Category-specific sponsored products

**7. Similar Products Section**
- **File:** `flutter-ocean/lib/features/products/presentation/widgets/similar_products_section.dart`
- **Purpose:** Related products on detail page

**8. Trending Category Section**
- **File:** `flutter-ocean/lib/features/products/presentation/widgets/trending_category_section.dart`
- **Purpose:** Trending products in same category

**For Auctions:**
- `similar_auctions_section.dart`
- `trending_auctions_section.dart`
- `top_placement_auctions_section.dart`
- `sponsored_auctions_section.dart`

**For Swap Deals:**
- `similar_swap_deals_section.dart`
- `trending_swap_deals_section.dart`
- `top_placement_swap_deals_section.dart`
- `sponsored_swap_deals_section.dart`

**For Group Buys:**
- `similar_group_buys_section.dart`
- `trending_group_buys_section.dart`
- `top_placement_group_buys_section.dart`
- `sponsored_group_buys_section.dart`

**For Distress Sales:**
- `similar_distress_sales_section.dart`
- `trending_distress_sales_section.dart`
- `top_placement_distress_sales_section.dart`
- `sponsored_distress_sales_section.dart`

---

### 📦 BACKEND API ENDPOINTS NEEDED

**1. Promotion Data Endpoints:**
- `GET /api/products/spotlight?type={homepage|category|search}`
- `GET /api/products/trending?limit={n}&category={category}`
- `GET /api/products/recommended?userId={id}&limit={n}`
- `GET /api/products/top-placement?category={category}`
- `GET /api/products/${productId}/similar?limit={n}`
- `GET /api/products/${productId}/visibility-score`

**2. Promotion Management Endpoints:**
- `POST /api/boosts` (create boost)
- `GET /api/boosts` (list user's boosts)
- `GET /api/boosts/analytics` (boost analytics)
- `POST /api/top-placement` (purchase top placement)
- `POST /api/spotlight` (request spotlight)

**For Auctions:**
- `GET /api/auctions/${auctionId}/similar?limit={n}`
- `GET /api/auctions/trending?category={category}&limit={n}`
- `GET /api/auctions/top-placement?category={category}`
- `GET /api/auctions/spotlight?type={homepage|category}`

**For Swap Deals:**
- `GET /api/swap-deals/${swapDealId}/similar?limit={n}`
- `GET /api/swap-deals/trending?limit={n}`
- `GET /api/swap-deals/top-placement`
- `GET /api/swap-deals/spotlight?type={homepage|category}`

**For Group Buys:**
- `GET /api/group-buys/${bulkPurchaseId}/similar?limit={n}`
- `GET /api/group-buys/trending?category={category}&limit={n}`
- `GET /api/group-buys/top-placement?category={category}`
- `GET /api/group-buys/spotlight?type={homepage|category}`

**For Distress Sales:**
- `GET /api/distress-sales/${distressSaleId}/similar?limit={n}`
- `GET /api/distress-sales/trending?category={category}&limit={n}`
- `GET /api/distress-sales/top-placement?category={category}`
- `GET /api/distress-sales/spotlight?type={homepage|category}`

---

## 🔄 IMPLEMENTATION PRIORITY

### Phase 1: Enhanced Boost Engine (Weeks 1-2)
- Auto-reboost functionality
- Boost analytics dashboard
- Multi-duration boost packages
- Location-specific boosting
- UI: Boost badges, boost management UI

### Phase 2: Ranking/Scoring Engine (Weeks 3-4)
- Enhanced scoring algorithm
- Dynamic ranking system (hourly recalculation)
- Category-specific weights
- UI: Trending sections, visibility score display

### Phase 3: Top Placement Engine (Weeks 5-6)
- Top placement slots system
- Duration management
- Placement analytics
- UI: Top placement section, premium badges

### Phase 4: Spotlight Engine (Weeks 7-8)
- Homepage featured section
- Category spotlight blocks
- Search promoted results
- UI: Featured carousels, sponsored sections

---

## 💰 REVENUE POTENTIAL

**Per Boost:**
- 1-day boost: ₦500-₦1,000
- 3-day boost: ₦1,200-₦2,000
- 7-day boost: ₦2,500-₦4,000

**Per Top Placement:**
- 3-day placement: ₦3,000-₦5,000
- 7-day placement: ₦6,000-₦10,000
- 14-day placement: ₦12,000-₦20,000

**Per Spotlight:**
- 7-day spotlight: ₦5,000-₦10,000
- 14-day spotlight: ₦10,000-₦15,000
- Premium homepage spotlight: ₦15,000-₦25,000

**Estimated Monthly Revenue per Active Seller:**
- **WAVE:** ₦3,000 (subscription) + ₦500-₦2,000 (occasional boosts) = **₦3,500-₦5,000**
- **TIDE:** ₦5,500 (subscription) + ₦3,000-₦8,000 (promotions) = **₦8,500-₦13,500**
- **SURGE:** ₦7,000 (subscription) + ₦10,000-₦30,000+ (unlimited promotions) = **₦17,000-₦37,000+**

---

## 📝 NOTES

- All promotion engines work together synergistically
- Ranking engine is the foundation - must be built first or alongside boost engine
- UI components should be modular and reusable across pages
- Analytics are critical for seller retention and upselling
- Promotion badges should be subtle but noticeable
- Mobile-first design for all new UI components
