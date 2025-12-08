Phase 1: Backend foundation — OAuth and provider setup
Goal: Set up Flutterwave authentication and provider structure
Tasks:
OAuth token manager
Create FlutterwaveTokenManager class
Implement token generation from OAuth endpoint
Auto-refresh logic (refresh at ~9 minutes)
Token caching in memory/Redis
Flutterwave provider class
Create FlutterwaveProvider extending PaymentProviderInterface
Add to PaymentProviderFactory
Basic structure with placeholder methods
Environment configuration
Add Flutterwave env variables to .env.example
Document required credentials
Deliverables:
FlutterwaveTokenManager class
FlutterwaveProvider skeleton
Updated PaymentProvider.js with Flutterwave support
Environment variable documentation
Phase 2: Backend — payment methods implementation
Goal: Implement card, virtual account, and Google Pay
Tasks:
Card payments
createPaymentIntent() for card payments
Use Flutterwave Standard Checkout
Generate checkout URL with metadata
Virtual accounts
createVirtualAccount() method
Generate NUBAN for subscriptions
Store account details in database
Handle account verification
Google Pay
Enable Google Pay in payment intent
Configure in Flutterwave checkout
Payment verification
verifyPayment() method
Query Flutterwave API for transaction status
Handle different payment states
Deliverables:
Card payment flow working
Virtual account generation working
Google Pay enabled
Payment verification working
Phase 3: Backend — webhooks and callbacks
Goal: Handle Flutterwave webhooks for payment confirmation
Tasks:
Webhook endpoint
Create /api/subscriptions/callback/flutterwave route
Verify webhook signature
Parse webhook payload
Webhook processing
verifyWebhookSignature() method
processWebhook() method
Update subscription status on successful payment
Handle failed payments
Virtual account monitoring
Polling or webhook for virtual account deposits
Auto-verify when payment is received
Deliverables:
Webhook endpoint functional
Payment status updates automatically
Virtual account payments verified
Phase 4: Frontend — Flutterwave SDK and service
Goal: Set up Flutterwave SDK and payment service
Tasks:
Add dependencies
Add Flutterwave package to pubspec.yaml
Or use web-based Standard Checkout
Flutterwave payment service
Create flutterwave_payment_service.dart
Methods for initializing payments
Handle payment callbacks
Error handling
Payment models
Create payment request/response models
Type-safe payment data structures
Deliverables:
Flutterwave SDK integrated
Payment service created
Payment models defined
Phase 5: Frontend — payment method selection UI
Goal: Build UI for selecting payment methods
Tasks:
Payment method selection page
Create payment_method_selection_page.dart
Display: Card, Virtual Account, Google Pay
Visual cards for each method
Plan details display
Payment method cards
Card payment option with icon
Virtual account option with info
Google Pay option (if available)
Selected state styling
Navigation flow
Integrate into subscription flow
Pass selected method to backend
Deliverables:
Payment method selection page
UI components for each method
Integrated into subscription flow
Phase 6: Frontend — payment flows implementation
Goal: Implement each payment method flow
Tasks:
Card payment flow
Open Flutterwave Standard Checkout
Handle payment callback
Show success/error states
Redirect after payment
Virtual account flow
Display generated account details
Show account number, bank name
Instructions for payment
Polling for payment confirmation
Success notification
Google Pay flow
Initialize Google Pay in checkout
Handle Google Pay callback
Success/error handling
Deliverables:
Card payment working end-to-end
Virtual account display and verification
Google Pay working
Phase 7: Integration and subscription flow update
Goal: Integrate Flutterwave into existing subscription system
Tasks:
Update subscription controller
Accept paymentMethod parameter
Support flutterwave as provider
Route to Flutterwave provider when selected
Update subscription service
Handle Flutterwave payment references
Store payment method in subscription
Update payment status tracking
Update frontend subscription flow
Add payment method selection step
Pass selected method to backend
Handle Flutterwave responses
Deliverables:
Subscription flow supports Flutterwave
Payment method stored correctly
End-to-end subscription with Flutterwave working
Phase 8: Testing and polish
Goal: Test all payment methods and fix issues
Tasks:
Testing
Test card payments (test cards)
Test virtual account generation
Test Google Pay (if available)
Test webhook handling
Test error scenarios
Error handling
Network errors
Payment failures
Timeout handling
User-friendly error messages
UI/UX improvements
Loading states
Success animations
Error recovery flows
Payment status indicators
Documentation
API documentation updates
Integration guide
Environment setup guide
Deliverables:
All payment methods tested
Error handling robust
UI polished
Documentation complete
Implementation order
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8(Backend) (Backend) (Backend) (Frontend) (Frontend) (Frontend) (Integration) (Testing)
Success criteria
Users can select Flutterwave as payment method
Card payments work via Flutterwave checkout
Virtual accounts generate and verify payments
Google Pay works (if available)
Webhooks update subscription status automatically
Error handling is robust
UI is polished and user-friendly
Estimated complexity
Phase 1: Medium (OAuth token management)
Phase 2: High (Multiple payment methods)
Phase 3: Medium (Webhook handling)
Phase 4: Low (SDK integration)
Phase 5: Low (UI components)
Phase 6: Medium (Payment flows)
Phase 7: Medium (Integration)
Phase 8: Low (Testing and polish)