import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function BulkPurchaseCheckoutScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock checkout data - extended waitlist
  const checkoutUsers = [
    {
      id: '1',
      name: 'Cody Fisher',
      username: '@codyluv',
      avatar: '👨‍💼',
      verified: true,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Maryam Tipsy',
      username: '@tipsymaymay',
      avatar: '👩‍💼',
      verified: false,
      rating: 4.5,
    },
    {
      id: '3',
      name: 'Cody Fisher',
      username: '@codyluv',
      avatar: '👨‍💼',
      verified: true,
      rating: 4.8,
    },
    {
      id: '4',
      name: 'Maryam Tipsy',
      username: '@tipsymaymay',
      avatar: '👩‍💼',
      verified: false,
      rating: 4.5,
    },
    {
      id: '5',
      name: 'Alex Johnson',
      username: '@alexj',
      avatar: '👨‍💻',
      verified: true,
      rating: 4.9,
    },
    {
      id: '6',
      name: 'Sarah Wilson',
      username: '@sarahw',
      avatar: '👩‍🎨',
      verified: false,
      rating: 4.3,
    },
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    
    // Mock checkout processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Success!',
        'Your bulk purchase order has been placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    }, 2000);
  };

  const handleMessageUser = (user: any) => {
    router.push('/chat/1' as any);
  };

  const handleCancel = () => {
    router.back();
  };

  const renderCheckoutUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userAvatar}>{item.avatar}</Text>
        <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
            )}
          </View>
          <Text style={styles.userUsername}>{item.username}</Text>
          <Text style={styles.userRating}>⭐ {item.rating}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => handleMessageUser(item)}
      >
        <Text style={styles.messageButtonText}>Message</Text>
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
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Bulk Purchase</Text>
        <Text style={styles.subtitle}>
          See people who want to get the same product as you
        </Text>
      </View>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Product:</Text>
          <Text style={styles.summaryValue}>Nike Sneakers</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Unit Price:</Text>
          <Text style={styles.summaryValue}>$30</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quantity:</Text>
          <Text style={styles.summaryValue}>1</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>$30</Text>
        </View>
      </View>

      {/* Checkout Users */}
      <FlatList
        data={checkoutUsers}
        renderItem={renderCheckoutUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.checkoutContainer}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            isProcessing && styles.checkoutButtonProcessing
          ]}
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  
  // Title
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  
  // Order Summary
  orderSummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  
  // Checkout Users
  checkoutContainer: {
    paddingHorizontal: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    fontSize: 48,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userRating: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Action Buttons
  actionButtons: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkoutButtonProcessing: {
    backgroundColor: '#8B5CF6',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B46C1',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
  },
});
