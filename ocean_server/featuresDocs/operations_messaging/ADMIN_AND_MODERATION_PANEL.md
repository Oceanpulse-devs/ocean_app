# 🛡️ Admin Panel & Moderation System Architecture

This document provides a comprehensive technical reference for the **Admin Control Panel, Role-Based Access Control (RBAC), Moderation Reports, Seller Application Review Pipeline, and System Maintenance Broadcasts** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Admin Panel provides operational control, user moderation, and platform management for authorized administrators:
1. **Strict Role-Based Access Control (RBAC)**: All admin routes are protected by `adminMiddleware`, strictly enforcing `req.user.role === 'admin'`. Unauthorized requests receive `403 Forbidden`.
2. **Flagged Content Moderation (`Report`)**: Users can report bad actors, fake listings, or offensive content. Admins review reported items, resolve reports (`status = 'resolved'`), issue warnings, or suspend user accounts.
3. **Seller Onboarding Review Pipeline**: Admins review submitted seller business documents and NIN verification logs, approving (`verificationStatus = 'approved'`) or rejecting applications with feedback.
4. **System Maintenance Broadcast Engine**: Dispatches platform-wide push and email notifications for scheduled maintenance, emergency downtime, or feature updates.

---

## 🗄️ Database Schema (`reports` Table)

- `id` (`UUID`, Primary Key, `UUIDV4`)
- `reporter_id` (`UUID`, Foreign Key -> `users.id`): User who filed the report.
- `reported_user_id` (`UUID`, Foreign Key -> `users.id`, `NULLABLE`): Target user being reported.
- `item_type` (`ENUM`: `'product'`, `'post'`, `'auction'`, `'swap_deal'`, `'group_buy'`, `'user'`, `'comment'`)
- `item_id` (`VARCHAR(255)`, `NOT NULL`): ID of the flagged item or user.
- `reason` (`ENUM`: `'spam'`, `'fraud'`, `'inappropriate'`, `'counterfeit'`, `'harassment'`, `'other'`)
- `description` (`TEXT`, `NULLABLE`): Detailed explanation provided by reporter.
- `status` (`ENUM`: `'pending'`, `'under_review'`, `'resolved'`, `'dismissed'`, Default `'pending'`)
- `resolved_by` (`UUID`, Foreign Key -> `users.id`, `NULLABLE`): Admin who resolved the report.
- `resolution_notes` (`TEXT`, `NULLABLE`): Notes on actions taken.
- `created_at` (`DATETIME`)
- `updated_at` (`DATETIME`)

---

## 🔌 API Endpoints Reference

### System & Maintenance Broadcast Routes (`/api/admin`)

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/system-health` | `GET` | Get server memory, Redis, and database performance stats |
| `/api/admin/maintenance/schedule` | `POST` | Dispatch scheduled maintenance notifications to all users |
| `/api/admin/maintenance/emergency` | `POST` | Dispatch emergency downtime alerts to active sessions |
| `/api/admin/feature-update` | `POST` | Send platform-wide feature update broadcast |

### User & Moderation Routes (`/api/admin`)

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/users` | `GET` | List all users with pagination, role filters, and status |
| `/api/admin/users/:userId/status` | `PUT` | Suspend or reactivate a user account |
| `/api/admin/reports` | `GET` | List flagged moderation reports (Filter by status/type) |
| `/api/admin/reports/:reportId/resolve` | `POST` | Resolve or dismiss a content report |
| `/api/seller-verification/admin/review` | `POST` | Approve or reject a seller application |

---

## 🛠️ Audit Summary & Status

1. **RBAC Middleware Confirmed**: Enforces `req.user.role === 'admin'` across all `/api/admin/*` routes.
2. **Audit Logging**: Admin actions record timestamps and admin user IDs for compliance.
