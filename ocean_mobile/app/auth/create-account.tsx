import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function CreateAccountScreen() {
  const { signup, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetStarted = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        country: country.trim(),
        city: city.trim(),
        agreeTerms: true, // Assuming user agrees by proceeding
      });
      
      // Show success message and navigate to login
      Alert.alert(
        'Account Created',
        'Your account has been created successfully! Please check your email for a verification link to activate your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error.message || 'An error occurred during signup. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.wave1} />
            <View style={styles.wave2} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Create your Account</Text>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <View style={styles.inputField}>
          <Ionicons name="person" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Full Name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) {
                setErrors(prev => ({ ...prev, fullName: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

        <View style={styles.inputField}>
          <Ionicons name="mail" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={styles.inputField}>
          <Ionicons name="globe" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Country"
            value={country}
            onChangeText={(text) => {
              setCountry(text);
              if (errors.country) {
                setErrors(prev => ({ ...prev, country: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </View>
        {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}

        <View style={styles.inputField}>
          <Ionicons name="business" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="City"
            value={city}
            onChangeText={(text) => {
              setCity(text);
              if (errors.city) {
                setErrors(prev => ({ ...prev, city: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </View>
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

        <View style={styles.inputField}>
          <Ionicons name="lock-closed" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Create Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <View style={styles.inputField}>
          <Ionicons name="lock-closed" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }
            }}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
            <Ionicons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      </View>

      {/* Get Started Button */}
      <TouchableOpacity 
        style={[styles.getStartedButton, isLoading && styles.disabledButton]} 
        onPress={handleGetStarted}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        )}
      </TouchableOpacity>

      {/* Separator */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OR</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Social Login Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.socialButtonText}>Sign Up with Google</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={handleSignIn}>
            Sign In
          </Text>
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wave1: {
    position: 'absolute',
    width: 50,
    height: 3,
    backgroundColor: '#6B46C1',
    borderRadius: 2,
    top: 25,
  },
  wave2: {
    position: 'absolute',
    width: 35,
    height: 3,
    backgroundColor: '#A78BFA',
    borderRadius: 2,
    top: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },

  inputContainer: {
    marginBottom: 32,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  getStartedButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
  },
  footerLink: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
