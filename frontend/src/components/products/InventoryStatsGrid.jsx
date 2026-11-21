import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';

export default function InventoryStatsGrid({ stats = {} }) {
  const {
    total = 0,
    inStock = 0,
    lowStock = 0,
    outOfStock = 0,
  } = stats;

  return (
    <View style={styles.grid}>
      {/* 1. Total Products */}
      <View style={[styles.card, styles.totalCard]}>
        <View style={styles.iconWrap}>
          <Package size={22} color="#A65E32" strokeWidth={2} />
        </View>
        <Text style={[styles.value, styles.totalValue]}>{total}</Text>
        <Text style={styles.label}>Total</Text>
      </View>

      {/* 2. In Stock */}
      <View style={[styles.card, styles.inStockCard]}>
        <View style={styles.iconWrap}>
          <CheckCircle2 size={22} color="#2E7D32" strokeWidth={2} />
        </View>
        <Text style={[styles.value, styles.inStockValue]}>{inStock}</Text>
        <Text style={styles.label}>In Stock</Text>
      </View>

      {/* 3. Low Stock */}
      <View style={[styles.card, styles.lowStockCard]}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={22} color="#D97706" strokeWidth={2} />
        </View>
        <Text style={[styles.value, styles.lowStockValue]}>{lowStock}</Text>
        <Text style={styles.label}>Low Stock</Text>
      </View>

      {/* 4. Out of Stock */}
      <View style={[styles.card, styles.outOfStockCard]}>
        <View style={styles.iconWrap}>
          <XCircle size={22} color="#DC2626" strokeWidth={2} />
        </View>
        <Text style={[styles.value, styles.outOfStockValue]}>{outOfStock}</Text>
        <Text style={styles.label}>Out of Stock</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  totalCard: {
    backgroundColor: '#F8F1E7',
    borderColor: '#E8DBCB',
  },
  inStockCard: {
    backgroundColor: '#EDF7EE',
    borderColor: '#D0EBD2',
  },
  lowStockCard: {
    backgroundColor: '#FEF7E6',
    borderColor: '#F9E5B7',
  },
  outOfStockCard: {
    backgroundColor: '#FEECEC',
    borderColor: '#FACCCC',
  },
  iconWrap: {
    marginBottom: 6,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  totalValue: {
    color: '#25251F',
  },
  inStockValue: {
    color: '#1E6B24',
  },
  lowStockValue: {
    color: '#B45309',
  },
  outOfStockValue: {
    color: '#B91C1C',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B665E',
    textAlign: 'center',
  },
});

