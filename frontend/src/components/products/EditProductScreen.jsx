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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import ProductFormInput from './ProductFormInput';
import ProductCategoryPicker, { INITIAL_CATEGORIES } from './ProductCategoryPicker';
import ProductPriceStockInput from './ProductPriceStockInput';
import ProductTagSelector from './ProductTagSelector';
import {
  getProductById,
  updateProduct,
  getProductCategories,
} from '@/services/productService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';
import { getProductRealImage } from '@/services/productImageService';

const backIcon = require('@/assets/images/shilpsetu/icon-back.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const bellIcon = require('@/assets/images/shilpsetu/icon-bell.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');
const rightArrow = require('@/assets/images/shilpsetu/icon-arrow-right.svg');
const terracottaPot = require('@/assets/images/shilpsetu/terracotta-pot.svg');
const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const productId = params?.id || 'prod-pot-1';

  // Artisan details
  const [artisan, setArtisan] = useState(null);

  // Loading & Initial states
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productData, setProductData] = useState(null);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pottery & Ceramics');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['Handmade', 'Terracotta', 'Eco-Friendly']);

  // Image Management
  // existingImages: array of existing remote URLs
  const [existingImages, setExistingImages] = useState([]);
  // newImages: array of newly picked local URIs
  const [newImages, setNewImages] = useState([]);
  // removedImages: array of existing remote URLs marked for deletion
  const [removedImages, setRemovedImages] = useState([]);

  // Errors & submission
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  // Track if user made changes
  const [initialSnapshot, setInitialSnapshot] = useState('');

  useEffect(() => {
    getArtisanDashboardProfile().then((p) => setArtisan(p)).catch(() => {});
    getProductCategories().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
    }).catch(() => {});

    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoadingProduct(true);
    try {
      const prod = await getProductById(productId);
      if (prod) {
        setProductData(prod);
        setName(prod.name || prod.product_name || '');
        setCategory(prod.category || 'Pottery & Ceramics');
        setPrice(String(prod.price || ''));
        setStock(String(prod.stock !== undefined ? prod.stock : (prod.stock_quantity || '0')));
        setDescription(prod.description || '');
        setTags(Array.isArray(prod.tags) && prod.tags.length > 0 ? prod.tags : ['Handmade']);

        const imgs = Array.isArray(prod.image_urls) && prod.image_urls.length > 0
          ? prod.image_urls
          : (prod.image_url ? [prod.image_url] : []);
        setExistingImages(imgs);
        setNewImages([]);
        setRemovedImages([]);

        setInitialSnapshot(
          JSON.stringify({
            name: prod.name,
            category: prod.category,
            price: String(prod.price),
            stock: String(prod.stock),
            description: prod.description,
            tags: prod.tags,
            imagesCount: imgs.length,
          })
        );
      } else {
        Alert.alert('Error', 'Product not found.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load product:', err);
    } finally {
      setLoadingProduct(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!initialSnapshot) return false;
    const current = JSON.stringify({
      name,
      category,
      price,
      stock,
      description,
      tags,
      imagesCount: existingImages.filter((x) => !removedImages.includes(x)).length + newImages.length,
    });
    return current !== initialSnapshot;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to exit without saving?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handlePickNewImage = async () => {
    const activeExisting = existingImages.filter((u) => !removedImages.includes(u));
    const currentTotal = activeExisting.length + newImages.length;
    if (currentTotal >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 product images.');
      return;
    }

    try {
      setPicking(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Permission to access gallery is required to add photos.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - currentTotal,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uris = res.assets.map((a) => a.uri);
        setNewImages((prev) => [...prev, ...uris].slice(0, 5 - activeExisting.length));
        if (errors.images) setErrors((prev) => ({ ...prev, images: null }));
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveExistingImage = (url) => {
    setRemovedImages((prev) => [...prev, url]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateForm = () => {
    const errs = {};
    const activeExisting = existingImages.filter((u) => !removedImages.includes(u));
    const totalImages = activeExisting.length + newImages.length;

    if (totalImages === 0) {
      errs.images = 'Please keep or add at least 1 craft image.';
    }
    if (!name.trim()) {
      errs.name = 'Product name is required.';
    }
    if (!category) {
      errs.category = 'Please select a category.';
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Price must be greater than zero.';
    }
    const numStock = Number(stock);
    if (stock === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      errs.stock = 'Stock must be a non-negative integer.';
    }
    if (!description.trim()) {
      errs.description = 'Description is required.';
    } else if (description.trim().length > 300) {
      errs.description = 'Description must not exceed 300 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validateForm()) {
      Alert.alert('Incomplete Form', 'Please review highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const activeExisting = existingImages.filter((u) => !removedImages.includes(u));
      const res = await updateProduct(
        productId,
        {
          name: name.trim(),
          product_name: name.trim(),
          description: description.trim(),
          price: Number(price),
          stock: parseInt(stock, 10),
          stock_quantity: parseInt(stock, 10),
          category,
          tags,
          existing_image_urls: activeExisting,
        },
        newImages,
        removedImages
      );

      if (res.success) {
        Alert.alert(
          'Product Updated! ✨',
          `"${name.trim()}" has been updated successfully.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/artisan-dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Update Failed', res.error || 'Could not save product changes.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />
        <ActivityIndicator color={ShilpColors.primary || '#263C29'} size="large" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  const activeExistingImages = existingImages.filter((u) => !removedImages.includes(u));
  const totalImageCount = activeExistingImages.length + newImages.length;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F0E3" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
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

        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.iconBtn}>
            <Image source={bellIcon} style={styles.bellIcon} contentFit="contain" />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <Image
              source={
                artisan?.avatarUrl && typeof artisan.avatarUrl === 'string'
                  ? { uri: artisan.avatarUrl }
                  : defaultPottery
              }
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.onlineDot} />
          </View>
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
          <Text style={styles.pageTitle}>Edit Product</Text>
          <Text style={styles.pageSubtitle}>Update your product details</Text>
        </View>

        {/* Edit Product Action Header */}
        <View style={styles.toggleRow}>
          <View
            style={[styles.toggleBtn, styles.toggleActive]}
          >
            <Text style={styles.toggleActiveText}>✎ Edit Product</Text>
          </View>
        </View>

        {/* Selected Product Summary Card */}
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.85}
          onPress={() => {
            if (productId) router.push(`/(customer)/product/${productId}`);
          }}
        >
          <Image
            source={
              productData?.image_url || (Array.isArray(productData?.image_urls) && productData.image_urls[0])
                ? getProductRealImage(productData?.category_name || productData?.category || category, productData?.image_url || productData?.image_urls?.[0])
                : getProductRealImage(category || 'pottery')
            }
            style={styles.summaryThumb}
            contentFit="cover"
          />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {productData?.name || productData?.product_name || 'Craft Product'}
            </Text>
            <View style={styles.summaryMetaRow}>
              <Text style={styles.summaryPrice}>₹{productData?.price || price || '0'}</Text>
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>
                  In Stock ({productData?.stock !== undefined ? productData?.stock : stock})
                </Text>
              </View>
            </View>
          </View>
          <Image source={rightArrow} style={styles.summaryArrow} contentFit="contain" />
        </TouchableOpacity>

        {/* Section Heading: Update Details */}
        <Text style={styles.sectionHeading}>Update Details</Text>

        {/* Product Images Section */}
        <View style={styles.imagesSection}>
          <Text style={styles.inputLabel}>Product Images</Text>
          <Text style={styles.inputSubtitle}>Add, remove, or reorder images (up to 5)</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScroll}
          >
            {/* Active Existing Remote Images */}
            {activeExistingImages.map((uri, idx) => (
              <View key={`exist-${uri}-${idx}`} style={styles.imageCard}>
                <Image
                  source={getProductRealImage(category, uri)}
                  style={styles.imageThumb}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveExistingImage(uri)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Newly Picked Local Images */}
            {newImages.map((uri, idx) => (
              <View key={`new-${uri}-${idx}`} style={styles.imageCard}>
                <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveNewImage(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Image Placeholder Button */}
            {totalImageCount < 5 && (
              <TouchableOpacity
                style={styles.addImagePlaceholder}
                onPress={handlePickNewImage}
                disabled={picking}
                activeOpacity={0.8}
              >
                {picking ? (
                  <ActivityIndicator color={ShilpColors.primary || '#263C29'} size="small" />
                ) : (
                  <>
                    <Text style={styles.placeholderPlus}>+</Text>
                    <Text style={styles.placeholderText}>Add Image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>

          {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
        </View>

        {/* Product Name */}
        <ProductFormInput
          label="Product Name"
          required
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="e.g., Terracotta Pot Set"
          maxLength={80}
          error={errors.name}
        />

        {/* Category Dropdown */}
        <ProductCategoryPicker
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
          }}
          categories={categories}
          error={errors.category}
        />

        {/* Price & Stock Inputs Side-by-Side */}
        <ProductPriceStockInput
          price={price}
          onChangePrice={(val) => {
            setPrice(val);
            if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
          }}
          stock={stock}
          onChangeStock={(val) => {
            setStock(val);
            if (errors.stock) setErrors((prev) => ({ ...prev, stock: null }));
          }}
          priceError={errors.price}
          stockError={errors.stock}
        />

        {/* Description Input */}
        <View style={styles.descriptionWrapper}>
          <ProductFormInput
            label="Description"
            required
            value={description}
            onChangeText={(val) => {
              setDescription(val);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            placeholder="Describe your product (materials, size, craft, etc.)"
            multiline
            numberOfLines={4}
            maxLength={300}
            error={errors.description}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        {/* Product Tags */}
        <ProductTagSelector
          tags={tags}
          onChangeTags={setTags}
        />

        {/* Bottom Actions: Cancel & Save Changes */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F0E3',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6E6B65',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#F8F0E3',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 24,
    height: 24,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 20,
    height: 20,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#263C29',
    borderWidth: 1.5,
    borderColor: '#F8F0E3',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headingSection: {
    position: 'relative',
    marginBottom: 16,
  },
  branchDecor: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 100,
    height: 100,
    opacity: 0.55,
  },
  branchImage: {
    width: '100%',
    height: '100%',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6E6B65',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#263C29',
  },
  toggleInactive: {
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  toggleActiveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleInactiveText: {
    color: '#25251F',
    fontSize: 13,
    fontWeight: '600',
  },
  // Selected Product Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 10,
    marginBottom: 22,
  },
  summaryThumb: {
    width: 68,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#EDE3D2',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A85E2B',
  },
  stockBadge: {
    backgroundColor: '#DCE8B5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#263C29',
  },
  summaryArrow: {
    width: 16,
    height: 16,
    tintColor: '#25251F',
    marginRight: 6,
  },
  // Section Title
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 12,
  },
  // Images Section
  imagesSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 2,
  },
  inputSubtitle: {
    fontSize: 12,
    color: '#6E6B65',
    marginBottom: 10,
  },
  imageScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  imageCard: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    backgroundColor: '#EDE3D2',
    overflow: 'hidden',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 37, 31, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImagePlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A85E2B',
    backgroundColor: '#FBF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPlus: {
    fontSize: 22,
    color: '#A85E2B',
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A85E2B',
    marginTop: 2,
  },
  descriptionWrapper: {
    position: 'relative',
  },
  charCount: {
    position: 'absolute',
    bottom: 24,
    right: 14,
    fontSize: 11,
    color: '#8E8B82',
  },
  errorText: {
    color: '#C94A29',
    fontSize: 11,
    marginTop: 4,
  },
  // Bottom action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F0E3',
  },
  cancelButtonText: {
    color: '#263C29',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: '#263C29',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

