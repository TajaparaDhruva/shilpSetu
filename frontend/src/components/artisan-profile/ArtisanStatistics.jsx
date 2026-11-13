import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const shoppingBagIcon = require('@/assets/images/shilpsetu/icon-shopping-bag.svg');
const catHomedecor = require('@/assets/images/shilpsetu/cat-homedecor.svg');
const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

export default function ArtisanStatistics({
  productsCount = 42,
  customersCount = '1,250+',
  experienceYears = '5 Years',
}) {
  return (
    <View style={styles.container}>
      <View style={styles.cardRow}>
        {/* Stat 1: Products */}
        <View style={styles.statCard}>
          <View style={styles.iconCircle}>
            <Image
              source={shoppingBagIcon}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.statNumber}>{productsCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stat 2: Customers */}
        <View style={styles.statCard}>
          <View style={styles.iconCircle}>
            <Image
              source={catHomedecor}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.statNumber}>{customersCount}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stat 3: Experience */}
        <View style={styles.statCard}>
          <View style={styles.iconCircle}>
            <Image
              source={starIcon}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.statNumber}>{experienceYears}</Text>
            <Text style={styles.statLabel}>on ShilpSetu</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 15,
    height: 15,
  },
  textWrapper: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263C29',
  },
  statLabel: {
    fontSize: 10,
    color: '#8A8275',
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: '#E5D7C5',
  },
});

