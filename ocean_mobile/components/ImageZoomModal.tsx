import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageZoomModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export default function ImageZoomModal({ visible, imageUri, onClose }: ImageZoomModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isVideo = imageUri && (imageUri.includes('.mp4') || imageUri.includes('.mov') || imageUri.includes('.mkv') || imageUri.includes('video/upload'));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Media Container */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            isVideo ? (
              <Video
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
                shouldPlay={true}
                isLooping={true}
                useNativeControls={true}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.log('Error loading video:', imageUri);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.log('Error loading image:', imageUri);
                  setImageLoaded(false);
                }}
              />
            )
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name={isVideo ? "videocam-outline" : "image-outline"} size={64} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Loading Indicator */}
        {!imageLoaded && imageUri && (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={32} color="#FFFFFF" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
  },
  image: {
    width: screenWidth,
    height: screenHeight,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
