import { writable } from 'svelte/store';
import { isAuthenticated, getAuthToken } from '$lib/api/auth';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePicture?: string;
  accountType: 'buyer' | 'seller' | 'admin';
  accountStatus: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  return {
    subscribe,
    setUser: (user: User) => {
      update(state => ({
        ...state,
        user,
        isAuthenticated: true,
        error: null
      }));
    },
    clearUser: () => {
      update(state => ({
        ...state,
        user: null,
        isAuthenticated: false,
        error: null
      }));
    },
    setError: (error: string) => {
      update(state => ({
        ...state,
        error
      }));
    },
    clearError: () => {
      update(state => ({
        ...state,
        error: null
      }));
    },
    setLoading: (isLoading: boolean) => {
      update(state => ({
        ...state,
        isLoading
      }));
    },
    checkAuth: async () => {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        // Check if user is authenticated by making an API call
        const isAuth = await isAuthenticated();
        
        if (isAuth) {
          // Try to get user profile
          const response = await fetch('http://localhost:5000/api/profile', {
            credentials: 'include' // Include cookies
          });
          
          if (response.ok) {
            const user = await response.json();
            update(state => ({
              ...state,
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            }));
          } else {
            // Token is invalid, clear auth state
            update(state => ({
              ...state,
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            }));
          }
        } else {
          update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to check authentication status'
        }));
      }
    }
  };
}

export const authStore = createAuthStore(); 