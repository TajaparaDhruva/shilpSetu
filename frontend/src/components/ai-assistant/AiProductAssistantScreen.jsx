import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Sparkles, Wand2, Tag, Edit3, Plus, ArrowLeft } from 'lucide-react-native';

import AiImageUploader from './AiImageUploader';
import AiGeneratedSuggestion from './AiGeneratedSuggestion';
import ImproveListingTab from './ImproveListingTab';
import SmartTagsTab from './SmartTagsTab';

import { generateProductFromImage } from '@/services/aiProductService';
import {
  createProduct,
  getMyProducts,
  getProductCategories,
} from '@/services/productService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const bellIcon = require('@/assets/images/shilpsetu/icon-bell.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');
const craftIntroImg = require('@/assets/images/shilpsetu/terracotta-craft.jpg');
const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

const TABS = [
  { id: 'generate', label: 'Generate Product', icon: Sparkles },
  { id: 'improve', label: 'Improve Listing', icon: Edit3 },
  { id: 'tags', label: 'Smart Tags', icon: Tag },
];

export default function AiProductAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Profile & Catalog State
  const [artisan, setArtisan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [myProducts, setMyProducts] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('generate');

  // Generate Product Tab State
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    getArtisanDashboardProfile().then((p) => setArtisan(p)).catch(() => {});
    getProductCategories().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
    }).catch(() => {});
    loadMyProducts();
  }, []);

  const loadMyProducts = async () => {
    try {
      const items = await getMyProducts();
      setMyProducts(Array.isArray(items) ? items : []);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      Alert.alert(
        'Upload Image First',
        'Please select or capture a craft photograph before generating details.'
      );
      return;
    }

    setAnalyzing(true);
    setUploadProgress(25);
    try {
      setUploadProgress(60);
      const res = await generateProductFromImage(
        selectedImage.uri,
        selectedImage.base64 || null
      );
      setUploadProgress(100);

      if (res && res.success && res.suggestion) {
        setSuggestion(res.suggestion);
      } else {
        Alert.alert(
          'Product Recognition',
          res?.message || 'We could not confidently identify this product. Please upload a clearer photograph.'
        );
      }
    } catch (err) {
      Alert.alert('Analysis Failed', err.message || 'Unable to process image with AI.');
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleSaveToCatalog = async () => {
    if (!suggestion || !selectedImage) return;

    if (!suggestion.title || !suggestion.title.trim()) {
      Alert.alert('Missing Field', 'Product title cannot be empty.');
      return;
    }
    if (!suggestion.description || !suggestion.description.trim()) {
      Alert.alert('Missing Field', 'Product description cannot be empty.');
      return;
    }

    setSavingProduct(true);
    try {
      const priceToSave = suggestion.suggestedPrice || suggestion.minPrice || 799;
      const res = await createProduct(
        {
          name: suggestion.title.trim(),
          description: suggestion.description.trim(),
          category: suggestion.category || 'Pottery & Ceramics',
          price: Number(priceToSave),
          stock: 10,
          tags: suggestion.tags || ['Handmade', 'Terracotta'],
          artisan_id: artisan?.id || null,
          artisan_name: artisan?.fullName || artisan?.name || 'Master Artisan',
        },
        [selectedImage.uri]
      );

      if (res.success) {
        Alert.alert(
          'Product Listed! 🏺',
          `"${suggestion.title.trim()}" has been saved and added to your craft catalog.`,
          [
            {
              text: 'View Catalog',
              onPress: () => router.replace('/(artisan)/products'),
            },
            {
              text: 'Create Another',
              style: 'cancel',
              onPress: () => {
                setSelectedImage(null);
                setSuggestion(null);
                loadMyProducts();
              },
            },
          ]
        );
      } else {
        Alert.alert('Save Failed', res.error || 'Could not list product.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add product to catalog.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#263C29" />
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <Image source={lotusLogo} style={styles.lotusLogo} contentFit="contain" />
          <Text style={styles.brandTitle}>
            <Text style={styles.brandShilp}>Shilp</Text>
            <Text style={styles.brandSetu}>Setu</Text>
          </Text>
        </View>

        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.iconBtn}>
            <Image source={bellIcon} style={styles.bellIcon} contentFit="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => router.push('/(artisan)/profile')}
          >
            <Image
              source={
                artisan?.avatarUrl && typeof artisan.avatarUrl === 'string' && artisan.avatarUrl.startsWith('http')
                  ? { uri: artisan.avatarUrl }
                  : defaultPottery
              }
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + Branch Decorative Motif */}
        <View style={styles.headingSection}>
          <View style={styles.branchDecor} pointerEvents="none">
            <Image
              source={topRightBranch}
              style={styles.branchImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>AI Product Assistant</Text>
            <Sparkles size={20} color="#E0A838" />
          </View>
          <Text style={styles.pageSubtitle}>
            Let AI help you create product listings faster
          </Text>
        </View>

        {/* Feature Tabs (Generate Product, Improve Listing, Smart Tags) */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
              >
                <Icon
                  size={14}
                  color={isActive ? '#F8F0E3' : '#7C7365'}
                  strokeWidth={2}
                />
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: GENERATE PRODUCT */}
        {activeTab === 'generate' && (
          <View style={styles.tabContent}>
            {/* Introduction Card matching screenshot */}
            <View style={styles.introCard}>
              <View style={styles.introTextCol}>
                <Text style={styles.introHeading}>Create Product with AI</Text>
                <Text style={styles.introDesc}>
                  Upload a photo of your craft, and AI will generate the title, description, category, price range, and tags.
                </Text>
              </View>

              <View style={styles.introImageWrap}>
                <Image
                  source={craftIntroImg}
                  style={styles.introPotteryImg}
                  contentFit="cover"
                />
                <View style={styles.aiBadge}>
                  <Sparkles size={12} color="#FFFFFF" />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              </View>
            </View>

            {/* Product Image Upload Section */}
            <AiImageUploader
              selectedImage={selectedImage}
              onImageSelected={(img) => {
                setSelectedImage(img);
                setSuggestion(null);
              }}
              onImageRemoved={() => {
                setSelectedImage(null);
                setSuggestion(null);
              }}
              uploading={analyzing}
              uploadProgress={uploadProgress}
            />

            {/* Generate with AI Button */}
            <TouchableOpacity
              style={[
                styles.generateActionBtn,
                (!selectedImage || analyzing) && styles.generateActionBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleGenerate}
              disabled={!selectedImage || analyzing}
            >
              {analyzing ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#F8F0E3" />
                  <Text style={styles.generateActionBtnText}>Analyzing Craft Details...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Wand2 size={16} color="#F8F0E3" />
                  <Text style={styles.generateActionBtnText}>Generate with AI</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* AI Generated Suggestion Box */}
            {suggestion && (
              <>
                <AiGeneratedSuggestion
                  suggestion={suggestion}
                  imageUrl={selectedImage?.uri}
                  onUpdateSuggestion={setSuggestion}
                  onRegenerate={handleGenerate}
                  categories={categories}
                  regenerating={analyzing}
                />

                {/* Bottom Action Buttons */}
                <View style={styles.bottomActionsRow}>
                  <TouchableOpacity
                    style={styles.editDetailsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        'Direct Editing Enabled',
                        'You can tap and edit the title, description, category, and tags directly in the suggestion card above.'
                      );
                    }}
                  >
                    <Edit3 size={15} color="#263C29" />
                    <Text style={styles.editDetailsText}>Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addToProductsBtn}
                    activeOpacity={0.88}
                    onPress={handleSaveToCatalog}
                    disabled={savingProduct}
                  >
                    {savingProduct ? (
                      <ActivityIndicator size="small" color="#F8F0E3" />
                    ) : (
                      <>
                        <Plus size={16} color="#F8F0E3" />
                        <Text style={styles.addToProductsText}>Add to My Products</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 2: IMPROVE LISTING */}
        {activeTab === 'improve' && (
          <ImproveListingTab
            products={myProducts}
            onProductUpdated={loadMyProducts}
          />
        )}

        {/* TAB 3: SMART TAGS */}
        {activeTab === 'tags' && (
          <SmartTagsTab
            products={myProducts}
            onProductUpdated={loadMyProducts}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 20,
    height: 20,
  },
  avatarWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ECE3D4',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headingSection: {
    position: 'relative',
    paddingVertical: 10,
    marginBottom: 8,
  },
  branchDecor: {
    position: 'absolute',
    right: -10,
    top: -5,
    width: 90,
    height: 90,
    opacity: 0.25,
  },
  branchImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#7C7365',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ECE3D4',
    borderRadius: 24,
    padding: 4,
    marginVertical: 10,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#263C29',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C7365',
  },
  tabButtonTextActive: {
    color: '#F8F0E3',
  },
  tabContent: {
    marginTop: 4,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7EDE1',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DBC9',
    marginBottom: 10,
    overflow: 'hidden',
  },
  introTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  introHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 12,
    color: '#7C7365',
    lineHeight: 17,
  },
  introImageWrap: {
    width: 95,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ECE3D4',
  },
  introPotteryImg: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(168, 94, 43, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  generateActionBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  generateActionBtnDisabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8F0E3',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  editDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECE3D4',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DFD2BF',
  },
  editDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263C29',
  },
  addToProductsBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#263C29',
    paddingVertical: 14,
    borderRadius: 24,
  },
  addToProductsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8F0E3',
  },
});

