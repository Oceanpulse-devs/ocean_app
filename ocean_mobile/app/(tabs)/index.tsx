import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SideNavigation from '../../components/SideNavigation';

const { width, height } = Dimensions.get('window');

// Mock data for user stories (24-hour temporary content)
const mockStories = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      verified: true,
      isFollowing: true,
    },
    hasStory: true,
    storyCount: 3,
    lastStoryTime: '2 hours ago',
    isViewed: false,
  },
  {
    id: '2',
    user: {
      name: 'TechStore NG',
      avatar: '🏪',
      verified: true,
      isFollowing: true,
    },
    hasStory: true,
    storyCount: 1,
    lastStoryTime: '5 hours ago',
    isViewed: true,
  },
  {
    id: '3',
    user: {
      name: 'Mike Johnson',
      avatar: '👨‍💼',
      verified: false,
      isFollowing: true,
    },
    hasStory: true,
    storyCount: 2,
    lastStoryTime: '1 hour ago',
    isViewed: false,
  },
  {
    id: '4',
    user: {
      name: 'Emma Davis',
      avatar: '👩‍🎨',
      verified: false,
      isFollowing: true,
    },
    hasStory: false,
    storyCount: 0,
    lastStoryTime: null,
    isViewed: false,
  },
  {
    id: '5',
    user: {
      name: 'Alex Chen',
      avatar: '👨‍💻',
      verified: true,
      isFollowing: true,
    },
    hasStory: true,
    storyCount: 4,
    lastStoryTime: '30 min ago',
    isViewed: false,
  },
  {
    id: '6',
    user: {
      name: 'Fashion Hub',
      avatar: '👗',
      verified: true,
      isFollowing: true,
    },
    hasStory: true,
    storyCount: 1,
    lastStoryTime: '8 hours ago',
    isViewed: true,
  },
  {
    id: '7',
    user: {
      name: 'Add Story',
      avatar: '+',
      verified: false,
      isFollowing: false,
  },
    hasStory: false,
    storyCount: 0,
    lastStoryTime: null,
    isViewed: false,
  },
];

// Mock data for feed posts (mixed seller and buyer posts)
const mockPosts = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      verified: true,
      location: 'Lagos, Nigeria',
    },
    product: {
      name: 'iPhone 14 Pro Max',
      price: '₦850,000',
      originalPrice: '₦950,000',
      images: ['📱', '📱', '📱'],
      condition: 'Like New',
      category: 'Electronics',
    },
    description: 'Selling my iPhone 14 Pro Max in excellent condition. Only used for 6 months, comes with original box and accessories.',
    likes: 24,
    comments: 8,
    shares: 3,
    timeAgo: '2 hours ago',
    isLiked: false,
    isSaved: false,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Tech Enthusiast',
          avatar: '👨‍💻',
          verified: false,
        },
        text: 'Is this still available? What\'s the battery health?',
        timeAgo: '1 hour ago',
        likes: 3,
      },
      {
        id: '2',
        user: {
          name: 'Mobile Store',
          avatar: '🏪',
          verified: true,
        },
        text: 'Great price! Would you consider a trade-in?',
        timeAgo: '45 min ago',
        likes: 1,
      },
      {
        id: '3',
        user: {
          name: 'John Doe',
          avatar: '👤',
          verified: false,
        },
        text: 'Can you ship to Abuja?',
        timeAgo: '30 min ago',
        likes: 0,
      },
    ],
  },
  {
    id: '2',
    user: {
      name: 'TechStore NG',
      avatar: '🏪',
      verified: true,
      location: 'Abuja, Nigeria',
    },
    product: {
      name: 'Gaming Laptop Bundle',
      price: '₦450,000',
      originalPrice: '₦520,000',
      images: ['💻', '🎮', '🎧'],
      condition: 'Brand New',
      category: 'Electronics',
    },
    description: 'Brand new gaming laptop with RTX 4060, 16GB RAM, 512GB SSD. Includes gaming mouse and headset. Perfect for gamers!',
    likes: 156,
    comments: 23,
    shares: 12,
    timeAgo: '5 hours ago',
    isLiked: true,
    isSaved: false,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Gamer Pro',
          avatar: '🎮',
          verified: false,
        },
        text: 'What games can this run at max settings?',
        timeAgo: '3 hours ago',
        likes: 8,
      },
      {
        id: '2',
        user: {
          name: 'Student Buyer',
          avatar: '👨‍🎓',
          verified: false,
        },
        text: 'Is this good for programming and gaming?',
        timeAgo: '2 hours ago',
        likes: 5,
      },
    ],
  },
  {
    id: '3',
    user: {
      name: 'Fashion Hub',
      avatar: '👗',
      verified: false,
      location: 'Port Harcourt, Nigeria',
    },
    product: {
      name: 'Designer Handbag Collection',
      price: '₦120,000',
      originalPrice: '₦180,000',
      images: ['👜', '👜', '👜'],
      condition: 'Good',
      category: 'Fashion',
    },
    description: 'Authentic designer handbags at wholesale prices. Perfect for resellers or personal use. Limited stock available!',
    likes: 89,
    comments: 15,
    shares: 7,
    timeAgo: '1 day ago',
    isLiked: false,
    isSaved: true,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Fashionista',
          avatar: '👠',
          verified: false,
        },
        text: 'Are these authentic? Do you have receipts?',
        timeAgo: '20 hours ago',
        likes: 12,
      },
      {
        id: '2',
        user: {
          name: 'Reseller Pro',
          avatar: '💼',
          verified: true,
        },
        text: 'Interested in bulk purchase. DM me for details.',
        timeAgo: '18 hours ago',
        likes: 3,
      },
    ],
  },
  // Buyer Posts (Want to Buy)
  {
    id: '4',
    type: 'buyer', // Distinguishes from seller posts
    user: {
      name: 'Alex Chen',
      avatar: '👨‍💻',
      verified: false,
      location: 'Lagos, Nigeria',
    },
    wantToBuy: {
      title: 'Looking for iPhone 13 or 14',
      budget: '₦400,000 - ₦600,000',
      description: 'Need a good condition iPhone 13 or 14 for my sister\'s birthday. Prefer 128GB or higher storage. Must be unlocked and have good battery health.',
      images: ['📱'], // Optional images
      category: 'Electronics',
      urgency: 'high', // high, medium, low
    },
    likes: 12,
    comments: 5,
    shares: 2,
    timeAgo: '3 hours ago',
    isLiked: false,
    isSaved: false,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Mobile Dealer',
          avatar: '📱',
          verified: true,
        },
        text: 'I have iPhone 13 128GB in excellent condition. DM me!',
        timeAgo: '2 hours ago',
        likes: 3,
      },
      {
        id: '2',
        user: {
          name: 'Tech Store',
          avatar: '🏪',
          verified: true,
        },
        text: 'iPhone 14 256GB available. Within your budget. Contact me!',
        timeAgo: '1 hour ago',
        likes: 2,
      },
    ],
  },
  {
    id: '5',
    type: 'buyer',
    user: {
      name: 'Maria Santos',
      avatar: '👩‍🎨',
      verified: false,
      location: 'Abuja, Nigeria',
    },
    wantToBuy: {
      title: 'Seeking Gaming Console',
      budget: '₦200,000 - ₦300,000',
      description: 'Looking for PS5 or Xbox Series X. Must be in good condition with controllers and some games. Cash ready!',
      images: [], // No images for this post
      category: 'Electronics',
      urgency: 'medium',
    },
    likes: 8,
    comments: 3,
    shares: 1,
    timeAgo: '6 hours ago',
    isLiked: true,
    isSaved: false,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Gaming Hub',
          avatar: '🎮',
          verified: true,
        },
        text: 'PS5 with 2 controllers and 5 games available. DM for details!',
        timeAgo: '4 hours ago',
        likes: 4,
      },
    ],
  },
  {
    id: '6',
    type: 'buyer',
    user: {
      name: 'David Wilson',
      avatar: '👨‍🔧',
      verified: false,
      location: 'Port Harcourt, Nigeria',
    },
    wantToBuy: {
      title: 'Need Car Parts - Toyota Camry',
      budget: '₦50,000 - ₦150,000',
      description: 'Looking for genuine Toyota Camry 2018-2020 parts: headlights, side mirrors, and front bumper. Must be original parts.',
      images: ['🚗', '🔧'], // Reference images
      category: 'Automotive',
      urgency: 'high',
    },
    likes: 15,
    comments: 7,
    shares: 3,
    timeAgo: '1 day ago',
    isLiked: false,
    isSaved: true,
    showComments: false,
    commentList: [
      {
        id: '1',
        user: {
          name: 'Auto Parts Pro',
          avatar: '🔧',
          verified: true,
        },
        text: 'I have all the parts you need. Original Toyota parts. Contact me!',
        timeAgo: '20 hours ago',
        likes: 6,
      },
    ],
  },
];

export default function FeedScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  const [isSideNavVisible, setIsSideNavVisible] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const toggleSave = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isSaved: !post.isSaved }
        : post
    ));
  };

  const toggleComments = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, showComments: !post.showComments }
        : post
    ));
  };

  const addComment = (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText || commentText.trim() === '') return;

    const newComment = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        avatar: '👤',
        verified: false,
      },
      text: commentText.trim(),
      timeAgo: 'Just now',
      likes: 0,
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            commentList: [newComment, ...post.commentList],
            comments: post.comments + 1
          }
        : post
    ));

    // Clear the input
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{item.user.avatar}</Text>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.user.name}</Text>
              {item.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.userLocation}>{item.user.location}</Text>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Post Type Badge */}
      {item.type === 'buyer' && (
        <View style={styles.buyerBadge}>
          <Ionicons name="search" size={14} color="#FFFFFF" />
          <Text style={styles.buyerBadgeText}>Want to Buy</Text>
        </View>
      )}

      {/* Images Section */}
      {item.type === 'buyer' ? (
        // Buyer post images (optional)
        item.wantToBuy.images.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.wantToBuy.images.map((image, index) => (
                <View key={index} style={styles.productImage}>
                  <Text style={styles.imagePlaceholder}>{image}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )
      ) : (
        // Seller post images
        <View style={styles.imageContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.product.images.map((image, index) => (
              <View key={index} style={styles.productImage}>
                <Text style={styles.imagePlaceholder}>{image}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content Section */}
      {item.type === 'buyer' ? (
        // Buyer post content
        <View style={styles.buyerContent}>
          <View style={styles.buyerHeader}>
            <Text style={styles.buyerTitle}>{item.wantToBuy.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.wantToBuy.category}</Text>
            </View>
          </View>
          <View style={styles.budgetRow}>
            <Ionicons name="cash-outline" size={16} color="#059669" />
            <Text style={styles.budgetText}>{item.wantToBuy.budget}</Text>
            {item.wantToBuy.urgency === 'high' && (
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>Urgent</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{item.wantToBuy.description}</Text>
        </View>
      ) : (
        // Seller post content
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.product.category}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{item.product.price}</Text>
            <Text style={styles.originalPrice}>{item.product.originalPrice}</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{item.product.condition}</Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={item.isLiked ? "#EF4444" : "#6B7280"} 
          />
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => toggleComments(item.id)}
        >
          <Ionicons 
            name={item.showComments ? "chatbubble" : "chatbubble-outline"} 
            size={20} 
            color={item.showComments ? "#6B46C1" : "#6B7280"} 
          />
          <Text style={[styles.actionText, item.showComments && styles.activeText]}>
            {item.comments}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => toggleSave(item.id)}
        >
          <Ionicons 
            name={item.isSaved ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={item.isSaved ? "#6B46C1" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {item.type === 'buyer' ? (
          // Buyer post actions
          <>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/product-detail')}
            >
              <Text style={styles.primaryButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>Contact Buyer</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Seller post actions
          <>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <Text style={styles.primaryButtonText}>Message Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/product-detail')}
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Comments Section */}
      {item.showComments && (
        <View style={styles.commentsSection}>
          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <Text style={styles.commentInputAvatar}>👤</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={commentInputs[item.id] || ''}
              onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [item.id]: text }))}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!commentInputs[item.id] || commentInputs[item.id].trim() === '') && styles.sendButtonDisabled]}
              onPress={() => addComment(item.id)}
              disabled={!commentInputs[item.id] || commentInputs[item.id].trim() === ''}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {item.commentList.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentAvatar}>{comment.user.avatar}</Text>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentNameRow}>
                      <Text style={styles.commentUserName}>{comment.user.name}</Text>
                      {comment.user.verified && (
                        <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
                      )}
                    </View>
                    <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.commentAction}>
                      <Ionicons name="heart-outline" size={14} color="#6B7280" />
                      <Text style={styles.commentActionText}>{comment.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentAction}>
                      <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                      <Text style={styles.commentActionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsSideNavVisible(true)}
          >
            <Ionicons name="menu" size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                <View style={styles.notificationBadge} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/saved')}
            >
              <Ionicons name="bookmark-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, sellers, or categories..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#6B46C1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Feed Content */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <View style={styles.storiesHeader}>
              <Text style={styles.storiesTitle}>Stories</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B46C1" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesScrollContainer}
            >
              {mockStories.map((story, index) => (
                <TouchableOpacity 
                  key={story.id} 
                  style={styles.storyItem}
                  onPress={() => {
                    if (story.id === '7') {
                      // Add story functionality
                      router.push('/(tabs)/upload?type=story');
                    } else if (story.hasStory) {
                      router.push(`/story/${story.id}`);
                    }
                  }}
                >
                  <View style={[
                    styles.storyRing, 
                    story.hasStory && !story.isViewed 
                      ? styles.storyRingUnviewed 
                      : story.hasStory && story.isViewed 
                        ? styles.storyRingViewed 
                        : styles.storyRingNoStory
                  ]}>
                    <View style={styles.storyAvatar}>
                      <Text style={styles.storyEmoji}>{story.user.avatar}</Text>
                      {story.user.verified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                        </View>
                      )}
                      {story.hasStory && story.storyCount > 1 && (
                        <View style={styles.storyCountBadge}>
                          <Text style={styles.storyCountText}>{story.storyCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.storyInfo}>
                    <Text style={styles.storyName} numberOfLines={1}>
                      {story.id === '7' ? 'Add Story' : story.user.name}
                    </Text>
                    {story.hasStory && story.lastStoryTime && (
                      <Text style={styles.storyTime} numberOfLines={1}>
                        {story.lastStoryTime}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />
      
      {/* Side Navigation */}
      <SideNavigation 
        isVisible={isSideNavVisible}
        onClose={() => setIsSideNavVisible(false)}
        onNavigate={(route) => {
          if (route === 'profile') {
            // Navigate to profile tab
            router.push('/(tabs)/profile');
          } else if (route === 'settings') {
            // Navigate to settings page
            router.push('/settings');
          } else if (route === 'product-demand') {
            // Navigate to product demand page
            router.push('/product-demand');
          } else if (route === 'distress-sale') {
            // Navigate to products page with distress filter
            router.push('/(tabs)/products?distress=true');
          } else if (route === 'swap-deal-upload') {
            // Navigate to swap deal upload page
            router.push('/swap-deal-upload');
          } else if (route === 'bulk-purchase-upload') {
            // Navigate to bulk purchase upload page
            router.push('/bulk-purchase-upload');
          } else if (route === 'heavy-distributor') {
            // Navigate to heavy distributor page
            router.push('/heavy-distributor');
          } else if (route === 'auctions') {
            // Navigate to auctions page
            router.push('/auctions');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  
  // Search Styles
  searchContainer: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  
  // Stories Section
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storiesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  storiesScrollContainer: {
    paddingRight: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyRingUnviewed: {
    borderColor: '#E91E63',
    borderWidth: 3,
  },
  storyRingViewed: {
    borderColor: '#9CA3AF',
    borderWidth: 2,
  },
  storyRingNoStory: {
    borderColor: '#E5E7EB',
    borderWidth: 2,
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyEmoji: {
    fontSize: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  storyCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyInfo: {
    alignItems: 'center',
    width: '100%',
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  storyTime: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Feed Container
  feedContainer: {
    paddingBottom: 20,
  },
  
  // Post Card Styles
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Post Header
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    fontSize: 40,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  userLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreButton: {
    padding: 4,
  },
  
  // Product Images
  imageContainer: {
    marginBottom: 16,
  },
  productImage: {
    width: width * 0.7,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  
  // Product Info
  productInfo: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  // Buyer Post Styles
  buyerBadge: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  buyerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buyerContent: {
    marginBottom: 16,
  },
  buyerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buyerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  budgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  urgencyBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  conditionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  
  // Description
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  likedText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: '#6B46C1',
    fontWeight: '500',
  },
  
  // Comments Section
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  commentInputAvatar: {
    fontSize: 24,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#6B46C1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    fontSize: 24,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Notification Badge
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
