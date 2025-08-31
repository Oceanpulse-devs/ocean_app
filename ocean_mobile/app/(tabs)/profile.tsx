import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock seller data
  const sellerData = {
    name: 'MBT CEO',
    username: '@mbt_ceo',
    posts: 46,
    followers: '2.8K',
    following: 200,
    lastActive: '1st February, 03PM',
    products: [
      {
        id: '1',
        name: 'Nike Sneakers',
        price: '$30',
        brand: 'Nike',
        location: 'Lagos, Nigeria',
        images: ['👟', '👟', '👟'], // Placeholder emojis for now
      },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Banner and Avatar */}
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <Text style={styles.bannerPlaceholder}>🌺🌸🌼</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarPlaceholder}>👩</Text>
            </View>
          </View>
        </View>

        {/* Seller Information */}
        <View style={styles.sellerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.sellerName}>{sellerData.name}</Text>
              <Text style={styles.sellerUsername}>{sellerData.username}</Text>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.iconText}>👤</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sellerData.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sellerData.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sellerData.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Message Seller Section */}
        <View style={styles.messageSection}>
          <View style={styles.messageLeft}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarPlaceholder}>👩</Text>
            </View>
            <View style={styles.messageInfo}>
              <Text style={styles.messageName}>{sellerData.name}</Text>
              <Text style={styles.messageTime}>{sellerData.lastActive}</Text>
            </View>
          </View>
          <View style={styles.messageRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message Me</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Listing Details */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          {sellerData.products.map((product, index) => (
            <View key={product.id} style={styles.productDetails}>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Product Name</Text>
                <Text style={styles.productValue}>{product.name}</Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Price</Text>
                <Text style={styles.productValue}>{product.price}</Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Brand</Text>
                <Text style={styles.productValue}>{product.brand}</Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Location</Text>
                <Text style={styles.productValue}>{product.location}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Product Images Grid */}
        <View style={styles.imagesSection}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <View style={styles.imageGrid}>
            <View style={styles.mainImage}>
              <Text style={styles.imagePlaceholder}>🏪</Text>
              <Text style={styles.imageCaption}>Store Front</Text>
            </View>
            <View style={styles.sideImages}>
              <View style={styles.smallImage}>
                <Text style={styles.imagePlaceholder}>👟</Text>
                <Text style={styles.imageCaption}>Sneaker Detail</Text>
              </View>
              <View style={styles.smallImage}>
                <Text style={styles.imagePlaceholder}>👟</Text>
                <Text style={styles.imageCaption}>Wearing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewProductsButton}>
            <Text style={styles.viewProductsButtonText}>View All Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Banner and Avatar
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    height: 200,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholder: {
    fontSize: 48,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    fontSize: 32,
  },
  
  // Seller Information
  sellerInfo: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nameContainer: {
    flex: 1,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerUsername: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  
  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Message Section
  messageSection: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageAvatarPlaceholder: {
    fontSize: 20,
  },
  messageInfo: {
    flex: 1,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Product Section
  productSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  productDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B46C1',
  },
  productValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  
  // Images Section
  imagesSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mainImage: {
    flex: 2,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideImages: {
    flex: 1,
    gap: 12,
  },
  smallImage: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageCaption: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Action Buttons
  actionButtons: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  followButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#F3F4F6',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#374151',
  },
  viewProductsButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProductsButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
