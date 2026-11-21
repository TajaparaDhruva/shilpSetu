import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import ArtisanDashboardHeader from '@/components/artisan-dashboard/ArtisanDashboardHeader';
import ArtisanBottomNavigation from '@/components/artisan-dashboard/ArtisanBottomNavigation';
import ArtisanNavigationDrawer from '@/components/artisan-dashboard/ArtisanNavigationDrawer';

import EarningsPeriodFilters from './EarningsPeriodFilters';
import TotalEarningsCard from './TotalEarningsCard';
import EarningsStatsCards from './EarningsStatsCards';
import EarningsOverviewChart from './EarningsOverviewChart';
import RecentTransactionsSection from './RecentTransactionsSection';

import {
  getArtisanEarningsAnalytics,
  PERIOD_FILTERS,
} from '@/services/artisanEarningsService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

export default function ArtisanEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Profile & Drawer
  const [artisan, setArtisan] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Filter & Data States
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [pProfile, pAnalytics] = await Promise.all([
        getArtisanDashboardProfile().catch(() => null),
        getArtisanEarningsAnalytics(selectedPeriod).catch((err) => {
          setError(err.message || 'Failed to load earnings analytics');
          return null;
        }),
      ]);

      if (pProfile) setArtisan(pProfile);
      if (pAnalytics) setAnalytics(pAnalytics);
    } catch (err) {
      console.warn('Failed to load artisan earnings:', err);
      setError('Unable to fetch earnings. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Bottom Navigation tabs handler
  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      router.replace('/(artisan)/dashboard');
    } else if (tabKey === 'products') {
      router.push('/(artisan)/products');
    } else if (tabKey === 'orders') {
      router.push('/(artisan)/orders');
    } else if (tabKey === 'earnings') {
      // already on earnings
    } else if (tabKey === 'profile') {
      router.push('/(artisan)/profile');
    }
  };

  const periodLabelMap = {
    this_month: 'last month',
    last_month: 'month prior',
    last_3_months: 'prior 3 months',
    this_year: 'last year',
  };

  const currentPeriodTitle =
    PERIOD_FILTERS.find((f) => f.id === selectedPeriod)?.label || 'This Month';

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

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 95 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary || '#173D2B'}
          />
        }
      >
        {/* Decorative Top Branch */}
        <View style={styles.branchDecorWrap} pointerEvents="none">
          <Image source={topRightBranch} style={styles.branchDecor} contentFit="contain" />
        </View>

        {/* Page Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>My Earnings</Text>
          <Text style={styles.subtitle}>Track your sales and earnings</Text>
        </View>

        {/* 1. Period Filter Tabs */}
        <EarningsPeriodFilters
          activeFilter={selectedPeriod}
          onSelectFilter={(p) => {
            setSelectedPeriod(p);
          }}
        />

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#173D2B" />
            <Text style={styles.loadingText}>Fetching earnings data...</Text>
          </View>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Failed to load earnings</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content (when loaded) */}
        {!loading && !error && (
          <>
            {/* 2. Total Earnings Hero Card */}
            <TotalEarningsCard
              totalEarnings={analytics?.totalEarnings ?? 0}
              priorEarnings={analytics?.priorEarnings ?? 0}
              growthPercentage={analytics?.growthPercentage ?? 0}
              isGrowth={analytics?.isGrowth ?? true}
              periodLabel={periodLabelMap[selectedPeriod] || 'last month'}
            />

            {/* 3. Three Statistics Cards */}
            <EarningsStatsCards
              totalOrders={analytics?.totalOrders ?? 0}
              productsSold={analytics?.productsSold ?? 0}
              averageRating={analytics?.averageRating ?? 0.0}
              totalReviews={analytics?.totalReviews ?? 0}
            />

            {/* 4. Earnings Overview Interactive Chart */}
            <EarningsOverviewChart
              chartPoints={analytics?.chartPoints ?? []}
              periodLabel={currentPeriodTitle}
            />

            {/* 5. Recent Transactions Section */}
            <RecentTransactionsSection
              transactions={analytics?.recentTransactions ?? []}
              onViewAllPress={() => {
                router.push('/(artisan)/orders');
              }}
            />
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <ArtisanBottomNavigation
        activeTab="earnings"
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
          else if (opt === 'orders') router.push('/(artisan)/orders');
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
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    position: 'relative',
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
    paddingBottom: 4,
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
  loadingWrap: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#766D60',
    marginTop: 10,
  },
  errorCard: {
    backgroundColor: '#FDEEEB',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F6C3BC',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B82D24',
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: 13,
    color: '#8A2A22',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#B82D24',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
