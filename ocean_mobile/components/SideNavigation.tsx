import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SideNavigationProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export default function SideNavigation({ isVisible, onClose, onNavigate }: SideNavigationProps) {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const menuItems = [
    {
      id: 'product-demand',
      title: 'Product Demand',
      icon: 'trending-up-outline',
      onPress: () => {
        console.log('Product Demand pressed');
        if (onNavigate) {
          onNavigate('product-demand');
        }
        onClose();
      },
    },
    {
      id: 'distress-sale',
      title: 'Distress Sale',
      icon: 'flame-outline',
      onPress: () => {
        console.log('Distress Sale pressed');
        if (onNavigate) {
          onNavigate('distress-sale');
        }
        onClose();
      },
    },
    {
      id: 'swap-deals',
      title: 'Swap Deals',
      icon: 'swap-horizontal-outline',
      onPress: () => {
        console.log('Swap Deals pressed');
        if (onNavigate) {
          onNavigate('swap-deal-upload');
        }
        onClose();
      },
    },
    {
      id: 'bulk-purchase',
      title: 'Bulk Purchase',
      icon: 'people-outline',
      onPress: () => {
        console.log('Bulk Purchase pressed');
        if (onNavigate) {
          onNavigate('bulk-purchase-upload');
        }
        onClose();
      },
    },
    {
      id: 'heavy-distributor',
      title: 'Heavy Distributor',
      icon: 'business-outline',
      onPress: () => {
        console.log('Heavy Distributor pressed');
        if (onNavigate) {
          onNavigate('heavy-distributor');
        }
        onClose();
      },
    },
    {
      id: 'auctions',
      title: 'Auctions',
      icon: 'hammer-outline',
      onPress: () => {
        console.log('Auctions pressed');
        if (onNavigate) {
          onNavigate('auctions');
        }
        onClose();
      },
    },

    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        console.log('Settings pressed');
        if (onNavigate) {
          onNavigate('settings');
        }
        onClose();
      },
    },
  ];

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sideNav, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header with Logo and Close Button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/oceanlogo-removebg-preview (1).png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.appNameContainer}>
                <Text style={styles.appName}>OCEAN</Text>
                <Text style={styles.tagline}>Marketplace</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={24} color="#1F2937" />
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#1F2937" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: height,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  appNameContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: -2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
  
  // Menu Items
  menuContainer: {
    flex: 1,
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
    fontWeight: '500',
  },
  
  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signOutText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
    fontWeight: '500',
  },
});
