import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function FollowersScreen() {
  const [followers] = useState([
    {
      id: '1',
      name: 'John Doe',
      username: '@johndoe',
      avatar: '👨',
      isFollowing: true,
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      username: '@sarahw',
      avatar: '👩',
      isFollowing: false,
      lastActive: '1 day ago',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      username: '@mikej',
      avatar: '👨‍💼',
      isFollowing: true,
      lastActive: '3 hours ago',
    },
    {
      id: '4',
      name: 'Emma Davis',
      username: '@emmad',
      avatar: '👩‍🎨',
      isFollowing: false,
      lastActive: '5 hours ago',
    },
    {
      id: '5',
      name: 'Alex Chen',
      username: '@alexchen',
      avatar: '👨‍💻',
      isFollowing: true,
      lastActive: '1 hour ago',
    },
  ]);

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
        {followers.map((follower) => (
          <TouchableOpacity key={follower.id} style={styles.followerCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{follower.avatar}</Text>
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
            >
              <Text style={[
                styles.followButtonText,
                follower.isFollowing ? styles.followingButtonText : styles.followButtonText
              ]}>
                {follower.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
});
