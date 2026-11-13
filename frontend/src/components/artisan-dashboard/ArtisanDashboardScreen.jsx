import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtisanDashboardHeader from './ArtisanDashboardHeader';
import ArtisanWelcomeSection from './ArtisanWelcomeSection';
import ArtisanBanner from './ArtisanBanner';
import ArtisanStatsGrid from './ArtisanStatsGrid';
import ArtisanQuickActions from './ArtisanQuickActions';
import RecentOrdersSection from './RecentOrdersSection';
import ArtisanBottomNavigation from './ArtisanBottomNavigation';
import ArtisanNavigationDrawer from './ArtisanNavigationDrawer';
import {
  getArtisanDashboardProfile,
  getArtisanDashboardStats,
  getArtisanRecentOrders,
} from '@/services/artisanDashboardService';
import { logout } from '@/services/auth';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, s, o] = await Promise.all([
        getArtisanDashboardProfile(),
        getArtisanDashboardStats(),
        getArtisanRecentOrders(3),
      ]);
      setProfile(p);
      setStats(s);
      setRecentOrders(o);
    } catch (err) {
      console.warn('Failed to load artisan dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActionPress = (actionId) => {
    if (actionId === 'add_product') {
      Alert.alert('Add Product', 'Opening Add Product studio...');
    } else if (actionId === 'manage_products') {
      Alert.alert('Manage Products', 'Opening Product Inventory...');
    } else if (actionId === 'orders') {
      Alert.alert('Manage Orders', 'Opening Artisan Orders...');
    } else if (actionId === 'earnings') {
      Alert.alert('My Earnings', 'Opening Financial Analytics & Payouts...');
    }
  };

  const handleDrawerOption = async (optionId) => {
    if (optionId === 'add_product' || optionId === 'manage_products' || optionId === 'orders' || optionId === 'earnings') {
      handleActionPress(optionId);
    } else if (optionId === 'profile') {
      if (profile?.id) {
        router.push(`/(customer)/artisan/${profile.id}`);
      } else {
        router.push('/(customer)/home');
      }
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
      Alert.alert('Products', 'Viewing your craft catalog...');
    } else if (tabKey === 'orders') {
      Alert.alert('Orders', 'Viewing orders for your products...');
    } else if (tabKey === 'earnings') {
      Alert.alert('Earnings', 'Viewing your revenue breakdown...');
    } else if (tabKey === 'profile') {
      if (profile?.id) {
        router.push(`/(customer)/artisan/${profile.id}`);
      }
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
            if (profile?.id) router.push(`/(customer)/artisan/${profile.id}`);
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

