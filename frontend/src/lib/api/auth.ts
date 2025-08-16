import { apiRequest } from './base';

// Authentication functions
export async function signup(userData: {
  fullName: string;
  username?: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}) {
  return apiRequest('/signup', {
    method: 'POST',
    body: JSON.stringify({
      fullName: userData.fullName,
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      agreeTerms: userData.agreeTerms,
      accountType: 'buyer', // Default to buyer
    }),
  });
}

export async function login(credentials: {
  email: string;
  password: string;
}) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout() {
  return apiRequest('/logout', {
    method: 'POST',
  });
}

export async function logoutAllDevices() {
  return apiRequest('/logout-all-devices', {
    method: 'POST',
  });
}

export async function getActiveSessions() {
  return apiRequest('/active-sessions', {
    method: 'GET',
  });
}

export async function forgotPassword(email: string) {
  return apiRequest('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetCode(email: string, code: string) {
  return apiRequest('/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return apiRequest('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function getProfile() {
  return apiRequest('/profile');
}

export async function updateProfile(profileData: {
  fullName?: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  coverPicture?: string;
}) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

// Seller registration
export async function registerSeller(sellerData: {
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite?: string;
  businessCategory: string;
  businessLicense?: string;
  taxId?: string;
  bankAccountInfo?: string;
  documents: {
    businessLicense?: File;
    taxCertificate?: File;
    bankStatement?: File;
    identityDocument?: File;
  };
}) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(sellerData).forEach(([key, value]) => {
    if (key !== 'documents' && value !== undefined) {
      formData.append(key, value);
    }
  });
  
  // Add files
  if (sellerData.documents) {
    Object.entries(sellerData.documents).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });
  }
  
  return apiRequest('/seller/register', {
    method: 'POST',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Google OAuth
export async function googleAuth() {
  return apiRequest('/auth/google', {
    method: 'GET',
  });
}

// Facebook OAuth
export async function facebookAuth() {
  return apiRequest('/auth/facebook', {
    method: 'GET',
  });
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    // Make an API call to check if the token is valid
    const response = await apiRequest('/profile');
    return true; // If we get here, the request was successful
  } catch (error) {
    console.log('🔍 isAuthenticated error:', error);
    return false;
  }
}

// Get user token (if needed for other API calls)
export function getAuthToken(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}
