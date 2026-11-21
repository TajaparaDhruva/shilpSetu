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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Search,
  SlidersHorizontal,
  Package,
} from 'lucide-react-native';

import ArtisanDashboardHeader from '@/components/artisan-dashboard/ArtisanDashboardHeader';
import ArtisanBottomNavigation from '@/components/artisan-dashboard/ArtisanBottomNavigation';
import ArtisanNavigationDrawer from '@/components/artisan-dashboard/ArtisanNavigationDrawer';
import ArtisanOrderStatsGrid from './ArtisanOrderStatsGrid';
import ArtisanOrderStatusTabs from './ArtisanOrderStatusTabs';
import ArtisanOrderCard from './ArtisanOrderCard';
import OrderFilterModal from './OrderFilterModal';
import ShippingModal from './ShippingModal';
import CancelOrderModal from './CancelOrderModal';
import OrderDetailsModal from './OrderDetailsModal';

import {
  getArtisanOrderStats,
  getArtisanOrders,
  acceptArtisanOrder,
  markArtisanOrderShipped,
  updateArtisanOrderTracking,
  cancelArtisanOrder,
} from '@/services/artisanOrdersService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

export default function ManageOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Artisan Profile & Navigation State
  const [artisan, setArtisan] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    minPrice: null,
    maxPrice: null,
  });

  // Action Modals State
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState(null);
  const [isEditingTracking, setIsEditingTracking] = useState(false);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);

  // Action busy indicator
  const [actionBusy, setActionBusy] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [pProfile, pStats, pOrders] = await Promise.all([
        getArtisanDashboardProfile().catch(() => null),
        getArtisanOrderStats().catch(() => null),
        getArtisanOrders({
          status: activeFilter,
          search: searchQuery,
          paymentStatus: appliedFilters.paymentStatus,
          minPrice: appliedFilters.minPrice,
          maxPrice: appliedFilters.maxPrice,
          sort: 'newest',
        }).catch(() => ({ total: 0, orders: [] })),
      ]);

      if (pProfile) setArtisan(pProfile);
      if (pStats) setStats(pStats);
      if (pOrders && Array.isArray(pOrders.orders)) {
        setOrders(pOrders.orders);
      }
    } catch (err) {
      console.warn('Failed to load artisan orders data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery, appliedFilters]);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 1. Accept Order Handler
  const handleAcceptOrder = (order) => {
    Alert.alert(
      'Accept Order',
      `Accept order ${order.order_number || `#${String(order.id).slice(0, 6)}`} and move to processing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Order',
          onPress: async () => {
            setActionBusy(true);
            try {
              const res = await acceptArtisanOrder(order.id);
              if (res.success) {
                Alert.alert('Order Accepted', 'Order moved to processing. Prepare items for dispatch.');
                loadData();
              } else {
                Alert.alert('Action Failed', res.error || 'Failed to accept order.');
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

  // 2. Cancel Order Modal Trigger
  const handleOpenCancelModal = (order) => {
    setSelectedOrderForCancel(order);
    setCancelModalVisible(true);
  };

  const handleConfirmCancelOrder = async ({ orderId, reason }) => {
    setActionBusy(true);
    try {
      const res = await cancelArtisanOrder(orderId, reason);
      if (res.success) {
        Alert.alert('Order Cancelled', 'The order has been cancelled and stock has been restored.');
        loadData();
      } else {
        Alert.alert('Cancellation Failed', res.error || 'Failed to cancel order.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // 3. Mark as Shipped Modal Trigger
  const handleOpenMarkShipped = (order) => {
    setSelectedOrderForShipping(order);
    setIsEditingTracking(false);
    setShippingModalVisible(true);
  };

  // 4. Update Tracking Modal Trigger
  const handleOpenUpdateTracking = (order) => {
    setSelectedOrderForShipping(order);
    setIsEditingTracking(true);
    setShippingModalVisible(true);
  };

  const handleConfirmShipping = async ({ orderId, courierName, trackingNumber, trackingUrl }) => {
    setActionBusy(true);
    try {
      if (isEditingTracking) {
        const res = await updateArtisanOrderTracking(orderId, courierName, trackingNumber, trackingUrl);
        if (res.success) {
          Alert.alert('Tracking Updated', 'Shipping tracking information has been saved.');
          loadData();
        } else {
          Alert.alert('Update Failed', res.error || 'Failed to update tracking info.');
        }
      } else {
        const res = await markArtisanOrderShipped(orderId, courierName, trackingNumber, trackingUrl);
        if (res.success) {
          Alert.alert('Order Shipped', 'Order marked as shipped. Tracking details sent to customer.');
          loadData();
        } else {
          Alert.alert('Shipping Failed', res.error || 'Failed to mark as shipped.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // 5. Open Order Details Modal
  const handleOpenDetails = (order) => {
    setSelectedOrderForDetails(order);
    setDetailsModalVisible(true);
  };

  // Bottom Navigation tabs handler
  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      router.replace('/(artisan)/dashboard');
    } else if (tabKey === 'products') {
      router.push('/(artisan)/products');
    } else if (tabKey === 'orders') {
      // already on orders
    } else if (tabKey === 'earnings') {
      Alert.alert('Earnings', 'Opening artisan revenue analytics...');
    } else if (tabKey === 'profile') {
      router.push('/(artisan)/profile');
    }
  };

  // Counts mapping for tabs
  const tabCounts = useMemo(() => {
    return {
      all: stats.total || 0,
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      shipped: stats.shipped || 0,
      delivered: stats.delivered || 0,
      cancelled: stats.cancelled || 0,
    };
  }, [stats]);

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

      {/* Main FlatList */}
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id || item.order_number)}
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
          <View style={styles.headerContainer}>
            {/* Top Branch Decorative Accent */}
            <View style={styles.branchDecorWrap} pointerEvents="none">
              <Image source={topRightBranch} style={styles.branchDecor} contentFit="contain" />
            </View>

            {/* Page Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.headingTitle}>Manage Orders</Text>
              <Text style={styles.subtitle}>
                Track, process and update your customer orders
              </Text>
            </View>

            {/* 1. Order Statistics Grid */}
            <ArtisanOrderStatsGrid stats={stats} />

            {/* 2. Horizontal Scrollable Status Filter Tabs */}
            <ArtisanOrderStatusTabs
              activeFilter={activeFilter}
              counts={tabCounts}
              onSelectFilter={(filterKey) => {
                setActiveFilter(filterKey);
              }}
            />

            {/* 3. Search Field & Filter Button */}
            <View style={styles.searchFilterRow}>
              <View style={styles.searchContainer}>
                <Search size={18} color="#8A7E72" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by Order ID, customer or product..."
                  placeholderTextColor="#A89F93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  (appliedFilters.paymentStatus !== 'all' || appliedFilters.minPrice || appliedFilters.maxPrice) &&
                    styles.filterBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setFilterModalVisible(true)}
                accessibilityLabel="Filter orders"
              >
                <SlidersHorizontal
                  size={18}
                  color={
                    appliedFilters.paymentStatus !== 'all' || appliedFilters.minPrice || appliedFilters.maxPrice
                      ? '#FFFFFF'
                      : '#173D2B'
                  }
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ArtisanOrderCard
            order={item}
            onPress={handleOpenDetails}
            onAccept={handleAcceptOrder}
            onCancel={handleOpenCancelModal}
            onMarkShipped={handleOpenMarkShipped}
            onUpdateTracking={handleOpenUpdateTracking}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#173D2B" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Package size={38} color="#A65E32" />
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyDesc}>
                Your customer orders will appear here once someone purchases your products.
              </Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <OrderFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={appliedFilters}
        onApplyFilters={(newFilters) => {
          setAppliedFilters(newFilters);
          if (newFilters.status && newFilters.status !== 'all') {
            setActiveFilter(newFilters.status);
          }
        }}
      />

      {/* Shipping / Tracking Details Modal */}
      <ShippingModal
        visible={shippingModalVisible}
        onClose={() => setShippingModalVisible(false)}
        order={selectedOrderForShipping}
        isEditing={isEditingTracking}
        onSubmit={handleConfirmShipping}
      />

      {/* Cancellation Modal */}
      <CancelOrderModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        order={selectedOrderForCancel}
        onSubmit={handleConfirmCancelOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        order={selectedOrderForDetails}
        onAccept={handleAcceptOrder}
        onCancel={handleOpenCancelModal}
        onMarkShipped={handleOpenMarkShipped}
        onUpdateTracking={handleOpenUpdateTracking}
      />

      {/* Bottom Navigation */}
      <ArtisanBottomNavigation
        activeTab="orders"
        onTabPress={handleTabPress}
      />

      {/* Drawer Menu */}
      <ArtisanNavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        artisan={artisan}
        onSelectOption={(opt) => {
          setDrawerVisible(false);
          if (opt === 'dashboard') router.replace('/(artisan)/dashboard');
          else if (opt === 'products') router.push('/(artisan)/products');
          else if (opt === 'ai_assistant') router.push('/(artisan)/ai-assistant');
          else if (opt === 'add_product') router.push('/(artisan)/products/add');
          else if (opt === 'profile') router.push('/(artisan)/profile');
          else if (opt === 'switch_customer') router.replace('/(customer)/home');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  contentContainer: {
    paddingTop: 6,
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  branchDecorWrap: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 140,
    height: 120,
    opacity: 0.7,
  },
  branchDecor: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#173D2B',
    fontFamily: 'serif',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#766D60',
    marginTop: 3,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE5D8',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C2E24',
    padding: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE5D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: '#173D2B',
    borderColor: '#173D2B',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#766D60',
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5ECE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173D2B',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#766D60',
    textAlign: 'center',
    lineHeight: 19,
  },
});
