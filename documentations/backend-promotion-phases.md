# Backend Promotion System Implementation Plan

This document outlines the backend implementation plan for the 4 core promotion engines with subscription plan gating.

---

## 📋 CURRENT STATE ANALYSIS

### ✅ Already Implemented:
- Basic boost system (`PromotionalBoost` model, controller, service)
- Subscription system (plans: DRIFT, WAVE, TIDE, SURGE)
- Database migrations for promotion tables (`top_placements`, `spotlight_slots`, `visibility_scores`)
- Promotion fields added to products, auctions, swap_deals, group_buys, distress_sales
- Basic boost management service (`boostManagementService.js`)

### ❌ Missing/Needs Enhancement:
- Enhanced Boost Engine (auto-reboost, location targeting, duration packages)
- Ranking/Scoring Engine (visibility score calculation service)
- Top Placement Engine (controllers, services, subscription gating)
- Spotlight Engine (controllers, services, subscription gating)
- Subscription plan gating logic for all engines
- Analytics tracking for all promotion types
- Cron jobs for score recalculation and expiration handling

---

## 🎯 BACKEND IMPLEMENTATION PHASES

### Phase 1: Enhanced Boost Engine ⭐ (Priority 1)

**Goal:** Upgrade existing boost system with advanced features and subscription gating

**Tasks:**

#### 1.1 Database Enhancements
- ✅ `promotional_boosts` table exists
- ❌ Add columns to `promotional_boosts`:
  - `auto_reboost` BOOLEAN DEFAULT FALSE
  - `reboost_interval_hours` INT (6, 12, or 24)
  - `location_target` JSON (target states/cities)
  - `boost_package` ENUM('1-day', '3-day', '7-day')
  - `cost` DECIMAL(10,2) (for purchased boosts)
  - `is_free` BOOLEAN (for monthly free boosts)
- **File:** `ocean_server/migrations/2024-12-26-enhance-boost-system.sql`

#### 1.2 Boost Service Enhancement
- ❌ Enhance `boostManagementService.js`:
  - Auto-reboost functionality
  - Location targeting logic
  - Boost package validation (1-day, 3-day, 7-day)
  - Boost cost calculation based on plan
- **File:** `ocean_server/src/services/boostManagementService.js`

#### 1.3 Subscription Gating Service
- ❌ Create `promotionGatingService.js`:
  - Check if user can create boost (based on plan)
  - Validate monthly boost limits
  - Check if auto-reboost is allowed
  - Calculate boost cost (free vs paid)
  - Validate boost duration options per plan
  - Check top placement eligibility
  - Check spotlight eligibility
  - Get available promotions for user
- **File:** `ocean_server/src/services/promotionGatingService.js`

#### 1.4 Boost Controller Enhancement
- ❌ Enhance `promotionalBoostController.js`:
  - `POST /api/boosts` - Create boost with subscription check
  - `POST /api/boosts/:id/auto-reboost` - Enable/disable auto-reboost
  - `GET /api/boosts/available` - Get available boosts for user (based on plan)
  - `GET /api/boosts/analytics` - Enhanced analytics with performance metrics
  - `GET /api/boosts/pricing` - Get boost pricing based on plan
- **File:** `ocean_server/src/controllers/promotionalBoostController.js`

#### 1.5 Auto-Reboost Cron Job
- ❌ Create auto-reboost scheduler:
  - Check active boosts with auto-reboost enabled
  - Reboost items when interval expires
  - Update boost records
- **File:** `ocean_server/src/services/autoReboostService.js`
- **File:** `ocean_server/src/jobs/autoReboostJob.js` (if using job scheduler)

**Subscription Plan Gating:**
- **DRIFT:** ❌ No boosts allowed
- **WAVE:** ✅ 1 free boost/month (24h), can purchase additional
- **TIDE:** ✅ 3 boosts/month (1-7 day options), auto-reboost available
- **SURGE:** ✅ Unlimited boosts, auto-reboost by default

**Deliverables:**
- Enhanced boost system with auto-reboost
- Location targeting support
- Subscription gating fully implemented
- Boost analytics with performance metrics

---

### Phase 2: Ranking/Scoring Engine 🧠 (Priority 2 - Foundation)

**Goal:** Implement visibility score calculation system

**Tasks:**

#### 2.1 Visibility Score Service
- ❌ Create `visibilityScoreService.js`:
  - Calculate visibility score for items
  - Score breakdown calculation:
    - Promotion weight (boosted +300, top placement +500, spotlight +400)
    - Seller reputation (verified +100, trust score +50)
    - Media quality (video +50, 5+ images +30, AR +40)
    - Engagement metrics (views, saves, messages, likes)
    - Freshness (newer = higher, decays over time)
    - Location match (+20 if buyer location matches)
    - Category relevance (+30 for exact match)
  - Category-specific weights
  - Score recalculation logic
  - Apply subscription multipliers (WAVE 1.5×, TIDE 2×, SURGE 3×)
- **File:** `ocean_server/src/services/visibilityScoreService.js`

#### 2.2 Score Calculation Controller
- ❌ Create `visibilityScoreController.js`:
  - `POST /api/visibility-scores/calculate` - Manual recalculation (admin)
  - `GET /api/visibility-scores/:itemType/:itemId` - Get score for item
  - `GET /api/visibility-scores/:itemType/:itemId/breakdown` - Get score breakdown
- **File:** `ocean_server/src/controllers/visibilityScoreController.js`

#### 2.3 Score Recalculation Cron Job
- ❌ Create hourly score recalculation job:
  - Recalculate scores for all active items
  - Update `visibility_scores` table
  - Update item tables with latest score
- **File:** `ocean_server/src/services/scoreRecalculationService.js`
- **File:** `ocean_server/src/jobs/scoreRecalculationJob.js`

#### 2.4 Ranking Service
- ❌ Create `rankingService.js`:
  - Get trending items (by visibility score)
  - Get recommended items (personalized based on user behavior)
  - Get similar items (category + score based)
  - Apply subscription multipliers (WAVE 1.5×, TIDE 2×, SURGE 3×)
  - Category-specific ranking
- **File:** `ocean_server/src/services/rankingService.js`

**Subscription Plan Impact:**
- **DRIFT:** Base score only, no multipliers
- **WAVE:** Base score + 1.5× when boosted
- **TIDE:** Base score + 2× when boosted, verified badge +100
- **SURGE:** Base score + 3× when boosted, all bonuses active

**Deliverables:**
- Visibility score calculation service
- Hourly score recalculation
- Ranking service for trending/recommended/similar
- Score breakdown API

---

### Phase 3: Top Placement Engine 💎 (Priority 3)

**Goal:** Implement top placement system with subscription gating

**Tasks:**

#### 3.1 Top Placement Model
- ✅ `top_placements` table exists
- ❌ Create `TopPlacement` model:
  - Model definition
  - Associations (UserSubscription, UserTable)
- **File:** `ocean_server/models/TopPlacement.js`

#### 3.2 Top Placement Service
- ❌ Create `topPlacementService.js`:
  - Create top placement
  - Validate subscription limits
  - Check slot availability
  - Apply placement to items (update is_top_placed, top_placement_id, top_placement_expires_at)
  - Handle expiration
  - Priority management (SURGE gets priority)
  - Category-specific placement logic
- **File:** `ocean_server/src/services/topPlacementService.js`

#### 3.3 Top Placement Controller
- ❌ Create `topPlacementController.js`:
  - `POST /api/top-placement` - Purchase top placement
  - `GET /api/top-placement` - Get user's top placements
  - `GET /api/top-placement/:itemType` - Get top placements by type
  - `GET /api/top-placement/:itemType/:category` - Get top placements for category
  - `DELETE /api/top-placement/:id` - Cancel placement
  - `GET /api/top-placement/analytics` - Placement analytics
- **File:** `ocean_server/src/controllers/topPlacementController.js`

#### 3.4 Top Placement Expiration Job
- ❌ Create expiration handler:
  - Check expired placements
  - Remove from items (set is_top_placed = false, clear top_placement_id)
  - Update status to 'expired'
- **File:** `ocean_server/src/services/topPlacementService.js` (add expiration method)

**Subscription Plan Gating:**
- **DRIFT:** ❌ Not available
- **WAVE:** ❌ Not available
- **TIDE:** ✅ 1 top placement/month (7-day), can purchase additional
- **SURGE:** ✅ Unlimited top placements (3, 7, 14-day options)

**Deliverables:**
- Top placement service and controller
- Subscription gating
- Expiration handling
- Analytics tracking

---

### Phase 4: Spotlight Engine ✨ (Priority 4)

**Goal:** Implement spotlight/featured system with subscription gating

**Tasks:**

#### 4.1 Spotlight Model
- ✅ `spotlight_slots` table exists
- ❌ Create `SpotlightSlot` model:
  - Model definition
  - Associations (UserSubscription, UserTable)
- **File:** `ocean_server/models/SpotlightSlot.js`

#### 4.2 Spotlight Service
- ❌ Create `spotlightService.js`:
  - Create spotlight slot
  - Validate subscription limits
  - Slot rotation logic
  - Display order management
  - Track impressions and clicks
  - Handle expiration
  - Apply spotlight to items (update is_spotlighted, spotlight_id, spotlight_expires_at)
  - Priority placement for SURGE plan
- **File:** `ocean_server/src/services/spotlightService.js`

#### 4.3 Spotlight Controller
- ❌ Create `spotlightController.js`:
  - `POST /api/spotlight` - Request spotlight slot
  - `GET /api/spotlight` - Get user's spotlight slots
  - `GET /api/spotlight/:slotType` - Get spotlight items by type (homepage/category/search)
  - `GET /api/spotlight/:slotType/:category` - Get category spotlight
  - `POST /api/spotlight/:id/impression` - Track impression
  - `POST /api/spotlight/:id/click` - Track click
  - `DELETE /api/spotlight/:id` - Cancel spotlight
  - `GET /api/spotlight/analytics` - Spotlight analytics
- **File:** `ocean_server/src/controllers/spotlightController.js`

#### 4.4 Spotlight Expiration Job
- ❌ Create expiration handler:
  - Check expired spotlights
  - Remove from items (set is_spotlighted = false, clear spotlight_id)
  - Update status to 'expired'
- **File:** `ocean_server/src/services/spotlightService.js` (add expiration method)

**Subscription Plan Gating:**
- **DRIFT:** ❌ Not available
- **WAVE:** ❌ Not available
- **TIDE:** ✅ 1 spotlight/month (7-day), can purchase additional
- **SURGE:** ✅ Unlimited spotlights, priority placement

**Deliverables:**
- Spotlight service and controller
- Subscription gating
- Impression/click tracking
- Expiration handling
- Analytics tracking

---

### Phase 5: Integration & API Endpoints

**Goal:** Integrate all engines into existing product/auction/swap/group-buy/distress-sale endpoints

**Tasks:**

#### 5.1 Product Controller Integration
- ❌ Update `productController.js`:
  - `GET /api/products/trending` - Use ranking service
  - `GET /api/products/recommended` - Use ranking service
  - `GET /api/products/:id/similar` - Use ranking service
  - `GET /api/products/spotlight` - Use spotlight service
  - `GET /api/products/top-placement` - Use top placement service
  - Include promotion fields in product responses
  - Sort products by visibility score by default
- **File:** `ocean_server/src/controllers/productController.js`

#### 5.2 Auction Controller Integration
- ❌ Update `auctionController.js`:
  - `GET /api/auctions/trending` - Use ranking service
  - `GET /api/auctions/:id/similar` - Use ranking service
  - `GET /api/auctions/top-placement` - Use top placement service
  - `GET /api/auctions/spotlight` - Use spotlight service
  - Include promotion fields in auction responses
- **File:** `ocean_server/src/controllers/auctionController.js`

#### 5.3 Swap Deal Controller Integration
- ❌ Update `swapDealController.js`:
  - `GET /api/swap-deals/trending` - Use ranking service
  - `GET /api/swap-deals/:id/similar` - Use ranking service
  - `GET /api/swap-deals/top-placement` - Use top placement service
  - `GET /api/swap-deals/spotlight` - Use spotlight service
  - Include promotion fields in swap deal responses
- **File:** `ocean_server/src/controllers/swapDealController.js`

#### 5.4 Group Buy Controller Integration
- ❌ Update `groupBuyController.js`:
  - `GET /api/group-buys/trending` - Use ranking service
  - `GET /api/group-buys/:id/similar` - Use ranking service
  - `GET /api/group-buys/top-placement` - Use top placement service
  - `GET /api/group-buys/spotlight` - Use spotlight service
  - Include promotion fields in group buy responses
- **File:** `ocean_server/src/controllers/groupBuyController.js`

#### 5.5 Distress Sale Controller Integration
- ❌ Update `distressSaleController.js`:
  - `GET /api/distress-sales/trending` - Use ranking service
  - `GET /api/distress-sales/:id/similar` - Use ranking service
  - `GET /api/distress-sales/top-placement` - Use top placement service
  - `GET /api/distress-sales/spotlight` - Use spotlight service
  - Include promotion fields in distress sale responses
- **File:** `ocean_server/src/controllers/distressSaleController.js`

**Deliverables:**
- All listing endpoints return promoted items first
- All detail endpoints include similar/trending/recommended
- Promotion fields included in all item responses
- Products sorted by visibility score by default

---

### Phase 6: Analytics & Reporting

**Goal:** Comprehensive analytics for all promotion types

**Tasks:**

#### 6.1 Promotion Analytics Service
- ❌ Create `promotionAnalyticsService.js`:
  - Aggregate analytics across all promotion types
  - Performance metrics (views, clicks, messages, conversions)
  - ROI calculations
  - Comparison reports
  - Time-series data for charts
- **File:** `ocean_server/src/services/promotionAnalyticsService.js`

#### 6.2 Promotion Analytics Controller
- ❌ Create `promotionAnalyticsController.js`:
  - `GET /api/promotions/analytics` - Overall analytics
  - `GET /api/promotions/analytics/boost` - Boost analytics
  - `GET /api/promotions/analytics/top-placement` - Top placement analytics
  - `GET /api/promotions/analytics/spotlight` - Spotlight analytics
  - `GET /api/promotions/analytics/performance` - Performance comparison
  - `GET /api/promotions/analytics/recent` - Recent promotions with metrics
- **File:** `ocean_server/src/controllers/promotionAnalyticsController.js`

#### 6.3 Performance Tracking
- ❌ Add performance tracking to all promotion types:
  - Track views during promotion period
  - Track clicks/interactions
  - Track messages/chat requests
  - Track conversions (if applicable)
- **Files:** Update all promotion services to track metrics

**Deliverables:**
- Comprehensive analytics API
- Performance tracking
- ROI calculations
- Time-series analytics data

---

### Phase 7: Cron Jobs & Background Tasks

**Goal:** Automated background processing

**Tasks:**

#### 7.1 Expiration Handlers
- ❌ Create cron jobs:
  - Expired boosts cleanup (every hour)
  - Expired top placements cleanup (every hour)
  - Expired spotlights cleanup (every hour)
  - Auto-reboost execution (every hour, check intervals)
- **File:** `ocean_server/src/jobs/promotionExpirationJob.js`

#### 7.2 Score Recalculation
- ❌ Create hourly job:
  - Recalculate all visibility scores
  - Update `visibility_scores` table
  - Update item tables with latest score
- **File:** `ocean_server/src/jobs/scoreRecalculationJob.js`

#### 7.3 Monthly Reset
- ❌ Create monthly job (runs on 1st of each month):
  - Reset monthly boost/placement/spotlight counters
  - Update subscription usage
  - Reset promotion_usage table
- **File:** `ocean_server/src/jobs/monthlyPromotionResetJob.js`

#### 7.4 Job Scheduler Setup
- ❌ Set up job scheduler (node-cron or similar):
  - Configure all cron jobs
  - Error handling and logging
  - Job monitoring
- **File:** `ocean_server/src/jobs/scheduler.js`

**Deliverables:**
- All cron jobs implemented
- Automated expiration handling
- Score recalculation automation
- Monthly reset automation

---

## 📊 SUBSCRIPTION PLAN GATING MATRIX

| Feature | DRIFT | WAVE | TIDE | SURGE |
|---------|-------|------|------|-------|
| **Boost Engine** |
| Monthly Boosts | 0 | 1 free | 3 | Unlimited |
| Boost Duration | N/A | 24h only | 1-7 days | 1-7 days |
| Auto-Reboost | ❌ | ❌ | ✅ | ✅ (default) |
| Location Targeting | ❌ | ❌ | ✅ | ✅ |
| Boost Multiplier | 1× | 1.5× | 2× | 3× |
| **Ranking Engine** |
| Base Score | ✅ | ✅ | ✅ | ✅ |
| Verified Badge Bonus | ❌ | ❌ | +100 | +100 |
| Priority Ranking | ❌ | ❌ | ✅ | ✅ (top) |
| **Top Placement** |
| Monthly Placements | 0 | 0 | 1 | Unlimited |
| Duration Options | N/A | N/A | 7-day | 3/7/14-day |
| Category Specific | ❌ | ❌ | ✅ | ✅ |
| Priority Placement | ❌ | ❌ | ❌ | ✅ |
| **Spotlight** |
| Monthly Spotlights | 0 | 0 | 1 | Unlimited |
| Slot Types | N/A | N/A | All | All + Premium |
| Priority Placement | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Database Schema Updates Needed:

1. **Enhance `promotional_boosts` table:**
```sql
ALTER TABLE promotional_boosts
ADD COLUMN auto_reboost BOOLEAN DEFAULT FALSE,
ADD COLUMN reboost_interval_hours INT DEFAULT NULL,
ADD COLUMN location_target JSON DEFAULT NULL,
ADD COLUMN boost_package ENUM('1-day', '3-day', '7-day') DEFAULT '1-day',
ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN is_free BOOLEAN DEFAULT FALSE;
```

2. **Add promotion limits to `subscription_plans` table:**
```sql
ALTER TABLE subscription_plans
ADD COLUMN max_top_placements INT DEFAULT 0 COMMENT 'Maximum top placements per month (-1 for unlimited)',
ADD COLUMN max_spotlights INT DEFAULT 0 COMMENT 'Maximum spotlights per month (-1 for unlimited)',
ADD COLUMN boost_multiplier DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Boost multiplier for visibility score',
ADD COLUMN can_auto_reboost BOOLEAN DEFAULT FALSE,
ADD COLUMN can_location_target BOOLEAN DEFAULT FALSE;
```

3. **Create promotion usage tracking:**
```sql
CREATE TABLE promotion_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  subscription_id INT NOT NULL,
  usage_period DATE NOT NULL COMMENT 'Year-month for tracking (YYYY-MM-01)',
  boosts_used INT DEFAULT 0,
  top_placements_used INT DEFAULT 0,
  spotlights_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_period (user_id, usage_period),
  INDEX idx_usage_period (usage_period),
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Service Architecture:

```
promotionGatingService.js (Core gating logic)
├── checkBoostEligibility(userId, boostType, duration)
├── checkTopPlacementEligibility(userId, itemType, duration)
├── checkSpotlightEligibility(userId, slotType, duration)
├── getAvailableBoosts(userId)
├── getAvailableTopPlacements(userId)
├── getAvailableSpotlights(userId)
├── getBoostCost(userId, duration, isFree)
├── validatePromotionLimits(userId, promotionType)
└── getSubscriptionPlanFeatures(userId)

visibilityScoreService.js (Score calculation)
├── calculateVisibilityScore(itemType, itemId, buyerLocation?)
├── calculateScoreBreakdown(itemType, itemId)
├── applyPromotionMultiplier(score, userId, isBoosted)
├── recalculateAllScores()
├── recalculateScoresForCategory(category)
└── getScoreHistory(itemType, itemId, days)

rankingService.js (Ranking & recommendations)
├── getTrendingItems(itemType, category?, limit)
├── getRecommendedItems(userId, itemType, limit)
├── getSimilarItems(itemType, itemId, limit)
├── applySubscriptionMultipliers(items, userId)
└── getRankingForCategory(category, itemType)
```

### API Endpoints Summary:

**Boost Engine:**
- `POST /api/boosts` - Create boost
- `GET /api/boosts` - Get user's boosts
- `GET /api/boosts/:id` - Get boost details
- `DELETE /api/boosts/:id` - Cancel boost
- `POST /api/boosts/:id/auto-reboost` - Enable/disable auto-reboost
- `GET /api/boosts/available` - Get available boosts
- `GET /api/boosts/pricing` - Get boost pricing
- `GET /api/boosts/analytics` - Boost analytics

**Top Placement:**
- `POST /api/top-placement` - Purchase top placement
- `GET /api/top-placement` - Get user's placements
- `GET /api/top-placement/:itemType` - Get placements by type
- `GET /api/top-placement/:itemType/:category` - Get category placements
- `DELETE /api/top-placement/:id` - Cancel placement
- `GET /api/top-placement/analytics` - Placement analytics

**Spotlight:**
- `POST /api/spotlight` - Request spotlight
- `GET /api/spotlight` - Get user's spotlights
- `GET /api/spotlight/:slotType` - Get spotlight by type
- `GET /api/spotlight/:slotType/:category` - Get category spotlight
- `POST /api/spotlight/:id/impression` - Track impression
- `POST /api/spotlight/:id/click` - Track click
- `DELETE /api/spotlight/:id` - Cancel spotlight
- `GET /api/spotlight/analytics` - Spotlight analytics

**Ranking/Scoring:**
- `GET /api/visibility-scores/:itemType/:itemId` - Get score
- `GET /api/visibility-scores/:itemType/:itemId/breakdown` - Get breakdown
- `POST /api/visibility-scores/calculate` - Manual recalculation (admin)

**Analytics:**
- `GET /api/promotions/analytics` - Overall analytics
- `GET /api/promotions/analytics/boost` - Boost analytics
- `GET /api/promotions/analytics/top-placement` - Top placement analytics
- `GET /api/promotions/analytics/spotlight` - Spotlight analytics
- `GET /api/promotions/analytics/performance` - Performance comparison

**Item Endpoints (Updated):**
- `GET /api/products/trending` - Trending products
- `GET /api/products/recommended` - Recommended products
- `GET /api/products/:id/similar` - Similar products
- `GET /api/products/spotlight` - Spotlight products
- `GET /api/products/top-placement` - Top placed products
- (Same pattern for auctions, swap-deals, group-buys, distress-sales)

---

## 📅 ESTIMATED TIMELINE

- **Phase 1 (Enhanced Boost):** 3-5 days
- **Phase 2 (Ranking/Scoring):** 4-6 days
- **Phase 3 (Top Placement):** 3-4 days
- **Phase 4 (Spotlight):** 3-4 days
- **Phase 5 (Integration):** 2-3 days
- **Phase 6 (Analytics):** 2-3 days
- **Phase 7 (Cron Jobs):** 1-2 days

**Total: 18-27 days**

---

## ✅ SUCCESS CRITERIA

1. All 4 promotion engines fully functional
2. Subscription gating working for all plans (DRIFT, WAVE, TIDE, SURGE)
3. Visibility scores calculated and updated hourly
4. All promotion types expire automatically
5. Analytics tracking for all promotions
6. Auto-reboost working for eligible plans (TIDE, SURGE)
7. All item types (products, auctions, swap deals, group buys, distress sales) support all promotion types
8. API endpoints return promoted items in correct order (top placement > spotlight > boosted > organic)
9. Performance metrics tracked and available via API
10. Monthly promotion limits reset automatically
11. Location targeting works for boosts (TIDE, SURGE)
12. Score breakdown available for transparency

---

## 📝 IMPLEMENTATION NOTES

### Priority Order:
1. **Phase 1 (Boost Engine)** - Most critical, highest seller demand
2. **Phase 2 (Ranking Engine)** - Foundation for all other engines, build alongside Phase 1
3. **Phase 3 (Top Placement)** - High revenue driver
4. **Phase 4 (Spotlight)** - Additional monetization
5. **Phase 5 (Integration)** - Connect everything together
6. **Phase 6 (Analytics)** - Important for seller retention
7. **Phase 7 (Cron Jobs)** - Automation for maintenance

### Key Considerations:
- All promotion services should use the same `promotionGatingService` for consistency
- Consider caching visibility scores in Redis for performance
- Use Redis for tracking impressions/clicks if needed
- Implement rate limiting on promotion creation endpoints
- Add comprehensive error handling and validation
- Log all promotion activities for audit trail
- Test subscription downgrade scenarios (what happens to active promotions?)
- Handle edge cases (expired subscription, cancelled subscription, etc.)
- Ensure data consistency (if boost expires, update item immediately)
- Consider database transactions for promotion creation
- Add indexes for performance on frequently queried fields

### Testing Requirements:
- Unit tests for all services
- Integration tests for controllers
- Test subscription gating for all plans
- Test expiration handling
- Test auto-reboost functionality
- Test score calculation accuracy
- Test ranking algorithms
- Load testing for score recalculation

---

## 🔄 MIGRATION STRATEGY

1. **Database migrations first** - Add all required columns and tables
2. **Models second** - Create/update Sequelize models
3. **Services third** - Build core business logic
4. **Controllers fourth** - Expose APIs
5. **Integration fifth** - Connect to existing endpoints
6. **Cron jobs last** - Automate background tasks

---

## 📚 RELATED DOCUMENTATION

- Frontend implementation: `promophases.md`
- Promotion system overview: `promotion-system.md`
- Subscription system: `SUBSCRIPTION_API_DOCUMENTATION.md`

