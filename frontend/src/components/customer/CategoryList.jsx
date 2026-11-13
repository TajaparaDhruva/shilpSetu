import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const catPottery = require('@/assets/images/shilpsetu/cat-pottery.svg');
const catTextiles = require('@/assets/images/shilpsetu/cat-textiles.svg');
const catJewellery = require('@/assets/images/shilpsetu/cat-jewellery.svg');
const catHomeDecor = require('@/assets/images/shilpsetu/cat-homedecor.svg');
const catMore = require('@/assets/images/shilpsetu/cat-more.svg');

const ICON_MAP = {
  pottery: catPottery,
  textiles: catTextiles,
  jewellery: catJewellery,
  homedecor: catHomeDecor,
  'home-decor': catHomeDecor,
  more: catMore,
};

export default function CategoryList({
  categories = [],
  selectedCategory = null,
  onSelectCategory,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const iconSource = ICON_MAP[cat.icon] || catMore;

          return (
            <TouchableOpacity
              key={cat.id || cat.name}
              style={styles.categoryItem}
              activeOpacity={0.75}
              onPress={() => onSelectCategory && onSelectCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Category ${cat.name}`}
            >
              <View
                style={[
                  styles.circleContainer,
                  isSelected && styles.circleSelected,
                ]}
              >
                <Image
                  source={iconSource}
                  style={styles.categoryIcon}
                  contentFit="contain"
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  circleContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3EBE0',
    borderWidth: 1,
    borderColor: '#E6DCCF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  circleSelected: {
    borderColor: '#263C29',
    backgroundColor: '#E5DDCF',
    borderWidth: 1.8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ShilpColors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#263C29',
    fontWeight: '700',
  },
});

