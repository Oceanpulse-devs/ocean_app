import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SellerVerificationRequirements() {
  const [requirements, setRequirements] = useState({
    basic: [
      { type: 'NIN', required: true, description: 'National Identification Number' },
      { type: 'UtilityBill', required: true, description: 'Recent utility bill for address verification' },
      { type: 'DriversLicense', required: false, description: 'Driver\'s license (alternative to NIN)' }
    ],
    business: [
      { type: 'BusinessCertificate', required: true, description: 'Business registration certificate' },
      { type: 'TaxCertificate', required: true, description: 'Tax clearance certificate' },
      { type: 'BankStatement', required: true, description: 'Business bank statement (last 3 months)' }
    ],
    premium: [
      { type: 'BusinessLicense', required: true, description: 'Business operating license' },
      { type: 'InsuranceCertificate', required: true, description: 'Business insurance certificate' }
    ]
  });

  const [selectedCategory, setSelectedCategory] = useState('basic');

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

  const getCategoryInfo = (category: string) => {
    const info = {
      basic: {
        title: 'Basic Verification',
        description: 'Essential documents for individual sellers',
        color: '#3B82F6',
        benefits: [
          'Verified seller badge',
          'Enhanced product visibility',
          'Access to basic analytics',
          'Priority customer support'
        ]
      },
      business: {
        title: 'Business Verification',
        description: 'Required for business entities',
        color: '#10B981',
        benefits: [
          'All basic benefits',
          'Premium placement in search results',
          'Advanced analytics dashboard',
          'Featured seller opportunities'
        ]
      },
      premium: {
        title: 'Premium Verification',
        description: 'For established businesses',
        color: '#8B5CF6',
        benefits: [
          'All business benefits',
          'Top placement in all listings',
          'Dedicated account manager',
          'Custom reporting tools'
        ]
      }
    };
    return info[category as keyof typeof info];
  };

  const currentCategory = getCategoryInfo(selectedCategory);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Verification</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={48} color="#10B981" />
          </View>
          <Text style={styles.introTitle}>Get Verified as a Seller</Text>
          <Text style={styles.introDescription}>
            Boost your credibility and increase sales with seller verification. 
            Choose your verification level and submit the required documents.
          </Text>
        </View>

        {/* Verification Levels */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Choose Verification Level</Text>
          
          {Object.keys(requirements).map((category) => {
            const info = getCategoryInfo(category);
            const isSelected = selectedCategory === category;
            
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.levelCard,
                  isSelected && { borderColor: info.color, borderWidth: 2 }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={styles.levelHeader}>
                  <View style={[styles.levelIcon, { backgroundColor: info.color + '20' }]}>
                    <Ionicons name="shield-checkmark" size={24} color={info.color} />
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelTitle}>{info.title}</Text>
                    <Text style={styles.levelDescription}>{info.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={info.color} />
                  )}
                </View>
                
                <View style={styles.benefitsList}>
                  {info.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Ionicons name="checkmark" size={16} color={info.color} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Required Documents */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <Text style={styles.sectionSubtitle}>
            For {currentCategory.title} verification
          </Text>
          
          {requirements[selectedCategory as keyof typeof requirements].map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <Ionicons 
                  name={getDocumentIcon(doc.type) as any} 
                  size={20} 
                  color={doc.required ? "#EF4444" : "#6B7280"} 
                />
              </View>
              <View style={styles.documentInfo}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentType}>{doc.type}</Text>
                  {doc.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.documentDescription}>{doc.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Processing Info */}
        <View style={styles.processingSection}>
          <View style={styles.processingIcon}>
            <Ionicons name="time-outline" size={24} color="#6B7280" />
          </View>
          <View style={styles.processingInfo}>
            <Text style={styles.processingTitle}>Processing Time</Text>
            <Text style={styles.processingText}>5-7 business days</Text>
          </View>
        </View>

        {/* Minimum Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreIcon}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Minimum Score</Text>
            <Text style={styles.scoreText}>70% required for approval</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: currentCategory.color }]}
          onPress={() => router.push('/seller-verification-apply')}
        >
          <Text style={styles.primaryButtonText}>Start Verification</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/seller-verification-status')}
        >
          <Text style={styles.secondaryButtonText}>Check Status</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Introduction
  introSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  introIcon: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Levels Section
  levelsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  
  // Documents Section
  documentsSection: {
    marginBottom: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Processing & Score Sections
  processingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  processingIcon: {
    marginRight: 12,
  },
  processingInfo: {
    flex: 1,
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  processingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  scoreIcon: {
    marginRight: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Action Section
  actionSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
