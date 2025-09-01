import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SwapDealVendorsScreen() {
  // Mock vendor data
  const mockVendors = [
    {
      id: '1',
      name: 'MBT CEO',
      username: '@mbt_ceo',
      avatar: '👨‍💼',
      verified: true,
      rating: 4.8,
      swapCount: 156,
      location: 'Lagos, Nigeria',
    },
    {
      id: '2',
      name: 'Alabi The Law',
      username: '@delaw',
      avatar: '👨‍⚖️',
      verified: false,
      rating: 4.5,
      swapCount: 89,
      location: 'Abuja, Nigeria',
    },
    {
      id: '3',
      name: 'Tech Swapper',
      username: '@tech_swap',
      avatar: '👩‍💻',
      verified: true,
      rating: 4.9,
      swapCount: 234,
      location: 'Port Harcourt, Nigeria',
    },
    {
      id: '4',
      name: 'Gadget Exchange',
      username: '@gadget_ex',
      avatar: '📱',
      verified: true,
      rating: 4.7,
      swapCount: 167,
      location: 'Kano, Nigeria',
    },
    {
      id: '5',
      name: 'Swap Master',
      username: '@swap_master',
      avatar: '🔄',
      verified: false,
      rating: 4.3,
      swapCount: 78,
      location: 'Ibadan, Nigeria',
    },
  ];

  const handleMessageVendor = (vendor: any) => {
    router.push('/chat/1' as any);
  };

  const renderVendor = ({ item }: { item: any }) => (
    <View style={styles.vendorCard}>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorAvatar}>{item.avatar}</Text>
        <View style={styles.vendorDetails}>
          <View style={styles.vendorNameRow}>
            <Text style={styles.vendorName}>{item.name}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
            )}
          </View>
          <Text style={styles.vendorUsername}>{item.username}</Text>
          <View style={styles.vendorStats}>
            <Text style={styles.vendorRating}>⭐ {item.rating}</Text>
            <Text style={styles.vendorSwaps}>{item.swapCount} swaps</Text>
            <Text style={styles.vendorLocation}>{item.location}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => handleMessageVendor(item)}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Swap Deals</Text>
        <Text style={styles.subtitle}>See Vendors available to swap</Text>
      </View>

      {/* Vendors List */}
      <FlatList
        data={mockVendors}
        renderItem={renderVendor}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.vendorsList}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  
  // Title
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  
  // Vendors List
  vendorsList: {
    padding: 20,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorAvatar: {
    fontSize: 48,
    marginRight: 16,
  },
  vendorDetails: {
    flex: 1,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  vendorUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  vendorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vendorRating: {
    fontSize: 12,
    color: '#6B7280',
  },
  vendorSwaps: {
    fontSize: 12,
    color: '#6B7280',
  },
  vendorLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
