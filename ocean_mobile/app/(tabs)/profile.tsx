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
              <View style={styles.avatar}>
                <Text style={styles.avatarPlaceholder}>👩‍💼</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.sellerName}>{sellerData.name}</Text>
              <Text style={styles.sellerUsername}>{sellerData.username}</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active {sellerData.lastActive}</Text>
              </View>
            </View>
          </View>

          {/* Modern Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{sellerData.posts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{sellerData.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{sellerData.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Message Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={20} color="#6B46C1" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Products */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B46C1" />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {sellerData.products.map((product, index) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>👟</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <View style={styles.productLocation}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text style={styles.locationText}>{product.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Seller Tools */}
        <View style={styles.sellerTools}>
          <Text style={styles.sellerToolsTitle}>Seller Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity 
              style={styles.toolCard}
              onPress={() => router.push('/product-demand')}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="trending-up-outline" size={24} color="#6B46C1" />
              </View>
              <Text style={styles.toolTitle}>Demand Analytics</Text>
              <Text style={styles.toolDescription}>View trending products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <View style={styles.toolIcon}>
                <Ionicons name="analytics-outline" size={24} color="#6B46C1" />
              </View>
              <Text style={styles.toolTitle}>Sales Report</Text>
              <Text style={styles.toolDescription}>Track your performance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <View style={styles.toolIcon}>
                <Ionicons name="storefront-outline" size={24} color="#6B46C1" />
              </View>
              <Text style={styles.toolTitle}>My Store</Text>
              <Text style={styles.toolDescription}>Manage products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <View style={styles.toolIcon}>
                <Ionicons name="settings-outline" size={24} color="#6B46C1" />
              </View>
              <Text style={styles.toolTitle}>Settings</Text>
              <Text style={styles.toolDescription}>Account preferences</Text>
            </TouchableOpacity>
          </View>
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
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
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
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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
    color: '#6B46C1',
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
    color: '#6B46C1',
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
    color: '#6B46C1',
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
    backgroundColor: '#F0F9FF',
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
});