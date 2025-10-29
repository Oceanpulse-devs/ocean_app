# Bulk Purchase Fixes Plan

## Issues Identified
1. ✅ **Only 1 image saved** - Backend only uploads first image
2. ✅ **Frontend not displaying** - Data shows in response but not in UI  
3. ✅ **Data mismatch** - "Target Quantity" maps to `min_buyers` instead of `max_buyers`
4. ✅ **Missing input** - Frontend has no `max_buyers` field
5. ✅ **ID type** - IDs are integers (AUTO_INCREMENT), not UUIDs (this is actually fine)
6. ⚠️ **Group chat not created** - No group conversation appears after creating group buy

## Fix Plan

### 1. Backend: Handle Multiple Images
**File:** `ocean_server/src/controllers/groupBuyController.js`
- Change `product_image` to store array of image URLs (JSON)
- Upload all images to Cloudinary, not just the first one
- Store as JSON array in database

### 2. Backend: Separate min_buyers and max_buyers
**File:** `ocean_server/src/controllers/groupBuyController.js`
- Keep current logic for `min_buyers`
- Extract "Target Quantity" from frontend and map to `max_buyers`
- Both should be required fields

### 3. Frontend: Add max_buyers Input Field
**File:** `flutter-ocean/lib/features/market_survey/presentation/pages/create_bulk_purchase_modal.dart`
- Add `max_buyers` text field
- Label it "Maximum Participants"
- Add validation

### 4. Frontend: Map Fields Correctly
**File:** `flutter-ocean/lib/features/market_survey/presentation/pages/create_bulk_purchase_modal.dart`
- Ensure form field names match backend expectations:
  - Current "Target Quantity" → `min_buyers`
  - New "Maximum Participants" → `max_buyers`

### 5. Frontend: Display Multiple Images
**Files:** 
- `bulk_purchases_page.dart`
- `bulk_purchase_detail_page.dart`
- Display first image as thumbnail/preview
- On detail page, show all images

### 6. ID Handling
- Change is fine - backend uses INTEGER AUTO_INCREMENT
- Frontend already handles this correctly with `.toString()`
- No changes needed

## Implementation Order
1. Fix backend to accept and store `max_buyers` correctly
2. Update frontend form to send both `min_buyers` and `max_buyers`
3. Fix image upload to handle multiple images
4. **Debug group chat creation issue** (conversation_id is null in API response)
5. Update frontend to refresh data after creation
6. Update frontend to display multiple images
7. Test complete flow

### **Group Chat Debug Needed:**
From the API response: `conversation_id: null`
- Check if `createGroupConversation` helper is being called in backend
- Review backend error logs for conversation creation failures
- Verify message server URL and internal API token are configured
- Ensure cross-server authentication is working

