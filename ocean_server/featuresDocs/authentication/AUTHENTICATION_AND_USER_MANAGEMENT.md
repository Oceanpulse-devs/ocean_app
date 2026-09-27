# 🔐 Authentication & User Management System

This document provides a comprehensive technical architecture and API reference for the **Authentication, Session Management, Account Security, and Profile System** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Authentication System is designed for multi-platform operation (Flutter Web, Android, iOS, React Admin). It enforces:
1. **Hybrid Token & Cookie Support**: JWTs are transmitted either via standard `Authorization: Bearer <token>` headers (ideal for Flutter Mobile & Web) or HTTP-only cookies (`sameSite: 'lax'`).
2. **Session Invalidation Engine**: Redis-backed session tracking (`session:<userId>:<sessionId>`) allowing instant single-device logout or global multi-device logout.
3. **Account Lockout & Rate-Limiting Protection**: Automatic 15-minute lockouts after 5 consecutive failed login attempts stored in Redis (`lockout:<userId>`).
4. **OAuth 2.0 Integration**: Native Google & Apple Sign-In SDK support for mobile apps and OAuth 2.0 Web callback flows.
5. **GDPR-Compliant Soft Deletion & Anonymization**: Account deletion soft-deletes user records, anonymizes PII (`deleted_<id>@deleted.local`), and cascades deactivations across products, auctions, group buys, swap deals, and follows within an atomic SQL transaction.

---

## 🗄️ Database Schema (`users` Table)

| Field Name | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `UUIDV4` | Unique User Identifier |
| `fullName` | `VARCHAR(255)` | `NOT NULL` | User's full name |
| `username` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Auto-generated handle (e.g. `@john_a1b2c3`) |
| `email` | `VARCHAR(255)` | `NOT NULL`, `INDEX` | User's email address |
| `password` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password ($10$ rounds) |
| `accountType` | `ENUM` | `'admin'`, `'buyer'`, `'seller'`, `'pending-seller'` | Current user authorization tier |
| `accountStatus` | `ENUM` | `'pending'`, `'active'`, `'suspended'`, `'deactivated'` | Account lifecycle status |
| `emailVerified` | `BOOLEAN` | Default `false` | Email verification flag |
| `google_Id` | `VARCHAR(255)` | `NULLABLE` | Google OAuth Subject ID |
| `apple_Id` | `VARCHAR(255)` | `NULLABLE` | Apple OAuth Subject ID |
| `sellerId` | `UUID` | `NULLABLE`, Foreign Key | Foreign key link to `sellers.id` |
| `deletedAt` | `DATETIME` | `NULLABLE` | Soft delete timestamp |
| `deleteReason` | `TEXT` | `NULLABLE` | User-provided deletion reason |

---

## ⚙️ Core Workflows & Logic

### 1. Signup & Username Generation
- Checks email uniqueness (`UserTable.findOne({ where: { email } })`).
- Enforces strict password validation: Minimum 8 characters with at least 1 uppercase, 1 lowercase, and 1 digit.
- Hashes password using `bcrypt` (10 rounds).
- Auto-generates unique handle: `@<first_8_chars>_<4_random_hex_bytes>`.
- Generates a 32-byte hex `emailVerificationToken` with a 24-hour expiration stored both in DB and cached in Redis (`email_verification:<token>`).
- Atomically seeds default notification preferences in a single bulk query (`UserNotificationPreference.bulkCreate`).

### 2. Login & Session Tracking
- Checks account status (`accountStatus === 'active'`). Blocks suspended/pending accounts.
- Queries Redis `lockout:<userId>` counter. If attempts $\ge 5$, returns `429 Too Many Requests` with remaining lockout minutes.
- Verifies password hash via `bcrypt.compare`.
- On success, generates a 32-byte hex `sessionId` and encodes `{ id, email, role, sessionId }` into JWT (expires in 7 days).
- Stores active session key `session:<userId>:<sessionId>` in Redis for instant remote session termination.

### 3. Account Deletion & PII Anonymization
Triggered via in-app request (`POST /api/account/delete`) or Google Play compliance form (`webDeleteAccountController.js`).
Executed inside a **Database Transaction**:
1. Anonymizes user: `fullName = 'Deleted User'`, `email = 'deleted_<id>@deleted.local'`, `username = 'deleted_<id>'`, `accountStatus = 'deactivated'`.
2. Soft-deletes associated seller business records (`verificationStatus = 'suspended'`).
3. Deactivates listed products, posts, auctions, group buys, swap deals, and buyer demands.
4. Purges follows, wishlist items, post/product likes, and personal notifications.
5. Deletes all active Redis session keys (`session:<userId>:*`).

---

## 🔌 API Endpoints Reference

### Public Authentication Routes

| Endpoint | Method | Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/signup` | `POST` | `{ fullName, email, password, confirmPassword, agreeTerms }` | Register a new buyer account |
| `/api/login` | `POST` | `{ email, password }` | Authenticate user & receive JWT token |
| `/api/verify-email` | `POST` | `{ token }` | Verify user email address |
| `/api/resend-verification` | `POST` | `{ email }` | Resend verification email link |
| `/api/forgot-password` | `POST` | `{ email }` | Send 5-digit password reset code via email |
| `/api/verify-resetCode` | `POST` | `{ email, resetCode }` | Validate 5-digit password reset OTP |
| `/api/reset-password` | `POST` | `{ email, resetCode, newPassword, confirmNewPassword }` | Set a new account password |
| `/api/auth/google/mobile` | `POST` | `{ idToken }` or `{ accessToken, userInfo }` | Authenticate via Google Mobile / Web SDK |
| `/api/auth/apple/mobile` | `POST` | `{ identityToken, givenName, familyName, email }` | Authenticate via Apple Sign-In |

### Authenticated Session Routes (Requires `authMiddleware`)

| Endpoint | Method | Headers / Params | Description |
| :--- | :--- | :--- | :--- |
| `/api/logout` | `POST` | Header: `Authorization: Bearer <token>` | Clear session cookie / client storage |
| `/api/logout-all-devices` | `POST` | Header: `Authorization: Bearer <token>` | Invalidate all active Redis sessions for user |
| `/api/active-sessions` | `GET` | Header: `Authorization: Bearer <token>` | List all active login sessions with TTLs |
| `/api/account/delete` | `DELETE` | `{ password, reason }` | Permanently anonymize & delete user account |
| `/api/profile` | `GET` | Header: `Authorization: Bearer <token>` | Fetch authenticated user profile details |
| `/api/profile` | `PUT` | Multipart / JSON Profile fields | Update profile picture, cover photo, bio |

---

## 🛠️ Audit Summary & Improvements Made

During the system audit, the following optimizations were applied:
1. **Password Regex Broadening**: Updated `validatePassword()` in `authcontroller.js` to allow all valid special characters (`#`, `_`, `-`, `.`, etc.) while strictly requiring 8+ chars, 1 uppercase, 1 lowercase, and 1 digit.
2. **Notification Preferences Bulk Query**: Optimized `UserTable.afterCreate` hook to execute a single `bulkCreate` SQL query instead of 13 separate queries on signup.
3. **Multi-device Session Invalidation**: Fully integrated Redis session keys with `authMiddleware.js` for instant global logout capabilities.
