import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconSearch = require('@/assets/images/shilpsetu/icon-search.svg');
const iconFilter = require('@/assets/images/shilpsetu/icon-filter.svg');
const iconClose = require('@/assets/images/shilpsetu/icon-close.svg');

export default function ExploreSearchBar({
  value = '',
  onChangeText,
  onFilterPress,
  placeholder = 'Search for products, artisans, or categories...',
  debounceMs = 350,
}) {
  const [internalValue, setInternalValue] = useState(value);

  // Synchronize when outer value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value && onChangeText) {
        onChangeText(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs]);

  const handleClear = () => {
    setInternalValue('');
    if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        {/* Search Icon */}
        <Image source={iconSearch} style={styles.searchIcon} contentFit="contain" />

        {/* Input */}
        <TextInput
          style={styles.input}
          value={internalValue}
          onChangeText={setInternalValue}
          placeholder={placeholder}
          placeholderTextColor="#8A8275"
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search input"
        />

        {/* Clear Icon if text is present */}
        {internalValue.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Image source={iconClose} style={styles.clearIcon} contentFit="contain" />
          </TouchableOpacity>
        )}

        {/* Vertical divider */}
        <View style={styles.divider} />

        {/* Filter Action Icon */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Image source={iconFilter} style={styles.filterIcon} contentFit="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingHorizontal: 14,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#25251F',
    paddingVertical: 0,
  },
  clearButton: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    width: 16,
    height: 16,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#E5D7C5',
    marginHorizontal: 10,
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    width: 18,
    height: 18,
  },
});

