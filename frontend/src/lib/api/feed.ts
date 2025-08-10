// Feed API functions
import { apiRequest } from './base';

export interface Post {
  id: string;
  userId: string;
  postType: 'product' | 'buyer_request' | 'general';
  content: string;
  productName?: string;
  brand?: string;
  price?: number;
  location?: string;
  userRegion?: string;
  userCountry?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savedCount: number;
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
    accountType: string;
  };
  media?: Array<{
    id: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    thumbnailUrl?: string;
    mediaOrder: number;
  }>;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowingAuthor?: boolean;
}

export interface CreatePostData {
  postType: 'product' | 'buyer_request' | 'general';
  content: string;
  productName?: string;
  brand?: string;
  price?: number;
  location?: string;
  tags?: string[];
  media?: File[];
}

// Get feed posts with filtering and pagination
export async function getFeed(params?: {
  page?: number;
  limit?: number;
  region?: string;
  country?: string;
  postType?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/feed?${searchParams.toString()}`);
}

// Get posts by a specific user
export async function getUserPosts(userId: string, params?: {
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
  
  return apiRequest(`/users/${userId}/posts?${searchParams.toString()}`);
}

// Create a new post
export async function createPost(postData: CreatePostData) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(postData).forEach(([key, value]) => {
    if (key !== 'media' && value !== undefined) {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Add media files
  if (postData.media) {
    postData.media.forEach((file, index) => {
      formData.append('media', file);
    });
  }
  
  return apiRequest('/posts', {
    method: 'POST',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Update an existing post
export async function updatePost(postId: string, postData: Partial<CreatePostData>) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(postData).forEach(([key, value]) => {
    if (key !== 'media' && value !== undefined) {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Add media files
  if (postData.media) {
    postData.media.forEach((file, index) => {
      formData.append('media', file);
    });
  }
  
  return apiRequest(`/posts/${postId}`, {
    method: 'PUT',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Delete a post
export async function deletePost(postId: string) {
  return apiRequest(`/posts/${postId}`, {
    method: 'DELETE',
  });
}

// Get a specific post
export async function getPost(postId: string) {
  return apiRequest(`/posts/${postId}`);
}

// Toggle like on a post
export async function toggleLike(postId: string) {
  return apiRequest(`/posts/${postId}/like`, {
    method: 'POST',
  });
}

// Toggle save on a post
export async function toggleSave(postId: string) {
  return apiRequest(`/posts/${postId}/save`, {
    method: 'POST',
  });
}

// Get saved posts
export async function getSavedPosts(params?: {
  page?: number;
  limit?: number;
  collectionName?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/saved-posts?${searchParams.toString()}`);
}

// Search posts
export async function searchPosts(query: string, params?: {
  page?: number;
  limit?: number;
  postType?: string;
  region?: string;
  country?: string;
}) {
  const searchParams = new URLSearchParams({ q: query });
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/search?${searchParams.toString()}`);
}

// Comment interfaces
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface CommentResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Create a comment on a post
export async function createComment(postId: string, content: string) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// Get comments for a post
export async function getComments(postId: string, params?: {
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
  
  return apiRequest(`/posts/${postId}/comments?${searchParams.toString()}`);
}

// Delete a comment
export async function deleteComment(commentId: string) {
  return apiRequest(`/comments/${commentId}`, {
    method: 'DELETE',
  });
} 