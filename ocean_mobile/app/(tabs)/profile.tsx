import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayRole, getRoleColor, canAccessSellerFeatures, canCreateAuctions } from '../../utils/permissions';
import apiService, { User } from '../../services/api';
import ImageZoomModal from '../../components/ImageZoomModal';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');

  // Fetch profile data
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getProfile();
      console.log('Profile API response:', response);
      console.log('Profile data:', response.user);
      console.log('Profile picture URL:', response.user?.profilePicture);
        setProfileData(response.user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // Refresh profile data when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchProfileData();
      }
    }, [user])
  );

  const handleMessageUser = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      // For profile page, we can't message ourselves
      Alert.alert('Info', 'You cannot message yourself from your own profile');
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  // Handle image tap
  const handleImagePress = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setImageModalVisible(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUri('');
  };


  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Get display data from backend or fallback to user data
  const displayData = profileData || user;
  const sellerData = {
    name: displayData?.fullName || 'User',
    username: displayData?.username || `@${displayData?.fullName?.toLowerCase().replace(/\s+/g, '_')}` || '@user',
    bio: displayData?.bio || 'Ocean App user',
    posts: displayData?.productsCount || 0,
    followers: formatNumber(displayData?.followersCount || 0),
    following: displayData?.followingCount || 0,
    lastActive: displayData?.lastActive || 'Recently',
    products: displayData?.featuredProducts || [],
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Modern Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatar}
                onPress={() => {
                  if (displayData?.profilePicture && typeof displayData.profilePicture === 'string' && (displayData.profilePicture.startsWith('http') || displayData.profilePicture.startsWith('https'))) {
                    handleImagePress(displayData.profilePicture);
                  }
                }}
                activeOpacity={0.8}
              >
                {displayData?.profilePicture && typeof displayData.profilePicture === 'string' && (displayData.profilePicture.startsWith('http') || displayData.profilePicture.startsWith('https')) ? (
                  <Image
                    source={{ uri: displayData.profilePicture }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image load error:', error);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', displayData.profilePicture);
                    }}
                  />
                ) : (
                <Text style={styles.avatarPlaceholder}>👩‍💼</Text>
                )}
              </TouchableOpacity>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
                         <View style={styles.profileInfo}>
               <Text style={styles.sellerName}>{sellerData.name}</Text>
               <Text style={styles.sellerUsername}>{sellerData.username}</Text>
               
               {/* Role Badge */}
               {user && (
                 <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user) }]}>
                   <Text style={styles.roleText}>{getUserDisplayRole(user)}</Text>
                 </View>
               )}
               
               <View style={styles.statusContainer}>
                 <View style={styles.statusDot} />
                 <Text style={styles.statusText}>Active {sellerData.lastActive}</Text>
               </View>
               <Text style={styles.bioText}>{sellerData.bio}</Text>
             </View>
          </View>

                     {/* Modern Stats */}
           <View style={styles.statsGrid}>
             {/* Only show Products for sellers */}
             {canAccessSellerFeatures(user) && (
               <TouchableOpacity style={styles.statCard} onPress={() => router.push('/my-products')}>
                 <Text style={styles.statNumber}>{sellerData.posts}</Text>
                 <Text style={styles.statLabel}>Products</Text>
               </TouchableOpacity>
             )}
             <TouchableOpacity style={styles.statCard} onPress={() => router.push('/followers' as any)}>
               <Text style={styles.statNumber}>{sellerData.followers}</Text>
               <Text style={styles.statLabel}>Followers</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.statCard} onPress={() => router.push('/following' as any)}>
               <Text style={styles.statNumber}>{sellerData.following}</Text>
               <Text style={styles.statLabel}>Following</Text>
             </TouchableOpacity>
           </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessageUser}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Message Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={20} color="#6B46C1" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Products - Only show for sellers */}
        {canAccessSellerFeatures(user) && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B46C1" />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
              {sellerData.products.length > 0 ? (
                sellerData.products.map((product, index) => (
                  <View key={product.id} style={styles.productCard}>
                    <TouchableOpacity 
                      style={styles.productImage}
                      onPress={() => {
                        if (product.images && product.images.length > 0) {
                          handleImagePress(product.images[0]);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          source={{ uri: product.images[0] }} 
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.productEmoji}>📦</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.title}</Text>
                      <Text style={styles.productBrand}>{product.brand || 'No Brand'}</Text>
                      <Text style={styles.productPrice}>{product.currency} {product.price}</Text>
                      <View style={styles.productLocation}>
                        <Ionicons name="location-outline" size={12} color="#6B7280" />
                        <Text style={styles.locationText}>{product.location}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noProductsContainer}>
                  <Text style={styles.noProductsText}>No products yet</Text>
                  <Text style={styles.noProductsSubtext}>Start selling to showcase your items here</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Seller Tools - Only show for sellers */}
        {canAccessSellerFeatures(user) && (
          <View style={styles.sellerTools}>
            <Text style={styles.sellerToolsTitle}>Seller Tools</Text>
            <View style={styles.toolsGrid}>
              <TouchableOpacity 
                style={styles.toolCard}
                onPress={() => router.push('/product-demand')}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name="trending-up-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.toolTitle}>Demand Analytics</Text>
                <Text style={styles.toolDescription}>View trending products</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.toolCard}
                onPress={() => router.push('/my-products')}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name="storefront-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.toolTitle}>My Store</Text>
                <Text style={styles.toolDescription}>Manage products</Text>
              </TouchableOpacity>
              
              {canCreateAuctions(user) && (
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/auction-create')}
                >
                  <View style={styles.toolIcon}>
                    <Ionicons name="gavel-outline" size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.toolTitle}>Create Auction</Text>
                  <Text style={styles.toolDescription}>Start an auction</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* General Tools - Available to all users */}
        <View style={styles.sellerTools}>
          <Text style={styles.sellerToolsTitle}>Account Tools</Text>
          <View style={styles.toolsGrid}>
            {!canAccessSellerFeatures(user) && (
              <TouchableOpacity 
                style={styles.toolCard}
                onPress={() => router.push('/seller-verification-requirements')}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#6B46C1" />
                </View>
                <Text style={styles.toolTitle}>Become a Seller</Text>
                <Text style={styles.toolDescription}>Start selling on Ocean</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.toolCard}
              onPress={() => router.push('/settings')}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="settings-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.toolTitle}>Settings</Text>
              <Text style={styles.toolDescription}>Account preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={imageModalVisible}
        imageUri={selectedImageUri}
        onClose={closeImageModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Modern Header
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  moreButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Modern Profile Header
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    fontSize: 32,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerUsername: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Modern Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Featured Products
  featuredSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  productsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  productCard: {
    width: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  productImage: {
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 32,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  productLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    color: '#6B7280',
  },
  
  // Seller Tools
  sellerTools: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sellerToolsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: (width - 60) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // No products styles
  noProductsContainer: {
    width: 160,
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noProductsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  noProductsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});