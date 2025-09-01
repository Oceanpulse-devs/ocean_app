import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AuctionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showFilters, setShowFilters] = useState(false);

  // Mock auction data
  const mockAuctions = [
    {
      id: '1',
      title: 'Vintage Rolex Submariner',
      description: 'Classic timepiece in excellent condition',
      currentPrice: 8500,
      startingPrice: 5000,
      reservePrice: 8000,
      endTime: '2024-02-20T15:30:00Z',
      startTime: '2024-02-15T10:00:00Z',
      category: 'Jewelry',
      condition: 'Excellent',
      location: 'New York, NY',
      totalBids: 12,
      uniqueBidders: 8,
      views: 156,
      images: ['⌚'],
      seller: {
        id: '1',
        fullName: 'Luxury Watches Co.',
        profilePicture: '👨‍💼',
        location: 'New York, NY'
      },
      status: 'active',
      isReserveMet: true,
      timeLeft: '2d 5h 30m'
    },
    {
      id: '2',
      title: 'MacBook Pro M2 16-inch',
      description: 'Brand new MacBook Pro with M2 chip, 16GB RAM, 512GB SSD',
      currentPrice: 1800,
      startingPrice: 1200,
      reservePrice: 1500,
      endTime: '2024-02-18T20:00:00Z',
      startTime: '2024-02-16T12:00:00Z',
      category: 'Electronics',
      condition: 'New',
      location: 'San Francisco, CA',
      totalBids: 8,
      uniqueBidders: 5,
      views: 89,
      images: ['💻'],
      seller: {
        id: '2',
        fullName: 'Tech Deals Inc.',
        profilePicture: '👩‍💻',
        location: 'San Francisco, CA'
      },
      status: 'active',
      isReserveMet: true,
      timeLeft: '1d 2h 15m'
    },
    {
      id: '3',
      title: 'Antique Persian Rug',
      description: 'Hand-woven Persian rug from 1920s, excellent condition',
      currentPrice: 3200,
      startingPrice: 2000,
      reservePrice: 3000,
      endTime: '2024-02-22T18:00:00Z',
      startTime: '2024-02-17T09:00:00Z',
      category: 'Home & Garden',
      condition: 'Good',
      location: 'Los Angeles, CA',
      totalBids: 15,
      uniqueBidders: 10,
      views: 203,
      images: ['🪞'],
      seller: {
        id: '3',
        fullName: 'Antique Collectors',
        profilePicture: '👴',
        location: 'Los Angeles, CA'
      },
      status: 'active',
      isReserveMet: true,
      timeLeft: '3d 8h 45m'
    },
    {
      id: '4',
      title: 'Vintage Gibson Les Paul',
      description: '1970s Gibson Les Paul Standard, all original parts',
      currentPrice: 4500,
      startingPrice: 3000,
      reservePrice: 4000,
      endTime: '2024-02-19T22:00:00Z',
      startTime: '2024-02-16T14:00:00Z',
      category: 'Musical Instruments',
      condition: 'Very Good',
      location: 'Nashville, TN',
      totalBids: 6,
      uniqueBidders: 4,
      views: 67,
      images: ['🎸'],
      seller: {
        id: '4',
        fullName: 'Music Store Pro',
        profilePicture: '👨‍🎤',
        location: 'Nashville, TN'
      },
      status: 'active',
      isReserveMet: true,
      timeLeft: '1d 6h 20m'
    }
  ];

  const categories = [
    'All Categories',
    'Electronics',
    'Jewelry',
    'Home & Garden',
    'Musical Instruments',
    'Automotive',
    'Fashion',
    'Sports',
    'Books',
    'Art & Collectibles'
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ended', label: 'Ended' }
  ];

  const handleAuctionPress = (auction: any) => {
    router.push(`/auction-detail/${auction.id}` as any);
  };

  const handleCreateAuction = () => {
    router.push('/auction-create');
  };

  const handleMyAuctions = () => {
    router.push('/my-auctions');
  };

  const handleMyBids = () => {
    router.push('/my-bids');
  };

  const renderAuctionCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.auctionCard}
      onPress={() => handleAuctionPress(item)}
    >
      {/* Auction Image */}
      <View style={styles.auctionImage}>
        <Text style={styles.imagePlaceholder}>{item.images[0]}</Text>
        {item.isReserveMet && (
          <View style={styles.reserveMetBadge}>
            <Text style={styles.reserveMetText}>Reserve Met</Text>
          </View>
        )}
      </View>

      {/* Auction Info */}
      <View style={styles.auctionInfo}>
        <Text style={styles.auctionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerAvatar}>{item.seller.profilePicture}</Text>
          <Text style={styles.sellerName}>{item.seller.fullName}</Text>
          <Text style={styles.sellerLocation}>{item.seller.location}</Text>
        </View>

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

        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.timeLeft}>{item.timeLeft} left</Text>
          <View style={styles.viewsContainer}>
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.viewsCount}>{item.views}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Status</Text>
        <View style={styles.statusOptions}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusOption,
                selectedStatus === status.value && styles.statusOptionSelected
              ]}
              onPress={() => setSelectedStatus(status.value)}
            >
              <Text style={[
                styles.statusOptionText,
                selectedStatus === status.value && styles.statusOptionTextSelected
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.clearFiltersButton}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyFiltersButton}>
          <Text style={styles.applyFiltersText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auctions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateAuction}
        >
          <Ionicons name="add" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search auctions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleMyAuctions}>
          <Ionicons name="hammer-outline" size={20} color="#6B46C1" />
          <Text style={styles.quickActionText}>My Auctions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleMyBids}>
          <Ionicons name="card-outline" size={20} color="#6B46C1" />
          <Text style={styles.quickActionText}>My Bids</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => setSelectedStatus('active')}>
          <Ionicons name="flame-outline" size={20} color="#EF4444" />
          <Text style={styles.quickActionText}>Live Now</Text>
        </TouchableOpacity>
      </View>

      {/* Auctions List */}
      <FlatList
        data={mockAuctions}
        renderItem={renderAuctionCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.auctionsList}
      />

      {/* Filter Modal */}
      {showFilters && (
        <View style={styles.filterOverlay}>
          {renderFilterModal()}
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
  menuButton: {
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
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
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
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  reserveMetBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reserveMetText: {
    fontSize: 12,
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
    marginRight: 8,
  },
  sellerLocation: {
    fontSize: 12,
    color: '#6B7280',
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLeft: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 6,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  
  // Filter Modal
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
