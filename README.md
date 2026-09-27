# 🐋 BlueWhale (Ocean App) Marketplace Ecosystem

Welcome to the **BlueWhale / Ocean App Marketplace Ecosystem** — a next-generation, high-performance social commerce platform connecting buyers and verified wholesale/retail sellers.

---

## 🌟 Ecosystem Overview

The project is structured as a decoupled microservice architecture comprising 4 main services:

```
                          ┌───────────────────────────┐
                          │   Flutter Web / Mobile    │
                          │        (Frontend)         │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│    ocean_server     │      │ocean_message_server │      │ ocean_admin_panel   │
│ (Core REST API Engine)     │(Real-Time WebSockets)│      │  (Moderation Panel) │
└──────────┬──────────┘      └──────────┬──────────┘      └──────────┬──────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │   MySQL 8.0 & Redis Cache   │
                         └─────────────────────────────┘
```

### Core Components:
1. **`ocean_server`** (Node.js REST API & Core Engine):
   - Handles authentication, seller verification, product cataloging, buyer-demand batch routing, multi-entity feeds, auctions, group buys, swap deals, distress sales, promotions, and subscriptions.
2. **`ocean_message_server`** (Real-Time WebSockets Microservice - Port 5001):
   - Standalone Socket.io microservice managing 1-on-1 chats, group rooms, typing indicators, read receipts, and direct entity context linkage.
3. **`ocean_admin_panel`** (Web Admin Interface):
   - Operational dashboard for seller document review, user moderation, flagged content reports, and platform maintenance broadcasts.
4. **`ocean_tester_server`**:
   - Automated testing suite and sandbox service.

---

## 🚀 Key Platform Features

- 🪪 **Automated Dojah NIN Facial Verification**: Biometric face matching comparing live camera selfies against official government NIMC photo records, with AES-256 NIN encryption.
- ⚡ **Bolt/Uber-Style Product Demand Distribution**: Batch-routes buyer requests to 5 eligible sellers at a time with a 5-minute countdown window and instant candidate replacement on decline.
- 🌊 **Unified Discovery Feed**: TikTok/Amazon-style interleaved timeline blending Products, Short Video Reels, Auctions, and Group Buys into a single stream ranked by dynamic visibility scores.
- 🔨 **Live Auctions & Sniping Protection**: Live bidding engine with reserve pricing, Buy Now requests, and a **5-minute auto-extend countdown** to prevent last-second sniping.
- 👥 **Group Buy Wholesale Thresholds**: Collective purchasing engine unlocking bulk discounts when target buyer counts (`min_buyers`) are reached.
- 🔄 **Swap Deals (Barter Trade)**: Item-for-item trade proposal engine with preferred category matching and in-person meeting scheduling.
- 🚨 **Distress Sales**: Deeply discounted urgent inventory liquidations with urgency countdown timers.
- 💳 **Subscriptions & Flutterwave Webhooks**: 5 tier plans (`Surge`, `Tide`, `Wave`, `Drift`, `Custom`) with verified Flutterwave payment webhook integration.
- 🔔 **Firebase FCM Push Notifications**: Multi-channel alert system (`in_app`, `push`, `email`) with customizable user preference categories.

---

## 📚 Complete Feature Documentation Hub

All technical specifications, database schemas, sequence diagrams, and API endpoint tables are documented in detail inside the server features directory:

📂 **[Browse Server Feature Documentation (17 Modules)](file:///Users/mac/Desktop/Folders/ocean_app/ocean_server/featuresDocs/README.md)**

---

## 🛠️ Tech Stack & Prerequisites

- **Backend**: Node.js (Express.js), Socket.io
- **Database**: MySQL 8.0, Sequelize ORM
- **Cache & Sessions**: Redis (Aiven Valkey / TLS Keep-Alive)
- **Authentication**: JWT, HTTP-Only Cookies, OAuth 2.0 (Google & Apple)
- **External Integrations**:
  - **Identity**: Dojah API (Biometric Facial Recognition & NIMC)
  - **Payments**: Flutterwave Gateway Webhooks
  - **Push Alerts**: Firebase Admin SDK (FCM)
  - **Media**: Cloudinary (HLS Video & Image Compression)

---

## ⚡ Quick Start & Setup Guide

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>

# Install ocean_server dependencies
cd ocean_app/ocean_server
npm install

# Install ocean_message_server dependencies
cd ../ocean_message_server
npm install
```

### 2. Configure Environment Variables
Copy `env.example` to `.env` in both server directories:

```bash
# Main API Server environment setup
cd ../ocean_server
cp env.example .env

# Messaging WebSocket Server environment setup
cd ../ocean_message_server
cp env.example .env
```

### 3. Run Automated Database Migrations
```bash
cd ../ocean_server
npx sequelize-cli db:migrate
```

### 4. Start Servers
```bash
# Start Core API Server (Port 5000)
cd ../ocean_server
npm run dev

# Start Messaging WebSocket Server (Port 5001)
cd ../ocean_message_server
npm run dev
```

---

## 🔒 Production & Deployment Best Practices

- **Automated Deployment Migrations**: The production startup script (`npm start`) automatically executes `npx sequelize-cli db:migrate` prior to starting `server.js`.
- **Instant Boot Times**: Server boot uses `{ alter: false }` to guarantee sub-second startup times without MySQL table lock risks on host platforms (Render / Railway / AWS).
