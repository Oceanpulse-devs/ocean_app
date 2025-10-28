# Group Buy Integration - Required Changes to BulkPurchaseDetailPage

## Summary
The file has been partially updated but needs a comprehensive refactor to replace all dummy data with real backend data.

## Key Changes Made So Far
✅ Added imports for GroupBuyService, auth provider, and timeago
✅ Added state variables to store real data (_groupBuy, _participants, _conversationId)
✅ Added initState and _fetchGroupBuyData() to fetch from backend
✅ Updated build method to handle loading/error states
✅ Started extracting real data variables (title, productName, pricePerUnit, etc.)

## Data Mapping Reference

### Backend → Frontend Fields
```dart
_groupBuy!['title'] → title
_groupBuy!['product_name'] → productName
_groupBuy!['description'] → description
_groupBuy!['product_image'] → productImage
_groupBuy!['group_price'] → pricePerUnit
_groupBuy!['min_buyers'] → minBuyers
_groupBuy!['max_buyers'] → maxBuyers
_groupBuy!['current_buyers'] → currentBuyers
_groupBuy!['deadline'] [...] → deadlineStr
_groupBuy!['views_count'] → viewsCount
```

### Participants Array
```dart
_participants[index]['user']['fullName'] → name
_participants[index]['user']['profilePicture'] → avatar
_participants[index]['quantity'] → units wanted
_participants[index]['joined_at'] → join time
```

## Critical Replacements Needed

### 1. Views Count (Line 118)
```dart
// OLD
'${(_bulkPurchaseIndex * 100 + 234)}'

// NEW
'${_groupBuy!['views_count'] ?? 0}'
```

### 2. Product Name (Lines 213, 331)
```dart
// OLD
_getProductName(_bulkPurchaseIndex)

// NEW  
productName
```

### 3. Product Price (Lines 218, 333)
```dart
// OLD
'\$${(_getBulkPurchasePrice(_bulkPurchaseIndex)).toStringAsFixed(2)}'

// NEW
'\$${pricePerUnit.toStringAsFixed(2)}'
```

### 4. Target Quantity (Lines 253, 334, 663)
```dart
// OLD
'${_getTargetQuantity(_bulkPurchaseIndex)} units'

// NEW
'${maxBuyers ?? minBuyers} units'
```

### 5. Current Members (Lines 270, 335, 648)
```dart
// OLD
'${_getCurrentMembers(_bulkPurchaseIndex)}'

// NEW
'$currentBuyers'
```

### 6. Deadline (Lines 288, 336, 677)
```dart
// OLD
_getDeadline(_bulkPurchaseIndex)

// NEW
FormatDateTime(deadlineStr) // Need to parse and format
```

### 7. Progress Indicator (Lines 301, 693)
```dart
// OLD
value: _getCurrentMembers(_bulkPurchaseIndex) / _getTargetQuantity(_bulkPurchaseIndex)

// NEW
value: currentBuyers / (maxBuyers ?? minBuyers)
```

### 8. Participant Display (Lines 705-707)
```dart
// OLD  
itemCount: _getCurrentMembers(_bulkPurchaseIndex) + 1
if (index == _getCurrentMembers(_bulkPurchaseIndex)) {

// NEW
itemCount: _participants.length + (isCreator ? 0 : 1)
if (index == _participants.length) {
```

### 9. Join Navigation (Line 799)
```dart
// OLD
context.push('/chats/group-bulk-purchase-$_bulkPurchaseIndex');

// NEW
if (_conversationId != null) {
  context.push('/chats/$_conversationId');
}
```

### 10. Product Description (Line 319)
```dart
// OLD
_getProductDescription(_bulkPurchaseIndex)

// NEW
description
```

## Next Steps
1. Replace all 28 instances systematically
2. Update _buildMemberCard to use real participant data
3. Update _showJoinDialog to call groupBuyService.joinGroupBuy()
4. Test the complete flow

