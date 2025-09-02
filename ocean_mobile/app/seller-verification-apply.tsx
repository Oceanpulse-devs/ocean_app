import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SellerVerificationApply() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    country: 'Nigeria',
    state: '',
    category: 'basic',
  });

  const [selectedDocumentType, setSelectedDocumentType] = useState('NIN');
  const [currentDocument, setCurrentDocument] = useState({
    type: 'NIN',
    documentNumber: '',
    documentImage: '',
    documentBackImage: '',
    documentExpiryDate: '',
    documentIssuingAuthority: '',
    documentCountry: 'Nigeria',
    status: 'pending'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa'];
  const states = {
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Ogun', 'Kaduna', 'Katsina', 'Oyo', 'Anambra', 'Edo'],
    'Ghana': ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State']
  };

  const categories = [
    { value: 'basic', label: 'Basic Verification', description: 'Individual sellers' },
    { value: 'business', label: 'Business Verification', description: 'Business entities' },
    { value: 'premium', label: 'Premium Verification', description: 'Established businesses' }
  ];

  const documentTypes = {
    'NIN': 'National Identification Number',
    'UtilityBill': 'Utility Bill',
    'DriversLicense': 'Driver\'s License',
    'BusinessCertificate': 'Business Certificate',
    'TaxCertificate': 'Tax Certificate',
    'BankStatement': 'Bank Statement',
    'BusinessLicense': 'Business License',
    'InsuranceCertificate': 'Insurance Certificate'
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCurrentDocument = (field: string, value: string) => {
    setCurrentDocument(prev => ({ ...prev, [field]: value }));
  };

  const selectDocumentType = (type: string) => {
    setSelectedDocumentType(type);
    setCurrentDocument(prev => ({ ...prev, type }));
  };

  const nextStep = () => {
    console.log('Next step clicked, current step:', currentStep);
    console.log('Validation result:', validateCurrentStep());
    console.log('Form data:', formData);
    
    if (currentStep < totalSteps && validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      // Close any open dropdowns
      setShowCountryDropdown(false);
      setShowStateDropdown(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = formData.businessName.trim() !== '' && 
                 formData.businessAddress.trim() !== '' && 
                 formData.state.trim() !== '';
        break;
      case 2:
        isValid = currentDocument.documentNumber.trim() !== '';
        console.log('Step 2 validation:', {
          documentNumber: currentDocument.documentNumber,
          isValid: isValid
        });
        break;
      case 3:
        isValid = true; // Review step
        break;
      default:
        isValid = false;
    }
    console.log(`Step ${currentStep} validation result:`, isValid);
    return isValid;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.businessName || !formData.businessAddress || !formData.state) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!currentDocument.documentNumber) {
      Alert.alert('Error', 'Please enter the document number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success!', 
        'Your verification application has been submitted successfully. You will receive a response within 5-7 business days.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/seller-verification-status')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'NIN': 'card-outline',
      'UtilityBill': 'receipt-outline',
      'DriversLicense': 'car-outline',
      'BusinessCertificate': 'business-outline',
      'TaxCertificate': 'document-text-outline',
      'BankStatement': 'card-outline',
      'BusinessLicense': 'shield-checkmark-outline',
      'InsuranceCertificate': 'umbrella-outline'
    };
    return icons[type] || 'document-outline';
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Business Information',
      2: 'Required Documents',
      3: 'Review & Submit'
    };
    return titles[currentStep as keyof typeof titles];
  };

  const getStepDescription = () => {
    const descriptions = {
      1: 'Tell us about your business',
      2: 'Upload your verification documents',
      3: 'Review your application before submitting'
    };
    return descriptions[currentStep as keyof typeof descriptions];
  };

  const selectCountry = (country: string) => {
    setFormData(prev => ({ ...prev, country, state: '' }));
    setShowCountryDropdown(false);
  };

  const selectState = (state: string) => {
    setFormData(prev => ({ ...prev, state }));
    setShowStateDropdown(false);
  };

  const closeDropdowns = () => {
    setShowCountryDropdown(false);
    setShowStateDropdown(false);
  };

  // Debug effect to monitor document number changes
  useEffect(() => {
    console.log('Document number changed:', currentDocument.documentNumber);
    console.log('Current step:', currentStep);
    console.log('Validation result:', validateCurrentStep());
  }, [currentDocument.documentNumber, currentStep]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getStepDescription()}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <TouchableOpacity 
        style={styles.content} 
        activeOpacity={1} 
        onPress={closeDropdowns}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              value={formData.businessName}
              onChangeText={(value) => updateFormData('businessName', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your business address"
              value={formData.businessAddress}
              onChangeText={(value) => updateFormData('businessAddress', value)}
              multiline
              numberOfLines={3}
            />
          </View>

                     <View style={styles.row}>
             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
               <Text style={styles.label}>Country *</Text>
               <TouchableOpacity 
                 style={styles.pickerContainer}
                 onPress={(e) => {
                   e.stopPropagation();
                   setShowCountryDropdown(!showCountryDropdown);
                 }}
               >
                 <Text style={styles.pickerText}>{formData.country}</Text>
                 <Ionicons name="chevron-down" size={20} color="#6B7280" />
               </TouchableOpacity>
               
               {showCountryDropdown && (
                 <View style={styles.dropdownList}>
                   <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                     {countries.map((country) => (
                       <TouchableOpacity
                         key={country}
                         style={styles.dropdownItem}
                         onPress={(e) => {
                           e.stopPropagation();
                           selectCountry(country);
                         }}
                       >
                         <Text style={styles.dropdownItemText}>{country}</Text>
                         {formData.country === country && (
                           <Ionicons name="checkmark" size={16} color="#6B46C1" />
                         )}
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>

             <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
               <Text style={styles.label}>State *</Text>
               <TouchableOpacity 
                 style={styles.pickerContainer}
                 onPress={(e) => {
                   e.stopPropagation();
                   setShowStateDropdown(!showStateDropdown);
                 }}
               >
                 <Text style={styles.pickerText}>{formData.state || 'Select State'}</Text>
                 <Ionicons name="chevron-down" size={20} color="#6B7280" />
               </TouchableOpacity>
               
               {showStateDropdown && (
                 <View style={styles.dropdownList}>
                   <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                     {states[formData.country as keyof typeof states]?.map((state) => (
                       <TouchableOpacity
                         key={state}
                         style={styles.dropdownItem}
                         onPress={(e) => {
                           e.stopPropagation();
                           selectState(state);
                         }}
                       >
                         <Text style={styles.dropdownItemText}>{state}</Text>
                         {formData.state === state && (
                           <Ionicons name="checkmark" size={16} color="#6B46C1" />
                         )}
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>
           </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryOption,
                    formData.category === category.value && styles.categoryOptionSelected
                  ]}
                  onPress={() => updateFormData('category', category.value)}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={[
                      styles.categoryLabel,
                      formData.category === category.value && styles.categoryLabelSelected
                    ]}>
                      {category.label}
                    </Text>
                    <Text style={[
                      styles.categoryDescription,
                      formData.category === category.value && styles.categoryDescriptionSelected
                    ]}>
                      {category.description}
                    </Text>
                  </View>
                  {formData.category === category.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
                         </View>
           </View>
          </View>
        )}

        {/* Step 2: Document Selection & Upload */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Document to Upload</Text>
            <Text style={styles.sectionDescription}>
              Choose one document to submit for verification. You can submit additional documents later.
            </Text>

            {/* Document Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Type *</Text>
              <View style={styles.documentTypeGrid}>
                {Object.keys(documentTypes).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.documentTypeOption,
                      selectedDocumentType === type && styles.documentTypeOptionSelected
                    ]}
                    onPress={() => selectDocumentType(type)}
                  >
                    <View style={styles.documentTypeIcon}>
                      <Ionicons 
                        name={getDocumentIcon(type) as any} 
                        size={24} 
                        color={selectedDocumentType === type ? "#6B46C1" : "#6B7280"} 
                      />
                    </View>
                    <Text style={[
                      styles.documentTypeLabel,
                      selectedDocumentType === type && styles.documentTypeLabelSelected
                    ]}>
                      {documentTypes[type as keyof typeof documentTypes]}
                    </Text>
                    {selectedDocumentType === type && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={16} color="#6B46C1" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Document Details Form */}
            <View style={styles.documentForm}>
              <View style={styles.documentHeader}>
                <View style={styles.documentIcon}>
                  <Ionicons name={getDocumentIcon(currentDocument.type) as any} size={20} color="#6B46C1" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentType}>{documentTypes[currentDocument.type as keyof typeof documentTypes]}</Text>
                  <Text style={styles.documentSubtext}>Document Details</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Document Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter document number"
                  value={currentDocument.documentNumber}
                  onChangeText={(value) => updateCurrentDocument('documentNumber', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Issuing Authority</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., FRSC, INEC, etc."
                  value={currentDocument.documentIssuingAuthority}
                  onChangeText={(value) => updateCurrentDocument('documentIssuingAuthority', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={currentDocument.documentExpiryDate}
                  onChangeText={(value) => updateCurrentDocument('documentExpiryDate', value)}
                />
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.label}>Document Images *</Text>
                <Text style={styles.uploadDescription}>
                  Upload clear photos of your document. Front image is required.
                </Text>
                <View style={styles.uploadButtons}>
                  <TouchableOpacity style={styles.uploadButton}>
                    <Ionicons name="camera" size={20} color="#6B46C1" />
                    <Text style={styles.uploadButtonText}>Front Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton}>
                    <Ionicons name="camera" size={20} color="#6B46C1" />
                    <Text style={styles.uploadButtonText}>Back Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Review Section */}
        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Your Application</Text>
            
            {/* Business Info Review */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Business Information</Text>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Business Name:</Text>
                <Text style={styles.reviewValue}>{formData.businessName}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Address:</Text>
                <Text style={styles.reviewValue}>{formData.businessAddress}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={styles.reviewValue}>{formData.state}, {formData.country}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Category:</Text>
                <Text style={styles.reviewValue}>{categories.find(c => c.value === formData.category)?.label}</Text>
              </View>
            </View>

            {/* Document Review */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Document Submitted</Text>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Document Type:</Text>
                <Text style={styles.reviewValue}>{documentTypes[currentDocument.type as keyof typeof documentTypes]}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Document Number:</Text>
                <Text style={styles.reviewValue}>{currentDocument.documentNumber || 'Not provided'}</Text>
              </View>
              {currentDocument.documentIssuingAuthority && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Issuing Authority:</Text>
                  <Text style={styles.reviewValue}>{currentDocument.documentIssuingAuthority}</Text>
                </View>
              )}
              {currentDocument.documentExpiryDate && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Expiry Date:</Text>
                  <Text style={styles.reviewValue}>{currentDocument.documentExpiryDate}</Text>
                </View>
              )}
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsSection}>
              <View style={styles.termsRow}>
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <Text style={styles.termsText}>
                  By submitting this application, you agree to our verification terms and conditions.
                  All documents will be reviewed by our admin team within 5-7 business days.
                </Text>
              </View>
            </View>
          </View>
        )}
        </ScrollView>
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <View style={styles.actionSection}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={prevStep}
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.spacer} />
          
          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={[
                styles.nextButton,
                !validateCurrentStep() && styles.nextButtonDisabled
              ]}
              onPress={nextStep}
              disabled={!validateCurrentStep()}
            >
              <Text style={[
                styles.nextButtonText,
                !validateCurrentStep() && styles.nextButtonTextDisabled
              ]}>Next</Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={validateCurrentStep() ? "#FFFFFF" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerRight: {
    width: 40,
  },
  
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 20,
    lineHeight: 20,
  },
  
  // Form Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  
  // Picker
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  
  // Dropdown
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
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Category Selection
  categoryContainer: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  categoryLabelSelected: {
    color: '#10B981',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryDescriptionSelected: {
    color: '#059669',
  },
  
  // Document Type Selection
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentTypeOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    position: 'relative',
  },
  documentTypeOptionSelected: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3F4F6',
  },
  documentTypeIcon: {
    marginBottom: 8,
  },
  documentTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  documentTypeLabelSelected: {
    color: '#6B46C1',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Document Form
  documentForm: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  
  documentCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  documentSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Upload Section
  uploadSection: {
    marginTop: 8,
  },
  uploadDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Terms
  termsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  
  // Review Section
  reviewSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  
  // Action Section
  actionSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#6B46C1',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
