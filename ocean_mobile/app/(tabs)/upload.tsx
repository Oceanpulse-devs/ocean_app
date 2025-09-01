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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function UploadScreen() {
  const params = useLocalSearchParams();
  const [selectedUploadType, setSelectedUploadType] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFeedSubSelection, setShowFeedSubSelection] = useState(false);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('seller'); // Mock user type

  // Handle query parameter for direct navigation to product form
  useEffect(() => {
    if (params.type === 'product') {
      const productOption = uploadOptions.find(option => option.id === 'product');
      if (productOption) {
        handleUploadOptionPress(productOption);
      }
    }
  }, [params.type]);

  // Upload options configuration
  const uploadOptions = [
    {
      id: 'feed-post',
      title: 'Post to Feed',
      description: 'Share what you\'re looking for or selling',
      icon: 'chatbubble-outline',
      color: '#3B82F6',
      availableFor: ['buyer', 'seller'],
      category: 'Social',
    },
    {
      id: 'product',
      title: 'List Product',
      description: 'Add a new product to the marketplace',
      icon: 'cube-outline',
      color: '#10B981',
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
      color: '#8B5CF6',
      availableFor: ['buyer', 'seller'],
      category: 'Trading',
    },
    {
      id: 'bulk-purchase',
      title: 'Bulk Purchase',
      description: 'Join group buying for better prices',
      icon: 'people-outline',
      color: '#F59E0B',
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

    // Special handling for feed posts - show sub-selection
    if (option.id === 'feed-post') {
      setShowFeedSubSelection(true);
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

  const handleFeedSubSelection = (feedType: 'buyer' | 'seller') => {
    setShowFeedSubSelection(false);
    setSelectedUploadType(`feed-post-${feedType}`);
    setShowUploadModal(true);
  };

  const handleUpload = () => {
    // Mock upload logic
    Alert.alert('Success', `${selectedUploadType} uploaded successfully!`);
    setShowUploadModal(false);
    setSelectedUploadType(null);
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

  const renderFeedSubSelection = () => {
    if (!showFeedSubSelection) return null;

    return (
      <Modal
        visible={showFeedSubSelection}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFeedSubSelection(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Post to Feed</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.subSelectionContent}>
            <Text style={styles.subSelectionTitle}>What type of post?</Text>
            <Text style={styles.subSelectionDescription}>
              Choose the type of content you want to share with the community.
            </Text>

            <View style={styles.subSelectionOptions}>
              <TouchableOpacity
                style={styles.subSelectionOption}
                onPress={() => handleFeedSubSelection('buyer')}
              >
                <View style={[styles.subSelectionIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="search-outline" size={32} color="#3B82F6" />
                </View>
                <View style={styles.subSelectionContent}>
                  <Text style={styles.subSelectionOptionTitle}>Looking for...</Text>
                  <Text style={styles.subSelectionOptionDescription}>
                    Post a request for something you need or want to buy
                  </Text>
                  <View style={styles.subSelectionFeatures}>
                    <Text style={styles.subSelectionFeature}>• Text-based request</Text>
                    <Text style={styles.subSelectionFeature}>• Optional images</Text>
                    <Text style={styles.subSelectionFeature}>• Contact buyer actions</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subSelectionOption}
                onPress={() => handleFeedSubSelection('seller')}
              >
                <View style={[styles.subSelectionIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="storefront-outline" size={32} color="#10B981" />
                </View>
                <View style={styles.subSelectionContent}>
                  <Text style={styles.subSelectionOptionTitle}>Selling...</Text>
                  <Text style={styles.subSelectionOptionDescription}>
                    Post a product or service you want to sell
                  </Text>
                  <View style={styles.subSelectionFeatures}>
                    <Text style={styles.subSelectionFeature}>• Product images</Text>
                    <Text style={styles.subSelectionFeature}>• Price information</Text>
                    <Text style={styles.subSelectionFeature}>• Message seller actions</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderUploadModal = () => {
    if (!selectedUploadType) return null;

    // Handle feed post sub-types
    let option;
    if (selectedUploadType.startsWith('feed-post-')) {
      const feedType = selectedUploadType.split('-')[2];
      option = {
        id: selectedUploadType,
        title: feedType === 'buyer' ? 'Looking for...' : 'Selling...',
        description: feedType === 'buyer' 
          ? 'Post a request for something you need or want to buy'
          : 'Post a product or service you want to sell',
        icon: feedType === 'buyer' ? 'search-outline' : 'storefront-outline',
        color: feedType === 'buyer' ? '#3B82F6' : '#10B981',
      };
    } else {
      option = uploadOptions.find(opt => opt.id === selectedUploadType);
    }
    
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
              <Text style={styles.previewTitle}>Ready to {option.title.toLowerCase()}?</Text>
              <Text style={styles.previewDescription}>
                {option.description}
              </Text>
            </View>

            {/* Upload Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Upload Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Enter ${option.title.toLowerCase()} title`}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your item or request..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {selectedUploadType.startsWith('feed-post-seller') && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="₦0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TouchableOpacity style={styles.categorySelector}>
                      <Text style={styles.categorySelectorText}>Select Category</Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {selectedUploadType.startsWith('feed-post-buyer') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Budget Range (Optional)</Text>
                  <View style={styles.budgetRow}>
                    <TextInput
                      style={[styles.textInput, styles.budgetInput]}
                      placeholder="Min ₦0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <Text style={styles.budgetSeparator}>to</Text>
                    <TextInput
                      style={[styles.textInput, styles.budgetInput]}
                      placeholder="Max ₦0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {!selectedUploadType.startsWith('feed-post') && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="₦0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TouchableOpacity style={styles.categorySelector}>
                      <Text style={styles.categorySelectorText}>Select Category</Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Add Photos</Text>
                <TouchableOpacity style={styles.photoUpload}>
                  <Ionicons name="camera-outline" size={32} color="#6B7280" />
                  <Text style={styles.photoUploadText}>Tap to add photos</Text>
                  <Text style={styles.photoUploadSubtext}>Up to 10 images</Text>
                </TouchableOpacity>
              </View>

              {selectedUploadType === 'auction' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Auction Duration</Text>
                  <TouchableOpacity style={styles.categorySelector}>
                    <Text style={styles.categorySelectorText}>7 days</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              )}

              {selectedUploadType === 'distress' && (
                <View style={styles.distressWarning}>
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={styles.distressWarningText}>
                    Distress sales are for urgent items only. These listings will be highlighted and prioritized in search results.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: option.color }]}
              onPress={handleUpload}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload {option.title}</Text>
            </TouchableOpacity>
          </View>
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

      {renderFeedSubSelection()}
      {renderUploadModal()}
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
});