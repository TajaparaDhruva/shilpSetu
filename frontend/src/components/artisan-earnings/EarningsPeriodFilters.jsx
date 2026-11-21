import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const FILTERS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: 'Last 3 Months' },
  { id: 'this_year', label: 'This Year' },
];

export default function EarningsPeriodFilters({ activeFilter, onSelectFilter }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelectFilter(item.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {item.label}
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
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 16,
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
