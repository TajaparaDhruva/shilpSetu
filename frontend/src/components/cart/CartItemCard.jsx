import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import CartQuantitySelector from './CartQuantitySelector';

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');
const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

const IMAGE_MAP = {
  woodcrafts: colWoodcrafts,
  handlooms: colHandlooms,
  accessories: colAccessories,
  pottery: bannerPottery,
};

/**
 * CartItemCard — single cart item card.
 * Props:
 *   item              {object}  cart item with item.product nested
 *   onQuantityChange  {func}    (id, newQty)
 *   onRemove          {func}    (id)
 *   onProductPress    {func}    (id)
 */
export default function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  onProductPress,
}) {
  const product = item?.product || {};
  const imageUrl =
    product.image_url ||
    (Array.isArray(product.image_urls) ? product.image_urls[0] : null);
  const fallbackAsset = product.imageKey ? IMAGE_MAP[product.imageKey] : null;
  const imageSource = imageUrl ? { uri: imageUrl } : (fallbackAsset || bannerPottery);
  const stock = product.stock ?? 99;
  const quantity = item?.quantity ?? 1;
  const nearStock = quantity >= stock;

  const handleIncrease = () => {
    if (quantity < stock) {
      onQuantityChange && onQuantityChange(item.id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange && onQuantityChange(item.id, quantity - 1);
    }
  };

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <TouchableOpacity
        onPress={() => onProductPress && onProductPress(product.id)}
        activeOpacity={0.85}
      >
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>

      {/* Details */}
      <View style={styles.details}>
        {/* Name */}
        <TouchableOpacity
          onPress={() => onProductPress && onProductPress(product.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.productName} numberOfLines={2}>
            {product.name || 'Unnamed Product'}
          </Text>
        </TouchableOpacity>

        {/* Artisan */}
        {!!product.artisan_name && (
          <Text style={styles.artisanName}>{product.artisan_name}</Text>
        )}

        {/* Price */}
        <Text style={styles.price}>₹{product.price ?? '—'}</Text>

        {/* Stock warning */}
        {nearStock && stock > 0 && (
          <Text style={styles.stockWarning}>Only {stock} left in stock!</Text>
        )}

        {/* Bottom row: quantity + delete */}
        <View style={styles.bottomRow}>
          <CartQuantitySelector
            quantity={quantity}
            stock={stock}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onRemove && onRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Remove item"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  productImage: {
    width: 90,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#F0E4D4',
    marginRight: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    lineHeight: 20,
    marginBottom: 2,
  },
  artisanName: {
    fontSize: 12,
    color: '#A85E2B',
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 4,
  },
  stockWarning: {
    fontSize: 11,
    color: '#D9534F',
    fontWeight: '600',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
});
