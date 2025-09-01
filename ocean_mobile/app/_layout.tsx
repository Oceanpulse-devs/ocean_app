import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking if user has completed onboarding
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="product-detail" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="swap-deal-upload" />
      <Stack.Screen name="swap-deal-vendors" />
      <Stack.Screen name="swap-deal-no-vendors" />
      <Stack.Screen name="bulk-purchase-upload" />
      <Stack.Screen name="bulk-purchase-product" />
      <Stack.Screen name="bulk-purchase-waitlist" />
      <Stack.Screen name="bulk-purchase-checkout" />
      <Stack.Screen name="bulk-purchase-no-vendors" />
      <Stack.Screen name="auctions" />
      <Stack.Screen name="auction-detail/[id]" />
      <Stack.Screen name="auction-create" />
      <Stack.Screen name="my-auctions" />
      <Stack.Screen name="my-bids" />
      <Stack.Screen name="product-demand" />
    </Stack>
  );
}
