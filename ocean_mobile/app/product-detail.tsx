import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pulsing animation for the message button
  const pulseAnim = new Animated.Value(1);
  
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);

  // Fetch product data
  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProduct(params.id as string);
      console.log('Product detail response:', response);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      console.log('🔍 Product detail - Product data:', JSON.stringify(productData, null, 2));

      // Use seller.userId instead of seller.id for messaging
      const sellerUserId = productData.seller?.userId || productData.seller?.id;
      
      if (!sellerUserId) {
        console.log('❌ No seller user ID found. Product structure:', {
          seller: productData.seller,
          productId: productData.id
        });
        Alert.alert('Error', 'Unable to find seller to message');
        return;
      }

      // Create conversation with the seller (server will add current user automatically)
      console.log('🚀 Creating conversation with seller user ID:', sellerUserId);
      const response = await apiService.createConversation([sellerUserId]);
      console.log('✅ Conversation created successfully:', response);
      const conversationId = response.data.id;
      
      // Navigate to chat
      router.push(`/chat/${conversationId}` as any);
    } catch (error: any) {
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
            return otherParticipant?.userId === sellerUserId;
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

  // Use real product data or fallback to mock data
  const productData = product || {
    id: '1',
    title: 'iPhone 14 Pro Max',
    price: '850000',
    originalPrice: '950000',
    condition: 'like_new',
    category: 'Electronics',
    brand: 'Apple',
    location: 'Lagos, Nigeria',
    description: 'Selling my iPhone 14 Pro Max in excellent condition. Only used for 6 months, comes with original box and accessories. No scratches or dents, battery health at 95%. Perfect for anyone looking for a premium smartphone at a great price.',
    images: ['📱', '📱', '📱', '📱'], // Placeholder emojis
    seller: {
      user: {
        fullName: 'Sarah Johnson',
        profilePicture: '👩‍💼',
      },
      businessName: 'Tech Store',
      verificationStatus: 'verified',
    },
  };

  const renderImage = (image: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.imageThumbnail,
        selectedImageIndex === index && styles.selectedImage
      ]}
      onPress={() => setSelectedImageIndex(index)}
    >
      {image && 
       !image.startsWith('📦') && 
       !image.startsWith('📱') && 
       !image.startsWith('💻') && 
       !image.startsWith('👜') && 
       !image.startsWith('🚗') &&
       (image.startsWith('http') || image.startsWith('https')) ? (
        <Image 
          source={{ uri: image }} 
          style={styles.imageThumbnail}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.imagePlaceholder}>{image || '📦'}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsLiked(!isLiked)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={async () => {
              try {
                await apiService.toggleSaveProduct(productData.id);
                setIsSaved(!isSaved);
              } catch (error) {
                console.error('Error saving product:', error);
                Alert.alert('Error', 'Failed to save product');
              }
            }}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? "#6B46C1" : "#FFFFFF"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Product Image */}
        <View style={styles.mainImageContainer}>
          <View style={styles.mainImage}>
            {productData.images && productData.images[selectedImageIndex] && 
             !productData.images[selectedImageIndex].startsWith('📦') && 
             !productData.images[selectedImageIndex].startsWith('📱') && 
             !productData.images[selectedImageIndex].startsWith('💻') && 
             !productData.images[selectedImageIndex].startsWith('👜') && 
             !productData.images[selectedImageIndex].startsWith('🚗') &&
             (productData.images[selectedImageIndex].startsWith('http') || productData.images[selectedImageIndex].startsWith('https')) ? (
              <Image 
                source={{ uri: productData.images[selectedImageIndex] }} 
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.mainImagePlaceholder}>{productData.images?.[selectedImageIndex] || '📦'}</Text>
            )}
          </View>
          
          {/* Image Thumbnails */}
          {productData.images && productData.images.length > 1 && (
          <View style={styles.imageThumbnails}>
            {productData.images.map((image, index) => renderImage(image, index))}
          </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              {productData.currency || '₦'} {parseFloat(productData.price).toLocaleString()}
            </Text>
            {productData.originalPrice && productData.originalPrice !== productData.price && (
              <Text style={styles.originalPrice}>
                {productData.currency || '₦'} {parseFloat(productData.originalPrice).toLocaleString()}
              </Text>
            )}
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{productData.condition || 'Good'}</Text>
            </View>
          </View>
          
          <Text style={styles.productName}>{productData.title || productData.name}</Text>
          <Text style={styles.productDescription}>{productData.description}</Text>
          
          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{productData.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="grid-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{productData.category}</Text>
            </View>
            {productData.brand && (
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{productData.brand}</Text>
            </View>
            )}
          </View>
        </View>

        {/* Seller Information */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <TouchableOpacity style={styles.sellerCard}>
            <View style={styles.sellerLeft}>
              <View style={styles.sellerAvatar}>
                {productData.seller?.user?.profilePicture && 
                 productData.seller.user.profilePicture !== '👤' && 
                 (productData.seller.user.profilePicture.startsWith('http') || productData.seller.user.profilePicture.startsWith('https')) ? (
                  <Image 
                    source={{ uri: productData.seller.user.profilePicture }} 
                    style={styles.sellerAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.sellerAvatarPlaceholder}>{productData.seller?.user?.profilePicture || '👤'}</Text>
                )}
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>
                    {productData.seller?.user?.fullName || productData.seller?.businessName || 'Unknown Seller'}
                  </Text>
                  {productData.seller?.verificationStatus === 'verified' && (
                    <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                  )}
                </View>
                <Text style={styles.sellerUsername}>@{productData.seller?.businessName || 'seller'}</Text>
                <View style={styles.sellerStats}>
                  <Text style={styles.sellerRating}>⭐ 4.5</Text>
                  <Text style={styles.sellerSales}>156 sales</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Specifications */}
        {productData.specifications && productData.specifications.length > 0 && (
        <View style={styles.specificationsSection}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specificationsGrid}>
            {productData.specifications.map((spec, index) => (
              <View key={index} style={styles.specItem}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Features */}
        {productData.features && productData.features.length > 0 && (
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            {productData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <View style={styles.comingSoonCard}>
            <Ionicons name="construct-outline" size={48} color="#6B7280" />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Similar products and recommendations will be available soon
            </Text>
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
  header: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Main Image
  mainImageContainer: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 20,
  },
  mainImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImagePlaceholder: {
    fontSize: 64,
  },
  imageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: '#6B46C1',
  },
  imagePlaceholder: {
    fontSize: 24,
  },
  
  // Product Info
  productInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 20,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  conditionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  quickInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Seller Section
  sellerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    fontSize: 24,
  },
  sellerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sellerUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  sellerRating: {
    fontSize: 12,
    color: '#6B7280',
  },
  sellerSales: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Specifications
  specificationsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specificationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  specItem: {
    width: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  
  // Features
  featuresSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  
  // Coming Soon Section
  comingSoonSection: {
    padding: 20,
    paddingBottom: 20,
  },
  comingSoonCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
});
