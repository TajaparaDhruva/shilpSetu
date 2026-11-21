import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ShilpColors } from '@/constants/shilpSetuTheme';

/**
 * Root index — Entry Point
 *
 * Directs to the /login page on application startup / reload.
 */
export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    // When the application loads/reloads, route directly to the login page
    router.replace('/login');
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={ShilpColors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShilpColors.background,
  },
});

