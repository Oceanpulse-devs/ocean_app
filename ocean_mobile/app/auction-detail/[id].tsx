import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [bidAmount, setBidAmount] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [maxAutoBidAmount, setMaxAutoBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState('2d 5h 30m');

  // Mock auction data
  const auction = {
    id: id,
    title: 'Vintage Rolex Submariner',
    description: 'This is a classic Rolex Submariner from the 1970s in excellent condition. The watch features the iconic black dial with luminescent markers, a rotating bezel, and the original Oyster bracelet. The movement has been recently serviced and is keeping excellent time. This is a rare opportunity to own a piece of horological history.',
    currentPrice: 8500,
    startingPrice: 5000,
    reservePrice: 8000,
    minimumBidIncrement: 100,
    endTime: '2024-02-20T15:30:00Z',
    startTime: '2024-02-15T10:00:00Z',
    category: 'Jewelry',
    subcategory: 'Watches',
    condition: 'Excellent',
    location: 'New York, NY',
    totalBids: 12,
    uniqueBidders: 8,
    views: 156,
    images: ['⌚', '⌚', '⌚', '⌚'],
    autoExtend: true,
    autoExtendMinutes: 5,
    tags: ['vintage', 'rolex', 'submariner', 'luxury', 'watch'],
    shippingInfo: {
      cost: 50,
      method: 'Insured Shipping',
      estimatedDays: '3-5 business days'
    },
    returnPolicy: '30-day return policy for authenticity issues',
    seller: {
      id: '1',
      fullName: 'Luxury Watches Co.',
      profilePicture: '👨‍💼',
      location: 'New York, NY',
      rating: 4.9,
      totalSales: 1250
    },
    status: 'active',
    isReserveMet: true,
    bids: [
      {
        id: '1',
        bidAmount: 8500,
        bidder: { fullName: 'John Smith' },
        createdAt: '2024-02-17T14:30:00Z',
        isWinningBid: true
      },
      {
        id: '2',
        bidAmount: 8400,
        bidder: { fullName: 'Sarah Johnson' },
        createdAt: '2024-02-17T14:25:00Z',
        isWinningBid: false
      },
      {
        id: '3',
        bidAmount: 8300,
        bidder: { fullName: 'Mike Wilson' },
        createdAt: '2024-02-17T14:20:00Z',
        isWinningBid: false
      }
    ]
  };

  const minimumBid = auction.currentPrice + auction.minimumBidIncrement;

  const handlePlaceBid = () => {
    const bid = parseFloat(bidAmount);
    
    if (!bid || bid < minimumBid) {
      Alert.alert(
        'Invalid Bid',
        `Minimum bid amount is $${minimumBid.toLocaleString()}`
      );
      return;
    }

    Alert.alert(
      'Place Bid',
      `Place a bid of $${bid.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Bid',
          onPress: () => {
            // Mock bid placement
            Alert.alert('Success', 'Your bid has been placed successfully!');
            setBidAmount('');
          }
        }
      ]
    );
  };

  const handleWatchToggle = () => {
    setIsWatching(!isWatching);
    Alert.alert(
      isWatching ? 'Unwatched' : 'Watching',
      isWatching ? 'You are no longer watching this auction' : 'You are now watching this auction'
    );
  };

  const handleMessageSeller = () => {
    router.push('/chat/1' as any);
  };

  const renderBidHistory = () => (
    <View style={styles.bidHistory}>
      <Text style={styles.sectionTitle}>Bid History</Text>
      {auction.bids.map((bid, index) => (
        <View key={bid.id} style={styles.bidItem}>
          <View style={styles.bidInfo}>
            <Text style={styles.bidAmount}>${bid.bidAmount.toLocaleString()}</Text>
            <Text style={styles.bidderName}>{bid.bidder.fullName}</Text>
          </View>
          <View style={styles.bidMeta}>
            <Text style={styles.bidTime}>
              {new Date(bid.createdAt).toLocaleDateString()}
            </Text>
            {bid.isWinningBid && (
              <View style={styles.winningBadge}>
                <Text style={styles.winningText}>Winning</Text>
              </View>
            )}
          </View>
        </View>
      ))}
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
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.watchButton}
          onPress={handleWatchToggle}
        >
          <Ionicons 
            name={isWatching ? "heart" : "heart-outline"} 
            size={24} 
            color={isWatching ? "#EF4444" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Auction Images */}
        <View style={styles.imagesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {auction.images.map((image, index) => (
              <View key={index} style={styles.auctionImage}>
                <Text style={styles.imagePlaceholder}>{image}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Auction Info */}
        <View style={styles.auctionInfo}>
          <Text style={styles.auctionTitle}>{auction.title}</Text>
          
          <View style={styles.priceSection}>
            <View style={styles.currentPriceContainer}>
              <Text style={styles.currentPriceLabel}>Current Bid</Text>
              <Text style={styles.currentPrice}>${auction.currentPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.bidStats}>
              <Text style={styles.bidCount}>{auction.totalBids} bids</Text>
              <Text style={styles.bidderCount}>{auction.uniqueBidders} bidders</Text>
            </View>
          </View>

          <View style={styles.timeSection}>
            <Ionicons name="time-outline" size={20} color="#EF4444" />
            <Text style={styles.timeLeft}>{timeLeft} left</Text>
            {auction.isReserveMet && (
              <View style={styles.reserveMetBadge}>
                <Text style={styles.reserveMetText}>Reserve Met</Text>
              </View>
            )}
          </View>

          <View style={styles.auctionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Starting Price:</Text>
              <Text style={styles.detailValue}>${auction.startingPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reserve Price:</Text>
              <Text style={styles.detailValue}>${auction.reservePrice.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Minimum Bid:</Text>
              <Text style={styles.detailValue}>${minimumBid.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>{auction.condition}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{auction.location}</Text>
            </View>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <Text style={styles.sellerAvatar}>{auction.seller.profilePicture}</Text>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{auction.seller.fullName}</Text>
              <Text style={styles.sellerLocation}>{auction.seller.location}</Text>
              <View style={styles.sellerStats}>
                <Text style={styles.sellerRating}>⭐ {auction.seller.rating}</Text>
                <Text style={styles.sellerSales}>{auction.seller.totalSales} sales</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.messageSellerButton} onPress={handleMessageSeller}>
              <Ionicons name="chatbubble-outline" size={20} color="#6B46C1" />
              <Text style={styles.messageSellerText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{auction.description}</Text>
        </View>

        {/* Shipping Info */}
        <View style={styles.shippingSection}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingCost}>Shipping: ${auction.shippingInfo.cost}</Text>
            <Text style={styles.shippingMethod}>{auction.shippingInfo.method}</Text>
            <Text style={styles.shippingTime}>Estimated: {auction.shippingInfo.estimatedDays}</Text>
          </View>
        </View>

        {/* Bid History */}
        {renderBidHistory()}
      </ScrollView>

      {/* Bidding Section */}
      <View style={styles.biddingSection}>
        <View style={styles.bidInputContainer}>
          <Text style={styles.bidInputLabel}>Your Bid</Text>
          <View style={styles.bidInputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.bidInput}
              placeholder={minimumBid.toString()}
              placeholderTextColor="#9CA3AF"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.minimumBidText}>
            Minimum bid: ${minimumBid.toLocaleString()}
          </Text>
        </View>

        <View style={styles.bidActions}>
          <TouchableOpacity style={styles.placeBidButton} onPress={handlePlaceBid}>
            <Text style={styles.placeBidText}>Place Bid</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  backButton: {
    padding: 8,
  },
  watchButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Images
  imagesContainer: {
    backgroundColor: '#FFFFFF',
  },
  auctionImage: {
    width: width,
    height: 300,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 64,
  },
  
  // Auction Info
  auctionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  auctionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 32,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPriceContainer: {
    flex: 1,
  },
  currentPriceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
  },
  bidStats: {
    alignItems: 'flex-end',
  },
  bidCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeLeft: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  reserveMetBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  reserveMetText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  auctionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Seller Section
  sellerSection: {
    backgroundColor: '#FFFFFF',
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
  },
  sellerAvatar: {
    fontSize: 48,
    marginRight: 16,
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
  sellerLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sellerRating: {
    fontSize: 14,
    color: '#6B7280',
  },
  sellerSales: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageSellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  messageSellerText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '500',
  },
  
  // Description
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  
  // Shipping
  shippingSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  shippingInfo: {
    gap: 8,
  },
  shippingCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  shippingMethod: {
    fontSize: 14,
    color: '#6B7280',
  },
  shippingTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Bid History
  bidHistory: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bidInfo: {
    flex: 1,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidderName: {
    fontSize: 14,
    color: '#6B7280',
  },
  bidMeta: {
    alignItems: 'flex-end',
  },
  bidTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  winningBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  winningText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Bidding Section
  biddingSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bidInputContainer: {
    marginBottom: 16,
  },
  bidInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  minimumBidText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bidActions: {
    flexDirection: 'row',
    gap: 12,
  },
  placeBidButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeBidText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
