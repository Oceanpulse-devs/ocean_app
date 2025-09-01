import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function BulkPurchaseProductScreen() {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleSeeWaitlist = () => {
    router.push('/bulk-purchase-waitlist');
  };

  const handleMessageSeller = () => {
    router.push('/chat/1' as any);
  };

  const productImages = [
    { id: '1', placeholder: '👟' },
    { id: '2', placeholder: '👟' },
    { id: '3', placeholder: '👟' },
    { id: '4', placeholder: '👟' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
        >
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seller Profile */}
        <View style={styles.sellerProfile}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.avatarText}>👩‍💼</Text>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>MBT CEO</Text>
            <Text style={styles.sellerDate}>16 February, 23 PM</Text>
          </View>
        </View>

        {/* Product Information */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>Product Name: Nike Sneakers</Text>
          <Text style={styles.productBrand}>Brand: Nike</Text>
        </View>

        {/* Price Information */}
        <View style={styles.priceInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>$30</Text>
            <Text style={styles.originalPrice}>$120</Text>
          </View>
          <Text style={styles.buyersCount}>Buyers: 4</Text>
        </View>

        {/* Product Images Grid */}
        <View style={styles.imagesGrid}>
          {productImages.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <Text style={styles.imagePlaceholder}>{image.placeholder}</Text>
            </View>
          ))}
        </View>

        {/* Product Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Step up your style with top-quality sneakers that combine comfort and fashion. 
            These Nike sneakers feature premium materials, excellent cushioning, and a 
            modern design that's perfect for everyday wear. Whether you're hitting the 
            gym or just running errands, these sneakers will keep you comfortable and 
            looking great all day long.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.waitlistButton} onPress={handleSeeWaitlist}>
            <Text style={styles.waitlistButtonText}>See Waitlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#EF4444" : "#6B7280"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
            <Ionicons name="chatbubble-outline" size={24} color="#6B46C1" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Seller Profile
  sellerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Product Information
  productInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Price Information
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  buyersCount: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Images Grid
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  imageContainer: {
    width: (width - 60) / 2,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholder: {
    fontSize: 32,
  },
  
  // Description
  descriptionContainer: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  waitlistButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  waitlistButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  likeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
