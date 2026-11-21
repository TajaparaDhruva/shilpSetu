import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');

const DRAWER_ITEMS = [
  { id: 'dashboard', label: 'Artisan Dashboard', icon: '🏛️' },
  { id: 'ai_assistant', label: 'AI Product Assistant ✨', icon: '✨' },
  { id: 'add_product', label: 'Add New Product', icon: '➕' },
  { id: 'manage_products', label: 'Manage Products', icon: '📦' },
  { id: 'orders', label: 'Manage Orders', icon: '🛍️' },
  { id: 'earnings', label: 'My Earnings', icon: '📊' },
  { id: 'profile', label: 'Artisan Profile', icon: '👤' },
  { id: 'switch_customer', label: 'Switch to Customer View', icon: '🔄' },
  { id: 'logout', label: 'Sign Out', icon: '🚪' },
];

export default function ArtisanNavigationDrawer({
  visible,
  onClose,
  artisan,
  onSelectOption,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.drawer,
                { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
              ]}
            >
              {/* Drawer Header */}
              <View style={styles.header}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={
                      artisan?.avatarUrl
                        ? { uri: artisan.avatarUrl }
                        : defaultPottery
                    }
                    style={styles.avatar}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.artisanInfo}>
                  <Text style={styles.artisanName} numberOfLines={1}>
                    {artisan?.fullName || artisan?.name || 'Artisan'}
                  </Text>
                  <Text style={styles.artisanCraft} numberOfLines={1}>
                    {artisan?.craftSpecialization || 'Master Artisan'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Navigation Items */}
              <View style={styles.itemsList}>
                {DRAWER_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.drawerItem,
                      item.id === 'logout' && styles.logoutItem,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      if (item.id === 'orders') {
                    router.push('/(artisan)/orders');
                  } else if (item.id === 'earnings') {
                    router.push('/(artisan)/earnings');
                  } else {
                    onSelectOption(item.id);
                  }
                    }}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.itemLabel,
                        item.id === 'logout' && styles.logoutLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Image source={lotusLogo} style={styles.footerLogo} contentFit="contain" />
                <Text style={styles.footerText}>ShilpSetu Artisan Suite</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.45)',
    flexDirection: 'row',
  },
  drawer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#F8F0E3',
    paddingHorizontal: 20,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBF5EB',
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  artisanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artisanName: {
    fontSize: 16,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
  },
  artisanCraft: {
    fontSize: 12,
    color: ShilpColors.secondary || '#A85E2B',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D7C5',
    marginBottom: 16,
  },
  itemsList: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
  },
  logoutItem: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFE3D5',
    paddingTop: 14,
  },
  logoutLabel: {
    color: '#C94A29',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DED2',
  },
  footerLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#8A8478',
    fontWeight: '600',
  },
});

