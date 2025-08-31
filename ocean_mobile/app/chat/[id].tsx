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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

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
  const [messages, setMessages] = useState(mockChats[id as string]?.messages || []);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatData = mockChats[id as string];
  if (!chatData) {
    return (
      <View style={styles.container}>
        <Text>Chat not found</Text>
      </View>
    );
  }

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromMe: true,
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate reply
      const reply = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! I\'ll get back to you soon.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: false,
        type: 'text',
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  const renderMessage = (message: any) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isFromMe ? styles.myMessage : styles.theirMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isFromMe ? styles.myBubble : styles.theirBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isFromMe ? styles.myMessageText : styles.theirMessageText
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.isFromMe ? styles.myMessageTime : styles.theirMessageTime
          ]}
        >
          {message.time}
        </Text>
      </View>
    </View>
  );

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
          <Text style={styles.userAvatar}>{chatData.user.avatar}</Text>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{chatData.user.name}</Text>
              {chatData.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.userStatus}>
              {chatData.user.online ? 'Online' : `Last seen ${chatData.user.lastSeen}`}
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

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productImage}>{chatData.product.image}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{chatData.product.name}</Text>
          <Text style={styles.productPrice}>{chatData.product.price}</Text>
          <Text style={styles.productCondition}>{chatData.product.condition}</Text>
        </View>
        <TouchableOpacity style={styles.viewProductButton}>
          <Text style={styles.viewProductText}>View</Text>
        </TouchableOpacity>
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
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.theirMessage]}>
            <View style={[styles.messageBubble, styles.theirBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
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
            onChangeText={setInputText}
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
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
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
});
