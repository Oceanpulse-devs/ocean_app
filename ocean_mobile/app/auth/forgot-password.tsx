import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleSendResetLink = () => {
    if (email) {
      // Send reset link logic here
      router.push('/auth/reset-password');
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Forgot Password
      </Text>
      
      <Text style={{ marginBottom: 20, textAlign: 'center' }}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 15, marginBottom: 20, borderRadius: 8 }}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={{ backgroundColor: '#6B46C1', padding: 15, borderRadius: 8, marginBottom: 15 }}
        onPress={handleSendResetLink}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          Send Reset Link
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleBackToLogin}>
        <Text style={{ color: '#6B46C1', textAlign: 'center' }}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

