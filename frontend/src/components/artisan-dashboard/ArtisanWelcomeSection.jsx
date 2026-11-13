import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const topLeftBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

export default function ArtisanWelcomeSection({ artisanName = 'Artisan' }) {
  return (
    <View style={styles.container}>
      {/* Decorative leaf motif on top right */}
      <View style={styles.leafDecorWrapper} pointerEvents="none">
        <Image
          source={topLeftBranch}
          style={styles.leafDecor}
          contentFit="contain"
        />
      </View>

      <Text style={styles.greeting}>
        Welcome, {artisanName} 👋
      </Text>
      <Text style={styles.subtitle}>
        Artisan Dashboard
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    position: 'relative',
  },
  leafDecorWrapper: {
    position: 'absolute',
    top: -10,
    right: 16,
    width: 80,
    height: 80,
    opacity: 0.6,
  },
  leafDecor: {
    width: '100%',
    height: '100%',
    transform: [{ scaleX: -1 }, { rotate: '20deg' }],
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6E6B65',
    marginTop: 3,
    fontWeight: '500',
  },
});

