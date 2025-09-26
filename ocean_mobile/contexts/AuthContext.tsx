import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { User, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    city: string;
    agreeTerms: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Verify token by getting user profile
        const response = await apiService.getProfile();
        console.log('Profile API response:', response);
        
        // All endpoints now return {message, user} structure
        if (response.user && response.user.email) {
          setUser(response.user);
          console.log('User authenticated on app start:', response.user.email);
        } else {
          console.log('Invalid user data received:', response);
          await AsyncStorage.removeItem('authToken');
          setUser(null);
        }
      } else {
        console.log('No authentication token found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiService.login({ email, password });
      
      // Store authentication status (backend uses httpOnly cookies for token)
      await AsyncStorage.setItem('authToken', 'authenticated');
      
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    city: string;
    agreeTerms: boolean;
  }) => {
    try {
      setIsLoading(true);
      
      const response: AuthResponse = await apiService.signup(userData);
      
      // Clear any pending verification email since we're using link-based verification
      await AsyncStorage.removeItem('pendingVerificationEmail');
      
      // Don't set user as authenticated until email is verified via link
      // setUser(response.user);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear local state regardless of API call success
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setIsLoading(false);
    }
  };

  const logoutAllDevices = async () => {
    try {
      setIsLoading(true);
      await apiService.logoutAllDevices();
    } catch (error) {
      console.error('Logout all devices failed:', error);
    } finally {
      // Clear local state regardless of API call success
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    logoutAllDevices,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
