import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function HeavyDistributorListScreen() {
  const params = useLocalSearchParams();
  const { type, product, location } = params;

  // Mock data for distributors
  const [distributors] = useState([
    {
      id: '1',
      name: 'HBT CEO',
      username: '@TOS_360',
      avatar: '👨‍💼',
      verified: true,
      type: 'Heavy Distributor',
      location: 'Lagos',
      rating: 4.8,
      reviews: 124,
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Alabi The Low',
      username: '@OOWW',
      avatar: '👨‍💻',
      verified: false,
      type: 'Manufacturer',
      location: 'Abuja',
      rating: 4.5,
      reviews: 89,
      lastActive: '1 hour ago',
    },
    {
      id: '3',
      name: 'Tech Solutions NG',
      username: '@TechSol_NG',
      avatar: '🏪',
      verified: true,
      type: 'Wholesaler',
      location: 'Port Harcourt',
      rating: 4.9,
      reviews: 256,
      lastActive: '30 min ago',
    },
    {
      id: '4',
      name: 'Global Imports Ltd',
      username: '@GlobalImports',
      avatar: '🌍',
      verified: true,
      type: 'Heavy Distributor',
      location: 'Kano',
      rating: 4.7,
      reviews: 178,
      lastActive: '5 hours ago',
    },
    {
      id: '5',
      name: 'Premium Electronics',
      username: '@PremiumElect',
      avatar: '📱',
      verified: false,
      type: 'Retail',
      location: 'Ibadan',
      rating: 4.3,
      reviews: 67,
      lastActive: '3 hours ago',
    },
    {
      id: '6',
      name: 'HBT CEO',
      username: '@TOS_360',
      avatar: '👨‍💼',
      verified: true,
      type: 'Heavy Distributor',
      location: 'Lagos',
      rating: 4.8,
      reviews: 124,
      lastActive: '2 hours ago',
    },
    {
      id: '7',
      name: 'Alabi The Low',
      username: '@OOWW',
      avatar: '👨‍💻',
      verified: false,
      type: 'Manufacturer',
      location: 'Abuja',
      rating: 4.5,
      reviews: 89,
      lastActive: '1 hour ago',
    },
  ]);

  const renderDistributor = ({ item }: { item: any }) => (
    <View style={styles.distributorCard}>
      <View style={styles.distributorInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={8} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.location}>• {item.location}</Text>
            <Text style={styles.lastActive}>• {item.lastActive}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews} reviews)</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.messageButton}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type}</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>See all available {type?.toLowerCase()}s</Text>
      </View>

      {/* Search Results */}
      <FlatList
        data={distributors}
        renderItem={renderDistributor}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationButton: {
    padding: 8,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  distributorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  distributorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastActive: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  reviews: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
