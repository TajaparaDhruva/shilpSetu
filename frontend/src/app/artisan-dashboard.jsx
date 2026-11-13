import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import { logout } from '@/services/auth';

/**
 * Placeholder: Artisan Dashboard Page
 * TODO: Build the full artisan dashboard in a future task.
 */
export default function ArtisanDashboardPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />
      <View style={styles.content}>
        <Text style={styles.emoji}>🏺</Text>
        <Text style={styles.heading}>Welcome, Artisan!</Text>
        <Text style={styles.subtitle}>
          Your creative dashboard is being shaped.{'\n'}This page will be built in a future update.
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={ShilpColors.white} size="small" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShilpColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: ShilpColors.text,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: ShilpColors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 32,
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 28,
    backgroundColor: ShilpColors.primary,
  },
  logoutText: {
    color: ShilpColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
