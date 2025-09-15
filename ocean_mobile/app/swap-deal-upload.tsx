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

export default function SwapDealUploadScreen() {
  const { user } = useAuth();
  const [productToSwap, setProductToSwap] = useState('');
  const [categoryToSwap, setCategoryToSwap] = useState('');
  const [brandToSwap, setBrandToSwap] = useState('');
  const [description, setDescription] = useState('');
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

  const handleUpload = async () => {
    // Validation
    if (!productToSwap.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!categoryToSwap) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    try {
      setIsLoading(true);

      const swapDealData = {
        productToSwap: productToSwap.trim(),
        categoryToSwap,
        brandToSwap: brandToSwap.trim(),
        description: description.trim(),
        userId: user?.id
      };

      const response = await apiService.post('/api/swap-deals/create', swapDealData);
      
      Alert.alert('Success', 'Swap deal uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/swap-deal-vendors')
        }
      ]);

    } catch (error) {
      console.error('Swap deal creation error:', error);
      Alert.alert('Error', 'Failed to create swap deal. Please try again.');
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
        <Text style={styles.title}>Swap Deals</Text>
        
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

        {/* Supported Formats */}
        <Text style={styles.supportedFormats}>
          Supported format is jpg, png and mp4
        </Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product to be swapped</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter product name"
              placeholderTextColor="#9CA3AF"
              value={productToSwap}
              onChangeText={setProductToSwap}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category of item to swap to</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>
                {categoryToSwap || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brand to be swapped to</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter brand name"
              placeholderTextColor="#9CA3AF"
              value={brandToSwap}
              onChangeText={setBrandToSwap}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description: Issues with the product</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe any issues or reasons for swapping..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Swap Deal</Text>
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
    marginBottom: 16,
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
  supportedFormats: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
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
  
  // Submit Button
  submitButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
