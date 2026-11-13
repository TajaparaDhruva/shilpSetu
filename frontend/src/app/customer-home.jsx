import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ShilpColors } from '@/constants/shilpSetuTheme';

/**
 * Placeholder: Customer Home Page
 * TODO: Build the full customer shopping experience in a future task.
 */
export default function CustomerHomePage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />
      <View style={styles.content}>
        <Text style={styles.emoji}>🛍️</Text>
        <Text style={styles.heading}>Welcome, Customer!</Text>
        <Text style={styles.subtitle}>
          Your shopping experience is being crafted.{'\n'}This page will be built in a future update.
        </Text>
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
  },
});

