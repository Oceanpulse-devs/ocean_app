import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const onboardingData = [
    {
      title: 'Post what you Sell',
      description: 'Share your products with the world',
      illustration: '📱💬', // Placeholder emoji - will be replaced with actual illustration
    },
    {
      title: 'Buy what you see',
      description: 'Discover amazing products from others',
      illustration: '🛍️📱', // Placeholder emoji - will be replaced with actual illustration
    },
    {
      title: 'Buy, Sell & Socialise',
      description: 'Connect with buyers and sellers',
      illustration: '👥📍', // Placeholder emoji - will be replaced with actual illustration
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Navigate to account creation
      router.replace('/auth/create-account');
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  return (
        <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.slide}>
            {/* Illustration Placeholder */}
            <View style={styles.illustrationContainer}>
              <Text style={styles.illustrationPlaceholder}>{item.illustration}</Text>
              <View style={styles.illustrationBox}>
                {/* This will be replaced with actual illustrations */}
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Navigation Button */}
      <TouchableOpacity 
        style={[
          styles.navButton,
          currentIndex === onboardingData.length - 1 && styles.navButtonWide
        ]} 
        onPress={handleNext}
      >
        {currentIndex === onboardingData.length - 1 ? (
          <Text style={[styles.navButtonText, styles.navButtonTextWide]}>Get Started</Text>
        ) : (
          <Text style={styles.navButtonText}>›</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height: height - 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationPlaceholder: {
    fontSize: 80,
    marginBottom: 20,
  },
  illustrationBox: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#6B46C1',
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
  navButton: {
    backgroundColor: '#6B46C1',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navButtonWide: {
    width: width - 80,
    borderRadius: 16,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  navButtonTextWide: {
    fontSize: 18,
  },
});
