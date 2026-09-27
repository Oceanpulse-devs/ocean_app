# 🔄 Swap Deals (Barter Trade) System Architecture

This document provides a comprehensive technical reference for the **Swap Deals System, Barter Trade Proposals, Item Preference Matching, and Location Scheduling** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Swap Deals System enables item-for-item barter trading between users:
1. **Swap Offer Creation**: A seller lists an item they want to swap (`product_to_swap`), specifies preferred swap categories (`preferred_swap_category`), and describes preferred item exchanges (`preferred_items`).
2. **Swap Proposals**: Interested users submit barter offers (`SwapProposal`), attaching their item details or cash top-up offers.
3. **Meeting Location & Date Scheduling**: When a proposal is accepted, meeting details (`meeting_location`, `meeting_date`) are arranged for in-person exchange.
4. **Foreign Key Relation**: `SwapDeal.seller_id` links directly to `users.id` (`UserTable.hasMany(SwapDeal, { foreignKey: 'sellerId', as: 'swapDeals' })`).

---

## 🗄️ Database Schema (`swap_deals` & `swap_proposals`)

### 1. `swap_deals` Table
- `id` (`UUID`, Primary Key)
- `seller_id` (`UUID`, Foreign Key -> `users.id`)
- `title` (`VARCHAR(255)`, `NOT NULL`)
- `description` (`TEXT`, `NOT NULL`)
- `product_to_swap` (`VARCHAR(255)`, `NOT NULL`)
- `category_to_swap` (`VARCHAR(100)`, `NOT NULL`)
- `brand_to_swap` (`VARCHAR(100)`, `NULLABLE`)
- `condition` (`ENUM`: `'New'`, `'Like New'`, `'Good'`, `'Fair'`, `'Poor'`)
- `preferred_swap_category` (`VARCHAR(100)`, `NULLABLE`)
- `preferred_swap_subcategories` (`JSON`, `NULLABLE`)
- `images` (`JSON`, `NULLABLE`)
- `ar_model` (`VARCHAR(500)`, `NULLABLE`)
- `meeting_location` (`VARCHAR(255)`, `NULLABLE`)
- `meeting_date` (`DATEONLY`, `NULLABLE`)
- `status` (`ENUM`: `'active'`, `'inactive'`, `'completed'`, `'cancelled'`)
- `views_count` (`INTEGER`, Default `0`)
- `savedCount` (`INTEGER`, Default `0`)
- `proposals_count` (`INTEGER`, Default `0`)
- `is_featured` (`BOOLEAN`, Default `false`)
- `is_boosted` (`BOOLEAN`, Default `false`)
- `visibility_score` (`DECIMAL(10,2)`, Default `0.00`)

### 2. `swap_proposals` Table
- `id` (`UUID`, Primary Key)
- `swapDealId` (`UUID`, Foreign Key -> `swap_deals.id`)
- `proposerId` (`UUID`, Foreign Key -> `users.id`)
- `proposedProduct` (`VARCHAR(255)`, `NOT NULL`)
- `cashTopUp` (`DECIMAL(15,2)`, Default `0.00`)
- `status` (`ENUM`: `'pending'`, `'accepted'`, `'rejected'`, `'withdrawn'`)
- `createdAt` (`DATETIME`)

---

## 🔌 API Endpoints Reference

### Public Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/swaps` | `GET` | List active swap deals (Redis cached 180s) |
| `/api/swaps/trending` | `GET` | Fetch top trending swap deals |
| `/api/swap/:swapId` | `GET` | Single swap deal details & preferred trade items |

### Authenticated Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/swaps` | `POST` | List a new item for swap |
| `/api/swap/:swapId/propose` | `POST` | Submit a swap proposal with offered item & top-up |
| `/api/swap/proposal/:proposalId/accept` | `POST` | Accept a swap proposal & set meeting details |
| `/api/swap/proposal/:proposalId/reject` | `POST` | Reject a swap proposal |
| `/api/swap/:swapId` | `DELETE` | Cancel swap deal |

---

## 🛠️ Audit Summary & Status

1. **Foreign Key Mapping Verified**: Explicitly verified `sellerId` $\rightarrow$ `seller_id` column mapping to prevent `Unknown column SwapDeal.userId` errors.
