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

export default function SellerVerificationStatus() {
  const [verificationData, setVerificationData] = useState({
    verificationStatus: 'pending', // pending, approved, rejected, suspended
    verificationScore: 45,
    verificationLevel: 'basic',
    businessName: 'Tech Solutions NG',
    submittedAt: '2024-01-15',
    lastChecked: '2024-01-20',
    verificationExpiresAt: null,
    documentsSubmitted: 3,
    documentsApproved: 1,
    benefits: [
      'Verified seller badge',
      'Enhanced product visibility',
      'Access to basic analytics',
      'Priority customer support'
    ],
    nextSteps: [
      'Submit additional required documents',
      'Wait for admin review (5-7 business days)'
    ],
    documents: [
      {
        id: '1',
        type: 'NIN',
        status: 'approved',
        submittedAt: '2024-01-15',
        verifiedAt: '2024-01-18',
        documentScore: 25,
        verificationNotes: 'Document verified successfully'
      },
      {
        id: '2',
        type: 'UtilityBill',
        status: 'pending',
        submittedAt: '2024-01-15',
        verifiedAt: null,
        documentScore: 0,
        verificationNotes: null
      },
      {
        id: '3',
        type: 'BusinessCertificate',
        status: 'rejected',
        submittedAt: '2024-01-15',
        verifiedAt: '2024-01-19',
        documentScore: 0,
        verificationNotes: 'Document is unclear. Please resubmit with better quality image.'
      }
    ]
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': '#F59E0B',
      'approved': '#10B981',
      'rejected': '#EF4444',
      'suspended': '#6B7280'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'pending': 'time-outline',
      'approved': 'checkmark-circle',
      'rejected': 'close-circle',
      'suspended': 'pause-circle'
    };
    return icons[status as keyof typeof icons] || 'help-circle';
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

  const getDocumentStatusColor = (status: string) => {
    const colors = {
      'approved': '#10B981',
      'pending': '#F59E0B',
      'rejected': '#EF4444',
      'expired': '#6B7280'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getProgressPercentage = () => {
    return Math.round((verificationData.documentsApproved / verificationData.documentsSubmitted) * 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Overview */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(verificationData.verificationStatus) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(verificationData.verificationStatus) as any} 
                size={32} 
                color={getStatusColor(verificationData.verificationStatus)} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.businessName}>{verificationData.businessName}</Text>
              <Text style={[styles.statusText, { color: getStatusColor(verificationData.verificationStatus) }]}>
                {verificationData.verificationStatus.charAt(0).toUpperCase() + verificationData.verificationStatus.slice(1)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Verification Progress</Text>
              <Text style={styles.progressPercentage}>{getProgressPercentage()}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getStatusColor(verificationData.verificationStatus)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {verificationData.documentsApproved} of {verificationData.documentsSubmitted} documents approved
            </Text>
          </View>

          {/* Score */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Verification Score</Text>
              <Text style={[styles.scoreValue, { color: getStatusColor(verificationData.verificationStatus) }]}>
                {verificationData.verificationScore}%
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Level</Text>
              <Text style={styles.scoreValue}>{verificationData.verificationLevel}</Text>
            </View>
          </View>
        </View>

        {/* Documents Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Status</Text>
          
          {verificationData.documents.map((doc, index) => (
            <View key={index} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentIcon}>
                  <Ionicons name={getDocumentIcon(doc.type) as any} size={20} color="#6B46C1" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentType}>{doc.type}</Text>
                  <Text style={styles.documentDate}>
                    Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getDocumentStatusColor(doc.status) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: getDocumentStatusColor(doc.status) }]}>
                    {doc.status}
                  </Text>
                </View>
              </View>

              {doc.verificationNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Admin Notes:</Text>
                  <Text style={styles.notesText}>{doc.verificationNotes}</Text>
                </View>
              )}

              {doc.status === 'rejected' && (
                <TouchableOpacity style={styles.resubmitButton}>
                  <Ionicons name="refresh" size={16} color="#6B46C1" />
                  <Text style={styles.resubmitText}>Resubmit Document</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Benefits */}
        {verificationData.verificationStatus === 'approved' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Benefits</Text>
            {verificationData.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          {verificationData.nextSteps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Application Submitted</Text>
              <Text style={styles.timelineDate}>{new Date(verificationData.submittedAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Under Review</Text>
              <Text style={styles.timelineDate}>In Progress</Text>
            </View>
          </View>

          {verificationData.verificationStatus === 'approved' && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Verification Approved</Text>
                <Text style={styles.timelineDate}>Congratulations!</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {verificationData.verificationStatus === 'pending' && (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/seller-verification-apply')}
          >
            <Text style={styles.primaryButtonText}>Update Application</Text>
          </TouchableOpacity>
        )}
        
        {verificationData.verificationStatus === 'rejected' && (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/seller-verification-apply')}
          >
            <Text style={styles.primaryButtonText}>Resubmit Application</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/seller-verification-requirements')}
        >
          <Text style={styles.secondaryButtonText}>View Requirements</Text>
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
  refreshButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Progress Section
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  
  // Documents
  documentCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  documentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Notes
  notesSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Resubmit Button
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  resubmitText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Benefits
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  
  // Steps
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineDate: {
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
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
