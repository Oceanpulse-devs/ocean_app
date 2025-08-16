// Follow API functions
import { apiRequest } from './base';

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

// Get users that the user is following
export async function getFollowing(userId: string, params?: {
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
  
  return apiRequest(`/users/${userId}/following?${searchParams.toString()}`);
}

// Check if current user is following target user
export async function checkFollowStatus(targetUserId: string) {
  return apiRequest(`/users/${targetUserId}/follow-status`);
}

// Get follow statistics for a user
export async function getFollowStats(userId: string) {
  return apiRequest(`/users/${userId}/follow-stats`);
}

// Get mutual followers
export async function getMutualFollowers(userId: string, params?: {
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
  
  return apiRequest(`/users/${userId}/mutual-followers`);
}

// Types for following data
export interface FollowUser {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  accountType: string;
  accountStatus: string;
}

export interface FollowRelationship {
  id: string;
  userId: string;
  followsUserId: string;
  createdAt: string;
  follower?: FollowUser;
  followed?: FollowUser;
}

export interface FollowersResponse {
  followers: FollowRelationship[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalFollowers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FollowingResponse {
  following: FollowRelationship[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalFollowing: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  followedAt?: string;
}

export interface FollowStatsResponse {
  userId: string;
  followerCount: number;
  followingCount: number;
} 