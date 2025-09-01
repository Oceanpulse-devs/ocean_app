import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function MyProductsScreen() {
  const [myProducts] = useState([
    {
      id: '1',
      name: 'Nike Air Max 270',
      price: '$120',
      originalPrice: '$150',
      brand: 'Nike',
      location: 'Lagos, Nigeria',
      status: 'active',
      views: 45,
      likes: 12,
      image: '👟',
      isDistress: false,
      createdAt: '2 days ago',
    },
    {
      id: '2',
      name: 'Adidas Ultraboost',
      price: '$180',
      originalPrice: '$220',
      brand: 'Adidas',
      location: 'Lagos, Nigeria',
      status: 'active',
      views: 32,
      likes: 8,
      image: '👟',
      isDistress: true,
      createdAt: '1 week ago',
    },
    {
      id: '3',
      name: 'Jordan Retro 1',
      price: '$200',
      originalPrice: '$250',
      brand: 'Jordan',
      location: 'Lagos, Nigeria',
      status: 'sold',
      views: 67,
      likes: 23,
      image: '👟',
      isDistress: false,
      createdAt: '3 days ago',
    },
    {
      id: '4',
      name: 'Converse Chuck Taylor',
      price: '$60',
      originalPrice: '$80',
      brand: 'Converse',
      location: 'Lagos, Nigeria',
      status: 'active',
      views: 28,
      likes: 5,
      image: '👟',
      isDistress: false,
      createdAt: '5 days ago',
    },
    {
      id: '5',
      name: 'Vans Old Skool',
      price: '$70',
      originalPrice: '$90',
      brand: 'Vans',
      location: 'Lagos, Nigeria',
      status: 'draft',
      views: 0,
      likes: 0,
      image: '👟',
      isDistress: false,
      createdAt: '1 day ago',
    },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredProducts = myProducts.filter(product => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return product.status === 'active';
    if (selectedFilter === 'sold') return product.status === 'sold';
    if (selectedFilter === 'draft') return product.status === 'draft';
    if (selectedFilter === 'distress') return product.isDistress;
    return true;
  });

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{item.image}</Text>
        {item.isDistress && (
          <View style={styles.distressBadge}>
            <Text style={styles.distressText}>🔥 URGENT</Text>
          </View>
        )}
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="bookmark-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        {item.status === 'sold' && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'active' ? styles.activeBadge :
            item.status === 'sold' ? styles.soldBadge :
            styles.draftBadge
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.productBrand}>{item.brand}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>{item.price}</Text>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
        </View>
        
        <View style={styles.productLocation}>
          <Ionicons name="location-outline" size={12} color="#6B7280" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        
        <View style={styles.productStats}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <Text style={styles.createdAt}>{item.createdAt}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#8B5CF6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.promoteButton}>
            <Ionicons name="trending-up-outline" size={16} color="#F59E0B" />
            <Text style={styles.promoteButtonText}>Promote</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/upload?type=product')}>
          <Ionicons name="add" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All', count: myProducts.length },
            { key: 'active', label: 'Active', count: myProducts.filter(p => p.status === 'active').length },
            { key: 'sold', label: 'Sold', count: myProducts.filter(p => p.status === 'sold').length },
            { key: 'draft', label: 'Draft', count: myProducts.filter(p => p.status === 'draft').length },
            { key: 'distress', label: 'Distress', count: myProducts.filter(p => p.isDistress).length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.activeFilterText
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  addButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterTab: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 60,
  },
  distressBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  soldBadge: {
    backgroundColor: '#FEE2E2',
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  productStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  createdAt: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  promoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    gap: 4,
  },
  promoteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
});
