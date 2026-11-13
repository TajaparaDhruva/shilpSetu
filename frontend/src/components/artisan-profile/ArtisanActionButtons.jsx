import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const chatIcon = require('@/assets/images/shilpsetu/icon-chat.svg');
const shoppingBagIcon = require('@/assets/images/shilpsetu/icon-shopping-bag.svg');

export default function ArtisanActionButtons({
  onChatPress,
  onViewProductsPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Chat with Artisan Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={onChatPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Chat with artisan"
        >
          <Image source={chatIcon} style={styles.chatIcon} contentFit="contain" />
          <Text style={styles.chatButtonText}>Chat with Artisan</Text>
        </TouchableOpacity>

        {/* View Products Button */}
        <TouchableOpacity
          style={styles.viewProductsButton}
          onPress={onViewProductsPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="View artisan products"
        >
          <Image
            source={shoppingBagIcon}
            style={styles.bagIcon}
            contentFit="contain"
          />
          <Text style={styles.viewProductsButtonText}>View Products</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBF5EB',
    borderWidth: 1.5,
    borderColor: '#263C29',
  },
  chatIcon: {
    width: 18,
    height: 18,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263C29',
  },
  viewProductsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#263C29',
  },
  bagIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  viewProductsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

