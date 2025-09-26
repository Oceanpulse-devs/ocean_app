import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export default function UploadScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [selectedUploadType, setSelectedUploadType] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('seller');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    images: []
  });

  // Fetch categories and determine user type
  useEffect(() => {
    fetchCategories();
    determineUserType();
  }, []);

  // Handle query parameter for direct navigation to product form
  useEffect(() => {
    if (params.type === 'product') {
      const productOption = uploadOptions.find(option => option.id === 'product');
      if (productOption) {
        handleUploadOptionPress(productOption);
      }
    }
  }, [params.type]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Image picker functions
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => {
          console.log('Picked asset:', asset);
          return {
            uri: asset.uri,
            type: 'image',
            name: asset.fileName || `image_${Date.now()}.jpg`
          };
        });
        
        console.log('New images to add:', newImages);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImage = {
          uri: result.assets[0].uri,
          type: 'image',
          name: `photo_${Date.now()}.jpg`
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const showImagePicker = () => {
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategoryPicker(false);
  };

  const determineUserType = () => {
    if (user?.role === 'seller' || user?.role === 'pending-seller') {
      setUserType('seller');
    } else {
      setUserType('buyer');
    }
  };

  // Upload options configuration
  const uploadOptions = [
    {
      id: 'feed-post',
      title: 'Create Post',
      description: 'Share your thoughts with the community',
      icon: 'add-circle-outline',
      color: '#3B82F6',
      availableFor: ['buyer', 'seller'],
      category: 'Social',
    },
    {
      id: 'product',
      title: 'List Product',
      description: 'Add a new product to the marketplace',
      icon: 'cube-outline',
      color: '#8B5CF6',
      availableFor: ['seller'],
      category: 'Selling',
    },
    {
      id: 'distress',
      title: 'Distress Sale',
      description: 'List urgent items that need quick sale',
      icon: 'flame-outline',
      color: '#EF4444',
      availableFor: ['seller'],
      category: 'Selling',
    },
    {
      id: 'swap-deal',
      title: 'Swap Deal',
      description: 'Exchange your product for something else',
      icon: 'swap-horizontal-outline',
      color: '#F59E0B',
      availableFor: ['buyer', 'seller'],
      category: 'Trading',
    },
    {
      id: 'bulk-purchase',
      title: 'Bulk Purchase',
      description: 'Join group buying for better prices',
      icon: 'people-outline',
      color: '#06B6D4',
      availableFor: ['buyer', 'seller'],
      category: 'Trading',
    },
    {
      id: 'auction',
      title: 'Create Auction',
      description: 'Start a competitive bidding auction',
      icon: 'hammer-outline',
      color: '#DC2626',
      availableFor: ['seller'],
      category: 'Selling',
    },
  ];

  const handleUploadOptionPress = (option: any) => {
    if (!option.availableFor.includes(userType)) {
      Alert.alert(
        'Access Restricted',
        'This feature is only available for verified sellers. Upgrade your account to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Account', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }

    // Special handling for swap deals - navigate to swap deal upload
    if (option.id === 'swap-deal') {
      router.push('/swap-deal-upload');
      return;
    }

    // Special handling for bulk purchase - navigate to bulk purchase upload
    if (option.id === 'bulk-purchase') {
      router.push('/bulk-purchase-upload');
      return;
    }

    // Special handling for auction - navigate to auction create
    if (option.id === 'auction') {
      router.push('/auction-create');
      return;
    }

    setSelectedUploadType(option.id);
    setShowUploadModal(true);
  };


  const handleUpload = async () => {
    try {
      setIsLoading(true);

      // Validate form data
      if (!formData.content.trim()) {
        Alert.alert('Error', 'Content is required');
        setIsLoading(false);
        return;
      }

      let response;
      
      if (selectedUploadType === 'feed-post') {
        // Unified feed post logic - choose route based on whether images are present
        if (formData.images.length > 0) {
          // Use FormData route for posts with images
          console.log('Using FormData route for post with images');
          console.log('Images to upload:', formData.images);
          
          const formDataToSend = new FormData();
          formDataToSend.append('content', formData.content);
          
          // Add images
          formData.images.forEach((image, index) => {
            console.log(`Adding image ${index}:`, {
              uri: image.uri,
              name: image.name,
              type: 'image/jpeg'
            });
            
            // React Native FormData format
            const fileObject = {
              uri: image.uri,
              type: 'image/jpeg',
              name: image.name || `image_${index}.jpg`
            };
            
            console.log('File object to append:', fileObject);
            console.log('File URI:', image.uri);
            console.log('File URI type:', typeof image.uri);
            console.log('File URI starts with file://', image.uri.startsWith('file://'));
            
            formDataToSend.append('media', fileObject);
          });

          console.log('FormData prepared, sending to /api/posts');
          
          // Try with explicit headers for React Native
          try {
            response = await apiService.post('/api/posts', formDataToSend, {
              headers: {
                'Accept': 'application/json',
              }
            });
          } catch (error) {
            console.error('FormData upload failed, trying alternative approach:', error);
            
            // Fallback: Try without explicit headers
            response = await apiService.post('/api/posts', formDataToSend);
          }
        } else {
          // Use JSON route for text-only posts
          console.log('Using JSON route for text-only post');
          
          response = await apiService.post('/api/posts/text', {
            content: formData.content
          });
        }
      } else if (selectedUploadType === 'product') {
        Alert.alert('Error', 'Product upload not implemented yet');
        setIsLoading(false);
        return;
      } else if (selectedUploadType === 'distress') {
        Alert.alert('Error', 'Distress sale upload not implemented yet');
        setIsLoading(false);
        return;
      } else {
        Alert.alert('Error', 'Upload type not supported yet');
        setIsLoading(false);
        return;
      }

      Alert.alert('Success', 'Post uploaded successfully!');
      setShowUploadModal(false);
      setSelectedUploadType(null);
      setFormData({
        content: '',
        images: []
      });

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadOption = (option: any) => {
    const isAvailable = option.availableFor.includes(userType);
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.uploadOption,
          !isAvailable && styles.uploadOptionDisabled
        ]}
        onPress={() => handleUploadOptionPress(option)}
        disabled={!isAvailable}
      >
        <View style={[styles.uploadIcon, { backgroundColor: option.color + '20' }]}>
          <Ionicons 
            name={option.icon as any} 
            size={32} 
            color={isAvailable ? option.color : '#9CA3AF'} 
          />
        </View>
        
        <View style={styles.uploadContent}>
          <View style={styles.uploadHeader}>
            <Text style={[
              styles.uploadTitle,
              !isAvailable && styles.uploadTitleDisabled
            ]}>
              {option.title}
            </Text>
            {!isAvailable && (
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
            )}
          </View>
          
          <Text style={[
            styles.uploadDescription,
            !isAvailable && styles.uploadDescriptionDisabled
          ]}>
            {option.description}
          </Text>
          
          <View style={styles.uploadMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: option.color + '20' }]}>
              <Text style={[styles.categoryText, { color: option.color }]}>
                {option.category}
              </Text>
            </View>
            {!isAvailable && (
              <Text style={styles.restrictionText}>Seller Only</Text>
            )}
          </View>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isAvailable ? "#6B7280" : "#9CA3AF"} 
        />
      </TouchableOpacity>
    );
  };


  const renderUploadModal = () => {
    if (!selectedUploadType) return null;

    const option = uploadOptions.find(opt => opt.id === selectedUploadType);
    if (!option) return null;

    return (
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{option.title}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.uploadPreview}>
              <View style={[styles.previewIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={48} color={option.color} />
              </View>
              <Text style={styles.previewTitle}>Ready to create your post?</Text>
              <Text style={styles.previewDescription}>
                {option.description}
              </Text>
            </View>

            {/* Upload Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Create Post</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What's on your mind? *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Share your thoughts with the community..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  value={formData.content}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
                />
              </View>

              {selectedUploadType === 'feed-post' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Add Photos (Optional)</Text>
                  <TouchableOpacity style={styles.photoUpload} onPress={showImagePicker}>
                    <Ionicons name="camera-outline" size={32} color="#6B7280" />
                    <Text style={styles.photoUploadText}>Tap to add photos</Text>
                    <Text style={styles.photoUploadSubtext}>Up to 10 images</Text>
                  </TouchableOpacity>
                  
                  {formData.images.length > 0 && (
                    <View style={styles.imagePreviewContainer}>
                      {formData.images.map((image, index) => (
                        <View key={index} style={styles.imagePreview}>
                          <Image source={{ uri: image.uri }} style={styles.previewImage} />
                          <TouchableOpacity 
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.uploadButton, 
                { backgroundColor: option.color },
                isLoading && styles.uploadButtonDisabled
              ]}
              onPress={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.uploadButtonText}>
                {isLoading ? 'Uploading...' : 'Create Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCategoryPicker = () => {
    if (!showCategoryPicker) return null;

    return (
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Category</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.categoryList}>
              {categories.map((category: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(category.name || category)}
                >
                  <Text style={styles.categoryItemText}>
                    {category.name || category}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload</Text>
        <View style={styles.userTypeIndicator}>
          <Ionicons 
            name={userType === 'seller' ? "storefront" : "person"} 
            size={20} 
            color="#6B46C1" 
          />
          <Text style={styles.userTypeText}>
            {userType === 'seller' ? 'Seller' : 'Buyer'}
          </Text>
        </View>
      </View>

      {/* Upload Options */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you like to upload?</Text>
          <Text style={styles.sectionDescription}>
            Choose the type of content you want to share with the Ocean community.
          </Text>
        </View>

        <View style={styles.uploadOptions}>
          {uploadOptions.map(renderUploadOption)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="scan-outline" size={24} color="#6B46C1" />
            <Text style={styles.quickActionText}>Scan Barcode</Text>
            <Text style={styles.quickActionSubtext}>Quick product lookup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="copy-outline" size={24} color="#6B46C1" />
            <Text style={styles.quickActionText}>Copy from Draft</Text>
            <Text style={styles.quickActionSubtext}>Continue previous upload</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={24} color="#6B46C1" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Learn about different upload types and how to create effective listings.
              </Text>
            </View>
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderUploadModal()}
      {renderCategoryPicker()}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  userTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  
  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Upload Options
  uploadOptions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadOptionDisabled: {
    opacity: 0.6,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  uploadContent: {
    flex: 1,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  uploadTitleDisabled: {
    color: '#9CA3AF',
  },
  lockIcon: {
    marginLeft: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  uploadDescriptionDisabled: {
    color: '#9CA3AF',
  },
  uploadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  restrictionText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
  },
  
  // Help Section
  helpSection: {
    padding: 20,
    paddingTop: 0,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  helpButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  
  modalContent: {
    flex: 1,
  },
  uploadPreview: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Form
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
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
  categorySelector: {
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
  categorySelectorText: {
    fontSize: 16,
    color: '#1F2937',
  },
  photoUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  photoUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  photoUploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  distressWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  distressWarningText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  
  // Modal Footer
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Sub-selection styles
  subSelectionContent: {
    flex: 1,
    padding: 20,
  },
  subSelectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subSelectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 20,
  },
  subSelectionOptions: {
    gap: 16,
  },
  subSelectionOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subSelectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subSelectionOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subSelectionOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  subSelectionFeatures: {
    gap: 4,
  },
  subSelectionFeature: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Budget input styles
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetSeparator: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Image Upload Styles
  imageUploadContainer: {
    marginTop: 8,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  imagePreview: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  
  // Category Picker Styles
  categoryList: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
});