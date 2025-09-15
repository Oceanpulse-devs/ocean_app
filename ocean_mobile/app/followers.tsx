import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

export default function FollowersScreen() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState({});

  // Fetch followers data
  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get(`/api/follow/${user?.id}/followers`);
        setFollowers(response.data.followers || []);
      } catch (error) {
        console.error('Error fetching followers:', error);
        Alert.alert('Error', 'Failed to load followers');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchFollowers();
    }
  }, [user]);

  const handleFollowToggle = async (followerId, currentStatus) => {
    try {
      if (currentStatus) {
        // Unfollow
        await apiService.post('/api/follow/unfollow', { targetUserId: followerId });
        setIsFollowing(prev => ({ ...prev, [followerId]: false }));
      } else {
        // Follow
        await apiService.post('/api/follow', { targetUserId: followerId });
        setIsFollowing(prev => ({ ...prev, [followerId]: true }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Followers</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {followers.length > 0 ? (
          followers.map((follower) => (
            <TouchableOpacity key={follower.id} style={styles.followerCard}>
              <View style={styles.avatarContainer}>
                {follower.avatar && follower.avatar !== '👤' ? (
                  <Image source={{ uri: follower.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatar}>{follower.avatar || '👤'}</Text>
                )}
              </View>
              
              <View style={styles.followerInfo}>
                <Text style={styles.followerName}>{follower.name}</Text>
                <Text style={styles.followerUsername}>{follower.username}</Text>
                <Text style={styles.lastActive}>Active {follower.lastActive}</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.followButton,
                  follower.isFollowing ? styles.followingButton : styles.followButton
                ]}
                onPress={() => handleFollowToggle(follower.id, follower.isFollowing)}
              >
                <Text style={[
                  styles.followButtonText,
                  follower.isFollowing ? styles.followingButtonText : styles.followButtonText
                ]}>
                  {follower.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No followers yet</Text>
            <Text style={styles.emptySubtext}>Share your profile to get followers!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    fontSize: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 50,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  followerUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Avatar image styles
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
