import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

export default function ProductRating({
  rating = 4.8,
  reviewsCount = 126,
}) {
  if (rating === null || rating === undefined) {
    return (
      <View style={styles.badge}>
        <Text style={styles.unratedText}>No reviews yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.badge}>
      <Image source={starIcon} style={styles.starIcon} contentFit="contain" />
      <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
      <Text style={styles.reviewsText}>({reviewsCount})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25251F',
  },
  reviewsText: {
    fontSize: 12,
    color: '#8A8275',
  },
  unratedText: {
    fontSize: 12,
    color: '#8A8275',
  },
});

