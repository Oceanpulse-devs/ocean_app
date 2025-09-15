import { Stack } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  // Removed loading state since we handle it in the splash screen

  return (
    <AuthProvider>
      <ThemeProvider>
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
          <Stack.Screen name="buyer-search-insight" />
          <Stack.Screen name="seller-verification-requirements" />
          <Stack.Screen name="seller-verification-apply" />
          <Stack.Screen name="seller-verification-status" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
