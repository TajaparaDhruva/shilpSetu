import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconLeaf = require('@/assets/images/shilpsetu/cat-homedecor.svg');
const iconEco = require('@/assets/images/shilpsetu/icon-eco.svg');
const iconDurable = require('@/assets/images/shilpsetu/icon-durable.svg');

export default function ProductHighlights({
  highlights = [
    { id: 'h1', label: 'Handmade', icon: iconLeaf },
    { id: 'h2', label: 'Eco-Friendly', icon: iconEco },
    { id: 'h3', label: 'Durable', icon: iconDurable },
  ],
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {highlights.map((item, index) => (
          <React.Fragment key={item.id || `hl-${index}`}>
            <View style={styles.item}>
              <View style={styles.iconCircle}>
                <Image source={item.icon} style={styles.icon} contentFit="contain" />
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </View>
            {index < highlights.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25251F',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5D7C5',
  },
});

