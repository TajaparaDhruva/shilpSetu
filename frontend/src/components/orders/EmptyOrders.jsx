import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function EmptyOrders({ filter = 'All Orders', onContinueShopping }) {
  const isFiltered = filter && filter !== 'All Orders';

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>📦</Text>
      </View>
      <Text style={styles.title}>
        {isFiltered ? `No ${filter} Orders` : 'No Orders Yet'}
      </Text>
      <Text style={styles.subtitle}>
        {isFiltered
          ? `You have no orders currently in "${filter}" status. Try checking other tabs.`
          : 'Explore authentic handcrafted treasures from our verified master artisans.'}
      </Text>

      {onContinueShopping && (
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={onContinueShopping}
        >
          <Text style={styles.buttonText}>Explore Products</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6E6B65',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: ShilpColors.primary || '#263C29',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

