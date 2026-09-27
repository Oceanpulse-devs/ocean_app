# 📊 User Interactions, Wishlist & Social Analytics

This document provides a comprehensive technical reference for the **Unified Saved Items (Wishlist) System, Seller Reviews & Ratings, Follow Graph, and Market Analytics** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Social & User Interaction System powers buyer-seller engagement, wishlist organization, and marketplace trust metrics:
1. **Unified Saved Items Engine**: A single API endpoint (`POST /api/items/:itemId/save`) handles bookmarking across **all 6 marketplace entity types**: `product`, `post`, `auction`, `swap_deal`, `group_buy`, and `distress_sale`.
2. **Collection Folders**: Buyers organize saved items into custom collection folders (`collectionName: 'Favorites'`).
3. **Seller Feedback & Star Ratings**: Buyers leave 1.0 to 5.0 star reviews (`SellerFeedback`). Ratings dynamically update `sellers.rating` and `sellers.trustScore`.
4. **Follow / Unfollow Graph**: Tracks user-seller follow relationships (`UserFollows`), feeding follower counts into discovery ranking and notification dispatching.

---

## 🗄️ Database Schemas (`saved_items`, `user_follows`, `seller_feedback`)

### 1. `saved_items` Table
- `id` (`UUID`, Primary Key, `UUIDV4`)
- `user_id` (`UUID`, Foreign Key -> `users.id`)
- `item_type` (`ENUM`: `'product'`, `'post'`, `'auction'`, `'swap_deal'`, `'group_buy'`, `'distress_sale'`)
- `item_id` (`UUID`, `NOT NULL`, ID of the bookmarked entity)
- `collection_name` (`VARCHAR(50)`, Default `'Favorites'`)
- `created_at` (`DATETIME`)
- `updated_at` (`DATETIME`)

*Unique Constraint*: Unique index `(user_id, item_type, item_id)` prevents duplicate saves.

### 2. `user_follows` Table
- `id` (`UUID`, Primary Key)
- `user_id` (`UUID`, Foreign Key -> `users.id`, User following)
- `follows_user_id` (`UUID`, Foreign Key -> `users.id`, Target seller user ID)
- `created_at` (`DATETIME`)

### 3. `seller_feedback` Table
- `id` (`UUID`, Primary Key)
- `seller_id` (`UUID`, Foreign Key -> `sellers.id`)
- `reviewer_id` (`UUID`, Foreign Key -> `users.id`)
- `rating` (`DECIMAL(3,2)`, `NOT NULL`, 1.00 to 5.00)
- `comment` (`TEXT`, `NULLABLE`)
- `created_at` (`DATETIME`)

---

## 🔌 API Endpoints Reference

### Unified Saved Items Routes

| Endpoint Path | Method | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `/api/items/:itemId/save` | `POST` | `{ itemType, collectionName }` | Toggle save/unsave item (Universal across 6 types) |
| `/api/saved-items` | `GET` | `page`, `limit`, `itemType`, `collectionName` | Fetch user's saved items with optional filters |
| `/api/items/:itemId/is-saved` | `GET` | `itemType` | Check if item is saved by authenticated user |
| `/api/saved-items/:savedItemId` | `DELETE` | Path parameter | Delete saved item record by ID |

### Follow & Feedback Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/sellers/:sellerId/follow` | `POST` | Follow or unfollow a seller |
| `/api/sellers/:sellerId/feedback` | `POST` | Submit a 1-5 star review for a seller |
| `/api/sellers/:sellerId/feedback` | `GET` | List feedback reviews for a seller |

---

## 🛠️ Audit Summary & Status

1. **Unified Wishlist Standardized**: Verified that saving items updates `savedCount` on target models without throwing FK constraint errors.
2. **Dynamic Rating Updating**: Confirmed that new seller feedback recalculates `sellers.rating` and `sellers.trustScore`.
