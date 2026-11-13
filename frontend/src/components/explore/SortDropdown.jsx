import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconChevronDown = require('@/assets/images/shilpsetu/icon-chevron-down.svg');
const iconFilter = require('@/assets/images/shilpsetu/icon-filter.svg');

export const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_low_high', label: 'Price: Low to High' },
  { id: 'price_high_low', label: 'Price: High to Low' },
  { id: 'highest_rated', label: 'Highest Rated' },
];

export default function SortDropdown({
  selectedSort = 'popular',
  onSelectSort,
  onOpenFilter,
  activeFilterCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const currentOption =
    SORT_OPTIONS.find((opt) => opt.id === selectedSort) || SORT_OPTIONS[0];

  const handleSelect = (sortId) => {
    if (onSelectSort) {
      onSelectSort(sortId);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Sort By Dropdown Trigger */}
      <TouchableOpacity
        style={styles.sortTrigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${currentOption.label}`}
      >
        <Text style={styles.sortLabel}>
          Sort By: <Text style={styles.sortValue}>{currentOption.label}</Text>
        </Text>
        <Image
          source={iconChevronDown}
          style={styles.chevronIcon}
          contentFit="contain"
        />
      </TouchableOpacity>

      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilterCount > 0 ? styles.filterButtonActive : null,
        ]}
        onPress={onOpenFilter}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open filter sheet"
      >
        <Image
          source={iconFilter}
          style={[
            styles.filterIcon,
            activeFilterCount > 0 ? styles.filterIconActive : null,
          ]}
          contentFit="contain"
        />
        <Text
          style={[
            styles.filterText,
            activeFilterCount > 0 ? styles.filterTextActive : null,
          ]}
        >
          Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Sort Options Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Sort Products</Text>

                {SORT_OPTIONS.map((item) => {
                  const isSelected = item.id === selectedSort;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.optionRow,
                        isSelected ? styles.optionRowSelected : null,
                      ]}
                      onPress={() => handleSelect(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected ? styles.optionTextSelected : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    color: '#8A8275',
  },
  sortValue: {
    fontWeight: '600',
    color: '#25251F',
  },
  chevronIcon: {
    width: 14,
    height: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  filterIcon: {
    width: 14,
    height: 14,
  },
  filterIconActive: {
    tintColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#25251F',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#FBF5EB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    paddingVertical: 16,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionRowSelected: {
    backgroundColor: '#F0E4D4',
  },
  optionText: {
    fontSize: 14,
    color: '#25251F',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#263C29',
  },
  checkmark: {
    color: '#263C29',
    fontSize: 16,
    fontWeight: '700',
  },
});

