import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const catPottery = require('@/assets/images/shilpsetu/cat-pottery.svg');
const catTextiles = require('@/assets/images/shilpsetu/cat-textiles.svg');
const catJewellery = require('@/assets/images/shilpsetu/cat-jewellery.svg');
const catHomedecor = require('@/assets/images/shilpsetu/cat-homedecor.svg');
const catAll = require('@/assets/images/shilpsetu/cat-all.svg');

export const EXPLORE_CATEGORIES = [
  { id: 'all', name: 'All', slug: 'all', icon: catAll },
  { id: 'pottery', name: 'Pottery', slug: 'pottery', icon: catPottery },
  { id: 'textiles', name: 'Textiles', slug: 'textiles', icon: catTextiles },
  { id: 'jewellery', name: 'Jewellery', slug: 'jewellery', icon: catJewellery },
  { id: 'decor', name: 'Decor', slug: 'decor', icon: catHomedecor },
];

export default function ExploreCategories({
  categories = EXPLORE_CATEGORIES,
  selectedCategory = 'all',
  onSelectCategory,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isSelected =
            selectedCategory === cat.slug ||
            selectedCategory === cat.name ||
            (selectedCategory === 'all' && cat.slug === 'all');

          return (
            <TouchableOpacity
              key={cat.id || cat.slug}
              style={[
                styles.categoryCard,
                isSelected ? styles.selectedCard : styles.unselectedCard,
              ]}
              onPress={() => onSelectCategory && onSelectCategory(cat.slug)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter by ${cat.name}`}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected ? styles.selectedIconBg : styles.unselectedIconBg,
                ]}
              >
                <Image
                  source={cat.icon || catAll}
                  style={[
                    styles.icon,
                    isSelected ? styles.selectedIconTint : null,
                  ]}
                  contentFit="contain"
                />
              </View>

              <Text
                style={[
                  styles.categoryName,
                  isSelected ? styles.selectedText : styles.unselectedText,
                ]}
              >
                {cat.name}
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
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  unselectedCard: {
    backgroundColor: '#FBF5EB',
    borderColor: '#E5D7C5',
  },
  selectedCard: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  selectedIconBg: {},
  unselectedIconBg: {},
  icon: {
    width: 24,
    height: 24,
  },
  selectedIconTint: {
    tintColor: '#FFFFFF',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  unselectedText: {
    color: '#25251F',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});

