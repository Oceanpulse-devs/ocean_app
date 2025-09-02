import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const settingsSections = [
    {
      title: 'Account & Profile',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: 'person-outline',
          type: 'navigate',
          onPress: () => console.log('Edit Profile'),
        },
        {
          id: 'verification',
          title: 'Seller Verification',
          subtitle: 'Get verified seller badge',
          icon: 'checkmark-circle-outline',
          type: 'navigate',
          onPress: () => router.push('/seller-verification-requirements'),
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Control your data visibility',
          icon: 'shield-outline',
          type: 'navigate',
          onPress: () => console.log('Privacy'),
        },
      ],
    },
    {
      title: 'Marketplace Preferences',
      items: [
        {
          id: 'categories',
          title: 'Preferred Categories',
          subtitle: 'Electronics, Fashion, Home & Garden',
          icon: 'grid-outline',
          type: 'navigate',
          onPress: () => console.log('Categories'),
        },
        {
          id: 'location',
          title: 'Trading Location',
          subtitle: 'Lagos, Nigeria',
          icon: 'location-outline',
          type: 'navigate',
          onPress: () => console.log('Location'),
        },
        {
          id: 'currency',
          title: 'Currency Preference',
          subtitle: 'Nigerian Naira (₦)',
          icon: 'cash-outline',
          type: 'navigate',
          onPress: () => console.log('Currency'),
        },
      ],
    },
    {
      title: 'Trading Settings',
      items: [
        {
          id: 'payment',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          icon: 'card-outline',
          type: 'navigate',
          onPress: () => console.log('Payment'),
        },
        {
          id: 'shipping',
          title: 'Shipping Preferences',
          subtitle: 'Delivery options & costs',
          icon: 'car-outline',
          type: 'navigate',
          onPress: () => console.log('Shipping'),
        },
        {
          id: 'returns',
          title: 'Return Policy',
          subtitle: 'Set your return terms',
          icon: 'refresh-outline',
          type: 'navigate',
          onPress: () => console.log('Returns'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: 'Get alerts on your device',
          icon: 'notifications-outline',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          id: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive updates via email',
          icon: 'mail-outline',
          type: 'switch',
          value: emailNotifications,
          onValueChange: setEmailNotifications,
        },
        {
          id: 'trading',
          title: 'Trading Alerts',
          subtitle: 'Bids, offers, and messages',
          icon: 'trending-up-outline',
          type: 'navigate',
          onPress: () => console.log('Trading Alerts'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'password',
          title: 'Change Password',
          subtitle: 'Update your login credentials',
          icon: 'lock-closed-outline',
          type: 'navigate',
          onPress: () => console.log('Password'),
        },
        {
          id: 'twoFactor',
          title: 'Two-Factor Authentication',
          subtitle: 'Add extra security layer',
          icon: 'key-outline',
          type: 'navigate',
          onPress: () => console.log('2FA'),
        },
        {
          id: 'sessions',
          title: 'Active Sessions',
          subtitle: 'Manage logged-in devices',
          icon: 'desktop-outline',
          type: 'navigate',
          onPress: () => console.log('Sessions'),
        },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          icon: 'moon-outline',
          type: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English (US)',
          icon: 'language-outline',
          type: 'navigate',
          onPress: () => console.log('Language'),
        },
        {
          id: 'dataUsage',
          title: 'Data Usage',
          subtitle: 'Control app data consumption',
          icon: 'cellular-outline',
          type: 'navigate',
          onPress: () => console.log('Data Usage'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.type === 'navigate' ? item.onPress : undefined}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon as any} size={20} color="#6B46C1" />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#6B46C1' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Settings Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => renderSettingItem(item))}
            </View>
          </View>
        ))}

        {/* Additional Actions */}
        <View style={styles.additionalActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#6B46C1" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color="#6B46C1" />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6B46C1" />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Ocean Marketplace v1.0.0</Text>
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerRight: {
    width: 60, // Balance the header
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Additional Actions
  additionalActions: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
  },
  
  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
