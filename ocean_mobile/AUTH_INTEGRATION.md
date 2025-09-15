# Authentication Integration Documentation

This document outlines the authentication system integration between the Ocean mobile app and the backend API.

## 🏗️ Architecture Overview

The authentication system consists of several key components:

### 1. **API Service** (`services/api.ts`)
- Centralized HTTP client for all backend communications
- Handles authentication tokens and request/response processing
- Provides typed methods for all authentication endpoints

### 2. **Auth Context** (`contexts/AuthContext.tsx`)
- React Context for managing global authentication state
- Provides authentication methods (login, signup, logout)
- Handles token storage and user session management

### 3. **Authentication Pages**
- **Signup** (`app/auth/create-account.tsx`): User registration with validation
- **Login** (`app/auth/login.tsx`): User authentication with error handling
- **Profile** (`app/(tabs)/profile.tsx`): Logout functionality

## 🔧 Configuration

### API Configuration (`config/api.ts`)
```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000'  // Development
    : 'https://your-production-api.com', // Production
  
  ENDPOINTS: {
    AUTH: {
      SIGNUP: '/api/signup',
      LOGIN: '/api/login',
      LOGOUT: '/api/logout',
      // ... other endpoints
    }
  }
};
```

## 📱 Features Implemented

### ✅ **Signup Integration**
- **Form Validation**: Client-side validation for all required fields
- **Password Requirements**: Enforces strong password policy
- **Error Handling**: Displays specific error messages from backend
- **Loading States**: Shows loading indicator during API calls
- **Success Flow**: Redirects to main app after successful signup

### ✅ **Login Integration**
- **Email/Password Validation**: Validates input format
- **Authentication**: Communicates with backend login endpoint
- **Error Handling**: Shows appropriate error messages
- **Loading States**: Visual feedback during login process
- **Session Management**: Stores authentication token locally

### ✅ **Logout Functionality**
- **Confirmation Dialog**: Asks user to confirm logout
- **API Call**: Communicates with backend logout endpoint
- **Token Cleanup**: Removes stored authentication tokens
- **Navigation**: Redirects to login screen

## 🔐 Security Features

### **Token Management**
- JWT tokens stored securely using AsyncStorage
- Automatic token inclusion in API requests
- Token cleanup on logout

### **Input Validation**
- Client-side validation for all forms
- Email format validation
- Password strength requirements
- Real-time error clearing

### **Error Handling**
- Comprehensive error messages
- Network error handling
- User-friendly error displays

## 🚀 Usage Examples

### **Using Auth Context**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };
}
```

### **Making API Calls**
```typescript
import apiService from '../services/api';

// Signup
const response = await apiService.signup({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  agreeTerms: true
});

// Login
const response = await apiService.login({
  email: 'john@example.com',
  password: 'SecurePass123'
});
```

## 🔄 Backend Integration

The mobile app integrates with the following backend endpoints:

### **Authentication Routes** (`authRoutes.js`)
- `POST /api/signup` - User registration
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `POST /api/logout-all-devices` - Logout from all devices
- `POST /api/forgot-password` - Password reset request
- `POST /api/verify-resetCode` - Verify reset code
- `POST /api/reset-password` - Reset password
- `POST /api/seller-registration` - Seller account registration

### **Profile Routes**
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/users/:userId` - Get user profile by ID

## 📋 Validation Rules

### **Signup Validation**
- Full Name: Minimum 2 characters
- Email: Valid email format
- Country: Required field
- City: Required field
- Password: Minimum 8 characters with uppercase, lowercase, and number
- Confirm Password: Must match password

### **Login Validation**
- Email: Valid email format
- Password: Required field

## 🎯 Next Steps

### **Pending Features**
1. **Forgot Password Flow**: Complete password reset implementation
2. **OTP Verification**: Email verification system
3. **Social Login**: Google/Facebook authentication
4. **Biometric Authentication**: Fingerprint/Face ID support
5. **Session Management**: Active sessions monitoring

### **Improvements**
1. **Offline Support**: Cache authentication state
2. **Token Refresh**: Automatic token renewal
3. **Security Headers**: Enhanced request security
4. **Analytics**: Authentication event tracking

## 🐛 Troubleshooting

### **Common Issues**

1. **Network Errors**
   - Check if backend server is running
   - Verify API URL configuration
   - Check network connectivity

2. **Authentication Failures**
   - Verify user credentials
   - Check token storage
   - Clear app data and retry

3. **Validation Errors**
   - Ensure all required fields are filled
   - Check password requirements
   - Verify email format

## 📞 Support

For authentication-related issues:
1. Check the console logs for error messages
2. Verify backend API responses
3. Test with valid credentials
4. Clear app storage if needed

---

**Last Updated**: December 2024
**Version**: 1.0.0
