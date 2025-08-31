import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
      {/* Logo placeholder - will be replaced with actual logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <View style={styles.wave1} />
          <View style={styles.wave2} />
          <View style={styles.wave3} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wave1: {
    position: 'absolute',
    width: 80,
    height: 4,
    backgroundColor: '#6B46C1',
    borderRadius: 2,
    top: 35,
  },
  wave2: {
    position: 'absolute',
    width: 60,
    height: 4,
    backgroundColor: '#A78BFA',
    borderRadius: 2,
    top: 50,
  },
  wave3: {
    position: 'absolute',
    width: 40,
    height: 4,
    backgroundColor: '#C4B5FD',
    borderRadius: 2,
    top: 65,
  },
});
