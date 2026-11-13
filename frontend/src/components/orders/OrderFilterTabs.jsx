import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrderFilterTabs({ activeFilter = 'all', onSelectFilter }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((tab) => {
        const isSelected = activeFilter === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onSelectFilter && onSelectFilter(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  chipActive: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#25251F',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

