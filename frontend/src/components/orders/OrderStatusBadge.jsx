import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * OrderStatusBadge
 * Shows green/red/amber status pills matching reference design
 */
export default function OrderStatusBadge({ status }) {
  const norm = String(status || 'pending').toLowerCase();

  let label = 'Processing';
  let badgeStyle = styles.badgeProcessing;
  let textStyle = styles.textProcessing;
  let icon = '📦';

  if (norm.includes('out_for_delivery') || norm.includes('delivery')) {
    label = 'Out for Delivery';
    badgeStyle = styles.badgeOutForDelivery;
    textStyle = styles.textOutForDelivery;
    icon = '🚚';
  } else if (norm.includes('delivered') || norm.includes('complete')) {
    label = 'Delivered';
    badgeStyle = styles.badgeDelivered;
    textStyle = styles.textDelivered;
    icon = '✓';
  } else if (norm.includes('cancel')) {
    label = 'Cancelled';
    badgeStyle = styles.badgeCancelled;
    textStyle = styles.textCancelled;
    icon = '✕';
  } else if (norm.includes('ship')) {
    label = 'Shipped';
    badgeStyle = styles.badgeShipped;
    textStyle = styles.textShipped;
    icon = '🚚';
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.icon, textStyle]}>{icon}</Text>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  icon: {
    fontSize: 12,
    fontWeight: '700',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeOutForDelivery: {
    backgroundColor: '#E2EED0',
  },
  textOutForDelivery: {
    color: '#263C29',
  },
  badgeDelivered: {
    backgroundColor: '#DCE8B5',
  },
  textDelivered: {
    color: '#263C29',
  },
  badgeCancelled: {
    backgroundColor: '#F9D8D0',
  },
  textCancelled: {
    color: '#A83220',
  },
  badgeShipped: {
    backgroundColor: '#E5D7C5',
  },
  textShipped: {
    color: '#263C29',
  },
  badgeProcessing: {
    backgroundColor: '#F0E4D4',
  },
  textProcessing: {
    color: '#A85E2B',
  },
});

