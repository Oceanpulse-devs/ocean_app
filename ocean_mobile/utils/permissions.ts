import { User } from '../services/api';

// Role-based permission utilities
export const hasRole = (user: User | null, requiredRole: string): boolean => {
  return user?.role === requiredRole;
};

export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const isBuyer = (user: User | null): boolean => {
  return hasRole(user, 'buyer');
};

export const isSeller = (user: User | null): boolean => {
  return hasRole(user, 'seller');
};

export const isPendingSeller = (user: User | null): boolean => {
  return hasRole(user, 'pending-seller');
};

export const isVerifiedSeller = (user: User | null): boolean => {
  return isSeller(user) && user?.verificationStatus === 'approved';
};

// Feature access checks
export const canSell = (user: User | null): boolean => {
  return isSeller(user) || isPendingSeller(user);
};

export const canAccessSellerFeatures = (user: User | null): boolean => {
  return isSeller(user);
};

export const canAccessBuyerFeatures = (user: User | null): boolean => {
  return isBuyer(user) || isSeller(user); // Sellers can also buy
};

export const canCreateAuctions = (user: User | null): boolean => {
  return isVerifiedSeller(user);
};

export const canAccessAnalytics = (user: User | null): boolean => {
  return isSeller(user);
};

export const canAccessMessaging = (user: User | null): boolean => {
  return user !== null; // All authenticated users can message
};

// Account status checks
export const isAccountActive = (user: User | null): boolean => {
  return user?.accountStatus === 'active';
};

export const isAccountSuspended = (user: User | null): boolean => {
  return user?.accountStatus === 'suspended';
};

// Combined permission checks
export const canPerformAction = (user: User | null, action: string): boolean => {
  if (!user || !isAccountActive(user)) {
    return false;
  }

  switch (action) {
    case 'sell':
      return canSell(user);
    case 'buy':
      return canAccessBuyerFeatures(user);
    case 'create_auction':
      return canCreateAuctions(user);
    case 'access_analytics':
      return canAccessAnalytics(user);
    case 'message':
      return canAccessMessaging(user);
    case 'upload_product':
      return canSell(user);
    case 'view_seller_tools':
      return canAccessSellerFeatures(user);
    default:
      return false;
  }
};

// Get user display role for UI
export const getUserDisplayRole = (user: User | null): string => {
  if (!user) return 'Guest';
  
  switch (user.role) {
    case 'buyer':
      return 'Buyer';
    case 'seller':
      return user.verificationStatus === 'approved' ? 'Verified Seller' : 'Seller';
    case 'pending-seller':
      return 'Pending Seller';
    default:
      return 'User';
  }
};

// Get role-based color for UI
export const getRoleColor = (user: User | null): string => {
  if (!user) return '#6B7280';
  
  switch (user.role) {
    case 'buyer':
      return '#3B82F6'; // Blue
    case 'seller':
      return user.verificationStatus === 'approved' ? '#10B981' : '#F59E0B'; // Green or Orange
    case 'pending-seller':
      return '#F59E0B'; // Orange
    default:
      return '#6B7280'; // Gray
  }
};
