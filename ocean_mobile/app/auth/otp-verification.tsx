import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<TextInput[]>([]);
  const params = useLocalSearchParams();

  // Get email from params or AsyncStorage
  useEffect(() => {
    const getEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      } else if (params.email) {
        setEmail(params.email as string);
      }
    };
    getEmail();
  }, [params.email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try signing up again.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Call backend verification endpoint
      const response = await apiService.post('/api/verify-email', {
        email,
        token: otpString
      });

      if (response.success) {
        // Clear pending email
        await AsyncStorage.removeItem('pendingVerificationEmail');
        
        Alert.alert(
          'Success',
          'Email verified successfully! You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try signing up again.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Call backend resend verification endpoint
      await apiService.post('/api/resend-verification', { email });
      
      setResendCooldown(60); // 60 second cooldown
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <View style={styles.wave1} />
          <View style={styles.wave2} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>OTP</Text>

      {/* Instruction */}
      <Text style={styles.instruction}>
        We sent a verification code to{'\n'}
        {email ? email.replace(/(.{2}).*(@.*)/, '$1****$2') : 'your email'}
      </Text>

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity 
        style={[styles.verifyButton, isLoading && styles.disabledButton]} 
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      {/* Resend Button */}
      <TouchableOpacity 
        style={[styles.resendButton, (resendCooldown > 0 || isLoading) && styles.disabledButton]} 
        onPress={handleResend}
        disabled={resendCooldown > 0 || isLoading}
      >
        <Text style={styles.resendButtonText}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
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
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    borderWidth: 2,
    borderColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  resendButtonText: {
    color: '#6B46C1',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

