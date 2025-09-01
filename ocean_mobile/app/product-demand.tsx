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

export default function ProductDemandScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock demand data
  const demandData = [
    {
      id: '1',
      rank: 1,
      productName: 'iPhone 15 Pro Max',
      category: 'Electronics',
      demandScore: 95,
      requestsCount: 1247,
      avgBudget: '₦850,000',
      trend: 'up',
      trendPercentage: 23,
      image: '📱',
      tags: ['Latest', 'Premium', 'High Demand'],
    },
    {
      id: '2',
      rank: 2,
      productName: 'MacBook Air M3',
      category: 'Electronics',
      demandScore: 89,
      requestsCount: 892,
      avgBudget: '₦1,200,000',
      trend: 'up',
      trendPercentage: 18,
      image: '💻',
      tags: ['Work', 'Student', 'Popular'],
    },
    {
      id: '3',
      rank: 3,
      productName: 'Nike Air Jordan 1',
      category: 'Fashion',
      demandScore: 87,
      requestsCount: 756,
      avgBudget: '₦45,000',
      trend: 'up',
      trendPercentage: 12,
      image: '👟',
      tags: ['Sneakers', 'Limited', 'Trending'],
    },
    {
      id: '4',
      rank: 4,
      productName: 'Samsung Galaxy S24 Ultra',
      category: 'Electronics',
      demandScore: 84,
      requestsCount: 634,
      avgBudget: '₦750,000',
      trend: 'down',
      trendPercentage: 5,
      image: '📱',
      tags: ['Android', 'Camera', 'Premium'],
    },
    {
      id: '5',
      rank: 5,
      productName: 'PlayStation 5',
      category: 'Gaming',
      demandScore: 82,
      requestsCount: 523,
      avgBudget: '₦350,000',
      trend: 'up',
      trendPercentage: 8,
      image: '🎮',
      tags: ['Gaming', 'Console', 'Entertainment'],
    },
    {
      id: '6',
      rank: 6,
      productName: 'Louis Vuitton Handbag',
      category: 'Fashion',
      demandScore: 79,
      requestsCount: 445,
      avgBudget: '₦180,000',
      trend: 'stable',
      trendPercentage: 2,
      image: '👜',
      tags: ['Luxury', 'Fashion', 'Premium'],
    },
    {
      id: '7',
      rank: 7,
      productName: 'Tesla Model 3',
      category: 'Automotive',
      demandScore: 76,
      requestsCount: 234,
      avgBudget: '₦25,000,000',
      trend: 'up',
      trendPercentage: 15,
      image: '🚗',
      tags: ['Electric', 'Luxury', 'High Value'],
    },
    {
      id: '8',
      rank: 8,
      productName: 'Rolex Submariner',
      category: 'Luxury',
      demandScore: 74,
      requestsCount: 198,
      avgBudget: '₦2,500,000',
      trend: 'up',
      trendPercentage: 7,
      image: '⌚',
      tags: ['Luxury', 'Watch', 'Investment'],
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
    ? demandData 
    : demandData.filter(item => item.category.toLowerCase() === selectedCategory);

  const renderDemandItem = ({ item, index }) => (
    <TouchableOpacity style={styles.demandCard}>
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

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productEmoji}>{item.image}</Text>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.demandMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Demand Score</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreFill, 
                    { width: `${item.demandScore}%` }
                  ]} 
                />
              </View>
              <Text style={styles.scoreText}>{item.demandScore}</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.requestsCount}</Text>
              <Text style={styles.metricLabel}>Requests</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.avgBudget}</Text>
              <Text style={styles.metricLabel}>Avg Budget</Text>
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
                {item.trendPercentage}%
              </Text>
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
        <Text style={styles.headerTitle}>Product Demand</Text>
        <TouchableOpacity style={styles.analyticsButton}>
          <Ionicons name="analytics-outline" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2,847</Text>
            <Text style={styles.summaryLabel}>Total Requests</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₦1.2M</Text>
            <Text style={styles.summaryLabel}>Avg Budget</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>156</Text>
            <Text style={styles.summaryLabel}>Products</Text>
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

      {/* Demand List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Top Demanded Products</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderDemandItem}
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
  analyticsButton: {
    padding: 8,
  },
  
  // Summary
  summaryContainer: {
    padding: 20,
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
  
  // Demand Card
  demandCard: {
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
  
  // Product Info
  productInfo: {
    marginRight: 40,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Metrics
  demandMetrics: {
    gap: 12,
  },
  metric: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 30,
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
