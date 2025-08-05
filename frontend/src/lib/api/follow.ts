// Follow API functions
import { apiRequest } from './base';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePicture?: string;
  accountType: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  mutualFollowersCount: number;
}

// Follow a user
export async function followUser(targetUserId: string) {
  return apiRequest('/follow', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
}

// Unfollow a user
export async function unfollowUser(targetUserId: string) {
  return apiRequest('/unfollow', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
}

// Get user's followers
export async function getFollowers(userId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'fullName';
  sortOrder?: 'ASC' | 'DESC';
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/users/${userId}/followers?${searchParams.toString()}`);
}

// Get user's following
export async function getFollowing(userId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'fullName';
  sortOrder?: 'ASC' | 'DESC';
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/users/${userId}/following?${searchParams.toString()}`);
}

// Check if current user is following target user
export async function checkFollowStatus(targetUserId: string) {
  return apiRequest(`/users/${targetUserId}/follow-status`);
}

// Get user's follow statistics
export async function getFollowStats(userId: string) {
  return apiRequest(`/users/${userId}/follow-stats`);
}

// Get mutual followers between current user and target user
export async function getMutualFollowers(targetUserId: string, params?: {
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/users/${targetUserId}/mutual-followers?${searchParams.toString()}`);
} 