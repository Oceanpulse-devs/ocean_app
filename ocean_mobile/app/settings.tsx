import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

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
          onPress: () => router.push('/edit-profile'),
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
          value: isDarkMode,
          onValueChange: toggleDarkMode,
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
        style={dynamicStyles.settingItem}
        onPress={item.type === 'navigate' ? item.onPress : undefined}
      >
        <View style={styles.settingLeft}>
          <View style={dynamicStyles.iconContainer}>
            <Ionicons name={item.icon as any} size={20} color={colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={dynamicStyles.settingTitle}>{item.title}</Text>
            <Text style={dynamicStyles.settingSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionContent: {
      backgroundColor: colors.surface,
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
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
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
      color: colors.text,
      marginLeft: 16,
      fontWeight: '500',
    },
    versionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    signOutButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      marginLeft: 12,
      fontWeight: '600',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.surface} 
        translucent 
      />
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={dynamicStyles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Settings Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
            <View style={dynamicStyles.sectionContent}>
              {section.items.map((item) => renderSettingItem(item))}
            </View>
          </View>
        ))}

        {/* Additional Actions */}
        <View style={styles.additionalActions}>
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={dynamicStyles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={dynamicStyles.actionButtonText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={dynamicStyles.actionButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity 
            style={[dynamicStyles.signOutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={dynamicStyles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={dynamicStyles.versionText}>Ocean Marketplace v1.0.0</Text>
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
  signOutSection: {
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
