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

export default function MyBidsScreen() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock user bids data
  const mockBids = [
    {
      id: '1',
      auctionId: '1',
      auctionTitle: 'Vintage Rolex Submariner',
      bidAmount: 8500,
      isWinningBid: true,
      status: 'active',
      auctionEndTime: '2024-02-20T15:30:00Z',
      timeLeft: '2d 5h 30m',
      auctionImage: '⌚',
      seller: {
        name: 'Luxury Watches Co.',
        avatar: '👨‍💼'
      },
      currentPrice: 8500,
      totalBids: 12
    },
    {
      id: '2',
      auctionId: '2',
      auctionTitle: 'MacBook Pro M2 16-inch',
      bidAmount: 1750,
      isWinningBid: false,
      status: 'outbid',
      auctionEndTime: '2024-02-18T20:00:00Z',
      timeLeft: '1d 2h 15m',
      auctionImage: '💻',
      seller: {
        name: 'Tech Deals Inc.',
        avatar: '👩‍💻'
      },
      currentPrice: 1800,
      totalBids: 8
    },
    {
      id: '3',
      auctionId: '3',
      auctionTitle: 'Antique Persian Rug',
      bidAmount: 3200,
      isWinningBid: true,
      status: 'won',
      auctionEndTime: '2024-02-15T18:00:00Z',
      timeLeft: 'Ended',
      auctionImage: '🪞',
      seller: {
        name: 'Antique Collectors',
        avatar: '👴'
      },
      currentPrice: 3200,
      totalBids: 15
    },
    {
      id: '4',
      auctionId: '4',
      auctionTitle: 'Vintage Gibson Les Paul',
      bidAmount: 4200,
      isWinningBid: false,
      status: 'outbid',
      auctionEndTime: '2024-02-19T22:00:00Z',
      timeLeft: '1d 6h 20m',
      auctionImage: '🎸',
      seller: {
        name: 'Music Store Pro',
        avatar: '👨‍🎤'
      },
      currentPrice: 4500,
      totalBids: 6
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All', count: mockBids.length },
    { value: 'active', label: 'Winning', count: mockBids.filter(b => b.isWinningBid && b.status === 'active').length },
    { value: 'outbid', label: 'Outbid', count: mockBids.filter(b => b.status === 'outbid').length },
    { value: 'won', label: 'Won', count: mockBids.filter(b => b.status === 'won').length }
  ];

  const filteredBids = selectedStatus === 'all' 
    ? mockBids 
    : mockBids.filter(bid => bid.status === selectedStatus);

  const handleAuctionPress = (bid: any) => {
    router.push(`/auction-detail/${bid.auctionId}` as any);
  };

  const handlePlaceNewBid = (bid: any) => {
    Alert.alert('Place New Bid', `Place a new bid on "${bid.auctionTitle}"?`);
  };

  const handleContactSeller = (bid: any) => {
    router.push('/chat/1' as any);
  };

  const getStatusColor = (status: string, isWinning: boolean) => {
    if (isWinning && status === 'active') return '#10B981';
    if (status === 'outbid') return '#EF4444';
    if (status === 'won') return '#059669';
    return '#6B7280';
  };

  const getStatusIcon = (status: string, isWinning: boolean) => {
    if (isWinning && status === 'active') return 'checkmark-circle';
    if (status === 'outbid') return 'close-circle';
    if (status === 'won') return 'trophy';
    return 'help-circle';
  };

  const getStatusText = (status: string, isWinning: boolean) => {
    if (isWinning && status === 'active') return 'WINNING';
    if (status === 'outbid') return 'OUTBID';
    if (status === 'won') return 'WON';
    return 'UNKNOWN';
  };

  const renderBidCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bidCard}
      onPress={() => handleAuctionPress(item)}
    >
      {/* Auction Image */}
      <View style={styles.auctionImage}>
        <Text style={styles.imagePlaceholder}>{item.auctionImage}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status, item.isWinningBid) }
        ]}>
          <Ionicons 
            name={getStatusIcon(item.status, item.isWinningBid)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>
            {getStatusText(item.status, item.isWinningBid)}
          </Text>
        </View>
      </View>

      {/* Bid Info */}
      <View style={styles.bidInfo}>
        <Text style={styles.auctionTitle} numberOfLines={2}>
          {item.auctionTitle}
        </Text>
        
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerAvatar}>{item.seller.avatar}</Text>
          <Text style={styles.sellerName}>{item.seller.name}</Text>
        </View>

        <View style={styles.bidDetails}>
          <View style={styles.bidAmountContainer}>
            <Text style={styles.bidAmountLabel}>Your Bid</Text>
            <Text style={[
              styles.bidAmount,
              { color: item.isWinningBid ? '#10B981' : '#EF4444' }
            ]}>
              ${item.bidAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.currentPriceContainer}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <Text style={styles.currentPrice}>${item.currentPrice.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.timeLeft}>{item.timeLeft}</Text>
          <Text style={styles.bidCount}>{item.totalBids} bids</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {item.status === 'outbid' && (
            <TouchableOpacity
              style={styles.placeBidButton}
              onPress={() => handlePlaceNewBid(item)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#6B46C1" />
              <Text style={styles.placeBidText}>Place New Bid</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'won' && (
            <TouchableOpacity
              style={styles.contactSellerButton}
              onPress={() => handleContactSeller(item)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#6B46C1" />
              <Text style={styles.contactSellerText}>Contact Seller</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleAuctionPress(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.viewText}>View</Text>
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
        <Text style={styles.headerTitle}>My Bids</Text>
        <TouchableOpacity
          style={styles.auctionsButton}
          onPress={() => router.push('/auctions')}
        >
          <Ionicons name="hammer-outline" size={24} color="#6B46C1" />
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
          <Text style={styles.statNumber}>
            {mockBids.filter(b => b.isWinningBid && b.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Winning</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockBids.filter(b => b.status === 'outbid').length}
          </Text>
          <Text style={styles.statLabel}>Outbid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockBids.filter(b => b.status === 'won').length}
          </Text>
          <Text style={styles.statLabel}>Won</Text>
        </View>
      </View>

      {/* Bids List */}
      {filteredBids.length > 0 ? (
        <FlatList
          data={filteredBids}
          renderItem={renderBidCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bidsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No bids found</Text>
          <Text style={styles.emptyDescription}>
            {selectedStatus === 'all' 
              ? "You haven't placed any bids yet"
              : `No ${selectedStatus} bids found`
            }
          </Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => router.push('/auctions')}
          >
            <Text style={styles.browseButtonText}>Browse Auctions</Text>
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
  auctionsButton: {
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
  
  // Bids List
  bidsList: {
    padding: 20,
  },
  bidCard: {
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
  bidInfo: {
    padding: 16,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerAvatar: {
    fontSize: 20,
    marginRight: 8,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  bidDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bidAmountContainer: {
    flex: 1,
  },
  bidAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentPriceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  currentPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeLeft: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  bidCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  placeBidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    gap: 6,
  },
  placeBidText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactSellerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 6,
  },
  contactSellerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  viewText: {
    fontSize: 14,
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
  browseButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
