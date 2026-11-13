import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const searchIcon = require('@/assets/images/shilpsetu/icon-search.svg');
const filterIcon = require('@/assets/images/shilpsetu/icon-filter.svg');

export default function HomeSearchBar({
  value,
  onChangeText,
  onSubmit,
  onPress,
  onFilterPress,
  placeholder = 'Search for handmade products...',
  editable = true,
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={editable ? 1 : 0.8}
        onPress={editable ? undefined : onPress}
      >
        <Image source={searchIcon} style={styles.searchIcon} contentFit="contain" />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ShilpColors.textPlaceholder}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          editable={editable}
          pointerEvents={editable ? 'auto' : 'none'}
        />

        <TouchableOpacity
          onPress={onFilterPress}
          style={styles.filterButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open filter"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image source={filterIcon} style={styles.filterIcon} contentFit="contain" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    width: '100%',
  },
  searchBar: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 0.5,
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
    height: '100%',
    fontSize: 14,
    color: ShilpColors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    paddingVertical: 0,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterIcon: {
    width: 20,
    height: 20,
  },
});

