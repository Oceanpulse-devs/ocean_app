import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications data
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/api/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return 'chatbubble-outline';
      case 'follow': return 'person-add-outline';
      case 'like': return 'heart-outline';
      case 'offer': return 'cash-outline';
      case 'message': return 'mail-outline';
      case 'auction': return 'hammer-outline';
      case 'system': return 'notifications-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment': return '#6B46C1';
      case 'follow': return '#059669';
      case 'like': return '#DC2626';
      case 'offer': return '#D97706';
      case 'message': return '#3B82F6';
      case 'auction': return '#7C3AED';
      case 'system': return '#6B7280';
      default: return '#6B46C1';
    }
  };

  const handleFollowAction = async (notificationId: string, action: 'follow' | 'decline') => {
    try {
      if (action === 'follow') {
        // Find the notification to get the userId
        const notification = notifications.find(n => n.id === notificationId);
        if (notification?.userId) {
          await apiService.post('/api/follow', { targetUserId: notification.userId });
        }
      }
      
      // Mark notification as read
      await apiService.put(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error handling follow action:', error);
      Alert.alert('Error', 'Failed to process follow action');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/api/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleNotificationPress = async (notification: any) => {
    try {
      // Mark notification as read
      await apiService.put(`/api/notifications/${notification.id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, isRead: true }
            : notif
        )
      );

      // Navigate based on notification type
      switch (notification.type) {
        case 'comment':
        case 'like':
          if (notification.postId) {
            router.push(`/product-detail?id=${notification.postId}`);
          }
          break;
        case 'follow':
          router.push('/(tabs)/profile');
          break;
        case 'offer':
          if (notification.productId) {
            router.push(`/product-detail?id=${notification.productId}`);
          }
          break;
        case 'message':
          if (notification.chatId) {
            router.push(`/chat/${notification.chatId}` as any);
          }
          break;
        case 'auction':
          if (notification.auctionId) {
            router.push(`/auction/${notification.auctionId}` as any);
          }
          break;
        default:
          // For system notifications, just mark as read
          break;
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      Alert.alert('Error', 'Failed to process notification');
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.isRead ? styles.readNotification : styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      
      <View style={styles.avatarContainer}>
        {item.user.avatar && item.user.avatar !== '🌊' && item.user.avatar !== '👨‍💼' && item.user.avatar !== '👩‍🎨' && item.user.avatar !== '👨‍💻' && item.user.avatar !== '👨‍🔧' && item.user.avatar !== '🏪' ? (
          <Image 
            source={{ uri: item.user.avatar }} 
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{item.user.avatar || '👤'}</Text>
        )}
        {item.user.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.notificationHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.notificationText}>{item.content}</Text>
        </View>
        
        {item.comment && (
          <Text style={styles.commentPreview}>"{item.comment}"</Text>
        )}
        
        {item.message && (
          <Text style={styles.messagePreview}>{item.message}</Text>
        )}
        
        {item.offer && (
          <Text style={styles.offerAmount}>{item.offer}</Text>
        )}
        
        {item.type === 'follow' && !item.isRead && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => handleFollowAction(item.id, 'follow')}
            >
              <Text style={styles.followButtonText}>Follow Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleFollowAction(item.id, 'decline')}
            >
              <Text style={styles.declineButtonText}>Decline Req</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      
      <View style={[styles.typeIcon, { backgroundColor: getNotificationColor(item.type) }]}>
        <Ionicons 
          name={getNotificationIcon(item.type)} 
          size={16} 
          color="#FFFFFF" 
        />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={styles.headerRight}>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications" size={24} color="#6B46C1" />
              <View style={styles.notificationBadge} />
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.headerRight}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color="#6B46C1" />
            <View style={styles.notificationBadge} />
          </View>
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <View style={styles.notificationCount}>
          <Text style={styles.countText}>Notifications {notifications.length}</Text>
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>All</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Ionicons name="checkmark" size={16} color="#6B46C1" />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You'll see notifications here when people interact with your content</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationCount: {
    flex: 1,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterContainer: {
    marginHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 14,
    color: '#6B46C1',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  readNotification: {
    backgroundColor: '#FFFFFF',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B46C1',
    marginRight: 12,
    marginTop: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
  },
  commentPreview: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  offerAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  followButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Avatar image styles
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
