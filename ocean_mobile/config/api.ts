import Constants from 'expo-constants';

// Get the development server URL automatically
const getDevServerUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // Extract IP from debugger host (e.g., "10.125.196.166:8081" -> "10.125.196.166")
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000`;
  }
  // Fallback to your actual IP address with correct port
  return 'http://10.125.196.166:5000';
};

// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API
  BASE_URL: __DEV__ 
    ? getDevServerUrl()  // Automatically detects your computer's IP
    : 'https://your-production-api.com', // Production URL
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNUP: '/api/signup',
      LOGIN: '/api/login',
      LOGOUT: '/api/logout',
      LOGOUT_ALL: '/api/logout-all-devices',
      FORGOT_PASSWORD: '/api/forgot-password',
      VERIFY_RESET_CODE: '/api/verify-resetCode',
      RESET_PASSWORD: '/api/reset-password',
      SELLER_REGISTRATION: '/api/seller-registration',
    },
    PROFILE: {
      GET_PROFILE: '/api/profile',
      UPDATE_PROFILE: '/api/profile',
      GET_USER_PROFILE: '/api/users',
    },
    MESSAGING: {
      GET_TOKEN: '/api/messaging-token',
      ACTIVE_SESSIONS: '/api/active-sessions',
    },
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 15000, // Increased timeout for development
  
  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return __DEV__;
};
