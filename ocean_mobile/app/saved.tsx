import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const { width } = Dimensions.get('window');

export default function SavedScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved items data
  useEffect(() => {
    fetchSavedItems();
  }, [selectedCategory]);

  const fetchSavedItems = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/api/saved-items', {
        params: { 
          page: 1, 
          limit: 20, 
          category: selectedCategory === 'All' ? undefined : selectedCategory 
        }
      });
      console.log('Saved items response:', response);
      setSavedItems(response.data.savedItems || []);
    } catch (error) {
      console.error('Error fetching saved items:', error);
      Alert.alert('Error', 'Failed to load saved items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedItems();
    setRefreshing(false);
  };

  const categories = [
    'All',
    'Electronics',
    'Fashion',
    'Automotive',
    'Feed Posts',
  ];

  const handleItemPress = (item: any) => {
    // Disabled navigation - users can only use the message button
    // This prevents accidental navigation when tapping on saved items
    return;
  };

  const handleRemoveSaved = async (itemId: string, itemType: string) => {
    try {
      if (itemType === 'product') {
        await apiService.post(`/api/products/${itemId}/save`);
      } else if (itemType === 'feed-post') {
        await apiService.toggleSave(itemId);
      }
      
      // Remove from local state
      setSavedItems(prev => prev.filter(item => item.id !== itemId));
      
      Alert.alert('Success', 'Item removed from saved');
    } catch (error) {
      console.error('Error removing saved item:', error);
      Alert.alert('Error', 'Failed to remove item from saved');
    }
  };

  const handleMessageSeller = async (item: any) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      console.log('🔍 Saved item data:', JSON.stringify(item, null, 2));

      // Get the user ID to message
      let targetUserId;
      if (item.type === 'feed-post') {
        // For saved feed posts, use the post author's ID
        targetUserId = item.userId || item.user?.id;
        
        // If still no user ID, try to extract from avatar URL
        if (!targetUserId && item.user?.avatar) {
          const avatarUrl = item.user.avatar;
          const userIdMatch = avatarUrl.match(/\/profiles\/([^\/]+)\//);
          if (userIdMatch) {
            targetUserId = userIdMatch[1];
            console.log('📱 Extracted user ID from saved post avatar URL:', targetUserId);
          }
        }
        
        console.log('📱 Saved feed post - targetUserId:', targetUserId);
      } else {
        // For saved products, use the seller's ID
        targetUserId = item.seller?.id;
        console.log('🏪 Saved product - targetUserId:', targetUserId);
      }

      if (!targetUserId) {
        console.log('❌ No target user ID found in saved item. Item structure:', {
          type: item.type,
          postType: item.postType,
          buyer: item.buyer,
          seller: item.seller,
          user: item.user,
          userId: item.userId
        });
        Alert.alert('Error', 'Unable to find user to message');
        return;
      }

      // Create conversation with the target user (server will add current user automatically)
      const response = await apiService.createConversation([targetUserId]);
      const conversationId = response.data.id;
      
      // Navigate to chat
      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // If conversation already exists, extract the conversation ID from error message
      if (error.message && error.message.includes('Direct conversation already exists')) {
        try {
          // Try to get existing conversations and find the one with this user
          const conversationsResponse = await apiService.getConversations();
          const existingConversation = conversationsResponse.conversations?.find((conv: any) => {
            const otherParticipant = conv.participants?.find((p: any) => p.userId !== user?.id);
            return otherParticipant?.userId === targetUserId;
          });
          
          if (existingConversation) {
            console.log('✅ Found existing conversation:', existingConversation.id);
            router.push(`/chat/${existingConversation.id}` as any);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching existing conversations:', fetchError);
        }
      }
      
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  // Filter items based on selected category (now handled by backend)
  const filteredItems = savedItems;

  const renderProductCard = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      {/* Product Image */}
      <View style={styles.productImage}>
        {item.images && item.images[0] && 
         !item.images[0].startsWith('📦') && 
         !item.images[0].startsWith('📱') && 
         !item.images[0].startsWith('💻') && 
         !item.images[0].startsWith('👜') && 
         !item.images[0].startsWith('🚗') &&
         (item.images[0].startsWith('http') || item.images[0].startsWith('https')) ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.imagePlaceholder}>
            {item.type === 'feed-post' ? '📱' : '📦'}
          </Text>
        )}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSaved(item.id, item.type)}
          >
            <Ionicons name="bookmark" size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>
        {item.originalPrice && item.price && item.originalPrice !== item.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((parseFloat(item.originalPrice) - parseFloat(item.price)) / parseFloat(item.originalPrice)) * 100)}% OFF
            </Text>
          </View>
        )}
        {item.type === 'feed-post' && (
          <View style={styles.feedPostBadge}>
            <Text style={styles.feedPostText}>
              {item.postType === 'buyer' ? 'BUYER' : 'SELLER'}
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {item.type === 'feed-post' && item.postType === 'buyer' ? item.budget : item.price}
          </Text>
          {item.originalPrice && item.price && item.originalPrice !== item.price && item.type !== 'feed-post' && (
            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          )}
        </View>
        
        <Text style={styles.productName} numberOfLines={2}>
          {item.name || item.title || 'Untitled'}
        </Text>
        
        {/* Show post content for feed posts */}
        {item.type === 'feed-post' && item.description && (
          <Text style={styles.postContent} numberOfLines={3}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.sellerRow}>
          {item.type === 'feed-post' && item.postType === 'buyer' ? (
            item.buyer?.avatar && 
            item.buyer.avatar !== '👤' && 
            (item.buyer.avatar.startsWith('http') || item.buyer.avatar.startsWith('https')) ? (
              <Image 
                source={{ uri: item.buyer.avatar }} 
                style={styles.sellerAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.sellerAvatar}>{item.buyer?.avatar || '👤'}</Text>
            )
          ) : (
            item.seller?.avatar && 
            item.seller.avatar !== '👤' && 
            (item.seller.avatar.startsWith('http') || item.seller.avatar.startsWith('https')) ? (
              <Image 
                source={{ uri: item.seller.avatar }} 
                style={styles.sellerAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.sellerAvatar}>{item.seller?.avatar || '👤'}</Text>
            )
          )}
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>
                {item.type === 'feed-post' && item.postType === 'buyer' ? item.buyer?.name : item.seller?.name}
              </Text>
              {(item.type === 'feed-post' && item.postType === 'buyer' ? item.buyer?.verified : item.seller?.verified) && (
                <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.sellerRating}>
              ⭐ {item.type === 'feed-post' && item.postType === 'buyer' ? item.buyer?.rating : item.seller?.rating}
            </Text>
          </View>
        </View>
        
        <View style={styles.productMeta}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        
        <View style={styles.productActions}>
          <Text style={styles.savedDate}>Saved {item.savedDate || 'Recently'}</Text>
          
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleMessageSeller(item)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6B46C1" />
            <Text style={styles.messageText}>
              {item.type === 'feed-post' && item.postType === 'buyer' ? 'Contact' : 'Message'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.listImage}>
        {item.images && item.images[0] && 
         !item.images[0].startsWith('📦') && 
         !item.images[0].startsWith('📱') && 
         !item.images[0].startsWith('💻') && 
         !item.images[0].startsWith('👜') && 
         !item.images[0].startsWith('🚗') &&
         (item.images[0].startsWith('http') || item.images[0].startsWith('https')) ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.listImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.listImagePlaceholder}>
            {item.type === 'feed-post' ? '📱' : '📦'}
          </Text>
        )}
        {item.type === 'feed-post' && (
          <View style={styles.listFeedBadge}>
            <Text style={styles.listFeedText}>
              {item.postType === 'buyer' ? 'BUYER' : 'SELLER'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.listContent}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.name || item.title || 'Untitled'}
        </Text>
        
        {/* Show post content for feed posts in list view */}
        {item.type === 'feed-post' && item.description && (
          <Text style={styles.listPostContent} numberOfLines={2}>
            {item.description}
        </Text>
        )}
        <Text style={styles.listPrice}>
          {item.type === 'feed-post' && item.postType === 'buyer' ? item.budget : item.price}
        </Text>
        <Text style={styles.listSeller}>
          {item.type === 'feed-post' && item.postType === 'buyer' ? 
            (item.buyer?.name || 'Unknown Buyer') : 
            (item.seller?.name || 'Unknown Seller')
          }
        </Text>
        <Text style={styles.listSavedDate}>Saved {item.savedDate || 'Recently'}</Text>
      </View>
      
      <View style={styles.listActions}>
        <TouchableOpacity
          style={styles.listRemoveButton}
          onPress={() => handleRemoveSaved(item.id)}
        >
          <Ionicons name="bookmark" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listMessageButton}
          onPress={() => handleMessageSeller(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#6B46C1" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? "list" : "grid"} 
              size={20} 
              color="#6B46C1" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredItems.length}</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredItems.filter(item => item.type === 'product').length}
          </Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredItems.filter(item => item.type === 'feed-post').length}
          </Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      ) : filteredItems.length > 0 ? (
        <FlatList
          key={viewMode} // Force re-render when view mode changes
          data={filteredItems}
          renderItem={viewMode === 'grid' ? renderProductCard : renderListItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsContainer}
          columnWrapperStyle={viewMode === 'grid' ? styles.productRow : undefined}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Saved Items</Text>
          <Text style={styles.emptyDescription}>
            {selectedCategory === 'All' 
              ? "You haven't saved any items yet. Start exploring and save items you like!"
              : `No ${selectedCategory.toLowerCase()} items saved yet.`
            }
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.exploreButtonText}>Explore Products</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Categories
  categoriesContainer: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  selectedCategory: {
    backgroundColor: '#6B46C1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  
  // Grid View
  itemsContainer: {
    padding: 10,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 40) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedPostBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#6B46C1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feedPostText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 18,
  },
  postContent: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerAvatar: {
    fontSize: 16,
    marginRight: 6,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 12,
    color: '#6B7280',
  },
  sellerRating: {
    fontSize: 10,
    color: '#6B7280',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 10,
    color: '#6B7280',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  messageText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
  },
  
  // List View
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listImage: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  listImagePlaceholder: {
    fontSize: 32,
  },
  listFeedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#6B46C1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listFeedText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  listPostContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  listPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  listSeller: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  listSavedDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  listActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listRemoveButton: {
    padding: 8,
    marginBottom: 8,
  },
  listMessageButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Avatar image styles
  sellerAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
