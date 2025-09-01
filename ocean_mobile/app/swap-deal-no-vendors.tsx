import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SwapDealNoVendorsScreen() {
  const handleContinue = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            {/* Male figure */}
            <View style={styles.maleFigure}>
              <View style={styles.maleHead} />
              <View style={styles.maleBody} />
              <View style={styles.maleLegs} />
              <View style={styles.maleBoxes}>
                <View style={styles.box} />
                <View style={styles.box} />
                <View style={styles.box} />
              </View>
            </View>
            
            {/* Female figure */}
            <View style={styles.femaleFigure}>
              <View style={styles.femaleHead} />
              <View style={styles.femaleBody} />
              <View style={styles.femaleLegs} />
            </View>
            
            {/* Plant decoration */}
            <View style={styles.plantDecoration}>
              <View style={styles.plantStem} />
              <View style={styles.plantLeaf1} />
              <View style={styles.plantLeaf2} />
              <View style={styles.plantLeaf3} />
            </View>
          </View>
        </View>

        {/* Message */}
        <Text style={styles.oopsText}>Oops! 😟</Text>
        
        <Text style={styles.description}>
          We couldn't find any vendor willing to swap. Click the button below to proceed to the home page.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  
  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  // Illustration
  illustrationContainer: {
    marginBottom: 40,
  },
  illustration: {
    width: 200,
    height: 150,
    position: 'relative',
  },
  
  // Male Figure
  maleFigure: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  maleHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    marginBottom: 4,
  },
  maleBody: {
    width: 24,
    height: 30,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  maleLegs: {
    width: 24,
    height: 20,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  maleBoxes: {
    position: 'absolute',
    left: 30,
    top: 10,
    flexDirection: 'row',
    gap: 2,
  },
  box: {
    width: 8,
    height: 8,
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  
  // Female Figure
  femaleFigure: {
    position: 'absolute',
    right: 20,
    top: 30,
  },
  femaleHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBBF24',
    marginBottom: 4,
  },
  femaleBody: {
    width: 22,
    height: 28,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 4,
  },
  femaleLegs: {
    width: 22,
    height: 18,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  
  // Plant Decoration
  plantDecoration: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  plantStem: {
    width: 3,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  plantLeaf1: {
    position: 'absolute',
    left: -5,
    top: 5,
    width: 8,
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 4,
    transform: [{ rotate: '-30deg' }],
  },
  plantLeaf2: {
    position: 'absolute',
    right: -5,
    top: 8,
    width: 6,
    height: 5,
    backgroundColor: '#10B981',
    borderRadius: 3,
    transform: [{ rotate: '30deg' }],
  },
  plantLeaf3: {
    position: 'absolute',
    left: -3,
    top: 12,
    width: 7,
    height: 5,
    backgroundColor: '#10B981',
    borderRadius: 3,
    transform: [{ rotate: '-15deg' }],
  },
  
  // Text
  oopsText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  
  // Button
  continueButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
