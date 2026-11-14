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
import ProductImagePicker from './ProductImagePicker';
import ProductFormInput from './ProductFormInput';
import ProductCategoryPicker, { INITIAL_CATEGORIES } from './ProductCategoryPicker';
import ProductPriceStockInput from './ProductPriceStockInput';
import ProductTagSelector from './ProductTagSelector';
import { createProduct, getProductCategories, getMyProducts } from '@/services/productService';
import { getArtisanDashboardProfile } from '@/services/artisanDashboardService';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const backIcon = require('@/assets/images/shilpsetu/icon-back.svg');
const lotusLogo = require('@/assets/images/shilpsetu/lotus-logo.svg');
const bellIcon = require('@/assets/images/shilpsetu/icon-bell.svg');
const defaultPottery = require('@/assets/images/shilpsetu/icon-pottery.svg');
const topRightBranch = require('@/assets/images/shilpsetu/top-left-branch.svg');

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Artisan identity
  const [artisan, setArtisan] = useState(null);
  const [existingProducts, setExistingProducts] = useState([]);

  // Form Fields
  const [images, setImages] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pottery & Ceramics');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['Handmade', 'Terracotta', 'Eco-Friendly']);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getArtisanDashboardProfile().then((p) => setArtisan(p)).catch(() => {});
    getProductCategories().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
    }).catch(() => {});
    getMyProducts().then((prods) => {
      if (Array.isArray(prods)) setExistingProducts(prods);
    }).catch(() => {});
  }, []);

  const validateForm = () => {
    const errs = {};
    if (images.length === 0) {
      errs.images = 'Please select at least 1 craft image.';
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

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateForm()) {
      Alert.alert('Incomplete Details', 'Please fill in all required fields accurately.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createProduct(
        {
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          stock: parseInt(stock, 10),
          category: category,
          tags: tags,
          artisan_id: artisan?.id || null,
          artisan_name: artisan?.fullName || artisan?.name || 'Master Artisan',
        },
        images
      );

      if (res.success) {
        Alert.alert(
          'Product Listed! 🏺',
          `"${name.trim()}" has been added to your craft catalog on ShilpSetu.`,
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/artisan-dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', res.error || 'Unable to list product.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add product.');
    } finally {
      setSubmitting(false);
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
          style={styles.backButton}
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
          <Text style={styles.pageTitle}>Add Product</Text>
          <Text style={styles.pageSubtitle}>List your handmade craft on ShilpSetu</Text>
        </View>

        {/* Add/Edit Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, styles.toggleActive]}
            activeOpacity={0.9}
          >
            <Text style={styles.toggleActiveText}>+ Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, styles.toggleInactive]}
            activeOpacity={0.8}
            onPress={() => {
              if (existingProducts.length > 0) {
                router.push(`/(artisan)/products/edit/${existingProducts[0].id}`);
              } else {
                router.push('/(artisan)/products');
              }
            }}
          >
            <Text style={styles.toggleInactiveText}>✎ Edit Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, styles.toggleInactive, { borderColor: '#A85E2B', borderWidth: 1 }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(artisan)/ai-assistant')}
          >
            <Text style={[styles.toggleInactiveText, { color: '#A85E2B' }]}>✨ AI Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Product Images */}
        <ProductImagePicker
          images={images}
          onChangeImages={(imgs) => {
            setImages(imgs);
            if (errors.images) setErrors((prev) => ({ ...prev, images: null }));
          }}
          maxImages={5}
          error={errors.images}
        />

        {/* 2. Product Name */}
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

        {/* 3. Category Dropdown */}
        <ProductCategoryPicker
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
          }}
          categories={categories}
          error={errors.category}
        />

        {/* 4. Price & Stock Inputs Side-by-Side */}
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

        {/* 5. Description */}
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
          <Text style={styles.charCount}>
            {description.length}/300
          </Text>
        </View>

        {/* 6. Product Tags */}
        <ProductTagSelector
          tags={tags}
          onChangeTags={setTags}
        />

        {/* 7. Submit Action Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonPlus}>⊕</Text>
              <Text style={styles.submitButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
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
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lotusLogo: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  brandShilp: {
    color: ShilpColors.primaryText || '#25251F',
  },
  brandSetu: {
    color: ShilpColors.secondary || '#A85E2B',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 20,
    height: 20,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FBF5EB',
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#287A3D',
    borderWidth: 1.5,
    borderColor: '#F8F0E3',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headingSection: {
    position: 'relative',
    marginBottom: 16,
  },
  branchDecor: {
    position: 'absolute',
    top: -12,
    right: 0,
    width: 70,
    height: 70,
    opacity: 0.5,
  },
  branchImage: {
    width: '100%',
    height: '100%',
    transform: [{ scaleX: -1 }, { rotate: '20deg' }],
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6E6B65',
    marginTop: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: ShilpColors.primary || '#263C29',
    marginRight: 8,
  },
  toggleActiveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleInactive: {
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginLeft: 8,
  },
  toggleInactiveText: {
    color: ShilpColors.primaryText || '#25251F',
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionWrapper: {
    position: 'relative',
  },
  charCount: {
    position: 'absolute',
    right: 8,
    bottom: 22,
    fontSize: 11,
    color: '#8A8478',
  },
  submitButton: {
    backgroundColor: ShilpColors.primary || '#263C29',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonPlus: {
    color: '#FFFFFF',
    fontSize: 17,
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

