# 🚀 Product Demand Distribution System (Buyer Needs Architecture)

This document provides a comprehensive, end-to-end technical reference of the **Bolt/Uber-style Product Demand Distribution System** in `ocean_server`.

---

## 📌 Executive Summary & Design Philosophy

The Product Demand Distribution System replaces legacy public post lists with an **intelligent, batch-routed marketplace dispatcher**. When a buyer submits a demand (e.g. *"Looking for 15 wholesale units of iPhone 15 Pro Max in Lagos"*), the system does not dump the request into a public forum. Instead:

1. **Controlled Batch Routing**: The demand is dispatched in **controlled batches of 5 eligible sellers** at a time.
2. **5-Minute High-Urgency Countdown**: Each batch of 5 sellers receives a real-time notification with an active **5-minute countdown window** ($300$ seconds) to accept the lead.
3. **Monetization & Tiered Priority**: Sellers on higher subscription plans (`Surge`, `Tide`) receive candidate priority over free tiers.
4. **Reach Limit Control**: The buyer sets a target reach limit (e.g. 5 accepted connections). As soon as 5 sellers accept, candidate routing automatically terminates and the demand transitions to `fulfilled`.

---

## 🗄️ Database Schema & Relationships

### 1. `buyer_needs` Table
Represents the demand post created by the buyer.
- `id` (UUID, Primary Key)
- `buyer_id` (UUID, Foreign Key -> `users.id`)
- `title` (VARCHAR 255): Demand title / caption.
- `description` (TEXT): Detailed request content.
- `category` (VARCHAR 255): Main category name (e.g., `"Services"`, `"Electronics"`).
- `subcategory` (VARCHAR 255): Subcategory name (e.g., `"Automotive Services"`).
- `reach_limit` (INT, Default `5`): Maximum number of seller acceptances before routing stops.
- `current_reach` (INT, Default `0`): Current count of sellers who accepted.
- `reach_exceeded` (BOOLEAN, Default `false`): Set to `true` when `current_reach >= reach_limit`.
- `current_batch` (INT, Default `1`): Monotonically increasing batch iteration counter.
- `batch_started_at` (DATETIME): Timestamp when the current candidate batch was dispatched.
- `expires_at` (DATETIME): Demand expiration date (Default 30 days from creation).
- `status` (ENUM: `'active'`, `'fulfilled'`, `'cancelled'`, `'expired'`).

### 2. `buyer_need_matches` Table
Tracks individual candidate routing events per seller.
- `id` (INT / UUID, Primary Key)
- `buyer_need_id` (UUID, Foreign Key -> `buyer_needs.id`)
- `seller_id` (UUID, Foreign Key -> `users.id`)
- `batch_number` (INT): The batch iteration when this seller was notified.
- `status` (ENUM: `'notified'`, `'accepted'`, `'declined'`, `'expired'`).
- `notified_at` (DATETIME): Timestamp when push notification was sent.
- `responded_at` (DATETIME): Timestamp when seller clicked Accept or Decline.

### 3. `subscription_plans` Table
Defines plan-level daily lead allocation limits.
- `id` (INT)
- `name` (VARCHAR): Plan name (`"Surge"`, `"Tide"`, `"Wave"`, `"Drift"`, `"Free"`).
- `maxDailyNotifications` (INT): Daily limit of direct lead matches a seller can accept:
  - **Surge**: `20` accepted leads / 24 hours.
  - **Tide**: `15` accepted leads / 24 hours.
  - **Wave**: `7` accepted leads / 24 hours.
  - **Drift**: `4` accepted leads / 24 hours.
  - **Free**: `0` leads / 24 hours.

---

## ⚙️ Core Candidate Selection & Priority Algorithm

When `routeNextBatch(buyerNeedId)` executes:

### Step 1: Exclusion Filtering
Finds all user IDs already notified in previous batches for this demand plus the buyer's own `user_id`:
$$\text{ExcludedUserIDs} = \{ \text{seller\_id} \mid \text{BuyerNeedMatch.buyer\_need\_id} = \text{demand.id} \} \cup \{ \text{demand.buyer\_id} \}$$

### Step 2: Location & Category Matching Query
Queries verified sellers (`verificationStatus IN ('approved', 'active')`) matching categories and subcategories:
1. **Subcategory Matching**: If `demand.subcategory` is present (e.g. `"Automotive Services"`), queries sellers whose `selectedSubcategories` JSON includes that subcategory.
2. **Category Fallback**: If subcategory matches $< 5$, queries general category sellers (`selectedCategories CONTAINS demand.category`).

### Step 3: Subscription & Daily Limit Verification
For each candidate seller:
1. **Plan Check**: Resolves `user.currentPlanId`. If `maxDailyNotifications <= 0` (e.g., Free), candidate is **rejected**.
2. **Bulk Daily Accepted Limit Check**: Queries total matches accepted by `seller.id` in the past 24 hours (`BuyerNeedMatch.status = 'accepted'` AND `BuyerNeedMatch.updated_at > 24h_ago`). If $\text{acceptedCountToday} \ge \text{maxDailyNotifications}$, candidate is **rejected**.

### Step 4: Multi-Factor Sorting Equation
Eligible sellers are sorted by 4 hierarchy tiers:
1. **Location Proximity** (Ascending Score):
   - `1`: Same Country + Same State (Best Match).
   - `2`: Same Country only (State fallback).
   - `3`: Global / Category fallback.
2. **Subscription Tier Priority** (Ascending Score):
   - `1`: `Surge` plan.
   - `2`: `Tide` plan.
   - `3`: `Wave` plan.
   - `4`: `Drift` plan.
   - `5`: Standard/Other.
3. **Seller Rating** (Descending): `seller.rating` (0.0 to 5.0).
4. **Trust Score** (Descending): `seller.trustScore` (0 to 100).

---

## ⏱️ High-Precision Expiration Scheduler Loop

1. **Background Polling Service** (`buyerNeedSchedulerService.js`):
   - Runs a high-precision tick every **10 seconds**.
   - Queries active demands where $\text{batch\_started\_at} < (\text{NOW} - 5 \text{ minutes})$.
2. **Batch Timeout Advancement**:
   - Updates remaining `'notified'` match rows for that batch to `'expired'`.
   - Calls `routeNextBatch(buyerNeedId)` to select and notify the next 5 sorted candidates.
3. **Instant Candidate Replacement on Decline**:
   - When a seller taps **Decline**, `declineDemandRequest` marks that match as `'declined'`.
   - If all active candidates in that batch have responded, `routeNextBatch` is triggered **immediately** without waiting out the 5-minute timer.

---

## 🔔 FCM Push Notification Payload Format

When candidates are selected, the server dispatches a silent/data FCM push notification to each candidate seller:

```json
{
  "notification": {
    "title": "New Product Demand Match",
    "body": "A buyer in Lagos is looking for \"Looking for 15 wholesale units of iPhone 15 Pro Max\". Accept within 5 minutes!"
  },
  "data": {
    "type": "buyer_need_match",
    "relatedEntityId": "buyer-need-uuid-123",
    "buyerNeedId": "buyer-need-uuid-123",
    "buyerNeedTitle": "Looking for 15 wholesale units of iPhone 15 Pro Max",
    "category": "Electronics",
    "expiresAt": "2026-09-27T14:40:00.000Z"
  }
}
```

---

## 🔌 Primary API Endpoints Reference

| HTTP Method | Endpoint Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/buyer-needs/create` | Create a new buyer demand & start batch routing | Authenticated Buyer |
| `GET` | `/api/buyer-needs/incoming` | Fetch seller's active incoming routed demands (with countdown seconds) | Authenticated Seller |
| `GET` | `/api/buyer-needs/accepted` | Fetch seller's accepted demands | Authenticated Seller |
| `POST` | `/api/buyer-needs/:id/accept` | Accept an incoming demand lead & open direct chat | Authenticated Seller |
| `POST` | `/api/buyer-needs/:id/decline` | Decline a demand lead & fast-forward batch routing | Authenticated Seller |
