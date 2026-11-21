import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import ArtisanBottomNavigation from '@/components/artisan-dashboard/ArtisanBottomNavigation';
import {
  getArtisanDashboardProfile,
  getArtisanDashboardStats,
} from '@/services/artisanDashboardService';
import { getMyProducts } from '@/services/productService';
import { logout } from '@/services/auth';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const backIcon = require('@/assets/images/shilpsetu/icon-back.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');
const checkIcon = require('@/assets/images/shilpsetu/icon-check.svg');
const locationIcon = require('@/assets/images/shilpsetu/icon-location.svg');

export default function ArtisanProfileRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, s, prods] = await Promise.all([
        getArtisanDashboardProfile(),
        getArtisanDashboardStats(),
        getMyProducts(),
      ]);
      setProfile(p);
      setStats(s);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.warn('Failed to load artisan profile:', err);
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

  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      router.replace('/(artisan)/dashboard');
    } else if (tabKey === 'products') {
      router.push('/(artisan)/products');
    } else if (tabKey === 'orders') {
      router.push('/(artisan)/orders');
    } else if (tabKey === 'earnings') {
      Alert.alert('Earnings', 'Viewing your revenue breakdown...');
    } else if (tabKey === 'profile') {
      // already on profile
    }
  };

  const handleSignOut = () => {
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
        <Text style={styles.headerTitle}>My Artisan Profile</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ShilpColors.primary || '#263C29'}
          />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#263C29" />
          </View>
        ) : (
          <>
            {/* Artisan Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={
                      profile?.avatarUrl && typeof profile.avatarUrl === 'string' && profile.avatarUrl.startsWith('http')
                        ? { uri: profile.avatarUrl }
                        : defaultPottery
                    }
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={styles.verifiedBadge}>
                    <Image source={checkIcon} style={styles.checkIcon} contentFit="contain" />
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.artisanName}>{profile?.fullName || profile?.name || 'Dhruva'}</Text>
                  <Text style={styles.artisanCraft}>{profile?.craftSpecialization || 'Handicraft Artisan'}</Text>
                  <View style={styles.locationRow}>
                    <Image source={locationIcon} style={styles.locationIcon} contentFit="contain" />
                    <Text style={styles.locationText}>India • Registered Artisan</Text>
                  </View>
                </View>
              </View>

              <View style={styles.roleTagWrap}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>🏺 Artisan Account</Text>
                </View>
              </View>
            </View>

            {/* Performance Stats */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionHeading}>Store Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stats?.totalProducts ?? products.length ?? 0}</Text>
                  <Text style={styles.statLbl}>Products Listed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stats?.totalOrders ?? 0}</Text>
                  <Text style={styles.statLbl}>Orders Received</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>₹{Number(stats?.totalEarnings || 0).toLocaleString('en-IN')}</Text>
                  <Text style={styles.statLbl}>Total Earnings</Text>
                </View>
              </View>
            </View>

            {/* Account Quick Links */}
            <View style={styles.linksCard}>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/(artisan)/ai-assistant')}
              >
                <Text style={styles.linkIcon}>✨</Text>
                <View style={styles.linkTextCol}>
                  <Text style={[styles.linkTitle, { color: '#263C29', fontWeight: '700' }]}>AI Product Assistant</Text>
                  <Text style={styles.linkDesc}>Generate titles, descriptions & smart tags</Text>
                </View>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/(artisan)/products')}
              >
                <Text style={styles.linkIcon}>📦</Text>
                <View style={styles.linkTextCol}>
                  <Text style={styles.linkTitle}>Manage Product Catalog</Text>
                  <Text style={styles.linkDesc}>{products.length} crafts in inventory</Text>
                </View>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/(artisan)/products/add')}
              >
                <Text style={styles.linkIcon}>➕</Text>
                <View style={styles.linkTextCol}>
                  <Text style={styles.linkTitle}>List New Handmade Craft</Text>
                  <Text style={styles.linkDesc}>Add pottery, textiles, jewellery</Text>
                </View>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.replace('/(customer)/home')}
              >
                <Text style={styles.linkIcon}>🛍️</Text>
                <View style={styles.linkTextCol}>
                  <Text style={styles.linkTitle}>Switch to Customer Store</Text>
                  <Text style={styles.linkDesc}>Browse ShilpSetu as a buyer</Text>
                </View>
                <Text style={styles.linkArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Logout button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={handleSignOut}
            >
              <Text style={styles.logoutBtnText}>Sign Out of Artisan Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Artisan Bottom Navigation */}
      <ArtisanBottomNavigation
        activeTab="profile"
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
  },
  rightPlaceholder: {
    width: 36,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECE3D4',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FBF5EB',
  },
  checkIcon: {
    width: 12,
    height: 12,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  artisanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25251F',
    fontFamily: 'serif',
  },
  artisanCraft: {
    fontSize: 13,
    color: '#A85E2B',
    fontWeight: '600',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationIcon: {
    width: 12,
    height: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#7C7365',
  },
  roleTagWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
    flexDirection: 'row',
  },
  roleTag: {
    backgroundColor: '#ECE3D4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#263C29',
  },
  statsCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5D7C5',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#25251F',
  },
  statLbl: {
    fontSize: 11,
    color: '#7C7365',
    marginTop: 2,
    textAlign: 'center',
  },
  linksCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginBottom: 18,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkTextCol: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
  },
  linkDesc: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 20,
    color: '#A85E2B',
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#EFE7DA',
    marginLeft: 46,
  },
  logoutBtn: {
    backgroundColor: '#ECE3D4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  logoutBtnText: {
    color: '#A85E2B',
    fontSize: 14,
    fontWeight: '700',
  },
});

