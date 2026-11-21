import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function ArtisanOrderStatusTabs({
  activeFilter = 'all',
  counts = {},
  onSelectFilter,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isSelected = activeFilter === tab.id;
          const count = counts[tab.id] ?? 0;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelectFilter(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[styles.pillText, isSelected && styles.pillTextSelected]}
              >
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E6DCCF',
  },
  pillSelected: {
    backgroundColor: '#173D2B',
    borderColor: '#173D2B',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4036',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
