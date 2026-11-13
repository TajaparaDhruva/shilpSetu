import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconChevronDown = require('@/assets/images/shilpsetu/icon-chevron-down.svg');
const iconChevronUp = require('@/assets/images/shilpsetu/icon-chevron-up.svg');

export default function ProductDescription({
  description = 'Handcrafted traditional Indian product made with care and dedication by rural artisans.',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = description && description.length > 160;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => isLong && setIsExpanded(!isExpanded)}
        activeOpacity={isLong ? 0.7 : 1}
      >
        <Text style={styles.heading}>Description</Text>
        {isLong && (
          <Image
            source={isExpanded ? iconChevronUp : iconChevronDown}
            style={styles.chevronIcon}
            contentFit="contain"
          />
        )}
      </TouchableOpacity>

      <Text
        style={styles.descriptionText}
        numberOfLines={isExpanded ? undefined : 4}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
  },
  chevronIcon: {
    width: 18,
    height: 18,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4A463E',
    lineHeight: 22,
  },
});

