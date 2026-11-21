import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Hourglass,
  Cog,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';

export default function OrderStatusBadge({ status, style }) {
  const norm = String(status || 'pending').toLowerCase();

  let config = {
    label: 'Pending',
    textColor: '#A06800',
    bgColor: '#FFF5E0',
    borderColor: '#FFE0A3',
    icon: Hourglass,
  };

  if (norm === 'processing') {
    config = {
      label: 'Processing',
      textColor: '#1E58A6',
      bgColor: '#EDF4FC',
      borderColor: '#C6DDF6',
      icon: Cog,
    };
  } else if (norm === 'shipped' || norm === 'packed' || norm === 'out_for_delivery') {
    config = {
      label: 'Shipped',
      textColor: '#5B4EB3',
      bgColor: '#F1EFFB',
      borderColor: '#D4CCF3',
      icon: Truck,
    };
  } else if (norm === 'delivered' || norm === 'completed') {
    config = {
      label: 'Delivered',
      textColor: '#1B6A3B',
      bgColor: '#EAF6EE',
      borderColor: '#BFE4CC',
      icon: CheckCircle,
    };
  } else if (norm === 'cancelled' || norm === 'refunded') {
    config = {
      label: 'Cancelled',
      textColor: '#B82D24',
      bgColor: '#FDEEEB',
      borderColor: '#F6C3BC',
      icon: XCircle,
    };
  }

  const IconComp = config.icon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <IconComp size={12} color={config.textColor} strokeWidth={2.2} style={styles.icon} />
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
