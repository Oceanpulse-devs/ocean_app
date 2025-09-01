import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HeavyDistributorScreen() {
  const [selectedType, setSelectedType] = useState('Heavy Distributor');
  const [productName, setProductName] = useState('');
  const [location, setLocation] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const distributorTypes = [
    'Heavy Distributor',
    'Retail',
    'Manufacturer',
    'Wholesaler',
  ];

  const productSuggestions = [
    'Electronics',
    'Fashion & Clothing',
    'Home & Garden',
    'Automotive',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Media',
    'Food & Beverages',
  ];

  const locationSuggestions = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Kaduna',
    'Enugu',
    'Calabar',
  ];

  const handleSearch = () => {
    if (productName.trim() && location.trim()) {
      router.push(`/heavy-distributor-list?type=${selectedType}&product=${productName}&location=${location}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heavy Distributor</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Search Form */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          {/* Distributor Type Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Distributor Type</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={styles.dropdownText}>{selectedType}</Text>
              <Ionicons 
                name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {showTypeDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {distributorTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedType(type);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Product Name Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name of product</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowProductDropdown(!showProductDropdown)}
            >
              <Text style={styles.dropdownText}>
                {productName || 'Select product category'}
              </Text>
              <Ionicons 
                name={showProductDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {showProductDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {productSuggestions.map((product) => (
                    <TouchableOpacity
                      key={product}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProductName(product);
                        setShowProductDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{product}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Location Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <Text style={styles.dropdownText}>
                {location || 'Select location'}
              </Text>
              <Ionicons 
                name={showLocationDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {showLocationDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {locationSuggestions.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Search Button */}
          <TouchableOpacity 
            style={[
              styles.searchButton,
              (!productName.trim() || !location.trim()) && styles.searchButtonDisabled
            ]}
            onPress={handleSearch}
            disabled={!productName.trim() || !location.trim()}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Find Suppliers Across Nigeria</Text>
          <Text style={styles.infoText}>
            Search for reliable suppliers, manufacturers, and distributors of any product across the country. Connect directly with verified businesses.
          </Text>
        </View>
      </ScrollView>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    paddingTop: 24,
    gap: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownScrollContent: {
    paddingVertical: 4,
  },
  searchButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
