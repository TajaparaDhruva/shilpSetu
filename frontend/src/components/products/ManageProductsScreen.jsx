import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  Package,
} from 'lucide-react-native';

import ArtisanDashboardHeader from '@/components/artisan-dashboard/ArtisanDashboardHeader';
import ArtisanBottomNavigation from '@/components/artisan-dashboard/ArtisanBottomNavigation';
import ArtisanNavigationDrawer from '@/components/artisan-dashboard/ArtisanNavigationDrawer';
import InventoryStatsGrid from './InventoryStatsGrid';
import ManageProductCard from './ManageProductCard';
import QuickStockModal from './QuickStockModal';

import {
  getMyProducts,
  getArtisanInventoryStats,
  deleteProduct,
  duplicateProduct,
  updateProductStock,
} from '@/services/productService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'name_az', label: 'Name: A to Z' },
  { id: 'stock_low', label: 'Stock: Low to High' },
];

export default function ManageProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Artisan Profile & Navigation State
  const [artisan, setArtisan] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Products Data
  const [products, setProducts] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [sortOption, setSortOption] = useState('newest');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Quick Stock Modal
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  // Action busy indicators
  const [actionBusy, setActionBusy] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [pProfile, myProds, invStats] = await Promise.all([
        getArtisanDashboardProfile().catch(() => null),
        getMyProducts().catch(() => []),
        getArtisanInventoryStats().catch(() => null),
      ]);
      if (pProfile) setArtisan(pProfile);
      setProducts(Array.isArray(myProds) ? myProds : []);
      if (invStats) setServerStats(invStats);
    } catch (err) {
      console.warn('Failed to load manage products data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload when screen gains focus (e.g. after adding or editing a craft)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Inventory Statistics Computation
  const stats = useMemo(() => {
    if (serverStats && serverStats.total !== undefined) {
      return serverStats;
    }

    let total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const s = Number(p.stock !== undefined ? p.stock : p.stock_quantity || 0);
      if (s <= 0) {
        outOfStock++;
      } else if (s <= 5) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { total, inStock, lowStock, outOfStock };
  }, [products, serverStats]);

  // Dynamic Filtering & Search
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search across name, category, and tags
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        const nameMatch = (p.name || p.product_name || '').toLowerCase().includes(query);
        const catMatch = (p.category || p.category_name || '').toLowerCase().includes(query);
        const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase().includes(query));
        return nameMatch || catMatch || tagMatch;
      });
    }

    // 2. Tab Filter: All, In Stock, Low Stock, Out of Stock
    if (activeFilter === 'in_stock') {
      result = result.filter((p) => {
        const s = Number(p.stock !== undefined ? p.stock : p.stock_quantity || 0);
        return s > 5;
      });
    } else if (activeFilter === 'low_stock') {
      result = result.filter((p) => {
        const s = Number(p.stock !== undefined ? p.stock : p.stock_quantity || 0);
        return s > 0 && s <= 5;
      });
    } else if (activeFilter === 'out_of_stock') {
      result = result.filter((p) => {
        const s = Number(p.stock !== undefined ? p.stock : p.stock_quantity || 0);
        return s <= 0;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      const priceA = Number(a.price || 0);
      const priceB = Number(b.price || 0);
      const stockA = Number(a.stock !== undefined ? a.stock : a.stock_quantity || 0);
      const stockB = Number(b.stock !== undefined ? b.stock : b.stock_quantity || 0);
      const nameA = (a.name || a.product_name || '').toLowerCase();
      const nameB = (b.name || b.product_name || '').toLowerCase();

      switch (sortOption) {
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'price_low':
          return priceA - priceB;
        case 'price_high':
          return priceB - priceA;
        case 'name_az':
          return nameA.localeCompare(nameB);
        case 'stock_low':
          return stockA - stockB;
        case 'newest':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    return result;
  }, [products, searchQuery, activeFilter, sortOption]);

  // Actions
  const handleEdit = (product) => {
    router.push(`/(artisan)/products/edit/${product.id}`);
  };

  const handleDuplicate = async (product) => {
    setActionBusy(true);
    try {
      const res = await duplicateProduct(product);
      if (res.success) {
        Alert.alert('Product Duplicated', `Created a copy of "${product.name || product.product_name}".`);
        loadData();
      } else {
        Alert.alert('Duplicate Failed', res.error || 'Unable to copy product.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${product.name || product.product_name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionBusy(true);
            try {
              const res = await deleteProduct(product.id);
              if (res.success) {
                setProducts((prev) => prev.filter((p) => p.id !== product.id));
                Alert.alert('Success', 'Product removed successfully.');
              } else {
                Alert.alert('Error', res.error || 'Failed to delete product.');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenStockModal = (product) => {
    setSelectedProductForStock(product);
    setStockModalVisible(true);
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const res = await updateProductStock(productId, newStock);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: newStock, stock_quantity: newStock } : p))
        );
      } else {
        Alert.alert('Update Failed', res.error || 'Unable to update stock.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Bottom Navigation tabs handler
  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      router.replace('/(artisan)/dashboard');
    } else if (tabKey === 'products') {
      // already on products
    } else if (tabKey === 'orders') {
      router.push('/(artisan)/orders');
    } else if (tabKey === 'earnings') {
      router.push('/(artisan)/earnings');
    } else if (tabKey === 'profile') {
      router.push('/(artisan)/profile');
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortOption)?.label || 'Newest';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Top Header */}
      <ArtisanDashboardHeader
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => Alert.alert('Notifications', 'No unread notifications.')}
        onProfilePress={() => router.push('/(artisan)/profile')}
        artisanAvatar={artisan?.avatarUrl}
        isOnline={artisan?.isOnline ?? true}
      />

      {/* FlatList rendering the full Manage Products experience */}
      <FlatList
        data={filteredProducts}
        key={viewMode === 'grid' ? 'grid-view' : 'list-view'}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => String(item.id || item.product_name)}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 105 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary || '#173D2B'}
          />
        }
        ListHeaderComponent={
          <>
            {/* Title Section with decorative botanical branch */}
            <View style={styles.titleSection}>
              <View style={styles.branchDecor} pointerEvents="none">
                <Image
                  source={topRightBranch}
                  style={styles.branchImage}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.headingTitle}>Manage Products</Text>
              <Text style={styles.headingSubtitle}>
                Add, edit, update stock and organize your listings
              </Text>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarRow}>
              <View style={styles.searchInputWrap}>
                <Search size={18} color="#7C7365" strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products by name, category or tag..."
                  placeholderTextColor="#8C8375"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>
              <TouchableOpacity
                style={styles.filterBtn}
                activeOpacity={0.7}
                onPress={() => setSortModalVisible(true)}
                accessibilityLabel="Sort and filter options"
              >
                <SlidersHorizontal size={18} color="#25251F" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Filter Pill Tabs (All, In Stock, Low Stock, Out of Stock) */}
            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[styles.pill, activeFilter === 'all' && styles.pillActive]}
                activeOpacity={0.75}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.pillText, activeFilter === 'all' && styles.pillTextActive]}>
                  All ({stats.total})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pill, activeFilter === 'in_stock' && styles.pillActive]}
                activeOpacity={0.75}
                onPress={() => setActiveFilter('in_stock')}
              >
                <Text style={[styles.pillText, activeFilter === 'in_stock' && styles.pillTextActive]}>
                  In Stock ({stats.inStock})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pill, activeFilter === 'low_stock' && styles.pillActive]}
                activeOpacity={0.75}
                onPress={() => setActiveFilter('low_stock')}
              >
                <Text style={[styles.pillText, activeFilter === 'low_stock' && styles.pillTextActive]}>
                  Low Stock ({stats.lowStock})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pill, activeFilter === 'out_of_stock' && styles.pillActive]}
                activeOpacity={0.75}
                onPress={() => setActiveFilter('out_of_stock')}
              >
                <Text style={[styles.pillText, activeFilter === 'out_of_stock' && styles.pillTextActive]}>
                  Out of Stock ({stats.outOfStock})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inventory Statistics (4 cards matching screenshot) */}
            <InventoryStatsGrid stats={stats} />

            {/* Sorting & Layout Switcher Bar */}
            <View style={styles.layoutBar}>
              <Text style={styles.resultsCount}>
                {filteredProducts.length} Product{filteredProducts.length === 1 ? '' : 's'}
              </Text>

              <View style={styles.layoutControlsRight}>
                {/* Sort Dropdown Selector */}
                <TouchableOpacity
                  style={styles.sortSelector}
                  activeOpacity={0.75}
                  onPress={() => setSortModalVisible(true)}
                >
                  <Text style={styles.sortSelectorText}>Sort: {currentSortLabel}</Text>
                  <ChevronDown size={14} color="#25251F" strokeWidth={2} />
                </TouchableOpacity>

                {/* Grid / List View Toggle */}
                <View style={styles.viewToggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setViewMode('grid')}
                  >
                    <LayoutGrid
                      size={16}
                      color={viewMode === 'grid' ? '#F8F0E3' : '#7C7365'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setViewMode('list')}
                  >
                    <List
                      size={16}
                      color={viewMode === 'list' ? '#F8F0E3' : '#7C7365'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ManageProductCard
            product={item}
            viewMode={viewMode}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onQuickStock={handleOpenStockModal}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#173D2B" />
              <Text style={styles.centerMsg}>Loading inventory catalog...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Package size={44} color="#A65E32" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>
                {searchQuery || activeFilter !== 'all' ? 'No Matching Products' : 'No Products Added Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search query or switching active inventory filters.'
                  : 'Start showcasing your handcrafted creations to thousands of craft lovers across India.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(artisan)/products/add')}
              >
                <Plus size={16} color="#F8F0E3" strokeWidth={2.5} />
                <Text style={styles.emptyAddBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Floating Add Product Button */}
      <TouchableOpacity
        style={[styles.fabButton, { bottom: insets.bottom + 72 }]}
        activeOpacity={0.9}
        onPress={() => router.push('/(artisan)/products/add')}
        accessibilityRole="button"
        accessibilityLabel="Add New Product"
      >
        <Plus size={18} color="#F8F0E3" strokeWidth={2.5} />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>

      {/* Sort Selection Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sortSheet}>
                <Text style={styles.sortSheetTitle}>Sort Inventory By</Text>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortOption === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.sortSheetRow, isSelected && styles.sortSheetRowActive]}
                      onPress={() => {
                        setSortOption(opt.id);
                        setSortModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sortSheetRowText,
                          isSelected && styles.sortSheetRowTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Quick Stock Modal */}
      <QuickStockModal
        visible={stockModalVisible}
        product={selectedProductForStock}
        onClose={() => {
          setStockModalVisible(false);
          setSelectedProductForStock(null);
        }}
        onUpdateStock={handleStockUpdate}
      />

      {/* Navigation Drawer */}
      <ArtisanNavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        artisan={artisan}
        onSelectOption={(optionId) => {
          if (optionId === 'dashboard') router.replace('/(artisan)/dashboard');
          else if (optionId === 'add_product') router.push('/(artisan)/products/add');
          else if (optionId === 'profile') router.push('/(artisan)/profile');
          else if (optionId === 'ai_assistant') router.push('/(artisan)/ai-assistant');
          else if (optionId === 'orders') Alert.alert('Orders', 'Viewing orders...');
          else if (optionId === 'earnings') Alert.alert('Earnings', 'Opening revenue dashboard...');
          else if (optionId === 'switch_customer') router.replace('/(customer)/home');
        }}
      />

      {/* Artisan Bottom Navigation (Products highlighted) */}
      <ArtisanBottomNavigation
        activeTab="products"
        onTabPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  contentContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  titleSection: {
    marginBottom: 16,
    position: 'relative',
  },
  branchDecor: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 140,
    height: 110,
    opacity: 0.65,
  },
  branchImage: {
    width: '100%',
    height: '100%',
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#173D2B',
    letterSpacing: -0.5,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  headingSubtitle: {
    fontSize: 13,
    color: '#6B665E',
    lineHeight: 18,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#25251F',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FBF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE5D8',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E8DED2',
  },
  pillActive: {
    backgroundColor: '#173D2B',
    borderColor: '#173D2B',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C5449',
  },
  pillTextActive: {
    color: '#F8F0E3',
  },
  layoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#25251F',
  },
  layoutControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E8DED2',
    gap: 6,
  },
  sortSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F0E5D6',
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#173D2B',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#173D2B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#173D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8F0E3',
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMsg: {
    marginTop: 12,
    fontSize: 14,
    color: '#7C7365',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE5D8',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#25251F',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7C7365',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#173D2B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8F0E3',
  },

  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 30, 24, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortSheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FBF5EB',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFE5D8',
  },
  sortSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173D2B',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D2',
    paddingBottom: 8,
  },
  sortSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  sortSheetRowActive: {
    backgroundColor: '#EAE1D3',
  },
  sortSheetRowText: {
    fontSize: 14,
    color: '#4A453E',
    fontWeight: '600',
  },
  sortSheetRowTextActive: {
    color: '#173D2B',
    fontWeight: '800',
  },
  checkMark: {
    fontSize: 14,
    color: '#173D2B',
    fontWeight: '800',
  },
});

