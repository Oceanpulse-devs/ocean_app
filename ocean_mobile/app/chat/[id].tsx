import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');

// Mock chat data
const mockChats = {
  '1': {
    user: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      verified: true,
      online: true,
      lastSeen: '2 min ago',
    },
    product: {
      name: 'iPhone 14 Pro Max',
      price: '₦850,000',
      image: '📱',
      condition: 'Like New',
    },
    messages: [
      {
        id: '1',
        text: 'Hi! I saw your iPhone listing. Is it still available?',
        time: '2:15 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '2',
        text: 'Yes, it\'s still available! The phone is in excellent condition.',
        time: '2:18 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '3',
        text: 'Great! What\'s the battery health?',
        time: '2:20 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '4',
        text: 'Battery health is at 95%. I\'ve only used it for 6 months.',
        time: '2:22 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '5',
        text: 'Perfect! I can offer ₦800,000. Is that okay?',
        time: '2:25 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '6',
        text: 'That\'s a bit low. Can you do ₦820,000?',
        time: '2:27 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '7',
        text: 'Deal! When can we meet?',
        time: '2:30 PM',
        isFromMe: false,
        type: 'text',
      },
    ],
  },
  '2': {
    user: {
      name: 'TechStore NG',
      avatar: '🏪',
      verified: true,
      online: false,
      lastSeen: '1 hour ago',
    },
    product: {
      name: 'Gaming Laptop Bundle',
      price: '₦450,000',
      image: '💻',
      condition: 'Brand New',
    },
    messages: [
      {
        id: '1',
        text: 'Hi! I\'m interested in your gaming laptop.',
        time: '1:30 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '2',
        text: 'Great choice! It comes with RTX 4060 and gaming accessories.',
        time: '1:35 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '3',
        text: 'Perfect! Let\'s meet at Ikeja Mall tomorrow.',
        time: '1:45 PM',
        isFromMe: true,
        type: 'text',
      },
    ],
  },
  // Buyer Chat Data
  '4': {
    user: {
      name: 'Alex Chen',
      avatar: '👨‍💻',
      verified: false,
      online: true,
      lastSeen: '5 min ago',
    },
    product: {
      name: 'Looking for iPhone 13 or 14',
      price: '₦400,000 - ₦600,000',
      image: '📱',
      condition: 'Want to Buy',
    },
    messages: [
      {
        id: '1',
        text: 'Hi! I saw your post about looking for an iPhone. I have an iPhone 13 128GB in excellent condition.',
        time: '2:15 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '2',
        text: 'Great! What\'s the condition and battery health?',
        time: '2:18 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '3',
        text: 'Excellent condition, 95% battery health. Only used for 8 months.',
        time: '2:20 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '4',
        text: 'Perfect! What\'s your asking price?',
        time: '2:22 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '5',
        text: '₦480,000. Within your budget range.',
        time: '2:25 PM',
        isFromMe: false,
        type: 'text',
      },
    ],
  },
  '5': {
    user: {
      name: 'Maria Santos',
      avatar: '👩‍🎨',
      verified: false,
      online: false,
      lastSeen: '2 hours ago',
    },
    product: {
      name: 'Seeking Gaming Console',
      price: '₦200,000 - ₦300,000',
      image: '🎮',
      condition: 'Want to Buy',
    },
    messages: [
      {
        id: '1',
        text: 'Hi Maria! I have a PS5 with 2 controllers and 5 games available.',
        time: '1:30 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '2',
        text: 'That sounds perfect! What games are included?',
        time: '1:35 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '3',
        text: 'FIFA 24, God of War, Spider-Man, GTA V, and Call of Duty.',
        time: '1:40 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '4',
        text: 'Amazing! What\'s your price?',
        time: '1:45 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '5',
        text: '₦280,000. Within your budget and includes everything.',
        time: '1:50 PM',
        isFromMe: false,
        type: 'text',
      },
    ],
  },
  '6': {
    user: {
      name: 'David Wilson',
      avatar: '👨‍🔧',
      verified: false,
      online: true,
      lastSeen: '1 min ago',
    },
    product: {
      name: 'Need Car Parts - Toyota Camry',
      price: '₦50,000 - ₦150,000',
      image: '🚗',
      condition: 'Want to Buy',
    },
    messages: [
      {
        id: '1',
        text: 'Hi David! I have genuine Toyota Camry parts available.',
        time: '3:15 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '2',
        text: 'Great! Which parts do you have?',
        time: '3:18 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '3',
        text: 'Headlights, side mirrors, and front bumper. All original parts.',
        time: '3:20 PM',
        isFromMe: false,
        type: 'text',
      },
      {
        id: '4',
        text: 'Perfect! What\'s the condition and price?',
        time: '3:22 PM',
        isFromMe: true,
        type: 'text',
      },
      {
        id: '5',
        text: 'Excellent condition. Headlights ₦45K, mirrors ₦35K, bumper ₦70K.',
        time: '3:25 PM',
        isFromMe: false,
        type: 'text',
      },
    ],
  },
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Poll for new messages (API-based approach)
  useEffect(() => {
    if (id) {
      const pollInterval = setInterval(async () => {
        try {
          const messagesResponse = await apiService.getMessages(id as string) as any;
          setMessages(messagesResponse.messages || []);
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 2000); // Poll every 2 seconds for near real-time feel

      return () => clearInterval(pollInterval);
    }
  }, [id]);

  // Fetch conversation and messages
  useEffect(() => {
    if (id) {
      fetchConversationData();
    }
  }, [id]);

  const fetchConversationData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch conversation details
      const conversationResponse = await apiService.getConversation(id as string) as any;
      setConversation(conversationResponse.conversation);

      // Fetch messages
      const messagesResponse = await apiService.getMessages(id as string) as any;
      setMessages(messagesResponse.messages || []);

      // Mark conversation as read
      await apiService.markConversationAsRead(id as string);
    } catch (error) {
      console.error('Error fetching conversation data:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    // Typing indicators will be added later with real-time messaging
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !id) return;

    try {
      // Send message via API
      await apiService.sendMessage(id as string, inputText.trim(), 'text');
      
      // Refresh messages to show the new message
      const messagesResponse = await apiService.getMessages(id as string) as any;
      setMessages(messagesResponse.messages || []);
      
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = (message: any) => {
    const isFromMe = message.senderId === user?.id;
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isFromMe ? styles.myMessage : styles.theirMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isFromMe ? styles.myBubble : styles.theirBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromMe ? styles.myMessageText : styles.theirMessageText
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isFromMe ? styles.myMessageTime : styles.theirMessageTime
            ]}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Conversation not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get the other participant (not the current user)
  const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          {otherParticipant?.profilePicture && 
           otherParticipant.profilePicture !== '👤' && 
           (otherParticipant.profilePicture.startsWith('http') || otherParticipant.profilePicture.startsWith('https')) ? (
            <Image 
              source={{ uri: otherParticipant.profilePicture }} 
              style={styles.userAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.userAvatar}>{otherParticipant?.profilePicture || '👤'}</Text>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{otherParticipant?.fullName || 'Unknown User'}</Text>
              {otherParticipant?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.userStatus}>
              {otherParticipant?.isOnline ? 'Online' : `Last seen ${otherParticipant?.lastSeenAt ? new Date(otherParticipant.lastSeenAt).toLocaleDateString() : 'Recently'}`}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={20} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={20} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {/* Typing indicators will be added later with real-time messaging */}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="cash-outline" size={20} color="#6B46C1" />
          <Text style={styles.quickActionText}>Make Offer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="location-outline" size={20} color="#6B46C1" />
          <Text style={styles.quickActionText}>Meet Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="card-outline" size={20} color="#6B46C1" />
          <Text style={styles.quickActionText}>Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add" size={24} color="#6B46C1" />
        </TouchableOpacity>
        
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  
  // Product Info
  productInfo: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productImage: {
    fontSize: 24,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  productCondition: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewProductButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProductText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#6B46C1',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#9CA3AF',
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 20,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    minHeight: 40,
  },
  input: {
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  sendButton: {
    backgroundColor: '#6B46C1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  
  // Loading and error states
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // User avatar image
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
});
