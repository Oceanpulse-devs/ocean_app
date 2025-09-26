import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('Latest');
  const [showDistressOnly, setShowDistressOnly] = useState(false);
  
  // Mock product data for fallback
  const mockProducts = [
    {
      id: '1',
      name: 'iPhone 14 Pro Max',
      price: '₦850,000',
      originalPrice: '₦950,000',
      condition: 'Like New',
      category: 'Electronics',
      location: 'Lagos, Nigeria',
      seller: {
        name: 'Sarah Johnson',
        avatar: '👩‍💼',
        verified: true,
        rating: 4.8,
      },
      images: ['📱', '📱', '📱'],
      description: 'Selling my iPhone 14 Pro Max in excellent condition. Only used for 6 months.',
      likes: 156,
      timeAgo: '2 hours ago',
      isLiked: false,
      isSaved: false,
    },
    {
      id: '2',
      name: 'Gaming Laptop Bundle',
      price: '₦450,000',
      originalPrice: '₦520,000',
      condition: 'Brand New',
      category: 'Electronics',
      location: 'Abuja, Nigeria',
      seller: {
        name: 'TechStore NG',
        avatar: '🏪',
        verified: true,
        rating: 4.9,
      },
      images: ['💻', '🎮', '🎧'],
      description: 'Brand new gaming laptop with RTX 4060, 16GB RAM, 512GB SSD.',
      likes: 89,
      timeAgo: '5 hours ago',
      isLiked: true,
      isSaved: false,
    },
    {
      id: '3',
      name: 'Designer Handbag Collection',
      price: '₦120,000',
      originalPrice: '₦180,000',
      condition: 'Good',
      category: 'Fashion',
      location: 'Port Harcourt, Nigeria',
      seller: {
        name: 'Fashion Hub',
        avatar: '👗',
        verified: false,
        rating: 4.5,
      },
      images: ['👜', '👜', '👜'],
      description: 'Authentic designer handbags at wholesale prices. Limited stock available!',
      likes: 234,
      timeAgo: '1 day ago',
      isLiked: false,
      isSaved: true,
    },
    {
      id: '4',
      name: 'Toyota Camry 2019',
      price: '₦8,500,000',
      originalPrice: '₦9,200,000',
      condition: 'Used',
      category: 'Automotive',
      location: 'Kano, Nigeria',
      seller: {
        name: 'Auto Dealer Pro',
        avatar: '🚗',
        verified: true,
        rating: 4.7,
      },
      images: ['🚗', '🚗', '🚗'],
      description: 'Well-maintained Toyota Camry with full service history. Perfect condition.',
      likes: 67,
      timeAgo: '3 days ago',
      isLiked: false,
      isSaved: false,
    },
    {
      id: '5',
      name: 'PS5 Console + Games',
      price: '₦280,000',
      originalPrice: '₦320,000',
      condition: 'Like New',
      category: 'Electronics',
      location: 'Ibadan, Nigeria',
      seller: {
        name: 'Gamer Zone',
        avatar: '🎮',
        verified: false,
        rating: 4.6,
      },
      images: ['🎮', '🎮', '🎮'],
      description: 'PS5 with 5 games included. Barely used, perfect for gaming enthusiasts.',
      likes: 189,
      timeAgo: '1 week ago',
      isLiked: true,
      isSaved: false,
    },
    {
      id: '6',
      name: 'MacBook Air M2',
      price: '₦1,200,000',
      originalPrice: '₦1,400,000',
      condition: 'Brand New',
      category: 'Electronics',
      location: 'Lagos, Nigeria',
      seller: {
        name: 'Apple Store NG',
        avatar: '🍎',
        verified: true,
        rating: 4.9,
      },
      images: ['💻', '💻', '💻'],
      description: 'Brand new MacBook Air M2 256GB. Sealed in box with warranty.',
      likes: 312,
      timeAgo: '2 weeks ago',
             isLiked: false,
       isSaved: true,
     },
     // Distress Sale Products
     {
       id: '7',
       name: 'iPhone 13 Pro - Urgent Sale',
       price: '₦650,000',
       originalPrice: '₦850,000',
       condition: 'Like New',
       category: 'Electronics',
       location: 'Lagos, Nigeria',
       seller: {
         name: 'John Smith',
         avatar: '👨‍💼',
         verified: false,
         rating: 4.2,
       },
       images: ['📱', '📱', '📱'],
       description: 'URGENT SALE! Need to sell quickly. iPhone 13 Pro in excellent condition.',
       likes: 45,
       timeAgo: '1 hour ago',
       isLiked: false,
       isSaved: false,
       isDistress: true,
     },
     {
       id: '8',
       name: 'Toyota Corolla 2020 - Must Sell',
       price: '₦6,500,000',
       originalPrice: '₦8,200,000',
       condition: 'Used',
       category: 'Automotive',
       location: 'Abuja, Nigeria',
       seller: {
         name: 'Auto Express',
         avatar: '🚗',
         verified: true,
         rating: 4.6,
       },
       images: ['🚗', '🚗', '🚗'],
       description: 'MUST SELL TODAY! Relocating urgently. Toyota Corolla in perfect condition.',
       likes: 23,
       timeAgo: '3 hours ago',
       isLiked: false,
       isSaved: false,
       isDistress: true,
     },
     {
       id: '9',
       name: 'MacBook Pro M1 - Emergency Sale',
       price: '₦900,000',
       originalPrice: '₦1,300,000',
       condition: 'Good',
       category: 'Electronics',
       location: 'Port Harcourt, Nigeria',
       seller: {
         name: 'Tech Seller',
         avatar: '💻',
         verified: false,
         rating: 4.0,
       },
       images: ['💻', '💻', '💻'],
       description: 'EMERGENCY SALE! Medical bills. MacBook Pro M1, barely used.',
       likes: 67,
       timeAgo: '6 hours ago',
       isLiked: true,
       isSaved: false,
       isDistress: true,
     },
   ];

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchQuery, showDistressOnly]);

  // Handle distress parameter from navigation
  useEffect(() => {
    if (params.distress === 'true') {
      setShowDistressOnly(true);
    }
  }, [params.distress]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: 1,
        limit: 20,
        sortBy: selectedFilter === 'Latest' ? 'createdAt' : 'random'
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (showDistressOnly) {
        // Note: Backend might need to support distress filter
        // For now, we'll filter on frontend
      }

      const response = await apiService.getProducts(params);
      console.log('Products response:', response);
      
      let productsData = response.data || [];
      
      // Filter distress sales on frontend if needed
      if (showDistressOnly) {
        productsData = productsData.filter((product: any) => product.isDistressSale);
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
      // Fallback to mock data
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      console.log('Categories response:', response);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Use dynamic categories from API or fallback to static list
  const categoryList = categories.length > 0 
    ? ['All', ...categories.map((cat: any) => cat.name || cat)]
    : ['All', 'Electronics', 'Fashion', 'Automotive', 'Home & Garden', 'Sports', 'Books', 'Health', 'Beauty'];

  const filters = [
    'Latest',
    'Price: Low to High',
    'Price: High to Low',
    'Most Popular',
    'Verified Sellers',
  ];

  const handleProductPress = (product: any) => {
    router.push(`/product-detail?id=${product.id}`);
  };

  const handleMessageSeller = async (product: any) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      console.log('🔍 Product data:', JSON.stringify(product, null, 2));

      if (!product.seller?.id) {
        console.log('❌ No seller id found. Product structure:', {
          seller: product.seller,
          productId: product.id
        });
        Alert.alert('Error', 'Unable to find seller to message');
        return;
      }

      // Create conversation with the seller (server will add current user automatically)
      console.log('🚀 Creating conversation with seller ID:', product.seller.id);
      const response = await apiService.createConversation([product.seller.id]);
      console.log('✅ Conversation created successfully:', response);
      const conversationId = response.data.id;
      
      // Navigate to chat
      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Original error:', (error as any).originalError);
      console.error('❌ Status:', (error as any).status);
      
      // If conversation already exists, find and navigate to it
      if (error.message && error.message.includes('Direct conversation already exists')) {
        try {
          const conversationsResponse = await apiService.getConversations();
          const existingConversation = conversationsResponse.conversations?.find((conv: any) => {
            const otherParticipant = conv.participants?.find((p: any) => p.userId !== user?.id);
            return otherParticipant?.userId === product.seller.id;
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
      
      // If it's a foreign key constraint error, the seller user doesn't exist in the messaging system
      const isForeignKeyError = error.message && (
        error.message.includes('foreign key constraint') || 
        error.message.includes('ER_NO_REFERENCED_ROW_2') ||
        (error as any).originalError?.message?.includes('foreign key constraint') ||
        (error as any).originalError?.message?.includes('ER_NO_REFERENCED_ROW_2')
      );
      
      if (isForeignKeyError) {
        Alert.alert('Error', 'This seller is not available for messaging yet. They may need to set up their messaging account.');
        return;
      }
      
      Alert.alert('Error', `Failed to start conversation: ${error.message}`);
    }
  };

  const handleLike = async (productId: string) => {
    try {
      // TODO: Implement like functionality when backend supports it
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, isLiked: !product.isLiked, likes: product.isLiked ? product.likes - 1 : product.likes + 1 }
          : product
      )
    );
    } catch (error) {
      console.error('Error liking product:', error);
    }
  };

  const handleSave = async (productId: string) => {
    try {
      await apiService.toggleSaveProduct(productId);
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, isSaved: !product.isSaved }
          : product
      )
    );
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    }
  };

  // Filter products based on distress filter
  const filteredProducts = products;

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
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
          <Text style={styles.imagePlaceholder}>{item.images?.[0] || '📦'}</Text>
        )}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSave(item.id)}
          >
            <Ionicons
              name={item.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={item.isSaved ? "#6B46C1" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
        {item.originalPrice && item.originalPrice !== item.price && (
           <View style={styles.discountBadge}>
             <Text style={styles.discountText}>
              {Math.round(((parseFloat(item.originalPrice) - parseFloat(item.price)) / parseFloat(item.originalPrice)) * 100)}% OFF
             </Text>
           </View>
         )}
        {item.isDistressSale && (
           <View style={styles.distressBadge}>
             <Text style={styles.distressText}>🔥 URGENT</Text>
           </View>
         )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {item.currency || '₦'} {parseFloat(item.price).toLocaleString()}
          </Text>
          {item.originalPrice && item.originalPrice !== item.price && (
            <Text style={styles.originalPrice}>
              {item.currency || '₦'} {parseFloat(item.originalPrice).toLocaleString()}
            </Text>
          )}
        </View>
        
        <Text style={styles.productName} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        
        <View style={styles.sellerRow}>
          {item.seller?.user?.profilePicture && 
           item.seller.user.profilePicture !== '👤' && 
           (item.seller.user.profilePicture.startsWith('http') || item.seller.user.profilePicture.startsWith('https')) ? (
            <Image 
              source={{ uri: item.seller.user.profilePicture }} 
              style={styles.sellerAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.sellerAvatar}>{item.seller?.user?.profilePicture || '👤'}</Text>
          )}
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{item.seller?.user?.fullName || item.seller?.businessName || 'Unknown Seller'}</Text>
              {item.seller?.verificationStatus === 'verified' && (
                <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.sellerRating}>⭐ 4.5</Text>
          </View>
        </View>
        
        <View style={styles.productMeta}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition || 'Good'}</Text>
          </View>
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={16}
              color={item.isLiked ? "#EF4444" : "#6B7280"}
            />
            <Text style={styles.likeCount}>{item.likes || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleMessageSeller(item)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6B46C1" />
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
             {/* Header */}
       <View style={styles.header}>
         <Text style={styles.headerTitle}>Products</Text>
         <View style={styles.headerActions}>
           <TouchableOpacity 
             style={[
               styles.distressButton,
               showDistressOnly && styles.distressButtonActive
             ]}
             onPress={() => setShowDistressOnly(!showDistressOnly)}
           >
             <Ionicons 
               name="flame" 
               size={16} 
               color={showDistressOnly ? "#FFFFFF" : "#EF4444"} 
             />
             <Text style={[
               styles.distressButtonText,
               showDistressOnly && styles.distressButtonTextActive
             ]}>
               Distress
             </Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={styles.headerButton}
             onPress={() => router.push('/notifications')}
           >
             <View style={styles.notificationIconContainer}>
               <Ionicons name="notifications-outline" size={24} color="#1F2937" />
               <View style={styles.notificationBadge} />
             </View>
           </TouchableOpacity>
         </View>
       </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categoryList.map((category) => (
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

             {/* Filter Bar */}
       <View style={styles.filterContainer}>
         <Text style={styles.resultsText}>
           {filteredProducts.length} products found
           {showDistressOnly && ' (Distress Sales)'}
         </Text>
         <TouchableOpacity style={styles.sortButton}>
           <Text style={styles.sortText}>{selectedFilter}</Text>
           <Ionicons name="chevron-down" size={16} color="#6B7280" />
         </TouchableOpacity>
       </View>

       {/* Products Grid */}
       {isLoading ? (
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#6B46C1" />
           <Text style={styles.loadingText}>Loading products...</Text>
         </View>
       ) : (
       <FlatList
         data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.productRow}
           refreshing={refreshing}
           onRefresh={handleRefresh}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
     headerButton: {
     padding: 8,
   },
   distressButton: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 16,
     backgroundColor: '#FEF2F2',
     borderWidth: 1,
     borderColor: '#FECACA',
   },
   distressButtonActive: {
     backgroundColor: '#EF4444',
     borderColor: '#EF4444',
   },
   distressButtonText: {
     fontSize: 12,
     fontWeight: '600',
     color: '#EF4444',
   },
   distressButtonTextActive: {
     color: '#FFFFFF',
   },
  
  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
  filterButton: {
    padding: 4,
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
  
  // Filter
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Products Grid
  productsContainer: {
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
  saveButton: {
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
   distressBadge: {
     position: 'absolute',
     bottom: 8,
     right: 8,
     backgroundColor: '#EF4444',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
   },
   distressText: {
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
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerAvatar: {
    fontSize: 16,
    marginRight: 6,
  },
  sellerAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#6B7280',
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
   
   // Notification Badge
   notificationIconContainer: {
     position: 'relative',
   },
   notificationBadge: {
     position: 'absolute',
     top: -2,
     right: -2,
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: '#EF4444',
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
 });
