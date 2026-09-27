# Distress Sale Form vs Backend API Comparison

## Frontend Form Fields

1. **productName** (TextFormField) - Required ✓
2. **description** (TextFormField) - Required ✓
3. **reason** (TextFormField) - Required (maps to `distressReason`)
4. **originalPrice** (TextFormField) - Required ✓
5. **distressPrice** (TextFormField) - Required (maps to `price`)
6. **_selectedCategory** (Dropdown) - Required ✓
7. **_selectedSubCategory** (Dropdown) - Required ✓
8. **_selectedEndTime** (DateTime) - Required (maps to `distressExpiryDate`)
9. **_selectedImages** (List<File>) - Required (2-4 images) ✓

## Backend API Expected Fields

### Required Fields:
- `title` or `productName` ✓ (backend accepts both)
- `description` ✓
- `originalPrice` ✓
- `distressReason` ✓ (frontend has `reason`)
- `distressExpiryDate` ✓ (frontend has `_selectedEndTime`)
- `category` ✓
- `subcategory` ✓
- `discountPercentage` OR `price` ⚠️ (frontend sends `distressPrice`, but backend also needs `discountPercentage` OR can calculate it)

### Optional Fields:
- `price` - If not provided, calculated from `originalPrice` and `discountPercentage`
- `discountPercentage` - If not provided, must be calculated from `price` and `originalPrice`
- `urgencyLevel` - Optional (defaults to 'medium' on backend)
- `brand` - Not in frontend form (optional)
- `condition` - Not in frontend form (defaults to 'good' on backend)
- `location` - Not in frontend form (optional)

## Issues to Fix:

1. ⚠️ **discountPercentage calculation**: Backend requires either `discountPercentage` OR `price`, and if only one is provided, it calculates the other. Frontend sends `distressPrice` but doesn't calculate/send `discountPercentage`. Need to calculate in frontend: `discountPercentage = ((originalPrice - distressPrice) / originalPrice) * 100`

2. ⚠️ **Field name mismatch**: Frontend uses `reason`, backend expects `distressReason`

3. ⚠️ **Field name mismatch**: Frontend uses `distressPrice`, backend expects `price`

4. ⚠️ **Date format**: Frontend uses `DateTime`, backend expects ISO string format for `distressExpiryDate`

5. ⚠️ **Images**: Frontend uses `File` objects (dart:io), needs to upload as multipart using FormData with `MultipartFile.fromBytes()` for web compatibility (similar to group buy form)

6. ⚠️ **Category**: Frontend sends category name string, backend Ajax can accept UUID or name string

7. ⚠️ **Missing optional fields**: `brand`, `condition`, `location` not in form but might be needed

## Action Items:

1. Create `DistressSaleService` similar to `GroupBuyService`
2. Update `_createDistressSale` to call backend API instead of creating local dummy data
3. Calculate `discountPercentage` from `originalPrice` and確實`distressPrice`
4. Map field names: `reason` → `distressReason`, `distressPrice` → `price`
5. Format `_selectedEndTime` to ISO 8601 string for `distressExpiryDate`
6. Upload images using `FormData` with `MultipartFile.fromBytes()` for web compatibility
7. Use `category` name string (backend can handle it)
8. Remove local dummy data creation

## Conclusion:

✅ **Can be connected successfully** but requires:
- Create service layer for API calls
- Fix field name mappings
- Calculate discount percentage
- Handle image uploads properly
- Format dates correctly

