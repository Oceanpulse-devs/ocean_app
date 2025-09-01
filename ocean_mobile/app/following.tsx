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

export default function FollowingScreen() {
  const [following] = useState([
    {
      id: '1',
      name: 'Tech Store',
      username: '@techstore',
      avatar: '🖥️',
      isFollowing: true,
      lastActive: '1 hour ago',
      category: 'Electronics',
    },
    {
      id: '2',
      name: 'Fashion Hub',
      username: '@fashionhub',
      avatar: '👗',
      isFollowing: true,
      lastActive: '3 hours ago',
      category: 'Fashion',
    },
    {
      id: '3',
      name: 'Sports Gear',
      username: '@sportsgear',
      avatar: '⚽',
      isFollowing: true,
      lastActive: '2 hours ago',
      category: 'Sports',
    },
    {
      id: '4',
      name: 'Home Decor',
      username: '@homedecor',
      avatar: '🏠',
      isFollowing: true,
      lastActive: '5 hours ago',
      category: 'Home & Garden',
    },
    {
      id: '5',
      name: 'Book Store',
      username: '@bookstore',
      avatar: '📚',
      isFollowing: true,
      lastActive: '1 day ago',
      category: 'Books',
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
        <Text style={styles.headerTitle}>Following</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {following.map((user) => (
          <TouchableOpacity key={user.id} style={styles.followingCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{user.avatar}</Text>
            </View>
            
            <View style={styles.followingInfo}>
              <Text style={styles.followingName}>{user.name}</Text>
              <Text style={styles.followingUsername}>{user.username}</Text>
              <Text style={styles.category}>{user.category}</Text>
              <Text style={styles.lastActive}>Active {user.lastActive}</Text>
            </View>
            
            <TouchableOpacity style={styles.unfollowButton}>
              <Text style={styles.unfollowButtonText}>Unfollow</Text>
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
  followingCard: {
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
  followingInfo: {
    flex: 1,
  },
  followingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  followingUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  unfollowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
