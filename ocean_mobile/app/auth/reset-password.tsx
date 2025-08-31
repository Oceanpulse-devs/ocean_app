import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = () => {
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      // Reset password logic here
      router.replace('/auth/login');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Reset Password
      </Text>
      
      <Text style={{ marginBottom: 20, textAlign: 'center' }}>
        Enter your new password below.
      </Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 15, marginBottom: 15, borderRadius: 8 }}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 15, marginBottom: 20, borderRadius: 8 }}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={{ backgroundColor: '#6B46C1', padding: 15, borderRadius: 8, marginBottom: 15 }}
        onPress={handleResetPassword}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          Reset Password
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

