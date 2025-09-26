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
        // Only set Content-Type if not already set (for FormData compatibility)
        ...(options.headers?.['Content-Type'] === undefined && { 'Content-Type': 'application/json' }),
        ...(token && token !== 'authenticated' && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
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
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      console.log('API Service: Sending FormData to', endpoint);
      console.log('FormData entries:', Array.from(data.entries()));
      console.log('FormData type:', typeof data);
      console.log('FormData constructor:', data.constructor.name);
      
      // Check if any entries contain file objects
      const entries = Array.from(data.entries());
      entries.forEach(([key, value], index) => {
        console.log(`Entry ${index}:`, { key, value, valueType: typeof value });
        if (typeof value === 'object' && value !== null) {
          console.log(`Object entry ${index} keys:`, Object.keys(value));
        }
      });
    } else {
      console.log('API Service: Sending JSON to', endpoint, data);
    }
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      // Don't set Content-Type for FormData - let the browser set it with boundary
      ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } })
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      // Don't set Content-Type for FormData - let the browser set it with boundary
      ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } })
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
    country: string;
    city: string;
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

  async updateProfileWithFormData(formData: FormData) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.PROFILE.UPDATE_PROFILE}`;
    
    // Get token from AsyncStorage if available
    const token = await AsyncStorage.getItem('authToken');
    
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        ...(token && token !== 'authenticated' && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      credentials: 'include',
      body: formData,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData.message || `HTTP ${response.status}`);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {};
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
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

  // Post interaction methods
  async toggleLike(postId: string) {
    return this.post(`/api/posts/${postId}/like`);
  }

  async toggleSave(postId: string, collectionName: string = 'General') {
    return this.post(`/api/posts/${postId}/save`, { collectionName });
  }

  async createComment(postId: string, content: string) {
    return this.post(`/api/posts/${postId}/comments`, { content });
  }

  async getComments(postId: string, page: number = 1, limit: number = 10) {
    return this.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  async updateComment(commentId: string, content: string) {
    return this.put(`/api/comments/${commentId}`, { content });
  }

  async deleteComment(commentId: string) {
    return this.delete(`/api/comments/${commentId}`);
  }

  async getSavedPosts(page: number = 1, limit: number = 10, collectionName?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (collectionName) {
      params.append('collectionName', collectionName);
    }
    return this.get(`/api/saved-posts?${params.toString()}`);
  }

  // Share functionality (placeholder - backend not implemented yet)
  async sharePost(postId: string) {
    // TODO: Implement when backend share endpoint is available
    console.log('Share functionality not yet implemented in backend');
    return Promise.resolve({ message: 'Share functionality coming soon' });
  }

  // Product methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
    sellerId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.get(`/api/products?${queryParams.toString()}`);
  }

  async getProduct(productId: string) {
    return this.get(`/api/product/${productId}`);
  }

  async getCategories() {
    return this.get('/api/categories');
  }

  async toggleSaveProduct(productId: string) {
    return this.post(`/api/products/${productId}/save`);
  }

  // Messaging methods (using separate messaging server with JWT auth)
  private async getMessagingToken(): Promise<string | null> {
    try {
      // Get the JWT token from the main server
      const response = await fetch(`${this.baseURL}/api/messaging-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting messaging token:', error);
      return null;
    }
  }

  private async messagingRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getMessagingToken();
    if (!token) {
      throw new Error('No messaging token available');
    }

    const messagingServerUrl = 'https://messageserver-production-88ba.up.railway.app';
    const url = `${messagingServerUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getConversations(page: number = 1, limit: number = 20) {
    return this.messagingRequest(`/api/conversations?page=${page}&limit=${limit}`);
  }

  async createConversation(participants: string[], type: 'direct' | 'group' = 'direct', name?: string) {
    return this.messagingRequest('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        type,
        participants,
        ...(name && { name })
      }),
    });
  }

  async getConversation(conversationId: string) {
    return this.messagingRequest(`/api/conversations/${conversationId}`);
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    return this.messagingRequest(`/api/messages/${conversationId}?page=${page}&limit=${limit}`);
  }

  async sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text', replyToId?: string) {
    return this.messagingRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content,
        type,
        ...(replyToId && { replyToId })
      }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.messagingRequest(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async addReaction(messageId: string, reaction: string) {
    return this.messagingRequest(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reaction }),
    });
  }

  async markConversationAsRead(conversationId: string) {
    return this.messagingRequest(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    return this.messagingRequest(`/api/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  async getOnlineUsers(page: number = 1, limit: number = 20) {
    return this.messagingRequest(`/api/users/online?page=${page}&limit=${limit}`);
  }

  async getRecentContacts(limit: number = 10) {
    return this.messagingRequest(`/api/users/recent/contacts?limit=${limit}`);
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
