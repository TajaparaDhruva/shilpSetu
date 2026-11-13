import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const iconClose = require('@/assets/images/shilpsetu/icon-close.svg');
const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

const FILTER_CATEGORIES = ['All', 'Pottery', 'Textiles', 'Jewellery', 'Decor'];
const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0];

export default function ProductFilterModal({
  visible = false,
  onClose,
  onApply,
  initialFilters = {},
}) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [category, setCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [minRating, setMinRating] = useState(null);

  useEffect(() => {
    if (visible) {
      setMinPrice(initialFilters.minPrice ? String(initialFilters.minPrice) : '');
      setMaxPrice(initialFilters.maxPrice ? String(initialFilters.maxPrice) : '');
      setCategory(initialFilters.category || 'All');
      setInStockOnly(
        initialFilters.inStockOnly !== undefined ? initialFilters.inStockOnly : true
      );
      setMinRating(initialFilters.minRating || null);
    }
  }, [visible, initialFilters]);

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setCategory('All');
    setInStockOnly(true);
    setMinRating(null);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        category: category === 'All' ? null : category,
        inStockOnly,
        minRating,
      });
    }
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
            >
              <Image source={iconClose} style={styles.closeIcon} contentFit="contain" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Price Range (₹)</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor="#8A8275"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                </View>
                <Text style={styles.priceDivider}>to</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor="#8A8275"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.chipGroup}>
                {FILTER_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Availability */}
            <View style={[styles.section, styles.switchRow]}>
              <View>
                <Text style={styles.sectionLabel}>Availability</Text>
                <Text style={styles.sectionSubtext}>Only show products in stock</Text>
              </View>
              <Switch
                value={inStockOnly}
                onValueChange={setInStockOnly}
                trackColor={{ false: '#E5D7C5', true: '#263C29' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Minimum Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Minimum Rating</Text>
              <View style={styles.chipGroup}>
                {RATING_OPTIONS.map((rat) => {
                  const isSelected = minRating === rat;
                  return (
                    <TouchableOpacity
                      key={rat}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                      onPress={() => setMinRating(isSelected ? null : rat)}
                    >
                      <Image source={starIcon} style={styles.starIcon} contentFit="contain" />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {rat} & above
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8F0E3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: Platform.select({ ios: 34, default: 20 }),
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5D7C5',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  section: {
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 8,
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#8A8275',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
  },
  currencyPrefix: {
    fontSize: 14,
    color: '#8A8275',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    color: '#25251F',
  },
  priceDivider: {
    fontSize: 14,
    color: '#8A8275',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: '#FBF5EB',
    borderColor: '#E5D7C5',
  },
  chipSelected: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  chipText: {
    fontSize: 13,
  },
  chipTextUnselected: {
    color: '#25251F',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5D7C5',
  },
  resetButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 23,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8275',
  },
  applyButton: {
    flex: 2,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#263C29',
    borderRadius: 23,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

