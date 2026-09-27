# 📚 Ocean Server System Architecture & Features Index

Welcome to the **Ocean Server System Architecture and Feature Documentation Hub**. This repository index provides a comprehensive, end-to-end technical reference for all 17 core marketplace modules, database schemas, sequence diagrams, and API endpoints.

---

## 🏗️ System Architecture Overview

`ocean_server` is a high-performance, modular Node.js RESTful API and marketplace engine built with:
- **Core Framework**: Node.js & Express.js
- **Database & ORM**: MySQL 8.0 with Sequelize ORM (`camelCase` model properties, strict foreign key constraints)
- **High-Speed Caching & Sessions**: Redis (Aiven Valkey / TLS Keep-Alive, automated session invalidation)
- **Real-Time WebSockets**: Standalone `ocean_message_server` Socket.io microservice (Port 5001)
- **Biometric Identity Verification**: Dojah API (NIN verification with camera selfie facial recognition matching)
- **Payments & Monetization**: Flutterwave Webhook Gateway & Tiered Subscription Engine
- **Push Notifications & Media**: Firebase FCM Admin SDK & Cloudinary HLS video/image processing

---

## 🗺️ Master Feature Documentation Index (17 Modules)

Click on any category or module below to open its complete technical documentation:

### 1. 🛡️ Authentication & Verification
- 📄 [**Authentication & User Management**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/authentication/AUTHENTICATION_AND_USER_MANAGEMENT.md): Signup, Login, JWT + HTTP-Only cookies, Redis session invalidation (`session:<userId>:<sessionId>`), password security, and account anonymization.
- 📄 [**Seller Identity & NIN Verification**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/authentication/SELLER_NIN_VERIFICATION.md): Dojah Biometric Facial Recognition, AES-256 NIN encryption, NIN masking (`123****8901`), and automatic seller role upgrades.

### 2. 🛒 Commerce & Discovery Engine
- 📄 [**Product Demand Distribution System**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/commerce_discovery/PRODUCT_DEMAND_DISTRIBUTION_SYSTEM.md): Batch-routed demand matching, 5-minute countdown window, instant candidate replacement on decline, and 10s high-precision scheduler loop.
- 📄 [**Product Catalog & Management**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/commerce_discovery/PRODUCT_CATALOG_MANAGEMENT.md): Product CRUD APIs, 3D AR GLB models (`arModel`), category/subcategory mapping, and deduplicated view counting.
- 📄 [**Unified Discovery Feed**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/commerce_discovery/UNIFIED_DISCOVERY_FEED.md): Interleaved multi-entity feed (Products, Videos, Auctions, Group Buys), visibility score sorting, block exclusions, and Redis feed caching (`homeFeed:v2:` 120s TTL).

### 3. 📢 Selling Formats & Deals
- 📄 [**Auction & Bidding System**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/selling_formats/AUCTION_SYSTEM.md): Live bidding, reserve pricing, Buy Now requests, **5-minute auto-extend sniping protection**, and expiration cron.
- 📄 [**Group Buy (Bulk Purchases)**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/selling_formats/GROUP_BUY_SYSTEM.md): Collective purchasing thresholds (`min_buyers`), automatic discount activation (`group_price`), deadline extensions, and chat room linkage.
- 📄 [**Swap Deals (Barter Trade)**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/selling_formats/SWAP_DEALS.md): Barter trade proposals (`SwapProposal`), preferred swap category matching, and meeting location/date scheduling.
- 📄 [**Distress Sales**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/selling_formats/DISTRESS_SALES.md): Urgent discount listings (`isDistressSale = true`), urgency levels (`low`, `medium`, `high`, `urgent`), and automated expiration logic.

### 4. 🎥 Content, Media & Social
- 📄 [**Video Feed & Reels**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/content_media/VIDEO_FEED_REELS.md): Short video uploads (100MB limit), Call-To-Action buttons (`message_seller`, `call_seller`), role types (`seller` vs `buyer`), and engagement counters.
- 📄 [**Stories & Request Rooms**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/content_media/STORIES_AND_REQUEST_ROOMS.md): 24-hour temporary media stories (`expires_at = NOW + 24 hours`), rich mobile overlays (text, font, music, emoji), and temporary buyer search request rooms (`RequestRoom`).

### 5. 🚀 Promotions, Subscriptions & Monetization
- 📄 [**Promotions & Visibility Scoring Engine**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/promotions_subscriptions/PROMOTIONS_AND_VISIBILITY_ENGINE.md): Promotional Boosts, **auto-reboost interval engine** (`autoReboost` with 6, 12, 24 hour intervals), Spotlight slots, Top Placements, impression/click analytics, and visibility score ranking math.
- 📄 [**Subscriptions & Payment Webhooks**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/promotions_subscriptions/SUBSCRIPTIONS_AND_PAYMENTS.md): 5 tier plans (`Drift`, `Wave`, `Tide`, `Surge`, `Custom`), plan feature limits, **Flutterwave payment webhook verification** sequence diagram, and auto-expiry cron loop.

### 6. 📊 Social Features & User Interactions
- 📄 [**User Interactions & Analytics**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/social_analytics/USER_INTERACTIONS_AND_ANALYTICS.md): Unified Saved Items Wishlist System (single API endpoint handling all 6 entity types: `product`, `post`, `auction`, `swap_deal`, `group_buy`, `distress_sale`), custom collection folders, seller reviews (`SellerFeedback`), and follow/unfollow graph (`UserFollows`).
- 📄 [**Notifications & FCM Push System**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/social_analytics/NOTIFICATIONS_AND_PUSH_SYSTEM.md): Multi-channel notification pipeline (`in_app`, `push`, `email`), **Firebase FCM Device Push Token registration**, push dispatch sequence diagram, priority levels, and user notification preference management (13 alert categories).

### 7. ⚙️ Operations & Real-Time Messaging
- 📄 [**Admin Panel & Moderation System**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/operations_messaging/ADMIN_AND_MODERATION_PANEL.md): Admin RBAC authorization (`req.user.role === 'admin'`), seller application review pipeline, content moderation reports (`Report`), and system maintenance broadcasts.
- 📄 [**Real-time Messaging Engine**](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/operations_messaging/REALTIME_MESSAGING_ENGINE.md): Standalone `ocean_message_server` microservice architecture (Port 5001), Socket.io connection handshake, room subscriptions, real-time message dispatch, read receipts, and media attachments.

---

## ⚙️ Environment Configuration & Deployment Standards

- **Automated Database Migrations**: Server deployments execute `npx sequelize-cli db:migrate` automatically prior to launch.
- **Instant Server Startup**: Model sync runs with `{ alter: false }` to guarantee sub-second server startup and zero table lock risks on production hosts (Render / Railway / AWS).
- **Environment Variables**: Managed via `.env` files and environment-driven configurations with automatic quote sanitization.
