import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import apiService, { User } from '../services/api';

export default function EditProfileScreen() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    location: '',
    website: '',
    profilePicture: null as string | null,
    coverPicture: null as string | null,
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        profilePicture: user.profilePicture || null,
        coverPicture: user.coverPicture || null,
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async (type: 'profile' | 'cover') => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          [type === 'profile' ? 'profilePicture' : 'coverPicture']: imageUri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (type: 'profile' | 'cover') => {
    setFormData(prev => ({
      ...prev,
      [type === 'profile' ? 'profilePicture' : 'coverPicture']: null
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    try {
      setIsSaving(true);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('fullName', formData.fullName.trim());
      if (formData.bio.trim()) formDataToSend.append('bio', formData.bio.trim());
      if (formData.location.trim()) formDataToSend.append('location', formData.location.trim());
      if (formData.website.trim()) formDataToSend.append('website', formData.website.trim());

      // Add profile picture if changed
      if (formData.profilePicture && formData.profilePicture.startsWith('file://')) {
        formDataToSend.append('profilePicture', {
          uri: formData.profilePicture,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      // Add cover picture if changed
      if (formData.coverPicture && formData.coverPicture.startsWith('file://')) {
        formDataToSend.append('coverPicture', {
          uri: formData.coverPicture,
          type: 'image/jpeg',
          name: 'cover.jpg',
        } as any);
      }

      // Update profile
      const response = await apiService.updateProfileWithFormData(formDataToSend);
      
      console.log('Profile update response:', response);
      
      if (response.user || response.message) {
        // Update user context
        if (response.user) {
          setUser(response.user);
        }
        
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderImagePicker = (
    type: 'profile' | 'cover',
    currentImage: string | null,
    placeholder: string,
    size: { width: number | string; height: number | string }
  ) => {
    return (
      <View style={styles.imagePickerContainer}>
        <Text style={styles.imagePickerLabel}>
          {type === 'profile' ? 'Profile Picture' : 'Cover Picture'}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.imagePicker, 
            { 
              width: typeof size.width === 'string' ? size.width : size.width,
              height: typeof size.height === 'string' ? size.height : size.height,
              minHeight: typeof size.height === 'number' ? size.height : 200
            }
          ]}
          onPress={() => pickImage(type)}
          activeOpacity={0.7}
        >
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={[
                styles.pickedImage, 
                { 
                  width: typeof size.width === 'string' ? '100%' : size.width,
                  height: typeof size.height === 'string' ? '100%' : size.height
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#6B7280" />
              <Text style={styles.imagePlaceholderText}>{placeholder}</Text>
            </View>
          )}
          
          {/* Overlay with camera icon */}
          <View style={styles.imageOverlay}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {currentImage && (
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => removeImage(type)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Picture */}
        {renderImagePicker(
          'cover',
          formData.coverPicture,
          'Add Cover Photo',
          { width: '100%', height: 200 }
        )}

        {/* Profile Picture */}
        <View style={styles.profilePictureSection}>
          {renderImagePicker(
            'profile',
            formData.profilePicture,
            'Add Photo',
            { width: 120, height: 120 }
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Tell us about yourself"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="City, Country"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.textInput}
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              placeholder="https://yourwebsite.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Image Picker
  imagePickerContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  imagePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  imagePicker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  pickedImage: {
    borderRadius: 12,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  
  // Profile Picture Section
  profilePictureSection: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 24,
    zIndex: 1,
  },
  
  // Form Section
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
