import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

export default function ArtisanBanner({ onAddProductPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Left Content */}
        <View style={styles.textColumn}>
          <Text style={styles.tagline}>Create · List · Sell</Text>
          <Text style={styles.description}>
            Showcase your handmade crafts to a wider audience across India.
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={onAddProductPress}
            accessibilityRole="button"
            accessibilityLabel="Add New Product"
          >
            <Text style={styles.addButtonText}>Add New Product</Text>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Right Craft Imagery */}
        <View style={styles.imageColumn}>
          <Image
            source={bannerPottery}
            style={styles.bannerImage}
            contentFit="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F3E5D3',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8D9C5',
    overflow: 'hidden',
  },
  textColumn: {
    flex: 1.1,
    paddingRight: 10,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    color: ShilpColors.secondary || '#A85E2B',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#5C5449',
    lineHeight: 17,
    marginBottom: 14,
  },
  addButton: {
    backgroundColor: ShilpColors.primary || '#263C29',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  plusIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  imageColumn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: 120,
    height: 100,
  },
});

