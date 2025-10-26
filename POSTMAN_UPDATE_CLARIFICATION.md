# Postman Collection Update Clarification

## 🎯 What Needs Updating in Postman Collections

### Request Body (What Frontend Sends)
**We made backend ACCEPT both field names, so requests can use:**
- ✅ `name` OR `title` (frontend sends `name`, backend accepts both)
- ✅ `otp` OR `resetCode` (frontend sends `otp`, backend accepts both)

**Postman Request Bodies:** Already correct or can show frontend field names

### Response Body (What Backend NOW Sends)
**Backend NOW SENDS frontend field names:**
- ✅ `startingBid` (was `startingPrice`)
- ✅ `currentBid` (was `currentPrice`)
- ✅ `pricePerUnit` (was `group_price`)
- ✅ `endDate` (was `deadline`)
- ✅ `caption` (was `title` for buyer needs)
- ✅ `productName` (was `title` for distress sales)
- ✅ `read` (was `isRead`)
- ✅ `body` (was `message`)
- ✅ `data` (was `metadata`)

**Postman Response Examples:** NEED TO BE UPDATED with these new field names

---

## 📋 What to Update in Each Postman Collection

### Ocean-Auctions.postman_collection.json
**Update Response Examples to show:**
```json
{
  "startingBid": 100.00,  // NOT "startingPrice"
  "currentBid": 150.00,   // NOT "currentPrice"
  ...
}
```

### Ocean-GroupBuy.postman_collection.json
**Update Response Examples to show:**
```json
{
  "pricePerUnit": 50.00,  // NOT "group_price"
  "endDate": "2024-01-20T10:00:00Z",  // NOT "deadline"
  ...
}
```

### Ocean-BuyerNeeds.postman_collection.json
**Update Response Examples to show:**
```json
{
  "caption": "Looking for product",  // NOT "title"
  ...
}
```

### Ocean-DistressSales.postman_collection.json
**Update Response Examples to show:**
```json
{
  "productName": "Product Name",  // NOT "title"
  ...
}
```

### Ocean-Notifications.postman_collection.json
**Update Response Examples to show:**
```json
{
  "read": false,     // NOT "isRead"
  "body": "...",     // NOT "message"
  "data": {...}      // NOT "metadata"
  ...
}
```

---

## 🎯 Summary

**Request Bodies:** No changes needed (backend accepts both field names)
**Response Bodies:** NEED TO UPDATE with new mapped field names

The issue is that Postman collections show EXAMPLE RESPONSES to help developers know what to expect. Those example responses need to be updated to show the NEW field names that the backend is now sending.

