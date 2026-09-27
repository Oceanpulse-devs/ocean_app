# 🚨 Distress Sales System Architecture

This document provides a comprehensive technical reference for the **Distress Sales Engine, Urgency Pricing, Expiration Timers, and Discount Calculations** in `ocean_server`.

---

## 📌 Architectural Overview & Philosophy

The Distress Sales System allows sellers to quickly liquidate inventory by offering deeply discounted prices (`group_price` / `price`) under urgent countdown deadlines:
1. **Embedded Product Engine**: Distress sales are flag-enabled product listings (`isDistressSale = true`) stored within the `products` table, allowing them to participate seamlessly in product search filters and feed interleaving.
2. **Urgency Levels**: Sellers specify an urgency level (`urgencyLevel`): `'low'`, `'medium'`, `'high'`, `'urgent'`.
3. **Automatic Expiration Loop**: When `distressExpiryDate` passes (`distressExpiryDate <= NOW`), background jobs update `isDistressSale = false`, reverting the listing back to a standard product.
4. **Discount Percentage Calculation**: Calculates discount percentage automatically:
   $$\text{discountPercentage} = \left( \frac{\text{originalPrice} - \text{price}}{\text{originalPrice}} \right) \times 100$$

---

## 🗄️ Database Schema (`products` Table Distress Fields)

- `isDistressSale` (`BOOLEAN`, Default `false`, `comment`: 'Whether this is a distress sale item')
- `originalPrice` (`DECIMAL(18,2)`, `NULLABLE`, `comment`: 'Original price before discount')
- `discountPercentage` (`DECIMAL(5,2)`, `NULLABLE`, `comment`: 'Discount percentage applied')
- `urgencyLevel` (`ENUM`: `'low'`, `'medium'`, `'high'`, `'urgent'`, Default `'medium'`)
- `distressReason` (`VARCHAR(255)`, `NULLABLE`, `comment`: 'Reason for distress sale')
- `distressExpiryDate` (`DATETIME`, `NULLABLE`, `comment`: 'Expiration timestamp')

---

## 🔌 API Endpoints Reference

### Public Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/distress-sales` | `GET` | List active distress sales (Redis cached 180s) |
| `/api/distress-sales/urgent` | `GET` | Fetch urgent distress sales ending soonest |
| `/api/distress-sale/:id` | `GET` | Get single distress sale with countdown seconds remaining |

### Authenticated Seller Routes

| Endpoint Path | Method | Description |
| :--- | :--- | :--- |
| `/api/distress-sales` | `POST` | Create a new distress sale listing |
| `/api/distress-sale/:id` | `PUT` | Update urgency level or discount price |
| `/api/distress-sale/:id` | `DELETE` | Cancel distress sale flag |

---

## 🛠️ Audit Summary & Status

1. **Embedded Architecture Verified**: Confirmed seamless integration with product search filters and discovery feeds.
