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
        isLoading: false,
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
       console.log('🔍 AuthStore: Starting auth check...');
       update(state => ({ ...state, isLoading: true }));
       
       try {
         // Check if user is authenticated by making an API call
         const isAuth = await isAuthenticated();
         console.log('🔍 AuthStore: isAuthenticated() returned:', isAuth);
         
         if (isAuth) {
           // Try to get user profile
           const { getProfile } = await import('$lib/api/auth');
           const data = await getProfile();
           console.log('🔍 AuthStore: Profile data:', data);
           
           if (data && data.profileInfo) {
             // Transform profile data to match User interface
             const userData = {
               id: data.profileInfo.id || 'unknown',
               fullName: data.profileInfo.fullName,
               username: data.profileInfo.email.split('@')[0], // Generate username from email
               email: data.profileInfo.email,
               accountType: data.profileInfo.role as 'buyer' | 'seller' | 'admin',
               accountStatus: data.profileInfo.accountStatus as 'active' | 'inactive' | 'suspended',
               createdAt: data.profileInfo.createdAt,
               updatedAt: data.profileInfo.createdAt // Use createdAt as updatedAt since backend doesn't provide it
             };
             console.log('🔍 AuthStore: Setting user data:', userData);
             update(state => ({
               ...state,
               user: userData,
               isAuthenticated: true,
               isLoading: false,
               error: null
             }));
           } else {
             console.log('🔍 AuthStore: Profile data invalid, clearing auth state');
             // Profile data is invalid, clear auth state
             update(state => ({
               ...state,
               user: null,
               isAuthenticated: false,
               isLoading: false,
               error: null
             }));
           }
         } else {
           console.log('🔍 AuthStore: Not authenticated, clearing auth state');
           update(state => ({
             ...state,
             user: null,
             isAuthenticated: false,
             isLoading: false,
             error: null
           }));
         }
       } catch (error) {
         console.log('🔍 AuthStore: Error during auth check:', error);
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