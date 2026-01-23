# Seller Documents Association Fix

## Root Cause Identified ✅

The admin panel was not displaying seller documents because of a **column name mismatch** between the Sequelize model and the database schema.

### The Problem:
- **Database** uses snake_case column names: `seller_id`, `document_type`, `document_image`, etc.
- **Sequelize Model** used camelCase properties: `sellerId`, `documentType`, `documentImage`, etc.
- **WITHOUT field mapping**, Sequelize looked for camelCase columns in the database
- **Result**: The association couldn't match records because it was looking for `sellerId` column but the database has `seller_id`

### Evidence from Logs:
```
📋 BACKEND RESPONSE - First Seller Documents:
   Has documents key: false
   Documents: null
```

Even though the seller had `documentsSubmitted: 2`, the documents weren't being loaded because the foreign key `sellerId` didn't match the database column `seller_id`.

---

## Fix Applied

### File: `ocean_server/models/SellerDocument.js`

Added `field` mappings to all properties to correctly map camelCase JavaScript properties to snake_case database columns:

```javascript
sellerId: {
  type: DataTypes.UUID,
  allowNull: false,
  field: 'seller_id',  // ✅ Maps to database column
},
documentType: {
  type: DataTypes.ENUM(...),
  allowNull: false,
  field: 'document_type',  // ✅ Maps to database column
},
documentNumber: {
  type: DataTypes.STRING,
  field: 'document_number',  // ✅ Maps to database column
},
documentImage: {
  type: DataTypes.TEXT,
  allowNull: true,
  field: 'document_image',  // ✅ Maps to database column
},
documentBackImage: {
  type: DataTypes.TEXT,
  field: 'document_back_image',  // ✅ Maps to database column
},
// ... and all other fields
```

### Fields Updated:
✅ `sellerId` → `seller_id` (most important - fixes the association!)
✅ `documentType` → `document_type`
✅ `documentNumber` → `document_number`
✅ `documentImage` → `document_image`
✅ `documentBackImage` → `document_back_image`
✅ `documentExpiryDate` → `document_expiry_date`
✅ `documentIssuingAuthority` → `document_issuing_authority`
✅ `documentCountry` → `document_country`
✅ `submittedAt` → `submitted_at`
✅ `verifiedAt` → `verified_at`
✅ `verifiedBy` → `verified_by`
✅ `verificationNotes` → `verification_notes`

---

## Files Modified

### Backend
1. **`ocean_server/models/SellerDocument.js`**
   - Added field mappings for all properties
   - Now correctly maps to database snake_case columns

2. **`ocean_server/src/controllers/sellerManagementController.js`**
   - Added debug logging (can be removed after verification)

### Frontend (Already Done)
1. **`ocean_admin_panel/lib/features/sellers/pages/sellers_page.dart`**
   - Added debug logging
   - Enhanced UI with "No documents" message

2. **`ocean_admin_panel/lib/features/sellers/services/seller_service.dart`**
   - Added backend response logging

---

## Next Steps - RESTART BACKEND SERVER

### ⚠️ CRITICAL: You MUST restart the backend server for the model changes to take effect!

```bash
# Stop the current backend server (Ctrl+C)
# Then restart it:
cd ocean_server
npm start
```

OR if using nodemon:
```bash
cd ocean_server
nodemon server.js
```

OR if using Railway/production:
- The changes will apply on next deployment
- OR manually restart the server instance

---

## Testing After Restart

### Step 1: Test Backend API Directly
```bash
# Test the pending sellers endpoint
curl -X GET "https://mainserver-production-7ad9.up.railway.app/api/admin/sellers/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
```json
{
  "success": true,
  "data": {
    "sellers": [
      {
        "id": "...",
        "businessName": "...",
        "documents": [  // ✅ Should now be included!
          {
            "id": "...",
            "documentType": "NIN",
            "documentNumber": "12345...",
            "documentImage": "/uploads/...",
            "status": "pending"
          }
        ]
      }
    ]
  }
}
```

### Step 2: Test Admin Panel
1. Run the admin panel: `cd ocean_admin_panel && flutter run -d chrome`
2. Navigate to Seller Management
3. Click eye icon on a seller
4. Check browser console logs:

**Expected logs:**
```
📋 BACKEND RESPONSE - First Seller Documents:
   Seller ID: c5f5a777-533b-442f-9e15-872474b7a2d1
   Business Name: Trace Stores
   Has documents key: true  // ✅ Changed from false!
   Documents: [{id: ..., documentType: NIN, ...}]  // ✅ Now populated!

🔍 SELLER DETAIL DEBUG:
   Documents Count: 2  // ✅ Changed from 0!
   Document 0: {documentType: NIN, documentNumber: 12345, ...}
   Document 1: {documentType: IDCard, ...}
```

### Step 3: Verify UI
- ✅ "Documents (2)" header should show correct count
- ✅ Each document should display:
  - Document type badge
  - Document number
  - Document image (clickable)
- ✅ Clicking image opens full-screen viewer

---

## Why This Happened

This is a common issue when:
1. Database uses snake_case (SQL convention)
2. JavaScript/Node.js uses camelCase (JS convention)
3. Sequelize doesn't have `underscored: true` globally
4. Individual fields don't specify `field` mapping

### Two Ways to Fix (We Used Option 2):
**Option 1:** Add `underscored: true` to model options (affects ALL fields)
```javascript
}, {
  tableName: 'seller_documents',
  timestamps: true,
  underscored: true  // Auto-converts all fields
});
```

**Option 2:** Add `field` mapping per property (more explicit, better for mixed cases)
```javascript
sellerId: {
  type: DataTypes.UUID,
  field: 'seller_id'  // Explicit mapping
}
```

We chose Option 2 because:
- ✅ More explicit and clear
- ✅ Works with existing codebase
- ✅ Doesn't affect other models
- ✅ Better for debugging

---

## Verification Checklist

After restarting the backend:

- [ ] Backend server started successfully
- [ ] No model/database errors in server logs
- [ ] Test API endpoint returns documents in response
- [ ] Admin panel console shows documents in backend logs
- [ ] Admin panel console shows documents in frontend logs
- [ ] UI displays document count correctly
- [ ] UI shows document details and images
- [ ] Images load correctly (not broken)
- [ ] Full-screen image viewer works

---

## Troubleshooting

### If documents still don't show after restart:

#### Check 1: Backend Logs
Look for errors like:
- `Column 'seller_id' not found` ❌ (field mapping failed)
- `Unknown column 'sellerId'` ❌ (still using old model)

#### Check 2: Association Loading
Add this temporarily to verify association works:
```javascript
// In sellerManagementController.js
console.log('SellersTable associations:', db.SellersTable.associations);
console.log('SellerDocument model:', db.SellerDocument);
```

#### Check 3: Raw Query
Test direct database query:
```sql
SELECT sd.* FROM seller_documents sd 
WHERE sd.seller_id = 'c5f5a777-533b-442f-9e15-872474b7a2d1';
```

Should return 2 rows for the test seller.

---

## Clean Up (Optional)

After verifying everything works, you can remove the debug logging:

### Backend:
Remove logs from `ocean_server/src/controllers/sellerManagementController.js` lines 44-63

### Frontend:
Remove logs from:
- `ocean_admin_panel/lib/features/sellers/pages/sellers_page.dart` lines 504-515
- `ocean_admin_panel/lib/features/sellers/services/seller_service.dart` (two locations)

---

## Summary

**Problem:** Column name mismatch prevented Sequelize from loading seller documents
**Solution:** Added field mappings to SellerDocument model
**Action Required:** **RESTART BACKEND SERVER**
**Expected Result:** Documents will now load and display in admin panel

The fix ensures the Sequelize association correctly matches `seller_id` in the database with the `sellerId` property in JavaScript code.
