import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function BulkPurchaseWaitlistScreen() {
  const [hasJoined, setHasJoined] = useState(false);

  // Mock waitlist data
  const waitlistUsers = [
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
  ];

  const handleJoinWaitlist = () => {
    setHasJoined(true);
    // Navigate to checkout after joining
    setTimeout(() => {
      router.push('/bulk-purchase-checkout');
    }, 1000);
  };

  const handleMessageUser = (user: any) => {
    router.push('/chat/1' as any);
  };

  const handleCancel = () => {
    router.back();
  };

  const renderWaitlistUser = ({ item }: { item: any }) => (
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

      {/* Waitlist Users */}
      <FlatList
        data={waitlistUsers}
        renderItem={renderWaitlistUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.waitlistContainer}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            hasJoined && styles.joinButtonJoined
          ]}
          onPress={handleJoinWaitlist}
          disabled={hasJoined}
        >
          <Text style={[
            styles.joinButtonText,
            hasJoined && styles.joinButtonTextJoined
          ]}>
            {hasJoined ? 'Joined!' : 'Join Waitlist'}
          </Text>
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
  
  // Waitlist
  waitlistContainer: {
    padding: 20,
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
  joinButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  joinButtonJoined: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  joinButtonTextJoined: {
    color: '#FFFFFF',
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
