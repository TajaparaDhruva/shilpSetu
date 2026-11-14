import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export const INITIAL_CATEGORIES = [
  { id: 'pottery', name: 'Pottery & Ceramics', icon: '🏺' },
  { id: 'textiles', name: 'Textiles & Handlooms', icon: '🧵' },
  { id: 'jewellery', name: 'Jewellery', icon: '✨' },
  { id: 'woodcrafts', name: 'Woodcrafts', icon: '🪵' },
  { id: 'homedecor', name: 'Home Decor', icon: '🏮' },
  { id: 'paintings', name: 'Paintings', icon: '🎨' },
  { id: 'accessories', name: 'Accessories', icon: '📿' },
  { id: 'other', name: 'Other', icon: '📦' },
];

export default function ProductCategoryPicker({
  selectedCategory,
  onSelectCategory,
  categories = INITIAL_CATEGORIES,
  error = null,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const currentCategory =
    categories.find((c) => c.name === selectedCategory || c.id === selectedCategory) ||
    categories[0];

  const handleSelect = (category) => {
    onSelectCategory(category.name);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Category <Text style={styles.required}>*</Text>
      </Text>

      {/* Dropdown trigger button */}
      <TouchableOpacity
        style={[styles.selectorButton, error && styles.errorSelector]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Select craft category"
      >
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryIcon}>{currentCategory?.icon || '🏺'}</Text>
          <Text style={styles.categoryName}>{currentCategory?.name || selectedCategory || 'Select Category'}</Text>
        </View>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Category selection modal */}
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
                <Text style={styles.modalTitle}>Choose Craft Category</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id || item.name}
                  renderItem={({ item }) => {
                    const isSelected = item.name === selectedCategory;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.optionIcon}>{item.icon || '🏷️'}</Text>
                        <Text
                          style={[
                            styles.optionName,
                            isSelected && styles.optionNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 6,
  },
  required: {
    color: '#C94A29',
    fontWeight: '700',
  },
  selectorButton: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorSelector: {
    borderColor: '#C94A29',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
  },
  chevron: {
    fontSize: 18,
    color: '#8A8478',
  },
  errorText: {
    color: '#C94A29',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#F8F0E3',
    borderRadius: 20,
    padding: 20,
    maxHeight: 420,
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 14,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionItemSelected: {
    backgroundColor: '#F0E4D4',
  },
  optionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  optionName: {
    flex: 1,
    fontSize: 14,
    color: ShilpColors.primaryText || '#25251F',
    fontWeight: '500',
  },
  optionNameSelected: {
    fontWeight: '700',
    color: ShilpColors.primary || '#263C29',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: ShilpColors.primary || '#263C29',
  },
});

