# Admin Panel - Seller Documents Fix

## Issue
Documents submitted by sellers (both pending and existing) were not visible when clicking the eye icon (👁️) to view seller details in the admin panel.

## Root Cause
The backend API endpoints `getAllSellers` and `searchSellers` were **not including the `documents` association** in their database queries. The admin panel displays seller data that's already loaded in the list, so when documents weren't fetched, they couldn't be displayed.

## Files Modified

### `ocean_server\src\controllers\sellerManagementController.js`

**1. Fixed `getAllSellers` method (line 42-54)**

**Before:**
```javascript
const sellers = await db.SellersTable.findAndCountAll({
  where: whereClause,
  include: [
    {
      model: db.UserTable,
      as: 'user',
      attributes: ['id', 'username', 'email', 'accountStatus', 'lastActive']
    }
    // ❌ Documents missing!
  ],
  order: [[sortBy, sortOrder]],
  limit: parseInt(limit),
  offset: parseInt(offset)
});
```

**After:**
```javascript
const sellers = await db.SellersTable.findAndCountAll({
  where: whereClause,
  include: [
    {
      model: db.UserTable,
      as: 'user',
      attributes: ['id', 'username', 'email', 'accountStatus', 'lastActive']
    },
    {
      model: db.SellerDocument,
      as: 'documents',
      required: false,  // ✅ Include even if seller has no documents
      attributes: [
        'id', 
        'documentType', 
        'documentNumber',
        'status', 
        'submittedAt', 
        'documentImage',      // Front image
        'documentBackImage'   // Back image for ID cards
      ]
    }
  ],
  order: [[sortBy, sortOrder]],
  limit: parseInt(limit),
  offset: parseInt(offset)
});
```

**2. Fixed `searchSellers` method (line 588-594)**

Added the same `documents` association to ensure searched sellers also show their documents.

## What This Fixes

✅ **All Sellers Tab** - Documents now visible when viewing any seller's details  
✅ **Pending Applications Tab** - Already had documents, continues to work  
✅ **Search Results** - Documents visible in search results  
✅ **Document Types Shown:**
- Document Type (e.g., "National ID", "Business License")
- Document Number
- Document Images (front and back)
- Submission status and date

## How It Works

When you click the eye icon (👁️) in the admin panel:

1. The admin panel shows a dialog with seller details
2. It displays data from the `seller` object already loaded in the list
3. Now that the list queries include `documents`, they will be visible in the dialog
4. The dialog shows:
   - Document type and number
   - Clickable document images (tap to view full size)
   - "No image available" message if document was submitted without image

## Expected Document Structure

Each document in the `documents` array contains:
```json
{
  "id": "doc-uuid",
  "documentType": "National ID",
  "documentNumber": "12345678",
  "status": "pending",
  "submittedAt": "2024-01-15T10:30:00Z",
  "documentImage": "/uploads/documents/front.jpg",
  "documentBackImage": "/uploads/documents/back.jpg"
}
```

## Next Steps (If Images Still Don't Show)

If documents appear but images don't load, the issue is likely with the image URL construction in the admin panel. Check:

1. **Image URL Construction** in `ocean_admin_panel\lib\features\sellers\pages\sellers_page.dart` (line 664-676)
2. **Base URL Configuration** in `ocean_admin_panel\lib\core\constants\app_constants.dart`
3. **CORS Settings** if images are on a different domain
4. **Image paths in database** - verify they're correct in the `seller_documents` table

## Testing

Test the fix by:

1. ✅ Go to "All Sellers" tab
2. ✅ Click eye icon on any seller
3. ✅ Verify documents section appears with document details
4. ✅ Go to "Pending Applications" tab
5. ✅ Click eye icon on pending seller
6. ✅ Verify documents are visible
7. ✅ Click on a document image to view full size

## Notes

- `required: false` ensures sellers without documents still appear in the list
- Both front and back images are included for documents like ID cards
- The `getPendingSellers` endpoint already had documents included (line 103-116)
- The `getSellerById` endpoint also already had documents included (line 169-181)
