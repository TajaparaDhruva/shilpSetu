import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingCart, Package, Star } from 'lucide-react-native';

export default function EarningsStatsCards({
  totalOrders = 0,
  productsSold = 0,
  averageRating = 0.0,
  totalReviews = 0,
}) {
  const cards = [
    {
      id: 'orders',
      label: 'Total Orders',
      value: String(totalOrders ?? 0),
      icon: ShoppingCart,
      bgColor: '#F0F8F3',
      borderColor: '#D4E8DC',
      iconColor: '#173D2B',
      textColor: '#173D2B',
      suffix: null,
    },
    {
      id: 'products_sold',
      label: 'Products Sold',
      value: String(productsSold ?? 0),
      icon: Package,
      bgColor: '#FFFBF2',
      borderColor: '#FBE8C3',
      iconColor: '#A65E32',
      textColor: '#2E2218',
      suffix: null,
    },
    {
      id: 'rating',
      label: 'Average Rating',
      value: Number(averageRating || 0) > 0 ? Number(averageRating).toFixed(1) : '0.0',
      icon: Star,
      bgColor: '#FFFDF0',
      borderColor: '#FDF0C8',
      iconColor: '#D97706',
      textColor: '#2E2218',
      suffix: '★',
    },
  ];

  return (
    <View style={styles.container}>
      {cards.map((c) => {
        const IconComp = c.icon;
        return (
          <View
            key={c.id}
            style={[
              styles.card,
              { backgroundColor: c.bgColor, borderColor: c.borderColor },
            ]}
          >
            <View style={styles.iconWrap}>
              <IconComp size={18} color={c.iconColor} strokeWidth={2.2} />
            </View>

            <Text style={styles.label} numberOfLines={1}>
              {c.label}
            </Text>

            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: c.textColor }]}>{c.value}</Text>
              {c.suffix && <Text style={styles.suffix}>{c.suffix}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 6,
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6E6458',
    marginBottom: 4,
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'System',
  },
  suffix: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '700',
  },
});
