# 🎯 Reach Feature Test Scenarios

## Overview
This document outlines comprehensive test scenarios for the new Reach Feature that automatically creates buyer needs from posts and manages contact limits.

## 🚀 Quick Start Testing

### Prerequisites
1. **Main Server Running**: `http://localhost:5000`
2. **Message Server Running**: `http://localhost:5001`
3. **Valid JWT Token**: Get from login API
4. **Postman Collections**: Import both updated collections

### Environment Variables Setup
```json
{
  "base_url_main": "http://localhost:5000",
  "base_url_message": "http://localhost:5001", 
  "auth_token": "your_jwt_token_here",
  "buyer_need_id": "will_be_generated",
  "conversation_id": "will_be_generated"
}
```

## 📋 Test Scenarios

### Scenario 1: Post Creation with Auto Buyer Need
**Objective**: Test that creating a post automatically creates a buyer need

#### Steps:
1. **Create Post** (Main Server)
   - **Endpoint**: `POST /api/posts`
   - **Method**: Single flexible route (handles both JSON and form-data)
   - **Text-Only Example**:
   ```json
   {
     "content": "Looking for a vintage guitar in good condition",
     "reach_limit": 3,
     "category_id": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```
   - **With Media Example** (form-data):
   ```
   content: "Looking for a vintage guitar in good condition"
   reach_limit: 3
   category_id: 550e8400-e29b-41d4-a716-446655440000
   media: [file upload]
   ```
   - **Expected**: Post created + Buyer need auto-created with custom reach limit
   - **Check**: Response includes `sourceId` and `sourceTable`

2. **Verify Buyer Need Created** (Main Server)
   - **Endpoint**: `GET /api/buyer-needs/all`
   - **Expected**: New buyer need appears in list
   - **Check**: `reach_limit: 3`, `current_reach: 0`, `reach_exceeded: false`

3. **Get Reach Status** (Main Server)
   - **Endpoint**: `GET /api/buyer-needs/{buyer_need_id}/reach-status`
   - **Expected**: 
   ```json
   {
     "success": true,
     "data": {
       "currentReach": 0,
       "reachLimit": 3,
       "reachExceeded": false,
       "canContact": true,
       "reachStatus": "0/3"
     }
   }
   ```

### Scenario 2: Reach Limit Validation
**Objective**: Test that reach limit validation works correctly

#### Steps:
1. **Test Valid Reach Limits** (Main Server)
   - **Endpoint**: `POST /api/posts`
   - **Method**: Single flexible route
   - **Test Cases**:
   ```json
   // Minimum reach limit (JSON)
   {
     "content": "Test with minimum reach",
     "reach_limit": 1
   }
   
   // Maximum reach limit (JSON)
   {
     "content": "Test with maximum reach", 
     "reach_limit": 50
   }
   
   // Custom reach limit (JSON)
   {
     "content": "Test with custom reach",
     "reach_limit": 15
   }
   ```
   - **Expected**: All requests succeed with specified reach limits

2. **Test Invalid Reach Limits** (Main Server)
   - **Endpoint**: `POST /api/posts`
   - **Method**: Single flexible route
   - **Test Cases**:
   ```json
   // Too low
   {
     "content": "Test with invalid reach",
     "reach_limit": 0
   }
   
   // Too high
   {
     "content": "Test with invalid reach",
     "reach_limit": 51
   }
   
   // Non-numeric
   {
     "content": "Test with invalid reach",
     "reach_limit": "abc"
   }
   ```
   - **Expected**: All requests fail with validation error

3. **Test Default Reach Limit** (Main Server)
   - **Endpoint**: `POST /api/posts`
   - **Method**: Single flexible route
   - **Body**:
   ```json
   {
     "content": "Test without reach limit"
   }
   ```
   - **Expected**: Post created with default reach limit of 5

### Scenario 3: Reach Increment via Buyer Need Messages
**Objective**: Test that messages from buyer needs page increment reach count

#### Steps:
1. **Create Conversation** (Message Server)
   - **Endpoint**: `POST /api/conversations`
   - **Body**:
   ```json
   {
     "type": "direct",
     "participants": ["recipient_user_id"]
   }
   ```

2. **Send Buyer Need Message** (Message Server)
   - **Endpoint**: `POST /api/messages`
   - **Body**:
   ```json
   {
     "conversationId": "conversation_id",
     "content": "I'm interested in your buyer need!",
     "referenceType": "buyer_need",
     "referenceId": "buyer_need_id",
     "referenceTitle": "Looking for Vintage Guitar",
     "referenceCategory": "Electronics",
     "buyerNeedId": "buyer_need_id"
   }
   ```
   - **Expected**: Message sent + Reach incremented
   - **Check**: Response includes reach info in metadata

3. **Verify Reach Increment** (Main Server)
   - **Endpoint**: `GET /api/buyer-needs/{buyer_need_id}/reach-status`
   - **Expected**: `currentReach: 1`, `canContact: true`

4. **Repeat Steps 2-3** until reach limit reached
   - **Expected**: After 3rd message, `reachExceeded: true`, `canContact: false`

### Scenario 3: Non-Buyer Need Messages Don't Increment Reach
**Objective**: Test that messages from other sources don't affect reach count

#### Steps:
1. **Send Product Reference Message** (Message Server)
   - **Body**:
   ```json
   {
     "conversationId": "conversation_id",
     "content": "Is this product still available?",
     "referenceType": "product",
     "referenceId": "product_id",
     "referenceTitle": "iPhone 13 Pro Max",
     "referenceCategory": "Electronics"
   }
   ```
   - **Expected**: Message sent, NO reach increment

2. **Send Swap Deal Reference Message** (Message Server)
   - **Body**:
   ```json
   {
     "conversationId": "conversation_id", 
     "content": "I'd like to discuss your swap deal",
     "referenceType": "swap_deal",
     "referenceId": "swap_deal_id",
     "referenceTitle": "Guitar for Camera Swap",
     "referenceCategory": "Electronics"
   }
   ```
   - **Expected**: Message sent, NO reach increment

3. **Verify Reach Unchanged** (Main Server)
   - **Expected**: Reach count remains the same

### Scenario 4: Reach Limit Enforcement
**Objective**: Test that reach limit prevents further contact

#### Steps:
1. **Reach Limit** (Repeat Scenario 2 until limit reached)
   - **Expected**: `currentReach: 3`, `reachLimit: 3`, `reachExceeded: true`

2. **Attempt Additional Buyer Need Message** (Message Server)
   - **Expected**: Message sent but reach NOT incremented
   - **Check**: Response shows `reachExceeded: true`

3. **Verify Contact Button Logic** (Main Server)
   - **Endpoint**: `GET /api/buyer-needs/all`
   - **Expected**: `canContact: false` for this buyer need

### Scenario 5: Cross-Server Communication Failure
**Objective**: Test resilience when main server is unavailable

#### Steps:
1. **Stop Main Server** (Temporarily)

2. **Send Buyer Need Message** (Message Server)
   - **Expected**: Message sent successfully
   - **Check**: Error logged but message creation succeeds

3. **Restart Main Server**

4. **Verify Message Created** (Message Server)
   - **Expected**: Message exists with reference info

### Scenario 6: Edge Cases and Error Handling

#### 6.1 Invalid Buyer Need ID
- **Test**: Send message with non-existent `buyerNeedId`
- **Expected**: Message sent, error logged, no crash

#### 6.2 Missing Reference Fields
- **Test**: Send message without `buyerNeedId` but with `referenceType: "buyer_need"`
- **Expected**: Message sent, no reach increment

#### 6.3 Malformed Reference Data
- **Test**: Send message with invalid `referenceType`
- **Expected**: Message sent, no reach increment

## 🔍 Monitoring and Debugging

### Key Logs to Watch

#### Main Server Logs:
```
📈 Incrementing reach for buyer need: {buyer_need_id}
✅ Reach incremented successfully: {current}/{limit}
❌ Error incrementing reach: {error_message}
```

#### Message Server Logs:
```
📱 Message creation request received
🔐 Auth middleware called for: POST /api/messages
📈 Incrementing reach for buyer need: {buyer_need_id}
✅ Reach incremented successfully: {current}/{limit}
❌ Error incrementing reach: {error_message}
```

### Database Verification Queries

#### Check Buyer Need Reach Status:
```sql
SELECT id, title, current_reach, reach_limit, reach_exceeded 
FROM buyer_needs 
WHERE id = 'your_buyer_need_id';
```

#### Check Message Reference Data:
```sql
SELECT id, content, reference_type, reference_id, reference_title, metadata 
FROM messages 
WHERE reference_type = 'buyer_need' 
ORDER BY created_at DESC;
```

## ✅ Success Criteria

### Functional Requirements:
- [ ] Posts automatically create buyer needs
- [ ] Buyer need messages increment reach count
- [ ] Non-buyer need messages don't affect reach
- [ ] Reach limit enforcement works correctly
- [ ] Contact button disappears when limit reached
- [ ] Cross-server communication is resilient

### Performance Requirements:
- [ ] Message sending succeeds even if reach increment fails
- [ ] Response times remain under 2 seconds
- [ ] No memory leaks in long-running tests

### Data Integrity:
- [ ] Reach counts are accurate
- [ ] Reference data is preserved in messages
- [ ] Database constraints are maintained

## 🚨 Common Issues and Solutions

### Issue: "Reach limit already exceeded"
**Cause**: Trying to increment reach beyond limit
**Solution**: Check `reach_exceeded` flag before allowing contact

### Issue: "Cannot add or update a child row: a foreign key constraint fails"
**Cause**: Invalid `buyerNeedId` in message
**Solution**: Validate buyer need exists before sending message

### Issue: "Error incrementing reach: Request failed with status code 500"
**Cause**: Main server unavailable or buyer need not found
**Solution**: Check main server status and buyer need ID

### Issue: Messages sent but reach not incrementing
**Cause**: Missing `buyerNeedId` or `referenceType` not "buyer_need"
**Solution**: Verify message payload includes correct reference fields

## 📊 Test Data Setup

### Sample Post Creation Payloads:

#### Post with Custom Reach Limit:
```json
{
  "content": "Looking for a vintage guitar in excellent condition",
  "reach_limit": 3,
  "category_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Post with Maximum Reach Limit:
```json
{
  "content": "Selling my car! Open to many offers and negotiations",
  "reach_limit": 50,
  "category_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### Post with Default Reach Limit:
```json
{
  "content": "Just a regular post without specifying reach limit"
}
```

#### Post with Form Data (for file uploads):
```
content: "Check out this amazing product!"
reach_limit: 10
category_id: 550e8400-e29b-41d4-a716-446655440000
media: [file upload]
```

### Sample Message Payloads:

#### Buyer Need Message (Increments Reach):
```json
{
  "conversationId": "conversation_uuid",
  "content": "I have exactly what you're looking for!",
  "referenceType": "buyer_need",
  "referenceId": "buyer_need_uuid",
  "referenceTitle": "Looking for Vintage Guitar",
  "referenceCategory": "Electronics",
  "buyerNeedId": "buyer_need_uuid"
}
```

#### Product Message (No Reach Increment):
```json
{
  "conversationId": "conversation_uuid",
  "content": "Is this still available?",
  "referenceType": "product",
  "referenceId": "product_uuid",
  "referenceTitle": "iPhone 13 Pro Max",
  "referenceCategory": "Electronics"
}
```

## 🎯 Next Steps After Testing

1. **Performance Testing**: Load test with multiple concurrent messages
2. **Integration Testing**: Test with real frontend integration
3. **User Acceptance Testing**: Validate with actual users
4. **Production Deployment**: Deploy to staging environment
5. **Monitoring Setup**: Configure alerts for reach increment failures

---

**Note**: This testing guide assumes both servers are running locally. Adjust URLs and ports for different environments.
