import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AuctionCreateScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    reservePrice: '',
    minimumBidIncrement: '1.00',
    startTime: '',
    endTime: '',
    category: '',
    subcategory: '',
    condition: '',
    location: '',
    tags: '',
    shippingCost: '',
    shippingMethod: '',
    estimatedDays: '',
    returnPolicy: '',
    autoExtend: false,
    autoExtendMinutes: '5'
  });

  const categories = [
    'Electronics',
    'Jewelry',
    'Home & Garden',
    'Musical Instruments',
    'Automotive',
    'Fashion',
    'Sports',
    'Books',
    'Art & Collectibles',
    'Antiques'
  ];

  const conditions = [
    'New',
    'Like New',
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAuction = () => {
    // Validation
    if (!formData.title || !formData.description || !formData.startingPrice || 
        !formData.startTime || !formData.endTime || !formData.category || 
        !formData.condition || !formData.location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.startingPrice) <= 0) {
      Alert.alert('Invalid Price', 'Starting price must be greater than 0');
      return;
    }

    if (formData.reservePrice && parseFloat(formData.reservePrice) <= parseFloat(formData.startingPrice)) {
      Alert.alert('Invalid Reserve', 'Reserve price must be greater than starting price');
      return;
    }

    if (new Date(formData.startTime) <= new Date()) {
      Alert.alert('Invalid Start Time', 'Start time must be in the future');
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      Alert.alert('Invalid End Time', 'End time must be after start time');
      return;
    }

    Alert.alert(
      'Create Auction',
      'Are you sure you want to create this auction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            // Mock auction creation
            Alert.alert('Success', 'Auction created successfully!', [
              {
                text: 'OK',
                onPress: () => router.push('/auctions')
              }
            ]);
          }
        }
      ]
    );
  };

  const renderInputField = (
    label: string,
    field: string,
    placeholder: string,
    required: boolean = false,
    multiline: boolean = false,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={formData[field as keyof typeof formData]}
        onChangeText={(value) => handleInputChange(field, value)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderDropdownField = (
    label: string,
    field: string,
    options: string[],
    required: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity style={styles.dropdownInput}>
        <Text style={[
          styles.dropdownText,
          !formData[field as keyof typeof formData] && styles.placeholderText
        ]}>
          {formData[field as keyof typeof formData] || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Create Auction</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleCreateAuction}
        >
          <Text style={styles.saveButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderInputField('Auction Title', 'title', 'Enter auction title', true)}
          {renderInputField('Description', 'description', 'Describe your item in detail', true, true)}
          
          <View style={styles.row}>
            {renderInputField('Starting Price', 'startingPrice', '0.00', true, false, 'numeric')}
            {renderInputField('Reserve Price', 'reservePrice', '0.00 (optional)', false, false, 'numeric')}
          </View>
          
          {renderInputField('Minimum Bid Increment', 'minimumBidIncrement', '1.00', false, false, 'numeric')}
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auction Timing</Text>
          
          <View style={styles.row}>
            {renderInputField('Start Time', 'startTime', 'YYYY-MM-DD HH:MM', true)}
            {renderInputField('End Time', 'endTime', 'YYYY-MM-DD HH:MM', true)}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Auto-Extend</Text>
              <Text style={styles.switchDescription}>
                Automatically extend auction if bids are placed in the last few minutes
              </Text>
            </View>
            <Switch
              value={formData.autoExtend}
              onValueChange={(value) => handleInputChange('autoExtend', value.toString())}
              trackColor={{ false: '#E5E7EB', true: '#6B46C1' }}
              thumbColor={formData.autoExtend ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {formData.autoExtend && (
            renderInputField('Auto-Extend Minutes', 'autoExtendMinutes', '5', false, false, 'numeric')
          )}
        </View>

        {/* Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          {renderDropdownField('Category', 'category', categories, true)}
          {renderInputField('Subcategory', 'subcategory', 'Enter subcategory (optional)')}
          {renderDropdownField('Condition', 'condition', conditions, true)}
          {renderInputField('Location', 'location', 'Enter your location', true)}
          {renderInputField('Tags', 'tags', 'Enter tags separated by commas')}
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.row}>
            {renderInputField('Shipping Cost', 'shippingCost', '0.00', false, false, 'numeric')}
            {renderInputField('Estimated Days', 'estimatedDays', '3-5 days', false, false, 'numeric')}
          </View>
          
          {renderInputField('Shipping Method', 'shippingMethod', 'e.g., Standard Shipping, Express')}
          {renderInputField('Return Policy', 'returnPolicy', 'Describe your return policy', false, true)}
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.sectionDescription}>
            Add up to 10 images of your item. First image will be the main photo.
          </Text>
          
          <TouchableOpacity style={styles.imageUploadArea}>
            <Ionicons name="camera-outline" size={48} color="#6B46C1" />
            <Text style={styles.uploadText}>Add Images</Text>
            <Text style={styles.uploadSubtext}>Tap to upload photos</Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            By creating this auction, you agree to our Terms of Service and Auction Rules. 
            You are responsible for accurately describing your item and fulfilling the sale 
            if the auction is successful.
          </Text>
        </View>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Input Fields
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
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
  placeholderText: {
    color: '#9CA3AF',
  },
  
  // Row Layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  
  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Image Upload
  imageUploadArea: {
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Terms
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
