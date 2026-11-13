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

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');

const COLLECTION_IMAGES = {
  woodcrafts: colWoodcrafts,
  handlooms: colHandlooms,
  accessories: colAccessories,
};

export default function FeaturedCollections({
  collections = [],
  onSelectCollection,
  onViewAllPress,
}) {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Featured Collections</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="View all collections"
        >
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* 3 Horizontal Collection Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {collections.map((col) => {
          const imageSource = COLLECTION_IMAGES[col.imageKey] || colWoodcrafts;

          return (
            <TouchableOpacity
              key={col.id || col.name}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelectCollection && onSelectCollection(col)}
              accessibilityRole="button"
              accessibilityLabel={`Collection ${col.name}`}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={imageSource}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              </View>
              <View style={styles.labelTab}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {col.name}
                </Text>
              </View>
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
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A85E2B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  card: {
    width: 116,
    height: 128,
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 94,
    backgroundColor: '#EDE4D6',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  labelTab: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ShilpColors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'center',
  },
});

