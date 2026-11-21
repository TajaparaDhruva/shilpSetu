import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Edit2, Copy, Trash2, MoreVertical, AlertTriangle } from 'lucide-react-native';
import { getProductRealImage } from '@/services/productImageService';

export default function ManageProductCard({
  product,
  viewMode = 'list',
  onEdit,
  onDuplicate,
  onDelete,
  onQuickStock,
}) {
  const stock = Number(product.stock !== undefined ? product.stock : product.stock_quantity || 0);
  const price = Number(product.price || 0);
  const name = product.name || product.product_name || 'Handmade Craft';
  const category = product.category || product.category_name || 'Handicrafts';

  // Stock status determination
  let statusBadgeStyle = styles.badgeInStock;
  let statusTextStyle = styles.textInStock;
  let statusLabel = `In Stock (${stock})`;

  if (stock <= 0) {
    statusBadgeStyle = styles.badgeOutOfStock;
    statusTextStyle = styles.textOutOfStock;
    statusLabel = 'Out of Stock';
  } else if (stock <= 5) {
    statusBadgeStyle = styles.badgeLowStock;
    statusTextStyle = styles.textLowStock;
    statusLabel = `Low Stock (${stock})`;
  }

  const rawImage = product.image_urls?.[0] || product.images?.[0] || product.imageUrl || product.image_url;
  const imageSource = getProductRealImage(product.category_name || product.category || 'pottery', rawImage);

  if (viewMode === 'grid') {
    return (
      <View style={styles.gridCard}>
        <View style={styles.gridImageWrap}>
          <Image
            source={imageSource}
            style={styles.gridImage}
            contentFit="cover"
            transition={150}
          />
          <View style={[styles.statusBadge, statusBadgeStyle, styles.gridStatusBadge]}>
            <Text style={[styles.statusText, statusTextStyle]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.gridCategory} numberOfLines={1}>
            {category}
          </Text>
          <Text style={styles.gridPrice}>₹{price.toLocaleString('en-IN')}</Text>

          {/* Action Row */}
          <View style={styles.gridActionRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => onEdit(product)}
              accessibilityLabel="Edit product"
            >
              <Edit2 size={16} color="#4A453E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => onDuplicate(product)}
              accessibilityLabel="Duplicate product"
            >
              <Copy size={16} color="#4A453E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => onDelete(product)}
              accessibilityLabel="Delete product"
            >
              <Trash2 size={16} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => onQuickStock(product)}
              accessibilityLabel="Update stock"
            >
              <MoreVertical size={16} color="#4A453E" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // List View (Matching exact uploaded reference card)
  return (
    <View style={styles.listCard}>
      {/* Product Image */}
      <View style={styles.listImageWrap}>
        <Image
          source={imageSource}
          style={styles.listImage}
          contentFit="cover"
          transition={150}
        />
      </View>

      {/* Middle Details */}
      <View style={styles.listContent}>
        <Text style={styles.productName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.productCategory} numberOfLines={1}>
          {category}
        </Text>

        <View style={styles.priceStockRow}>
          <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
          <View style={[styles.statusBadge, statusBadgeStyle]}>
            <Text style={[styles.statusText, statusTextStyle]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Right Actions */}
      <View style={styles.actionsColumn}>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => onEdit(product)}
            accessibilityLabel="Edit product"
          >
            <Edit2 size={17} color="#4A453E" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => onDuplicate(product)}
            accessibilityLabel="Duplicate product"
          >
            <Copy size={17} color="#4A453E" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => onDelete(product)}
            accessibilityLabel="Delete product"
          >
            <Trash2 size={17} color="#C53030" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => onQuickStock(product)}
            accessibilityLabel="More options"
          >
            <MoreVertical size={17} color="#4A453E" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // List Layout
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    shadowColor: '#25251F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  listImageWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EBE2D5',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  productCategory: {
    fontSize: 12,
    color: '#7C7365',
    marginBottom: 6,
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173D2B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeInStock: {
    backgroundColor: '#E3F2E1',
  },
  textInStock: {
    color: '#1E6B24',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeLowStock: {
    backgroundColor: '#FDF0D5',
  },
  textLowStock: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeOutOfStock: {
    backgroundColor: '#FDE8E8',
  },
  textOutOfStock: {
    color: '#C53030',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsColumn: {
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#F5EBE0',
    borderWidth: 1,
    borderColor: '#E8DED2',
  },

  // Grid Layout
  gridCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FBF5EB',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    shadowColor: '#25251F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  gridImageWrap: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EBE2D5',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridStatusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  gridInfo: {
    marginTop: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 2,
  },
  gridCategory: {
    fontSize: 11,
    color: '#7C7365',
    marginBottom: 4,
  },
  gridPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#173D2B',
    marginBottom: 8,
  },
  gridActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECE2D3',
  },
});

