// Messaging API functions
import { apiRequest } from './base';

// Override the base URL for messaging server
const MESSAGING_API_BASE_URL = 'http://localhost:5001/api';

// Helper function to get JWT token from main server
export async function getMessagingToken(): Promise<string | null> {
  try {
    const response = await apiRequest('/messaging-token');
    return response.token;
  } catch (error) {
    console.error('Error getting messaging token:', error);
    return null;
  }
}

// Helper function for messaging API requests
async function messagingApiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${MESSAGING_API_BASE_URL}${endpoint}`;
  
  // Get JWT token from main server
  const token = await getMessagingToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      // Preserve additional error data for handling specific cases
      (error as any).conversationId = errorData.conversationId;
      (error as any).status = response.status;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Messaging API Request Error:', error);
    throw error;
  }
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  lastMessageAt?: string;
  lastMessageId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'admin' | 'member';
  isActive: boolean;
  joinedAt: string;
  leftAt?: string;
  lastReadAt?: string;
  lastReadMessageId?: string;
  isMuted: boolean;
  isPinned: boolean;
  nickname?: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
    accountType: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'file' | 'audio';
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  mediaDuration?: number;
  thumbnailUrl?: string;
  replyToId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  deletedBy?: string;
  isForwarded: boolean;
  forwardedFromId?: string;
  readBy?: string[];
  deliveredTo?: string[];
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  replyTo?: Message;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

// Get user's conversations
export async function getConversations(params?: {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return messagingApiRequest(`/conversations?${searchParams.toString()}`);
}

// Get a specific conversation
export async function getConversation(conversationId: string) {
  return messagingApiRequest(`/conversations/${conversationId}`);
}

// Create a new conversation
export async function createConversation(conversationData: {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  participants: string[];
}) {
  return messagingApiRequest('/conversations', {
    method: 'POST',
    body: JSON.stringify(conversationData),
  });
}

// Add participant to conversation
export async function addParticipant(conversationId: string, participantData: {
  userId: string;
  role?: 'admin' | 'member';
  nickname?: string;
}) {
  return messagingApiRequest(`/conversations/${conversationId}/participants`, {
    method: 'POST',
    body: JSON.stringify(participantData),
  });
}

// Remove participant from conversation
export async function removeParticipant(conversationId: string, userId: string) {
  return messagingApiRequest(`/conversations/${conversationId}/participants/${userId}`, {
    method: 'DELETE',
  });
}

// Update conversation
export async function updateConversation(conversationId: string, updateData: {
  name?: string;
  description?: string;
  avatar?: string;
}) {
  return messagingApiRequest(`/conversations/${conversationId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

// Mark conversation as read
export async function markConversationAsRead(conversationId: string) {
  return messagingApiRequest(`/conversations/${conversationId}/read`, {
    method: 'PUT',
  });
}

// Get messages in a conversation
export async function getMessages(conversationId: string, params?: {
  page?: number;
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return messagingApiRequest(`/messages/${conversationId}?${searchParams.toString()}`);
}

// Send a message
export async function sendMessage(conversationId: string, messageData: {
  type: 'text' | 'image' | 'video' | 'file' | 'audio';
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  mediaDuration?: number;
  thumbnailUrl?: string;
  replyToId?: string;
}) {
  // Add conversationId to the message data since the endpoint is /api/messages
  const messageWithConversation = {
    ...messageData,
    conversationId: conversationId
  };
  
  return messagingApiRequest(`/messages`, {
    method: 'POST',
    body: JSON.stringify(messageWithConversation),
  });
}

// Edit a message
export async function editMessage(conversationId: string, messageId: string, content: string) {
  return messagingApiRequest(`/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// Delete a message
export async function deleteMessage(conversationId: string, messageId: string) {
  return messagingApiRequest(`/messages/${messageId}`, {
    method: 'DELETE',
  });
}

// Add reaction to message
export async function addReaction(conversationId: string, messageId: string, reaction: string) {
  return messagingApiRequest(`/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ reaction }),
  });
}

// Remove reaction from message
export async function removeReaction(conversationId: string, messageId: string, reaction: string) {
  return messagingApiRequest(`/messages/${messageId}/reactions/${reaction}`, {
    method: 'DELETE',
  });
}

// Search users for messaging
export async function searchUsers(query: string, params?: {
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams({ q: query });
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return messagingApiRequest(`/users/search?${searchParams.toString()}`);
}

// Get recent contacts
export async function getRecentContacts(limit?: number) {
  const searchParams = new URLSearchParams();
  
  if (limit) {
    searchParams.append('limit', limit.toString());
  }
  
  return messagingApiRequest(`/users/recent/contacts?${searchParams.toString()}`);
}

// Get conversation statistics
export async function getConversationStats(conversationId: string) {
  return messagingApiRequest(`/conversations/${conversationId}/stats`);
} 