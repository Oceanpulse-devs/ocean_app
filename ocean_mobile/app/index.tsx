import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Image, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for authentication check to complete
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          // User is logged in, go directly to main app
          router.replace('/(tabs)');
        } else {
          // User is not logged in, go to onboarding
          router.replace('/onboarding/');
        }
      }, 1500); // Reduced time since we're checking auth status

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Ocean Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/oceanlogo-removebg-preview (1).png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App Name */}
        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>OCEAN</Text>
          <Text style={styles.tagline}>Marketplace</Text>
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20E6CC" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  appNameContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '300',
    color: '#20E6CC',
    letterSpacing: 2,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '300',
  },
});
