import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="role-setup" options={{ headerShown: false }} />
          <Stack.Screen name="customer-home" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/home" options={{ headerShown: false }} />
          <Stack.Screen name="explore" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/explore" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/artisan/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="artisan-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="(artisan)/dashboard/index" options={{ headerShown: false }} />
          <Stack.Screen name="(artisan)/products/add" options={{ headerShown: false }} />
          <Stack.Screen name="(artisan)/products/edit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/cart" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/checkout" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/checkout/payment" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/checkout/success" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/orders" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)/orders/[id]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
