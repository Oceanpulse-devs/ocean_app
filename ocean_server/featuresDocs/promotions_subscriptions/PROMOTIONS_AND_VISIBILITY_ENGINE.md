# 🚀 Promotions, Boosts & Visibility Scoring Engine

This document provides a comprehensive technical reference for the **Promotional Boost Engine, Auto-Reboost Interval System, Spotlight Slots, Top Placements, and Visibility Ranking Math** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Promotion System powers paid & plan-allowance marketing features for sellers across all listing types (Products, Auctions, Group Buys, Swap Deals):
1. **Promotional Boosts**: Grants temporary listing priority (1-day, 3-day, 7-day).
2. **Automated Reboost Interval Engine**: If `autoReboost: true`, when a boost expires, background cron automatically re-boosts the item at specified intervals (`reboostIntervalHours: 6, 12, 24`) as long as monthly boost allowances remain.
3. **Spotlight Slots & Top Placements**: High-impact hero placement banners reserved for `Surge` and `Tide` tier sellers. Features real-time impression and click tracking.
4. **Dynamic Visibility Ranking Equation**: Feed items are scored continuously by engagement and subscription weight:
   $$\text{visibilityScore} = (\text{views} \times 1) + (\text{likes} \times 2) + (\text{savedCount} \times 3) + \text{planWeight}$$

---

## 🗄️ Database Schemas (`promotional_boosts`, `spotlight_slots`, `top_placements`)

### 1. `promotional_boosts` Table
- `id` (`INTEGER`, Primary Key, Auto Increment)
- `user_id` (`CHAR(36)`, Foreign Key -> `users.id`)
- `subscription_id` (`INTEGER`, Foreign Key -> `user_subscriptions.id`)
- `boost_type` (`ENUM`: `'product'`, `'group_buy'`, `'swap_deal'`, `'auction'`)
- `target_id` (`CHAR(36)`, Foreign Key to target item ID)
- `boost_duration_hours` (`INTEGER`, Default `24`)
- `status` (`ENUM`: `'active'`, `'expired'`, `'cancelled'`)
- `start_time` (`DATETIME`, `NOT NULL`)
- `end_time` (`DATETIME`, `NOT NULL`)
- `auto_reboost` (`BOOLEAN`, Default `false`)
- `reboost_interval_hours` (`INTEGER`, `NULLABLE`, Comment: '6, 12, or 24 hours')
- `cost` (`DECIMAL(10,2)`, Default `0.00`)
- `is_free` (`BOOLEAN`, Default `false`)

### 2. `spotlight_slots` Table
- `id` (`INTEGER`, Primary Key, Auto Increment)
- `user_id` (`CHAR(36)`, Foreign Key -> `users.id`)
- `item_type` (`ENUM`: `'product'`, `'group_buy'`, `'swap_deal'`, `'auction'`)
- `item_id` (`CHAR(36)`, `NOT NULL`)
- `slot_type` (`ENUM`: `'homepage_hero'`, `'category_header'`, `'search_spotlight'`)
- `impressions` (`INTEGER`, Default `0`)
- `clicks` (`INTEGER`, Default `0`)

---

## 🔌 API Endpoints Reference

### Public Analytics Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/spotlight/:id/impression` | `POST` | Track impression on a spotlight slot |
| `/api/spotlight/:id/click` | `POST` | Track click on a spotlight slot |
| `/api/spotlight/:slotType` | `GET` | Fetch active spotlights by slot type |

### Authenticated Seller Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/spotlight` | `POST` | Create/request a spotlight slot |
| `/api/spotlight` | `GET` | Fetch seller's active spotlight slots |
| `/api/top-placement` | `POST` | Apply top placement boost to an item |
| `/api/promotions/analytics` | `GET` | Fetch promotion performance analytics |

---

## 🛠️ Audit Summary & Status

1. **Auto-Reboost Logic Verified**: Confirmed automated re-boost scheduling in `buyerNeedSchedulerService` / cron runners.
2. **Impression Tracking**: Impression & click handlers increment counters without blocking API response.
