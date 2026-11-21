import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package, Hourglass, Truck, CheckCircle2 } from 'lucide-react-native';

export default function ArtisanOrderStatsGrid({ stats }) {
  const safeStats = stats || {
    total: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
  };

  const statCards = [
    {
      id: 'total',
      label: 'Total Orders',
      value: safeStats.total ?? 0,
      icon: Package,
      bgColor: '#FDF7ED',
      borderColor: '#EFE3D3',
      textColor: '#1A3323',
      iconColor: '#A65E32',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: safeStats.pending ?? 0,
      icon: Hourglass,
      bgColor: '#FFFBF0',
      borderColor: '#FBE8C3',
      textColor: '#9E6700',
      iconColor: '#D97706',
    },
    {
      id: 'shipped',
      label: 'Shipped',
      value: safeStats.shipped ?? 0,
      icon: Truck,
      bgColor: '#F2F8F5',
      borderColor: '#D4E8DC',
      textColor: '#1A4D2E',
      iconColor: '#1A4D2E',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      value: safeStats.delivered ?? 0,
      icon: CheckCircle2,
      bgColor: '#F4FAF4',
      borderColor: '#D9ECD9',
      textColor: '#1E6637',
      iconColor: '#2D8A4E',
    },
  ];

  return (
    <View style={styles.gridContainer}>
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <View
            key={card.id}
            style={[
              styles.card,
              {
                backgroundColor: card.bgColor,
                borderColor: card.borderColor,
              },
            ]}
          >
            <View style={styles.iconWrapper}>
              <IconComponent size={20} color={card.iconColor} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, { color: card.textColor }]}>
              {card.value}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {card.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: 74,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'System',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#635B50',
    textAlign: 'center',
  },
});
