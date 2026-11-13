import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import ArtisanStatCard from './ArtisanStatCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ArtisanStatsGrid({ stats, loading = false }) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={ShilpColors.primary || '#263C29'} />
      </View>
    );
  }

  const {
    totalProducts = 0,
    totalOrders = 0,
    totalEarnings = 0,
    averageRating = 0,
    totalReviews = 0,
  } = stats || {};

  // Indian currency formatting for earnings
  const formattedEarnings = `₹${Number(totalEarnings).toLocaleString('en-IN')}`;
  const formattedOrders = Number(totalOrders).toLocaleString('en-IN');
  const formattedProducts = Number(totalProducts).toLocaleString('en-IN');

  return (
    <View style={styles.container}>
      {/* Row 1: Products & Orders */}
      <View style={styles.row}>
        <ArtisanStatCard
          icon="📦"
          value={formattedProducts}
          label="Total Products"
        />
        <View style={styles.spacer} />
        <ArtisanStatCard
          icon="🛒"
          value={formattedOrders}
          label="Total Orders"
        />
      </View>

      {/* Row 2: Earnings & Reviews */}
      <View style={[styles.row, { marginTop: 10 }]}>
        <ArtisanStatCard
          icon="₹"
          value={formattedEarnings}
          label="Total Earnings"
        />
        <View style={styles.spacer} />
        <ArtisanStatCard
          icon="⭐"
          value={averageRating ? averageRating.toString() : '0.0'}
          label={totalReviews > 0 ? `(${totalReviews} Reviews)` : 'Average Rating'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 10,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

