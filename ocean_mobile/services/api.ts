import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getApiUrl } from '../config/api';

// API service class for handling HTTP requests
class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from AsyncStorage if available
    const token = await AsyncStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle different response types
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData.message || `HTTP ${response.status}`);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Authentication methods
  async signup(userData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
  }) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, userData);
  }

  async login(credentials: {
    email: string;
    password: string;
  }) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async logout() {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
  }

  async logoutAllDevices() {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT_ALL);
  }

  async forgotPassword(email: string) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async verifyResetCode(email: string, resetCode: string) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_RESET_CODE, { email, resetCode });
  }

  async resetPassword(data: {
    email: string;
    resetCode: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async getProfile() {
    return this.get(API_CONFIG.ENDPOINTS.PROFILE.GET_PROFILE);
  }

  async getUserProfile(userId: string) {
    return this.get(`${API_CONFIG.ENDPOINTS.PROFILE.GET_USER_PROFILE}/${userId}`);
  }

  async updateProfile(profileData: any) {
    return this.put(API_CONFIG.ENDPOINTS.PROFILE.UPDATE_PROFILE, profileData);
  }

  async sellerRegistration(sellerData: {
    businessName: string;
    businessAddress: string;
    category: string;
    documentType: string;
    documentNumber?: string;
    documentImage: string;
  }) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.SELLER_REGISTRATION, sellerData);
  }

  async getMessagingToken() {
    return this.get(API_CONFIG.ENDPOINTS.MESSAGING.GET_TOKEN);
  }

  async getActiveSessions() {
    return this.get(API_CONFIG.ENDPOINTS.MESSAGING.ACTIVE_SESSIONS);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export types for better TypeScript support
export interface User {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  role: 'buyer' | 'seller' | 'pending-seller'; // Current role for permissions/feature access
  accountType: 'buyer' | 'seller' | 'pending-seller'; // Account classification
  accountStatus: 'active' | 'suspended' | 'inactive';
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  profilePicture?: string;
  coverPicture?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  lastActive?: string;
  verificationStatus?: string;
  createdAt?: string;
  // Social stats
  followersCount?: number;
  followingCount?: number;
  productsCount?: number;
  featuredProducts?: Product[];
  // Seller-specific fields
  businessName?: string;
  businessAddress?: string;
  category?: string;
  rating?: number;
  totalSales?: number;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  brand?: string;
  location: string;
  images: string[];
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  message: string;
  error?: string;
}
