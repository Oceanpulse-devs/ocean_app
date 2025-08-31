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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
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

  // Mock product data
  const productData = {
    id: '1',
    name: 'iPhone 14 Pro Max',
    price: '₦850,000',
    originalPrice: '₦950,000',
    condition: 'Like New',
    category: 'Electronics',
    brand: 'Apple',
    location: 'Lagos, Nigeria',
    description: 'Selling my iPhone 14 Pro Max in excellent condition. Only used for 6 months, comes with original box and accessories. No scratches or dents, battery health at 95%. Perfect for anyone looking for a premium smartphone at a great price.',
    images: ['📱', '📱', '📱', '📱'], // Placeholder emojis
    seller: {
      name: 'Sarah Johnson',
      username: '@sarahj',
      avatar: '👩‍💼',
      verified: true,
      rating: 4.8,
      totalSales: 156,
      location: 'Lagos, Nigeria',
      joinedDate: 'March 2023',
    },
    specifications: [
      { label: 'Storage', value: '256GB' },
      { label: 'Color', value: 'Deep Purple' },
      { label: 'Network', value: 'Unlocked' },
      { label: 'Warranty', value: 'Apple Warranty' },
    ],
    features: [
      'A16 Bionic chip',
      '48MP Main camera',
      'Dynamic Island',
      'Always-On display',
      'Emergency SOS',
      '5G capable',
    ],
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
      <Text style={styles.imagePlaceholder}>{image}</Text>
    </TouchableOpacity>
  );

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
            onPress={() => setIsSaved(!isSaved)}
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
            <Text style={styles.mainImagePlaceholder}>{productData.images[selectedImageIndex]}</Text>
          </View>
          
          {/* Image Thumbnails */}
          <View style={styles.imageThumbnails}>
            {productData.images.map((image, index) => renderImage(image, index))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{productData.price}</Text>
            <Text style={styles.originalPrice}>{productData.originalPrice}</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{productData.condition}</Text>
            </View>
          </View>
          
          <Text style={styles.productName}>{productData.name}</Text>
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
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{productData.brand}</Text>
            </View>
          </View>
        </View>

        {/* Seller Information */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <TouchableOpacity style={styles.sellerCard}>
            <View style={styles.sellerLeft}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarPlaceholder}>{productData.seller.avatar}</Text>
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{productData.seller.name}</Text>
                  {productData.seller.verified && (
                    <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                  )}
                </View>
                <Text style={styles.sellerUsername}>{productData.seller.username}</Text>
                <View style={styles.sellerStats}>
                  <Text style={styles.sellerRating}>⭐ {productData.seller.rating}</Text>
                  <Text style={styles.sellerSales}>{productData.seller.totalSales} sales</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Specifications */}
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

        {/* Features */}
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

        {/* Similar Products */}
        <View style={styles.similarSection}>
          <Text style={styles.sectionTitle}>Similar Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((item) => (
              <TouchableOpacity key={item} style={styles.similarProduct}>
                <View style={styles.similarImage}>
                  <Text style={styles.similarImagePlaceholder}>📱</Text>
                </View>
                <Text style={styles.similarName}>iPhone 13 Pro</Text>
                <Text style={styles.similarPrice}>₦750,000</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity 
            style={styles.messageSellerButton}
            onPress={() => router.push('/chat/1')}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
            <Text style={styles.messageSellerButtonText}>Message Buyer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  
  // Similar Products
  similarSection: {
    padding: 20,
    paddingBottom: 100, // Space for bottom bar
  },
  similarProduct: {
    width: 120,
    marginRight: 16,
  },
  similarImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarImagePlaceholder: {
    fontSize: 32,
  },
  similarName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageSellerButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    // Multiple shadow layers for glowing effect
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    // Additional glow effect
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.3)',
    // Gradient-like effect with multiple backgrounds
    backgroundColor: '#7C3AED',
  },
  messageSellerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
});
