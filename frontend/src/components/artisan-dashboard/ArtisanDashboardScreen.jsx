import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtisanDashboardHeader from './ArtisanDashboardHeader';
import ArtisanWelcomeSection from './ArtisanWelcomeSection';
import ArtisanBanner from './ArtisanBanner';
import ArtisanStatsGrid from './ArtisanStatsGrid';
import ArtisanQuickActions from './ArtisanQuickActions';
import ArtisanProductsSection from './ArtisanProductsSection';
import RecentOrdersSection from './RecentOrdersSection';
import ArtisanBottomNavigation from './ArtisanBottomNavigation';
import ArtisanNavigationDrawer from './ArtisanNavigationDrawer';
import {
  getArtisanDashboardProfile,
  getArtisanDashboardStats,
  getArtisanRecentOrders,
} from '@/services/artisanDashboardService';
import { getMyProducts } from '@/services/productService';
import { logout } from '@/services/auth';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, s, prods, o] = await Promise.all([
        getArtisanDashboardProfile(),
        getArtisanDashboardStats(),
        getMyProducts(),
        getArtisanRecentOrders(3),
      ]);
      setProfile(p);
      setStats(s);
      setProducts(Array.isArray(prods) ? prods : []);
      setRecentOrders(o);
    } catch (err) {
      console.warn('Failed to load artisan dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh every time the Artisan Dashboard comes into focus (e.g. after adding or editing a product)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActionPress = (actionId) => {
    if (actionId === 'add_product') {
      router.push('/(artisan)/products/add');
    } else if (actionId === 'manage_products') {
      router.push('/(artisan)/products');
    } else if (actionId === 'orders') {
      router.push('/(artisan)/orders');
    } else if (actionId === 'earnings') {
      router.push('/(artisan)/earnings');
    }
  };

  const handleDrawerOption = async (optionId) => {
    if (optionId === 'ai_assistant') {
      router.push('/(artisan)/ai-assistant');
    } else if (optionId === 'add_product' || optionId === 'manage_products' || optionId === 'orders' || optionId === 'earnings') {
      handleActionPress(optionId);
    } else if (optionId === 'profile') {
      router.push('/(artisan)/profile');
    } else if (optionId === 'switch_customer') {
      router.replace('/(customer)/home');
    } else if (optionId === 'logout') {
      Alert.alert('Sign Out', 'Are you sure you want to log out of ShilpSetu?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]);
    }
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      // already here
    } else if (tabKey === 'products') {
      router.push('/(artisan)/products');
    } else if (tabKey === 'orders') {
      router.push('/(artisan)/orders');
    } else if (tabKey === 'earnings') {
      router.push('/(artisan)/earnings');
    } else if (tabKey === 'profile') {
      router.push('/(artisan)/profile');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <ArtisanDashboardHeader
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationPress={() => Alert.alert('Notifications', 'You have no new alerts.')}
          onProfilePress={() => {
            router.push('/(artisan)/profile');
          }}
          artisanAvatar={profile?.avatarUrl}
          isOnline={profile?.isOnline ?? true}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 85 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary || '#263C29'}
          />
        }
      >
        {/* Welcome Section */}
        <ArtisanWelcomeSection artisanName={profile?.name || 'Artisan'} />

        {/* Promotional Craft Banner */}
        <ArtisanBanner onAddProductPress={() => handleActionPress('add_product')} />

        {/* Dashboard 4-Stats Grid */}
        <ArtisanStatsGrid stats={stats} loading={loading} />

        {/* Quick Actions (Add Product, Manage Products, Orders, Earnings) */}
        <ArtisanQuickActions onActionPress={handleActionPress} />

        {/* My Products Section on Dashboard */}
        <ArtisanProductsSection
          products={products}
          loading={loading}
          onAddPress={() => handleActionPress('add_product')}
          onEditPress={(item) => router.push(`/(artisan)/products/edit/${item.id}`)}
          onViewProductPress={(item) => router.push(`/(customer)/product/${item.id}`)}
        />

        {/* Recent Orders Section */}
        <RecentOrdersSection
          orders={recentOrders}
          onViewAll={() => handleActionPress('orders')}
          onOrderPress={(order) => {
            Alert.alert(`Order #${order.orderNumber}`, `Customer ordered ${order.quantity}x ${order.productName} for ₹${order.price}.`);
          }}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <ArtisanBottomNavigation
        activeTab="dashboard"
        onTabPress={handleTabPress}
      />

      {/* Navigation Drawer */}
      <ArtisanNavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        artisan={profile}
        onSelectOption={handleDrawerOption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
  },
});
