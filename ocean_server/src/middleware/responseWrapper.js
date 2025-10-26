/**
 * Response Wrapper Middleware
 * 
 * This middleware automatically wraps all API responses in a consistent format:
 * 
 * Success Response:
 * {
 *   "success": true,
 *   "message": "Status message",
 *   "data": { ...actual response data... }
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": { ...error details... }
 * }
 * 
 * This ensures the frontend always receives responses in the expected format
 * without needing to modify individual controllers.
 */

const responseWrapper = (req, res, next) => {
  // Store the original json method
  const originalJson = res.json.bind(res);
  
  // Override the json method to wrap responses
  res.json = function(data) {
    // Skip wrapping if response already has success flag
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson(data);
    }
    
    // Handle error responses (status codes 400+)
    if (res.statusCode >= 400) {
      return originalJson({
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors || data.error || data
      });
    }
    
    // ========================================
    // Special Case: Logout
    // ========================================
    if (data && data.message && data.message.includes('Logged out')) {
      return originalJson({
        success: true,
        message: data.message
      });
    }
    
    // ========================================
    // Special Case: Authentication Responses
    // ========================================
    if (data && data.user && data.token) {
      // Login response
      return originalJson({
        success: true,
        message: data.message || 'Login successful',
        data: {
          user: data.user,
          token: data.token
        }
      });
    }
    
    // ========================================
    // Special Case: Signup Response
    // ========================================
    if (data && data.user && data.requiresVerification) {
      return originalJson({
        success: true,
        message: data.message || 'Registration successful',
        data: {
          user: data.user
        },
        requiresVerification: data.requiresVerification
      });
    }
    
    // ========================================
    // Special Case: Profile Response
    // ========================================
    if (data && data.profileInfo) {
      return originalJson({
        success: true,
        message: 'Profile retrieved successfully',
        user: data.profileInfo
      });
    }
    
    // ========================================
    // Special Case: Forgot Password
    // ========================================
    if (data && data.message && data.message.includes('Reset code sent')) {
      return originalJson({
        success: true,
        message: 'Password reset email sent',
        data: {
          otpSent: true
        }
      });
    }
    
    // ========================================
    // Special Case: OTP/Reset Code Verification
    // ========================================
    if (data && data.message && data.message.includes('Reset code verified')) {
      return originalJson({
        success: true,
        message: 'OTP verified',
        data: {
          verified: true
        }
      });
    }
    
    // ========================================
    // Special Case: Password Reset Success
    // ========================================
    if (data && data.message && data.message.includes('Password reset successfully')) {
      return originalJson({
        success: true,
        message: data.message
      });
    }
    
    // ========================================
    // Special Case: Email Verification
    // ========================================
    if (data && data.message && data.message.includes('verified successfully')) {
      return originalJson({
        success: true,
        message: data.message,
        user: data.user
      });
    }
    
    // ========================================
    // Special Case: List endpoints with data arrays
    // ========================================
    if (data && (data.posts || data.products || data.auctions || data.distressSales || 
                 data.swapDeals || data.groupBuys || data.demandPosts || data.bids || 
                 data.comments || data.notifications || data.chats || data.messages ||
                 data.sellers || data.users)) {
      // These already have success: true from controllers - pass through with data wrapper
      if (typeof data === 'object' && 'success' in data) {
        return originalJson(data);
      }
      return originalJson({
        success: true,
        message: data.message || 'Request successful',
        data: data
      });
    }
    
    // ========================================
    // Special Case: Responses with pagination
    // ========================================
    if (data && data.pagination) {
      return originalJson({
        success: true,
        message: data.message || 'Request successful',
        data: data
      });
    }
    
    // ========================================
    // Default Success Response Wrapper
    // ========================================
    // For responses without specific handling
    return originalJson({
      success: true,
      message: data.message || 'Request successful',
      data: data
    });
  };
  
  next();
};

module.exports = responseWrapper;

