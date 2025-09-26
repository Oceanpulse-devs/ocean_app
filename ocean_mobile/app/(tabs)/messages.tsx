import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');

// Mock data for conversations
const mockConversations = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      verified: true,
      lastSeen: '2 min ago',
      online: true,
    },
    lastMessage: {
      text: 'Is the iPhone still available? I can offer ₦800,000',
      time: '2:30 PM',
      isRead: false,
      isFromMe: false,
    },
    product: {
      name: 'iPhone 14 Pro Max',
      price: '₦850,000',
      image: '📱',
    },
    unreadCount: 2,
  },
  {
    id: '2',
    user: {
      name: 'TechStore NG',
      avatar: '🏪',
      verified: true,
      lastSeen: '1 hour ago',
      online: false,
    },
    lastMessage: {
      text: 'Perfect! Let\'s meet at Ikeja Mall tomorrow',
      time: '1:45 PM',
      isRead: true,
      isFromMe: true,
    },
    product: {
      name: 'Gaming Laptop Bundle',
      price: '₦450,000',
      image: '💻',
    },
    unreadCount: 0,
  },
  {
    id: '3',
    user: {
      name: 'Fashion Hub',
      avatar: '👗',
      verified: false,
      lastSeen: '3 hours ago',
      online: false,
    },
    lastMessage: {
      text: 'Can you ship to Port Harcourt?',
      time: '11:20 AM',
      isRead: true,
      isFromMe: false,
    },
    product: {
      name: 'Designer Handbag Collection',
      price: '₦120,000',
      image: '👜',
    },
    unreadCount: 0,
  },
  {
    id: '4',
    user: {
      name: 'Mobile Dealer',
      avatar: '📱',
      verified: true,
      lastSeen: '5 hours ago',
      online: false,
    },
    lastMessage: {
      text: 'I have 5 units available. Bulk discount?',
      time: '9:15 AM',
      isRead: false,
      isFromMe: false,
    },
    product: {
      name: 'Samsung Galaxy S23',
      price: '₦380,000',
      image: '📱',
    },
    unreadCount: 1,
  },
  {
    id: '5',
    user: {
      name: 'Car Dealer Pro',
      avatar: '🚗',
      verified: true,
      lastSeen: '1 day ago',
      online: false,
    },
    lastMessage: {
      text: 'The car is in perfect condition. Test drive?',
      time: 'Yesterday',
      isRead: true,
      isFromMe: true,
    },
    product: {
      name: 'Toyota Camry 2020',
      price: '₦8,500,000',
      image: '🚗',
    },
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getConversations() as any;
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to mock data if API fails
      setConversations(mockConversations);
      Alert.alert('Connection Error', 'Unable to load conversations. Showing sample data.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  };

  const filteredConversations = conversations.filter(conv => {
    const userName = conv.participants?.[0]?.fullName || conv.user?.name || 'Unknown User';
    const productName = conv.product?.name || 'Unknown Product';
    return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           productName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConversation = ({ item }: { item: any }) => {
    // Handle both API data and mock data structures
    const isApiData = item.participants;
    const otherParticipant = isApiData ? item.participants?.find((p: any) => p.userId !== user?.id) : null;
    
    const userName = isApiData ? (otherParticipant?.fullName || 'Unknown User') : item.user.name;
    const userAvatar = isApiData ? (otherParticipant?.profilePicture || '👤') : item.user.avatar;
    const isVerified = isApiData ? otherParticipant?.isVerified : item.user.verified;
    const isOnline = isApiData ? otherParticipant?.isOnline : item.user.online;
    const lastMessage = isApiData ? item.lastMessage : item.lastMessage;
    const messageTime = isApiData ? (lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') : lastMessage.time;
    const unreadCount = isApiData ? item.unreadCount : item.unreadCount;

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          {userAvatar && userAvatar !== '👤' && 
           (userAvatar.startsWith('http') || userAvatar.startsWith('https')) ? (
            <Image 
              source={{ uri: userAvatar }} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatar}>{userAvatar || '👤'}</Text>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Conversation Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName}</Text>
              {isVerified && (
                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.messageTime}>{messageTime}</Text>
          </View>

          {/* Product Info - Only show if available */}
          {item.product && (
            <View style={styles.productInfo}>
              <Text style={styles.productImage}>{item.product.image || '📦'}</Text>
              <Text style={styles.productName}>{item.product.name || 'Product'}</Text>
              <Text style={styles.productPrice}>{item.product.price || 'Price not specified'}</Text>
            </View>
          )}

          {/* Last Message */}
          <View style={styles.lastMessageRow}>
            <Text 
              style={[
                styles.lastMessageText,
                unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {lastMessage?.content || lastMessage?.text || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="people" size={20} color="#1F2937" />
          </View>
          <Text style={styles.quickActionText}>All Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="star" size={20} color="#1F2937" />
          </View>
          <Text style={styles.quickActionText}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="time" size={20} color="#1F2937" />
          </View>
          <Text style={styles.quickActionText}>Recent</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#6B46C1']}
              tintColor="#6B46C1"
            />
          }
        />
      )}

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>💬</Text>
          <Text style={styles.emptyStateTitle}>No conversations found</Text>
          <Text style={styles.emptyStateText}>
            Start a conversation by messaging a seller or buyer
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  
  // Search
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 20,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Conversations List
  conversationsList: {
    paddingTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    fontSize: 40,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productImage: {
    fontSize: 16,
  },
  productName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  unreadMessage: {
    color: '#1F2937',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#6B46C1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
