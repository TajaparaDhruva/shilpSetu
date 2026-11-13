import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const ACTIONS = [
  {
    id: 'add_product',
    label: 'Add Product',
    icon: '➕',
  },
  {
    id: 'manage_products',
    label: 'Manage\nProducts',
    icon: '📑',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: '📋',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: '📊',
  },
];

export default function ArtisanQuickActions({ onActionPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Actions</Text>
      <View style={styles.actionRow}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => onActionPress && onActionPress(action.id)}
            accessibilityRole="button"
            accessibilityLabel={action.label.replace('\n', ' ')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{action.icon}</Text>
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginHorizontal: 4,
    minHeight: 90,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4E8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
    color: ShilpColors.secondary || '#A85E2B',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
    textAlign: 'center',
    lineHeight: 14,
  },
});

