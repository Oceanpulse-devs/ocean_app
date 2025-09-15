import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function BuyerSearchInsightScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock search insight data - searches that are NOT found in the app
  const searchInsightData = [
    {
      id: '1',
      rank: 1,
      searchTerm: 'Vintage Rolex Daytona',
      category: 'Luxury',
      searchCount: 234,
      avgBudget: '₦3,500,000',
      trend: 'up',
      trendPercentage: 45,
      image: '⌚',
      tags: ['Vintage', 'Rare', 'High Demand'],
      description: 'Highly sought after vintage timepiece',
      lastSearched: '2 hours ago',
      locations: ['Lagos', 'Abuja', 'Port Harcourt'],
    },
    {
      id: '2',
      rank: 2,
      searchTerm: 'Limited Edition Nike Dunk Low',
      category: 'Fashion',
      searchCount: 189,
      avgBudget: '₦85,000',
      trend: 'up',
      trendPercentage: 32,
      image: '👟',
      tags: ['Limited', 'Sneakers', 'Collectible'],
      description: 'Rare colorway with high resale value',
      lastSearched: '4 hours ago',
      locations: ['Lagos', 'Ibadan'],
    },
    {
      id: '3',
      rank: 3,
      searchTerm: 'Tesla Model Y Performance',
      category: 'Automotive',
      searchCount: 156,
      avgBudget: '₦28,000,000',
      trend: 'up',
      trendPercentage: 28,
      image: '🚗',
      tags: ['Electric', 'Performance', 'Luxury'],
      description: 'High-performance electric SUV',
      lastSearched: '6 hours ago',
      locations: ['Lagos', 'Abuja'],
    },
    {
      id: '4',
      rank: 4,
      searchTerm: 'Hermès Birkin Bag',
      category: 'Luxury',
      searchCount: 134,
      avgBudget: '₦2,800,000',
      trend: 'stable',
      trendPercentage: 5,
      image: '👜',
      tags: ['Luxury', 'Handbag', 'Investment'],
      description: 'Iconic luxury handbag',
      lastSearched: '8 hours ago',
      locations: ['Lagos', 'Abuja', 'Kano'],
    },
    {
      id: '5',
      rank: 5,
      searchTerm: 'PlayStation 5 Digital Edition',
      category: 'Gaming',
      searchCount: 98,
      avgBudget: '₦320,000',
      trend: 'down',
      trendPercentage: 12,
      image: '🎮',
      tags: ['Gaming', 'Console', 'Digital'],
      description: 'Digital-only gaming console',
      lastSearched: '12 hours ago',
      locations: ['Lagos', 'Abuja', 'Enugu'],
    },
    {
      id: '6',
      rank: 6,
      searchTerm: 'MacBook Pro M3 Max',
      category: 'Electronics',
      searchCount: 87,
      avgBudget: '₦1,800,000',
      trend: 'up',
      trendPercentage: 18,
      image: '💻',
      tags: ['Apple', 'Professional', 'High-end'],
      description: 'Latest professional laptop',
      lastSearched: '1 day ago',
      locations: ['Lagos', 'Abuja'],
    },
    {
      id: '7',
      rank: 7,
      searchTerm: 'Supreme Box Logo Hoodie',
      category: 'Fashion',
      searchCount: 76,
      avgBudget: '₦120,000',
      trend: 'up',
      trendPercentage: 22,
      image: '👕',
      tags: ['Streetwear', 'Limited', 'Resale'],
      description: 'Iconic streetwear piece',
      lastSearched: '1 day ago',
      locations: ['Lagos', 'Abuja', 'Port Harcourt'],
    },
    {
      id: '8',
      rank: 8,
      searchTerm: 'Air Jordan 1 Retro High OG',
      category: 'Fashion',
      searchCount: 65,
      avgBudget: '₦95,000',
      trend: 'stable',
      trendPercentage: 3,
      image: '👟',
      tags: ['Jordan', 'Retro', 'OG'],
      description: 'Classic basketball sneaker',
      lastSearched: '2 days ago',
      locations: ['Lagos', 'Ibadan', 'Kano'],
    },
  ];

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'automotive', name: 'Automotive' },
    { id: 'luxury', name: 'Luxury' },
  ];

  const timeframes = [
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
  ];

  const filteredData = selectedCategory === 'all' 
    ? searchInsightData 
    : searchInsightData.filter(item => item.category.toLowerCase() === selectedCategory);

  const renderSearchInsightItem = ({ item, index }) => (
    <TouchableOpacity style={styles.insightCard}>
      <View style={styles.rankContainer}>
        <View style={[
          styles.rankBadge,
          index < 3 && styles.topRankBadge
        ]}>
          <Text style={[
            styles.rankText,
            index < 3 && styles.topRankText
          ]}>
            #{item.rank}
          </Text>
        </View>
      </View>

      <View style={styles.searchInfo}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchEmoji}>{item.image}</Text>
          <View style={styles.searchDetails}>
            <Text style={styles.searchTerm}>{item.searchTerm}</Text>
            <Text style={styles.searchCategory}>{item.category}</Text>
            <Text style={styles.searchDescription}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.searchMetrics}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.searchCount}</Text>
              <Text style={styles.metricLabel}>Searches</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.avgBudget}</Text>
              <Text style={styles.metricLabel}>Avg Budget</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.lastSearched}</Text>
              <Text style={styles.metricLabel}>Last Search</Text>
            </View>
          </View>

          <View style={styles.trendContainer}>
            <View style={styles.trendItem}>
              <Ionicons 
                name={item.trend === 'up' ? 'trending-up' : item.trend === 'down' ? 'trending-down' : 'remove'} 
                size={16} 
                color={item.trend === 'up' ? '#10B981' : item.trend === 'down' ? '#EF4444' : '#6B7280'} 
              />
              <Text style={[
                styles.trendText,
                { color: item.trend === 'up' ? '#10B981' : item.trend === 'down' ? '#EF4444' : '#6B7280' }
              ]}>
                {item.trendPercentage}% this week
              </Text>
            </View>
          </View>

          <View style={styles.locationsContainer}>
            <Text style={styles.locationsLabel}>Popular in:</Text>
            <View style={styles.locationsList}>
              {item.locations.map((location, locationIndex) => (
                <View key={locationIndex} style={styles.locationTag}>
                  <Text style={styles.locationText}>{location}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {item.tags.map((tag, tagIndex) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.filterChip,
            selectedCategory === category.id && styles.activeFilterChip
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text style={[
            styles.filterChipText,
            selectedCategory === category.id && styles.activeFilterChipText
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTimeframeFilter = () => (
    <View style={styles.timeframeContainer}>
      {timeframes.map((timeframe) => (
        <TouchableOpacity
          key={timeframe.id}
          style={[
            styles.timeframeChip,
            selectedTimeframe === timeframe.id && styles.activeTimeframeChip
          ]}
          onPress={() => setSelectedTimeframe(timeframe.id)}
        >
          <Text style={[
            styles.timeframeChipText,
            selectedTimeframe === timeframe.id && styles.activeTimeframeChipText
          ]}>
            {timeframe.name}
          </Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Buyer Search Insight</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIcon}>
          <Ionicons name="search-outline" size={20} color="#6B46C1" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>What People Are Searching For</Text>
          <Text style={styles.infoDescription}>
            Discover trending searches that aren't available in the app yet. Join the demand or adjust your expectations.
          </Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>1,039</Text>
            <Text style={styles.summaryLabel}>Unmet Searches</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₦2.1M</Text>
            <Text style={styles.summaryLabel}>Avg Budget</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>8</Text>
            <Text style={styles.summaryLabel}>Categories</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categories</Text>
        {renderCategoryFilter()}
        
        <Text style={styles.filterTitle}>Timeframe</Text>
        {renderTimeframeFilter()}
      </View>

      {/* Search Insight List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Trending Unmet Searches</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderSearchInsightItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoButton: {
    padding: 8,
  },
  
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  
  // Summary
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#6B46C1',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  
  // Timeframe
  timeframeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  activeTimeframeChip: {
    backgroundColor: '#6B46C1',
  },
  timeframeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTimeframeChipText: {
    color: '#FFFFFF',
  },
  
  // List
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  
  // Insight Card
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankBadge: {
    backgroundColor: '#FEF3C7',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  topRankText: {
    color: '#D97706',
  },
  
  // Search Info
  searchInfo: {
    marginRight: 40,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  searchDetails: {
    flex: 1,
  },
  searchTerm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  searchCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Metrics
  searchMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Trend
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Locations
  locationsContainer: {
    marginTop: 8,
  },
  locationsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  locationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  locationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  locationText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#166534',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#0369A1',
  },
});
