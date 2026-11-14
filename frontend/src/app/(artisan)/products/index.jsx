import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { getMyProducts, deleteProduct } from '@/services/productService';
import { getProductRealImage } from '@/services/productImageService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const backIcon = require('@/assets/images/shilpsetu/icon-back.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');

export default function ManageProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const items = await getMyProducts();
      setProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to load artisan products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleEdit = (product) => {
    router.push(`/(artisan)/products/edit/${product.id}`);
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to deactivate "${product.name || product.product_name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteProduct(product.id);
            if (res.success) {
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              Alert.alert('Success', 'Product removed from your active store.');
            } else {
              Alert.alert('Error', res.error || 'Failed to remove product.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <Image source={lotusLogo} style={styles.lotusLogo} contentFit="contain" />
          <Text style={styles.brandTitle}>
            <Text style={styles.brandShilp}>Shilp</Text>
            <Text style={styles.brandSetu}>Setu</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/(artisan)/products/add')}
        >
          <Text style={styles.addBtnHeaderText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Manage Products</Text>
        <Text style={styles.pageSubtitle}>
          {products.length} {products.length === 1 ? 'craft' : 'crafts'} active in your catalog
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={ShilpColors.primary || '#263C29'} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏺</Text>
          <Text style={styles.emptyHeading}>No products listed yet</Text>
          <Text style={styles.emptyDesc}>
            Start selling your handcrafted pottery, textiles, jewellery and decor by listing your first product.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => router.push('/(artisan)/products/add')}
          >
            <Text style={styles.emptyActionBtnText}>+ Add New Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#263C29"
            />
          }
          renderItem={({ item }) => {
            const rawImg = item.image_url || (Array.isArray(item.image_urls) ? item.image_urls[0] : null);
            const imageSource = getProductRealImage(item.imageKey || item.category, rawImg);
            const price = Number(item.price || 0);
            const stock = item.stock_quantity ?? item.stock ?? 0;

            return (
              <View style={styles.productCard}>
                <Image
                  source={imageSource}
                  style={styles.productThumb}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productCategory}>
                    {item.category || item.category_name || 'Handicraft'}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name || item.product_name}
                  </Text>
                  <Text style={styles.productPrice}>₹{price.toLocaleString('en-IN')}</Text>
                  <Text style={styles.productStock}>Stock: {stock} units</Text>
                </View>

                <View style={styles.actionColumn}>
                  <TouchableOpacity
                    style={styles.editActionBtn}
                    onPress={() => handleEdit(item)}
                  >
                    <Text style={styles.editActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteActionBtn}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.deleteActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#F8F0E3',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lotusLogo: {
    width: 26,
    height: 26,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  brandShilp: {
    color: '#263C29',
  },
  brandSetu: {
    color: '#A85E2B',
  },
  addBtnHeader: {
    backgroundColor: '#263C29',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addBtnHeaderText: {
    color: '#F8F0E3',
    fontSize: 13,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#7C7365',
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#7C7365',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  emptyActionBtnText: {
    color: '#F8F0E3',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    alignItems: 'center',
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#ECE3D4',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productCategory: {
    fontSize: 10,
    color: '#A85E2B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263C29',
    marginTop: 4,
  },
  productStock: {
    fontSize: 11,
    color: '#7C7365',
    marginTop: 2,
  },
  actionColumn: {
    gap: 8,
    marginLeft: 8,
  },
  editActionBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  editActionText: {
    color: '#F8F0E3',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteActionBtn: {
    backgroundColor: '#ECE3D4',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  deleteActionText: {
    color: '#A85E2B',
    fontSize: 12,
    fontWeight: '600',
  },
});

