# Signup Redirect Analysis - The Real Problem 🔍

## Root Cause Analysis

The issue is that **after signup, the user is automatically being set in the auth state**, which causes the router to redirect them to home page.

### The Problem Flow:

1. **User signs up** → `signUpWithEmailAndPassword()` called
2. **Backend returns user + token** → Auth service stores the token
3. **Auth provider creates User object** → Sets user in auth state
4. **Router sees `authState != null`** → User is "logged in" according to router
5. **Router redirect logic kicks in**: If user is logged in and tries to access auth routes, redirect to `/` (home)
6. **User gets redirected to home page**

### But Then:
- User doesn't have a valid auth token stored properly
- Profile fetch fails with 401 "Token not found!"
- Everything breaks

---

## The Fix Applied:

### 1. **Auth Provider** - Don't Create User After Signup
```dart
// BEFORE: Created user and set in auth state (caused auto-login)
await ref.read(authStateProvider.notifier).setUser(user);
state = AuthState.success(user);

// AFTER: Don't create user yet, just mark as initial state
state = const AuthState.initial();
```

### 2. **Register Page** - Handle Initial State
```dart
// Added navigation when state changes from loading to initial
initial: () {
  if (previous is _Loading && next is _Initial) {
    context.push('/auth/otp', extra: {
      'email': _emailController.text.trim(),
      'userId': '',
    });
  }
}
```

### 3. **OTP Page** - Redirect to Login After Verification
```dart
// After OTP verification, redirect to login page
context.go('/auth/login');
```

---

## Why This Fixes It:

1. **Signup** → Creates account, stores email, but **doesn't create auth state**
2. **Navigate to OTP** → User verifies email
3. **Router sees authState is null** → No redirect to home
4. **After OTP** → Redirect to login page
5. **User logs in** → Proper authentication flow with token storage

---

## The Key Insight:

**Signup should NOT auto-login the user!**
- User must verify email first (OTP)
- Then user must explicitly log in
- This ensures proper authentication flow

---

## Status: Fixed ✅

The signup flow now correctly:
1. ✅ Creates account without logging in
2. ✅ Redirects to OTP verification
3. ✅ After OTP, redirects to login
4. ✅ User must log in to access app

**No more automatic redirect to home page!**

