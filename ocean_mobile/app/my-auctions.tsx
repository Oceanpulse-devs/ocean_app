import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function MyAuctionsScreen() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock user auctions data
  const mockAuctions = [
    {
      id: '1',
      title: 'Vintage Rolex Submariner',
      currentPrice: 8500,
      startingPrice: 5000,
      totalBids: 12,
      uniqueBidders: 8,
      views: 156,
      endTime: '2024-02-20T15:30:00Z',
      status: 'active',
      timeLeft: '2d 5h 30m',
      isReserveMet: true,
      image: '⌚'
    },
    {
      id: '2',
      title: 'MacBook Pro M2 16-inch',
      currentPrice: 1800,
      startingPrice: 1200,
      totalBids: 8,
      uniqueBidders: 5,
      views: 89,
      endTime: '2024-02-18T20:00:00Z',
      status: 'active',
      timeLeft: '1d 2h 15m',
      isReserveMet: true,
      image: '💻'
    },
    {
      id: '3',
      title: 'Antique Persian Rug',
      currentPrice: 3200,
      startingPrice: 2000,
      totalBids: 15,
      uniqueBidders: 10,
      views: 203,
      endTime: '2024-02-15T18:00:00Z',
      status: 'ended',
      timeLeft: 'Ended',
      isReserveMet: true,
      image: '🪞'
    },
    {
      id: '4',
      title: 'Vintage Gibson Les Paul',
      currentPrice: 4500,
      startingPrice: 3000,
      totalBids: 6,
      uniqueBidders: 4,
      views: 67,
      endTime: '2024-02-25T22:00:00Z',
      status: 'draft',
      timeLeft: 'Not Started',
      isReserveMet: false,
      image: '🎸'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All', count: mockAuctions.length },
    { value: 'active', label: 'Active', count: mockAuctions.filter(a => a.status === 'active').length },
    { value: 'draft', label: 'Draft', count: mockAuctions.filter(a => a.status === 'draft').length },
    { value: 'ended', label: 'Ended', count: mockAuctions.filter(a => a.status === 'ended').length }
  ];

  const filteredAuctions = selectedStatus === 'all' 
    ? mockAuctions 
    : mockAuctions.filter(auction => auction.status === selectedStatus);

  const handleAuctionPress = (auction: any) => {
    router.push(`/auction-detail/${auction.id}` as any);
  };

  const handleEditAuction = (auction: any) => {
    Alert.alert('Edit Auction', `Edit "${auction.title}"?`);
  };

  const handleCancelAuction = (auction: any) => {
    Alert.alert(
      'Cancel Auction',
      `Are you sure you want to cancel "${auction.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Auction cancelled successfully');
          }
        }
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/auction-create');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'ended': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'draft': return 'create-outline';
      case 'ended': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const renderAuctionCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.auctionCard}
      onPress={() => handleAuctionPress(item)}
    >
      {/* Auction Image */}
      <View style={styles.auctionImage}>
        <Text style={styles.imagePlaceholder}>{item.image}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color="#FFFFFF" />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Auction Info */}
      <View style={styles.auctionInfo}>
        <Text style={styles.auctionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.priceInfo}>
          <View style={styles.currentPriceContainer}>
            <Text style={styles.currentPriceLabel}>Current Bid</Text>
            <Text style={styles.currentPrice}>${item.currentPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.bidInfo}>
            <Text style={styles.bidCount}>{item.totalBids} bids</Text>
            <Text style={styles.bidderCount}>{item.uniqueBidders} bidders</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.views} views</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.timeLeft}</Text>
          </View>
        </View>

        {item.isReserveMet && (
          <View style={styles.reserveMetContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.reserveMetText}>Reserve Met</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {item.status === 'active' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancelAuction(item)}
            >
              <Ionicons name="stop-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAuction(item)}
            >
              <Ionicons name="create-outline" size={16} color="#6B46C1" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAuctionPress(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.actionButtonText}>View</Text>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Auctions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNew}
        >
          <Ionicons name="add" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.statusChip,
                selectedStatus === option.value && styles.statusChipSelected
              ]}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Text style={[
                styles.statusChipText,
                selectedStatus === option.value && styles.statusChipTextSelected
              ]}>
                {option.label} ({option.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockAuctions.filter(a => a.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockAuctions.reduce((sum, a) => sum + a.totalBids, 0)}</Text>
          <Text style={styles.statLabel}>Total Bids</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockAuctions.reduce((sum, a) => sum + a.views, 0)}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      {/* Auctions List */}
      {filteredAuctions.length > 0 ? (
        <FlatList
          data={filteredAuctions}
          renderItem={renderAuctionCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.auctionsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="hammer-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No auctions found</Text>
          <Text style={styles.emptyDescription}>
            {selectedStatus === 'all' 
              ? "You haven't created any auctions yet"
              : `No ${selectedStatus} auctions found`
            }
          </Text>
          <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateNew}>
            <Text style={styles.createFirstButtonText}>Create Your First Auction</Text>
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
    justifyContent: 'space-between',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  createButton: {
    padding: 8,
  },
  
  // Status Filter
  statusFilter: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusChipSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  statusChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
  },
  
  // Summary Stats
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Auctions List
  auctionsList: {
    padding: 20,
  },
  auctionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  auctionImage: {
    height: 160,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  auctionInfo: {
    padding: 16,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPriceContainer: {
    flex: 1,
  },
  currentPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  bidInfo: {
    alignItems: 'flex-end',
  },
  bidCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  bidderCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  reserveMetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  reserveMetText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
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
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
