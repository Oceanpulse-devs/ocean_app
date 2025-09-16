import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

export default function BulkPurchaseUploadScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = async () => {
    // Validation
    if (!searchQuery.trim() && !productName.trim()) {
      Alert.alert('Error', 'Please enter a search query or product name');
      return;
    }

    try {
      setIsLoading(true);

      const bulkPurchaseData = {
        searchQuery: searchQuery.trim(),
        category: selectedCategory,
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        userId: user?.id
      };

      const response = await apiService.post('/api/group-buys/create', bulkPurchaseData);
      
      Alert.alert('Success', 'Bulk purchase request created successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/bulk-purchase-product')
        }
      ]);

    } catch (error) {
      console.error('Bulk purchase creation error:', error);
      Alert.alert('Error', 'Failed to create bulk purchase request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = () => {
    Alert.alert('Upload Image', 'Image upload functionality would be implemented here');
  };

  const handleVideoUpload = () => {
    Alert.alert('Upload Video', 'Video upload functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
        >
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>Bulk Purchase</Text>
        
        {/* Instructions */}
        <Text style={styles.instructions}>
          Please Upload an image and a video of product
        </Text>

        {/* Upload Areas */}
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadArea} onPress={handleImageUpload}>
            <Ionicons name="add" size={48} color="#6B46C1" />
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadArea} onPress={handleVideoUpload}>
            <Ionicons name="add" size={48} color="#6B46C1" />
            <Text style={styles.uploadText}>Upload Video</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for product"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#6B46C1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Or Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Category</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>
                {selectedCategory || 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name of product</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter product name"
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description of product</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe the product you want to buy in bulk..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={productDescription}
              onChangeText={setProductDescription}
            />
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity 
          style={[styles.searchButton, isLoading && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  
  // Upload Areas
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  uploadArea: {
    width: '48%',
    height: 120,
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
    marginTop: 8,
  },
  
  // Search Bar
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    padding: 4,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  
  // Form
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  
  // Search Button
  searchButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
