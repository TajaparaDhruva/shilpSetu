import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ArtisanRecentOrderCard from './ArtisanRecentOrderCard';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function RecentOrdersSection({
  orders = [],
  onViewAll,
  onOrderPress,
}) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Recent Orders</Text>
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent orders received yet.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <ArtisanRecentOrderCard
            key={order.id}
            order={order}
            onPress={onOrderPress}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: ShilpColors.secondary || '#A85E2B',
  },
  emptyContainer: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  emptyText: {
    fontSize: 13,
    color: '#6E6B65',
  },
});

