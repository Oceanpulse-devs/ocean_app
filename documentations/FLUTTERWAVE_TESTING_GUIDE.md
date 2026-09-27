# Flutterwave Integration Testing Guide

## Overview
This guide provides instructions for testing the Flutterwave payment integration in the Ocean app.

## Prerequisites
1. Flutterwave sandbox account credentials
2. Test environment variables configured
3. Backend server running
4. Flutter app running

## Environment Setup

### Backend Environment Variables
```env
# Flutterwave Configuration
FLW_CLIENT_ID=your_flutterwave_client_id
FLW_CLIENT_SECRET=your_flutterwave_client_secret
FLW_PUBLIC_KEY=your_flutterwave_public_key
FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_ENCRYPTION_KEY=your_flutterwave_encryption_key
FLW_BASE_URL=https://api.flutterwave.com/v3

# Payment Provider
PAYMENT_PROVIDER=flutterwave
```

### Frontend Configuration
Ensure `AppConfig` has Flutterwave public key configured:
```dart
FLW_PUBLIC_KEY=your_flutterwave_public_key
```

## Test Cards

### Successful Payment Cards
Use these cards for successful payment testing:

| Card Number | CVV | Expiry | PIN | OTP |
|-------------|-----|--------|-----|-----|
| 5531886652142950 | 564 | Any future date | 3310 | 123456 |
| 4084084084084081 | 408 | Any future date | 4081 | 123456 |

### Failed Payment Cards
Use these cards to test error scenarios:

| Card Number | CVV | Expected Result |
|-------------|-----|-----------------|
| 5060666666666666666 | 123 | Insufficient Funds |
| 4084084084084081 | 408 | Card Declined |
| 506099058000000000 | 123 | Invalid Card |

### Test Card Details
- **CVV**: Use any 3-digit number
- **Expiry Date**: Use any future date (e.g., 12/25)
- **PIN**: Use the PIN provided in the table
- **OTP**: Use 123456 for all test transactions

## Testing Scenarios

### 1. Card Payment Flow

#### Test Case 1.1: Successful Card Payment
1. Navigate to Seller Plans page
2. Select a plan (e.g., Wave, Tide, Surge)
3. Click "Choose Plan"
4. Select "Card Payment" method
5. Click "Continue to Payment"
6. WebView opens with Flutterwave checkout
7. Enter test card: `5531886652142950`
8. Enter CVV: `564`
9. Enter expiry: `12/25`
10. Enter PIN: `3310`
11. Enter OTP: `123456`
12. **Expected**: Payment succeeds, subscription activated, success screen shown

#### Test Case 1.2: Declined Card Payment
1. Follow steps 1-6 from Test Case 1.1
2. Enter test card: `4084084084084081`
3. Enter CVV: `408`
4. Enter expiry: `12/25`
5. Enter PIN: `4081`
6. Enter OTP: `123456`
7. **Expected**: Payment declined, error message shown, retry option available

#### Test Case 1.3: Insufficient Funds
1. Follow steps 1-6 from Test Case 1.1
2. Enter test card: `5060666666666666666`
3. Enter CVV: `123`
4. Enter expiry: `12/25`
5. Enter PIN: `1234`
6. Enter OTP: `123456`
7. **Expected**: Insufficient funds error, user-friendly message shown

#### Test Case 1.4: Payment Cancellation
1. Follow steps 1-6 from Test Case 1.1
2. Click "Cancel" or close WebView
3. **Expected**: Returns to payment method selection, no subscription created

### 2. Virtual Account Flow

#### Test Case 2.1: Virtual Account Creation
1. Navigate to Seller Plans page
2. Select a plan
3. Click "Choose Plan"
4. Select "Virtual Account" method
5. Click "Continue to Payment"
6. **Expected**: 
   - Virtual account details displayed
   - Account number shown
   - Bank name shown
   - Amount to pay shown
   - Payment instructions displayed
   - Polling indicator active

#### Test Case 2.2: Virtual Account Payment Detection
1. Complete Test Case 2.1
2. Transfer exact amount to virtual account
3. Wait for polling (up to 15 minutes)
4. **Expected**: 
   - Payment detected automatically
   - Subscription activated
   - Success screen shown
   - Polling stops

#### Test Case 2.3: Virtual Account Timeout
1. Complete Test Case 2.1
2. Wait 5 minutes without payment
3. **Expected**: 
   - Timeout message shown after 20 polling attempts
   - User can retry or contact support
   - Account details still visible

### 3. Google Pay Flow

#### Test Case 3.1: Google Pay Payment (if available)
1. Navigate to Seller Plans page
2. Select a plan
3. Click "Choose Plan"
4. Select "Google Pay" method
5. Click "Continue to Payment"
6. **Expected**: 
   - WebView opens with Google Pay option
   - User can select Google Pay
   - Payment processes through Google Pay
   - Success screen shown

### 4. Error Handling Tests

#### Test Case 4.1: Network Error
1. Disable internet connection
2. Attempt to subscribe to a plan
3. **Expected**: 
   - Network error message shown
   - Retry option available
   - Automatic retry with exponential backoff

#### Test Case 4.2: Timeout Handling
1. Simulate slow network (throttle connection)
2. Attempt payment
3. **Expected**: 
   - Timeout error message shown
   - Retry option available
   - Clear error message

#### Test Case 4.3: Server Error
1. Stop backend server
2. Attempt to subscribe
3. **Expected**: 
   - Server error message shown
   - User-friendly error message
   - Retry option available

### 5. Webhook Testing

#### Test Case 5.1: Successful Payment Webhook
1. Complete a successful payment
2. Check backend logs
3. **Expected**: 
   - Webhook received
   - Signature verified
   - Subscription status updated
   - Email sent

#### Test Case 5.2: Failed Payment Webhook
1. Complete a failed payment
2. Check backend logs
3. **Expected**: 
   - Webhook received
   - Signature verified
   - Payment failure logged
   - User notified

#### Test Case 5.3: Virtual Account Webhook
1. Transfer money to virtual account
2. Check backend logs
3. **Expected**: 
   - Webhook received for virtual account credit
   - Subscription activated automatically
   - Email sent

## Testing Checklist

### Payment Methods
- [ ] Card payment - successful
- [ ] Card payment - declined
- [ ] Card payment - insufficient funds
- [ ] Card payment - cancellation
- [ ] Virtual account - creation
- [ ] Virtual account - payment detection
- [ ] Virtual account - timeout
- [ ] Google Pay - if available

### Error Scenarios
- [ ] Network errors
- [ ] Timeout errors
- [ ] Server errors
- [ ] Invalid payment data
- [ ] Payment cancellation

### Integration Points
- [ ] Payment method selection
- [ ] Payment processing
- [ ] Payment verification
- [ ] Subscription activation
- [ ] Webhook handling
- [ ] Email notifications

### UI/UX
- [ ] Loading states
- [ ] Success animations
- [ ] Error messages
- [ ] Retry flows
- [ ] Navigation flows

## Debugging

### Backend Logs
Check for:
- OAuth token refresh logs
- Payment intent creation logs
- Webhook processing logs
- Virtual account creation logs
- Payment verification logs

### Frontend Logs
Check for:
- Payment service calls
- Error messages
- Retry attempts
- Payment status updates

### Common Issues

#### Issue: Payment Intent Creation Fails
**Solution**: 
- Check Flutterwave credentials
- Verify OAuth token is valid
- Check network connectivity
- Review backend logs

#### Issue: Webhook Not Received
**Solution**:
- Verify webhook URL is accessible
- Check encryption key matches
- Verify webhook signature
- Check Flutterwave dashboard webhook settings

#### Issue: Virtual Account Not Created
**Solution**:
- Check Flutterwave API response
- Verify user email is valid
- Check account creation limits
- Review backend logs

#### Issue: Payment Verification Fails
**Solution**:
- Verify payment reference is correct
- Check Flutterwave API status
- Verify subscription exists
- Review verification logs

## Production Checklist

Before going to production:
- [ ] Update to production Flutterwave credentials
- [ ] Configure production webhook URL
- [ ] Test all payment methods in production
- [ ] Verify webhook security
- [ ] Test error handling
- [ ] Review error messages
- [ ] Test email notifications
- [ ] Verify subscription activation
- [ ] Test virtual account monitoring
- [ ] Review security measures

## Support

For issues or questions:
1. Check backend logs
2. Check frontend logs
3. Review Flutterwave dashboard
4. Check webhook logs
5. Contact support with:
   - Payment reference
   - Error messages
   - Logs
   - Steps to reproduce

