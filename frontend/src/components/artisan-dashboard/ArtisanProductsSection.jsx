import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import { getProductRealImage } from '@/services/productImageService';

export default function ArtisanProductsSection({
  products = [],
  loading = false,
  onAddPress,
  onEditPress,
  onViewProductPress,
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={ShilpColors.primary || '#263C29'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>My Listed Crafts</Text>
          <Text style={styles.subtitle}>
            {products.length} {products.length === 1 ? 'item' : 'items'} in your active store
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={onAddPress}
        >
          <Text style={styles.addButtonText}>+ Add Craft</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No products listed yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your handmade pottery, textiles, or jewelry to showcase them to buyers across India.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            activeOpacity={0.85}
            onPress={onAddPress}
          >
            <Text style={styles.emptyAddBtnText}>List Your First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id || item.product_id || Math.random())}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const rawImg = item.image_url || (Array.isArray(item.image_urls) ? item.image_urls[0] : null);
            const imageSource = getProductRealImage(item.imageKey || item.category, rawImg);
            const price = Number(item.price || 0);
            const stock = item.stock_quantity ?? item.stock ?? 0;

            return (
              <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.88}
                onPress={() => onViewProductPress && onViewProductPress(item)}
              >
                <View style={styles.cardImageContainer}>
                  <Image
                    source={imageSource}
                    style={styles.productImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.stockBadge}>
                    <Text style={styles.stockText}>Stock: {stock}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {item.category || item.category_name || 'Handicraft'}
                  </Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name || item.product_name || 'Handmade Craft'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{price.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#263C29',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#F8F0E3',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7C7365',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyAddBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  emptyAddBtnText: {
    color: '#F8F0E3',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    gap: 12,
    paddingRight: 8,
  },
  productCard: {
    width: 170,
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  cardImageContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#ECE3D4',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(38, 60, 41, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    padding: 10,
  },
  categoryText: {
    fontSize: 10,
    color: '#A85E2B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263C29',
  },
  editBtn: {
    backgroundColor: '#ECE3D4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#263C29',
  },
});

