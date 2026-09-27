# 📦 Product Catalog & Management System

This document provides a comprehensive technical reference for the **Product Catalog, Inventory Lifecycle, Category Mapping, 3D AR Model Attachments, and Search Engine** in `ocean_server`.

---

## 📌 Architectural Overview & Design Philosophy

The Product Management System handles physical goods, services, and inventory listings submitted by verified sellers. Key architectural highlights include:
1. **Multi-Media & 3D AR Model Storage**: Products support up to 10 compressed Cloudinary images and GLB/GLTF 3D AR Model files (`arModel` field) for augmented reality viewing on mobile devices.
2. **Universal Category & Subcategory System**: Products are categorized using global system categories (`ProductCategory`) or seller custom categories.
3. **Engagement & Standardized Counters**: Deduplicated view tracking (`ProductView` findOrCreate per user), like counts (`ProductLike`), and standardized bookmark counts (`savedCount`).
4. **Subscription-Aware Search Engine**: Integrated with `SubscriptionAwareSearchService`, boosting search ranking for `Surge` and `Tide` sellers while enforcing plan daily limits.
5. **Multi-Tier Filtering**: Full-text search queries, min/max price range sliders, condition filters (`new`, `like_new`, `good`, `fair`, `poor`), location filters, and seller filters.

---

## 🗄️ Database Schema (`products` Table)

| Field Name | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `UUIDV4` | Unique Product ID |
| `sellerId` | `UUID` | `NOT NULL`, Foreign Key -> `sellers.id` | Seller store reference |
| `title` | `VARCHAR(100)` | `NOT NULL` | Product listing title |
| `description` | `TEXT` | `NOT NULL` | Full description text |
| `price` | `DECIMAL(18,2)`| `NOT NULL` | Listing price |
| `currency` | `VARCHAR(3)` | Default `'USD'` | Currency ISO code |
| `category` | `VARCHAR(50)` | `NOT NULL` | Category name / UUID |
| `subcategory` | `VARCHAR(50)`| `NULLABLE` | Subcategory name |
| `condition` | `ENUM` | `'new'`, `'like_new'`, `'good'`, `'fair'`, `'poor'` | Product physical condition |
| `location` | `VARCHAR(100)`| `NOT NULL` | City / State location |
| `images` | `JSON` | `NOT NULL`, Default `[]` | Array of image URLs |
| `arModel` | `VARCHAR(500)`| `NULLABLE` | Cloudinary GLB 3D AR Model URL |
| `views` | `INTEGER` | Default `0` | Deduplicated view count |
| `savedCount` | `INTEGER` | Default `0` | Standardized wishlist save count |
| `likes` | `INTEGER` | Default `0` | Like count |
| `isAvailable` | `BOOLEAN` | Default `true` | Stock availability flag |
| `status` | `ENUM` | `'active'`, `'sold'`, `'inactive'` | Listing lifecycle state |
| `is_boosted` | `BOOLEAN` | Default `false` | Active promotional boost flag |
| `is_top_placed` | `BOOLEAN` | Default `false` | Top Placement engine flag |
| `is_spotlighted` | `BOOLEAN` | Default `false` | Spotlight Slot engine flag |
| `visibility_score`| `DECIMAL(10,2)`| Default `0.00` | Dynamic score for feed ranking |

---

## ⚙️ Core Workflows & Business Logic

### 1. Product Creation (`POST /api/products`)
- Requires seller authentication (`authMiddleware`).
- Enforces subscription tier listing limits via `checkSubscriptionLimit('products')`.
- Accepts up to 10 image files (`images`) and 1 3D AR Model file (`arModel` `.glb` / `.gltf`).
- Compresses images via `imageCompressionService` and uploads assets to Cloudinary.
- Maps `title` to `name` in the response payload for multi-platform compatibility.
- Automatically clears matching Redis search cache keys (`products:*`).

### 2. Deduplicated View Counter
- When an authenticated user views a product detail page (`GET /api/product/:productId`), the server executes a `findOrCreate` on `ProductView` (`productId`, `viewerId`).
- Only **first-time views** by a specific user increment the `views` counter. Duplicate refreshes by the same user do not inflate stats.

---

## 🔌 API Endpoints Reference

### Public & Discovery Routes

| Endpoint Path | Method | Params / Query | Description |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `condition` | Filtered product search listing (Redis cached 120s) |
| `/api/product/:productId` | `GET` | `productId` | Single product details with engagement state (`isSaved`, `isLiked`) |
| `/api/products/trending` | `GET` | `limit` | Fetch top trending products sorted by engagement score |
| `/api/products/recommended` | `GET` | `limit` | Recommended items based on user preferences |
| `/api/products/spotlight` | `GET` | `limit` | Active spotlight slot products |
| `/api/products/top-placement` | `GET` | `limit` | Active top-placed products |
| `/api/products/seller/:sellerId` | `GET` | `sellerId` | Public store products for a specific seller |
| `/api/categories` | `GET` | `type=system` | Active system categories & subcategories |

### Authenticated Seller Routes

| Endpoint Path | Method | Payload / Headers | Description |
| :--- | :--- | :--- | :--- |
| `/api/products` | `POST` | Multipart: `images`, `arModel`, `title`, `price`, `category`, `condition` | Create a new product listing |
| `/api/products/:productId` | `PUT` | Multipart: `images`, `arModel`, text fields | Update an existing product |
| `/api/products/:productId` | `DELETE` | Header: `Authorization: Bearer <token>` | Soft-delete / deactivate product |
| `/api/products/:productId/like` | `POST` | Header: `Authorization: Bearer <token>` | Toggle like status on product |
| `/api/my-products` | `GET` | Header: `Authorization: Bearer <token>` | Authenticated seller's product management list |

---

## 🛠️ Audit Summary & Improvements Made

1. **Obsolete Counter Deprecation**: Removed the obsolete `saves` property definition from `models/Product.js` and standardized 100% on **`savedCount`** across `subscriptionAwareSearchService.js` and `savedItemsController.js`.
2. **Automated Deployment Migrations**: Updated `package.json` start scripts to execute `npx sequelize-cli db:migrate` automatically on deployment and set `alter: false` in `server.js` model sync loop for instant, zero-lock server boot times.
