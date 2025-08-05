// Notifications API functions
import { apiRequest } from './base';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'auction' | 'follow' | 'product' | 'seller' | 'admin';
  isRead: boolean;
  isEmailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Get user's notifications
export async function getUserNotifications(params?: {
  page?: number;
  limit?: number;
  category?: string;
  isRead?: boolean;
  sortBy?: 'createdAt';
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
  
  return apiRequest(`/notifications?${searchParams.toString()}`);
}

// Get unread notifications count
export async function getUnreadCount() {
  return apiRequest('/notifications/unread-count');
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  return apiRequest('/notifications/mark-all-read', {
    method: 'PUT',
  });
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  return apiRequest(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
} 