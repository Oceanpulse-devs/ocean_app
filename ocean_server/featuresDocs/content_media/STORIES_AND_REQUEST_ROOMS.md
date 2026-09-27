# 📸 Stories & Request Rooms System Architecture

This document provides a comprehensive technical reference for **24-Hour Temporary Media Stories, Rich Overlays, and High-Intent Request Rooms** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Content & Media System includes two real-time temporary interaction channels:
1. **24-Hour Media Stories (`stories`)**: Temporary visual posts (images, videos, or text) that expire automatically 24 hours after creation (`expires_at = NOW + 24 hours`). Supports rich mobile overlays (text positioning, fonts, background colors, music tracks, and emoji stickers).
2. **Temporary Request Rooms (`request_rooms`)**: 24-hour temporary buyer-seller rooms created when high-intent buyer searches occur (`BuyerSearchInsight`). Matching sellers are connected directly into an active room (`ACTIVE`, `EXPIRED`, `COMPLETED`).

---

## 🗄️ Database Schemas (`stories` & `request_rooms`)

### 1. `stories` Table
- `id` (`UUID`, Primary Key)
- `user_id` (`UUID`, Foreign Key -> `users.id`)
- `media_url` (`VARCHAR(500)`, `NULLABLE`): Image or video URL.
- `media_type` (`ENUM`: `'image'`, `'video'`, `'text'`, `NOT NULL`)
- `caption` (`TEXT`, `NULLABLE`)
- `background_color` (`VARCHAR(7)`, `NULLABLE`)
- `text_color` (`VARCHAR(7)`, `NULLABLE`)
- `font_family` (`VARCHAR(50)`, `NULLABLE`)
- `text_overlay` (`TEXT`, `NULLABLE`)
- `text_size` (`DECIMAL(5,2)`, `NULLABLE`)
- `text_position_x` (`DECIMAL(10,2)`, `NULLABLE`)
- `text_position_y` (`DECIMAL(10,2)`, `NULLABLE`)
- `music_track` (`VARCHAR(255)`, `NULLABLE`): Audio track link.
- `emoji` (`VARCHAR(10)`, `NULLABLE`)
- `expires_at` (`DATETIME`, `NOT NULL`)
- `views_count` (`INTEGER`, Default `0`)

### 2. `request_rooms` Table
- `id` (`UUID`, Primary Key)
- `insight_id` (`INTEGER`, Foreign Key -> `buyer_search_insights.id`)
- `buyer_id` (`UUID`, Foreign Key -> `users.id`)
- `status` (`ENUM`: `'ACTIVE'`, `'EXPIRED'`, `'COMPLETED'`, Default `'ACTIVE'`)
- `expires_at` (`DATETIME`, `NOT NULL`, Comment: 'Expires 24 hours after creation')

---

## 🔌 API Endpoints Reference

### Stories API Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/stories` | `GET` | Fetch active 24-hour stories from followed users (Redis cached) |
| `/api/stories` | `POST` | Create a new story with optional text/music overlays |
| `/api/stories/:id/view` | `POST` | Record a story view |
| `/api/stories/:id` | `DELETE` | Delete a story before 24h expiration |

### Request Rooms API Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/request-rooms` | `GET` | Fetch active demand request rooms for buyer/seller |
| `/api/request-rooms/create` | `POST` | Create request room from search insight |
| `/api/request-rooms/:roomId/join` | `POST` | Matching seller joins request room |

---

## 🛠️ Audit Summary & Status

1. **24-Hour Expiration Engine Verified**: Confirmed automated cleanup and filtering for expired stories (`expires_at > NOW`).
