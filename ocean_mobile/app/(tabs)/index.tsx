import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SideNavigation from '../../components/SideNavigation';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import ImageZoomModal from '../../components/ImageZoomModal';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Helper function to format time ago
const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};


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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  
  // Debug posts state
  useEffect(() => {
    console.log('Posts state updated:', posts.length, 'posts');
  }, [posts]);

  // Handle image tap
  const handleImagePress = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setImageModalVisible(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUri('');
  };
  const [isSideNavVisible, setIsSideNavVisible] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [loadingComments, setLoadingComments] = useState<{[key: string]: boolean}>({});
  const [editingComment, setEditingComment] = useState<{commentId: string, postId: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');


  // Fetch home feed data
  const fetchHomeFeed = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/api/feed');
      
      console.log('Feed API response:', response);
      console.log('Response data:', response.data);
      console.log('Posts array:', response.data?.posts);
      
      if (response.message === 'Feed retrieved successfully' && response.data && response.data.posts) {
        // Handle the actual API response structure
        const apiPosts = response.data.posts.map((post: any) => ({
          id: post.id,
          user: {
            name: post.user.fullName,
            avatar: post.user.profilePicture || null,
            verified: post.user.accountStatus === 'active',
            location: post.location || ''
          },
          product: {
            name: post.productName || '',
            price: post.price ? `₦${parseInt(post.price).toLocaleString()}` : '',
            originalPrice: null,
            images: post.media?.map((m: any) => m.mediaUrl) || [],
            condition: '',
            category: ''
          },
          // Add direct images field for social media posts
          images: post.media?.map((m: any) => m.mediaUrl) || [],
          description: post.content,
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: post.sharesCount || 0,
          timeAgo: getTimeAgo(post.createdAt),
          isLiked: post.isLiked || false,
          isSaved: post.isSaved || false,
          showComments: false,
          commentList: [] // Comments will be loaded on-demand when user opens comments section
        }));
        
        console.log('Formatted posts:', apiPosts);
        console.log('Setting posts count:', apiPosts.length);
        
        // Debug: Check images in first post
        if (apiPosts.length > 0) {
          console.log('First post images:', apiPosts[0].images);
          console.log('First post product images:', apiPosts[0].product.images);
        }
        
        setPosts(apiPosts);
      } else {
        console.log('Using fallback mock data');
        // Fallback to mock data
        setPosts(mockPosts);
      }
    } catch (error) {
      console.error('Error fetching home feed:', error);
      // Keep mock data if API fails
      setPosts(mockPosts);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHomeFeed();
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchHomeFeed();
  }, []);

  const toggleLike = async (postId: string) => {
    try {
      const response = await apiService.toggleLike(postId);
      console.log('Like toggle response:', response);
      
      // Update local state
    setPosts(posts.map(post => 
      post.id === postId 
          ? { 
              ...post, 
              isLiked: response.data.isLiked, 
              likes: response.data.isLiked ? post.likes + 1 : post.likes - 1 
            }
        : post
    ));
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const toggleSave = async (postId: string) => {
    try {
      const response = await apiService.toggleSave(postId);
      console.log('Save toggle response:', response);
      
      // Update local state
    setPosts(posts.map(post => 
      post.id === postId 
          ? { ...post, isSaved: response.data.isSaved }
        : post
    ));
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', 'Failed to update save. Please try again.');
    }
  };

  const toggleComments = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newShowComments = !post.showComments;
    
    // If opening comments and we don't have comments loaded, fetch them
    if (newShowComments && post.commentList.length === 0) {
      try {
        console.log('Loading comments for post:', postId);
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        
        const response = await apiService.getComments(postId);
        console.log('Comments response:', response);
        
        const comments = response.data.comments.map((comment: any) => ({
          id: comment.id,
          user: {
            name: comment.user.fullName,
            avatar: comment.user.profilePicture || '👤',
            verified: comment.user.accountStatus === 'verified',
          },
          text: comment.content,
          timeAgo: getTimeAgo(comment.createdAt),
          likes: 0,
        }));

        // Update the post with loaded comments
        setPosts(posts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                showComments: newShowComments,
                commentList: comments
              }
            : p
        ));
        
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
        return;
      } catch (error) {
        console.error('Error loading comments:', error);
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
        Alert.alert('Error', 'Failed to load comments. Please try again.');
        return;
      }
    }

    // Just toggle the visibility
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, showComments: newShowComments }
        : p
    ));
  };

  const addComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText || commentText.trim() === '') return;

    try {
      // Check if we're editing an existing comment
      if (editingComment && editingComment.postId === postId) {
        // Update existing comment
        const response = await apiService.updateComment(editingComment.commentId, commentText.trim());
        console.log('Comment update response:', response);
        
        // Update local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? {
                ...post,
                commentList: post.commentList.map(comment =>
                  comment.id === editingComment.commentId
                    ? { ...comment, text: commentText.trim() }
                    : comment
                )
              }
            : post
        ));
        
        // Clear editing state
        setEditingComment(null);
      } else {
        // Create new comment
        const response = await apiService.createComment(postId, commentText.trim());
        console.log('Comment creation response:', response);
        
        // Create new comment object from API response
    const newComment = {
          id: response.data.id,
      user: {
            name: response.data.user.fullName,
            avatar: response.data.user.profilePicture || '👤',
            verified: response.data.user.accountStatus === 'verified',
          },
          text: response.data.content,
      timeAgo: 'Just now',
      likes: 0,
    };

        // Update local state
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            commentList: [newComment, ...post.commentList],
            comments: post.comments + 1
          }
        : post
    ));
      }

    // Clear the input
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error with comment:', error);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
    }
  };

  const handleCommentLongPress = (comment: any, postId: string) => {
    // Check if this is the current user's comment
    if (comment.user.name === user?.fullName) {
      Alert.alert(
        'Comment Options',
        'What would you like to do with this comment?',
        [
          {
            text: 'Edit',
            onPress: () => editComment(comment.id, comment.text, postId),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteComment(comment.id, postId),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const editComment = (commentId: string, currentText: string, postId: string) => {
    // Set the comment text in the input field for editing
    setCommentInputs(prev => ({ ...prev, [postId]: currentText }));
    
    // Store the comment ID being edited
    setEditingComment({ commentId, postId });
    
    // Focus on the input (if possible)
    // Note: We can't directly focus TextInput here, but the text will be pre-filled
  };

  const deleteComment = async (commentId: string, postId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteComment(commentId);
              console.log('Comment deleted successfully');
              
              // Update local state
              setPosts(posts.map(post => 
                post.id === postId 
                  ? {
                      ...post,
                      commentList: post.commentList.filter(comment => comment.id !== commentId),
                      comments: post.comments - 1
                    }
                  : post
              ));
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await apiService.sharePost(postId);
      console.log('Share response:', response);
      Alert.alert('Share', 'Share functionality coming soon!');
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
  };

  const handleMessageUser = async (item: any) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      console.log('🔍 Message item data:', JSON.stringify(item, null, 2));

      // Get the user ID to message (use the post author's ID)
      let targetUserId;
      
      // Try to get user ID from various sources
      targetUserId = item.userId || item.user?.id;
      
      // If still no user ID, try to extract from avatar URL
      if (!targetUserId && item.user?.avatar) {
        const avatarUrl = item.user.avatar;
        const userIdMatch = avatarUrl.match(/\/profiles\/([^\/]+)\//);
        if (userIdMatch) {
          targetUserId = userIdMatch[1];
          console.log('📱 Extracted user ID from avatar URL:', targetUserId);
        }
      }
      
      console.log('📱 Feed post - targetUserId:', targetUserId);

      if (!targetUserId) {
        console.log('❌ No target user ID found. Item structure:', {
          type: item.type,
          buyer: item.buyer,
          seller: item.seller,
          user: item.user,
          userId: item.userId
        });
        Alert.alert('Error', 'Unable to find user to message');
        return;
      }

      // Create conversation with the target user (server will add current user automatically)
      const response = await apiService.createConversation([targetUserId]);
      const conversationId = response.data.id;
      
      // Navigate to chat
      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // If conversation already exists, extract the conversation ID from error message
      if (error.message && error.message.includes('Direct conversation already exists')) {
        try {
          // Try to get existing conversations and find the one with this user
          const conversationsResponse = await apiService.getConversations();
          const existingConversation = conversationsResponse.conversations?.find((conv: any) => {
            const otherParticipant = conv.participants?.find((p: any) => p.userId !== user?.id);
            return otherParticipant?.userId === targetUserId;
          });
          
          if (existingConversation) {
            console.log('✅ Found existing conversation:', existingConversation.id);
            router.push(`/chat/${existingConversation.id}` as any);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching existing conversations:', fetchError);
        }
      }
      
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => {
              if (typeof item.user.avatar === 'string' && item.user.avatar.startsWith('http')) {
                handleImagePress(item.user.avatar);
              }
            }}
            activeOpacity={0.8}
          >
            {item.user.avatar && typeof item.user.avatar === 'string' && item.user.avatar.startsWith('http') ? (
              <Image 
                source={{ uri: item.user.avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {item.user.name ? item.user.name.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.user.name}</Text>
              {item.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              )}
            </View>
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

      {/* Content Section - Above Images (Facebook Style) */}
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
          {item.wantToBuy.description && <Text style={styles.description}>{item.wantToBuy.description}</Text>}
        </View>
      ) : (
        // Seller post content - just description
        <View style={styles.postContent}>
          {item.description && <Text style={styles.description}>{item.description}</Text>}
            </View>
      )}

      {/* Images Section */}
      {item.images && item.images.length > 0 && (
        <View style={styles.imageContainer}>
          {item.images.length === 1 ? (
            // Single image - center it
            <View style={styles.singleImageContainer}>
              {item.images.map((media, index) => {
                console.log(`Rendering single media ${index}:`, media);
                const isVideo = typeof media === 'string' && (media.includes('.mp4') || media.includes('.mov') || media.includes('.mkv') || media.includes('video/upload'));
                const isImage = typeof media === 'string' && media.startsWith('http') && !isVideo;
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.singleImage}
                    onPress={() => {
                      if (typeof media === 'string' && media.startsWith('http')) {
                        handleImagePress(media);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {isImage ? (
                      <Image 
                        source={{ uri: media }} 
                        style={styles.singleImageContent}
                        resizeMode="cover"
                        onLoad={() => console.log(`Single image ${index} loaded successfully`)}
                        onError={(error) => console.log(`Single image ${index} failed to load:`, error)}
                      />
                    ) : isVideo ? (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: media }}
                          style={styles.singleImageContent}
                          resizeMode="cover"
                          shouldPlay={false}
                          isLooping={false}
                          useNativeControls={false}
                        />
                        <View style={styles.playButton}>
                          <Ionicons name="play" size={32} color="#FFFFFF" />
          </View>
            </View>
                    ) : (
                      <Text style={styles.imagePlaceholder}>{media}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
          ) : (
            // Multiple images - horizontal scroll
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.images.map((media, index) => {
                console.log(`Rendering media ${index}:`, media);
                const isVideo = typeof media === 'string' && (media.includes('.mp4') || media.includes('.mov') || media.includes('.mkv') || media.includes('video/upload'));
                const isImage = typeof media === 'string' && media.startsWith('http') && !isVideo;
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.productImage}
                    onPress={() => {
                      if (typeof media === 'string' && media.startsWith('http')) {
                        handleImagePress(media);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {isImage ? (
                      <Image 
                        source={{ uri: media }} 
                        style={styles.productImageContent}
                        resizeMode="cover"
                        onLoad={() => console.log(`Image ${index} loaded successfully`)}
                        onError={(error) => console.log(`Image ${index} failed to load:`, error)}
                      />
                    ) : isVideo ? (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: media }}
                          style={styles.productImageContent}
                          resizeMode="cover"
                          shouldPlay={false}
                          isLooping={false}
                          useNativeControls={false}
                        />
                        <View style={styles.playButton}>
                          <Ionicons name="play" size={32} color="#FFFFFF" />
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.imagePlaceholder}>{media}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
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

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(item.id)}
        >
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
              onPress={() => handleMessageUser(item)}
            >
              <Text style={styles.secondaryButtonText}>Contact Buyer</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Seller post actions
          <>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => handleMessageUser(item)}
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
              placeholder={editingComment && editingComment.postId === item.id ? "Edit your comment..." : "Add a comment..."}
              placeholderTextColor="#9CA3AF"
              value={commentInputs[item.id] || ''}
              onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [item.id]: text }))}
              multiline
            />
            {editingComment && editingComment.postId === item.id && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setEditingComment(null);
                  setCommentInputs(prev => ({ ...prev, [item.id]: '' }));
                }}
              >
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.sendButton, (!commentInputs[item.id] || commentInputs[item.id].trim() === '') && styles.sendButtonDisabled]}
              onPress={() => addComment(item.id)}
              disabled={!commentInputs[item.id] || commentInputs[item.id].trim() === ''}
            >
              <Ionicons name={editingComment && editingComment.postId === item.id ? "checkmark" : "send"} size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {loadingComments[item.id] ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="small" color="#6B46C1" />
                <Text style={styles.commentsLoadingText}>Loading comments...</Text>
              </View>
            ) : (
              item.commentList.map((comment) => (
              <TouchableOpacity 
                key={comment.id} 
                style={styles.commentItem}
                onLongPress={() => handleCommentLongPress(comment, item.id)}
                activeOpacity={0.7}
              >
                {typeof comment.user.avatar === 'string' && comment.user.avatar.startsWith('http') ? (
                  <Image 
                    source={{ uri: comment.user.avatar }} 
                    style={styles.commentAvatarImage}
                  />
                ) : (
                <Text style={styles.commentAvatar}>{comment.user.avatar}</Text>
                )}
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
              </TouchableOpacity>
            ))
            )}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6B46C1']}
            tintColor="#6B46C1"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B46C1" />
              <Text style={styles.loadingText}>Loading feed...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts available</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or check back later</Text>
            </View>
          )
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

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={imageModalVisible}
        imageUri={selectedImageUri}
        onClose={closeImageModal}
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
  
  
  // Feed Container
  feedContainer: {
    paddingBottom: 20,
  },
  
  // Post Card Styles
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 0,
  },
  postSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginBottom: 20,
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  // Single image container - centers the image
  singleImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Single image - larger and centered
  singleImage: {
    width: width * 0.85,
    height: 250,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  singleImageContent: {
    width: '100%',
    height: '100%',
  },
  // Multiple images - horizontal scroll
  productImage: {
    width: width * 0.7,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImageContent: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  
  // Post Content
  postContent: {
    marginBottom: 12,
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
    marginBottom: 12,
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
  
  // Description - Larger text for better readability
  description: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
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
  cancelButton: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentsList: {
    gap: 16,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  commentsLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    fontSize: 24,
  },
  commentAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
