import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Mock story data for the specific user
const mockStoryData = {
  '1': {
    user: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      verified: true,
    },
    stories: [
      {
        id: '1-1',
        type: 'image',
        content: '📱',
        backgroundColor: '#FF6B6B',
        text: 'New iPhone 15 Pro just arrived!',
        duration: 5000,
      },
      {
        id: '1-2',
        type: 'text',
        content: '💎',
        backgroundColor: '#4ECDC4',
        text: 'Limited edition sneakers available',
        duration: 4000,
      },
      {
        id: '1-3',
        type: 'image',
        content: '👟',
        backgroundColor: '#45B7D1',
        text: 'DM for bulk orders!',
        duration: 6000,
      },
    ],
  },
  '2': {
    user: {
      name: 'TechStore NG',
      avatar: '🏪',
      verified: true,
    },
    stories: [
      {
        id: '2-1',
        type: 'image',
        content: '💻',
        backgroundColor: '#FFA726',
        text: 'Flash Sale: 30% off all laptops',
        duration: 5000,
      },
    ],
  },
  '3': {
    user: {
      name: 'Mike Johnson',
      avatar: '👨‍💼',
      verified: false,
    },
    stories: [
      {
        id: '3-1',
        type: 'text',
        content: '🔍',
        backgroundColor: '#AB47BC',
        text: 'Looking for vintage watches',
        duration: 4000,
      },
      {
        id: '3-2',
        type: 'image',
        content: '⌚',
        backgroundColor: '#EF5350',
        text: 'Anyone selling?',
        duration: 5000,
      },
    ],
  },
  '5': {
    user: {
      name: 'Alex Chen',
      avatar: '👨‍💻',
      verified: true,
    },
    stories: [
      {
        id: '5-1',
        type: 'image',
        content: '🎮',
        backgroundColor: '#66BB6A',
        text: 'PS5 bundle available',
        duration: 5000,
      },
      {
        id: '5-2',
        type: 'text',
        content: '🎯',
        backgroundColor: '#26A69A',
        text: 'Includes 3 games + controller',
        duration: 4000,
      },
      {
        id: '5-3',
        type: 'image',
        content: '💰',
        backgroundColor: '#FF7043',
        text: 'Price: ₦450,000',
        duration: 4000,
      },
      {
        id: '5-4',
        type: 'text',
        content: '📞',
        backgroundColor: '#8E24AA',
        text: 'Contact me ASAP!',
        duration: 3000,
      },
    ],
  },
  '6': {
    user: {
      name: 'Fashion Hub',
      avatar: '👗',
      verified: true,
    },
    stories: [
      {
        id: '6-1',
        type: 'image',
        content: '👕',
        backgroundColor: '#42A5F5',
        text: 'New summer collection',
        duration: 5000,
      },
    ],
  },
};

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const storyData = mockStoryData[id as string];
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressAnimations = useRef<Animated.Value[]>([]);
  const storyDuration = useRef<number[]>([]);

  useEffect(() => {
    if (!storyData) return;
    
    // Initialize progress animations for each story
    progressAnimations.current = storyData.stories.map(() => new Animated.Value(0));
    storyDuration.current = storyData.stories.map(story => story.duration);
    
    // Reset all progress bars
    progressAnimations.current.forEach((anim, index) => {
      if (index < currentStoryIndex) {
        anim.setValue(1); // Mark previous stories as completed
      } else if (index === currentStoryIndex) {
        anim.setValue(0); // Reset current story
      } else {
        anim.setValue(0); // Reset future stories
      }
    });
    
    startStoryProgress();
  }, [storyData, currentStoryIndex]);

  const startStoryProgress = () => {
    if (!storyData || isPaused) return;
    
    const currentStory = storyData.stories[currentStoryIndex];
    const duration = currentStory.duration;
    
    // Stop any existing animation
    progressAnimations.current[currentStoryIndex]?.stopAnimation();
    
    Animated.timing(progressAnimations.current[currentStoryIndex], {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  // Handle pause/resume
  useEffect(() => {
    if (isPaused) {
      // Pause animation
      progressAnimations.current[currentStoryIndex]?.stopAnimation();
    } else {
      // Resume animation
      startStoryProgress();
    }
  }, [isPaused, currentStoryIndex]);

  const nextStory = () => {
    if (currentStoryIndex < storyData.stories.length - 1) {
      // Complete current story progress
      progressAnimations.current[currentStoryIndex]?.setValue(1);
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // End of stories, go back to feed
      router.back();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      // Reset current story progress
      progressAnimations.current[currentStoryIndex]?.setValue(0);
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      previousStory();
    } else {
      nextStory();
    }
  };

  const handleLongPress = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume animation
      startStoryProgress();
    }
  };

  if (!storyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Story not found</Text>
      </View>
    );
  }

  const currentStory = storyData.stories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
             {/* Progress Bars */}
       <View style={styles.progressContainer}>
         {storyData.stories.map((story, index) => (
           <TouchableOpacity 
             key={story.id} 
             style={styles.progressBarContainer}
             onPress={() => {
               // Jump to specific story
               progressAnimations.current.forEach((anim, animIndex) => {
                 if (animIndex < index) {
                   anim.setValue(1); // Mark previous as complete
                 } else if (animIndex === index) {
                   anim.setValue(0); // Reset target story
                 } else {
                   anim.setValue(0); // Reset future stories
                 }
               });
               setCurrentStoryIndex(index);
             }}
           >
             <Animated.View
               style={[
                 styles.progressBar,
                 {
                   width: progressAnimations.current[index]?.interpolate({
                     inputRange: [0, 1],
                     outputRange: ['0%', '100%'],
                   }) || '0%',
                 },
               ]}
             />
           </TouchableOpacity>
         ))}
       </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{storyData.user.avatar}</Text>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{storyData.user.name}</Text>
            <Text style={styles.storyTime}>2 hours ago</Text>
          </View>
          {storyData.user.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Story Content */}
      <View style={[styles.storyContent, { backgroundColor: currentStory.backgroundColor }]}>
        <Text style={styles.storyEmoji}>{currentStory.content}</Text>
        <Text style={styles.storyText}>{currentStory.text}</Text>
      </View>

      {/* Navigation Areas */}
      <TouchableOpacity
        style={styles.leftNav}
        onPress={() => handleTap('left')}
        onLongPress={handleLongPress}
      />
      <TouchableOpacity
        style={styles.rightNav}
        onPress={() => handleTap('right')}
        onLongPress={handleLongPress}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Story Counter */}
      <View style={styles.storyCounter}>
        <Text style={styles.counterText}>
          {currentStoryIndex + 1} of {storyData.stories.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 50,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    fontSize: 32,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storyTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  storyEmoji: {
    fontSize: 120,
    marginBottom: 24,
  },
  storyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  leftNav: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 100,
    width: width * 0.3,
  },
  rightNav: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 100,
    width: width * 0.3,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCounter: {
    position: 'absolute',
    left: 16,
    bottom: 100,
  },
  counterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
