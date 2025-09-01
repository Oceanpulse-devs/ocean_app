import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Image, Text } from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  useEffect(() => {
    // Navigate to onboarding after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/onboarding/');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
});
