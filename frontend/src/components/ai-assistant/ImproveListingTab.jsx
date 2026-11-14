import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, Check, ArrowRight, Wand2 } from 'lucide-react-native';
import { improveProductListing } from '@/services/aiProductService';
import { updateProduct } from '@/services/productService';
import { getProductRealImage } from '@/services/productImageService';

export default function ImproveListingTab({
  products = [],
  onProductUpdated,
}) {
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [improving, setImproving] = useState(false);
  const [improvementResult, setImprovementResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setImprovementResult(null);
  };

  const handleGenerateImprovement = async () => {
    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a product from your catalog.');
      return;
    }

    setImproving(true);
    try {
      const res = await improveProductListing({
        title: selectedProduct.name || selectedProduct.product_name,
        description: selectedProduct.description || '',
        category: selectedProduct.category || selectedProduct.category_name,
      });

      if (res && res.success && res.improved) {
        setImprovementResult(res.improved);
      } else {
        Alert.alert('AI Error', 'Could not generate improvements at this time.');
      }
    } catch (err) {
      Alert.alert('Improvement Error', err.message || 'Failed to improve listing.');
    } finally {
      setImproving(false);
    }
  };

  const handleApplyImprovement = async () => {
    if (!selectedProduct || !improvementResult) return;

    setSaving(true);
    try {
      const res = await updateProduct(selectedProduct.id, {
        name: improvementResult.improvedTitle,
        description: improvementResult.improvedDescription,
        category: selectedProduct.category || selectedProduct.category_name,
        price: selectedProduct.price,
        stock: selectedProduct.stock_quantity ?? selectedProduct.stock,
      });

      if (res.success) {
        Alert.alert('Listing Updated! ✨', 'Your product details have been upgraded with AI suggestions.');
        if (onProductUpdated) onProductUpdated();
        setImprovementResult(null);
      } else {
        Alert.alert('Update Failed', res.error || 'Could not save product.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to apply improvements.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Product Picker Ribbon */}
      <Text style={styles.heading}>Select Craft from Your Catalog</Text>
      <Text style={styles.subheading}>
        Choose which product listing you want AI to enhance for better customer engagement.
      </Text>

      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Listed Crafts Found</Text>
          <Text style={styles.emptySub}>
            Add or generate a product first to use the Improve Listing feature.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerScroll}
        >
          {products.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            const rawImg = p.image_url || (Array.isArray(p.image_urls) ? p.image_urls[0] : null);
            const source = getProductRealImage(p.imageKey || p.category, rawImg);

            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.productThumbCard, isSelected && styles.productThumbCardActive]}
                activeOpacity={0.8}
                onPress={() => handleSelectProduct(p)}
              >
                <Image source={source} style={styles.thumbImg} contentFit="cover" />
                <Text style={styles.thumbTitle} numberOfLines={1}>
                  {p.name || p.product_name}
                </Text>
                <Text style={styles.thumbPrice}>₹{p.price}</Text>
                {isSelected && (
                  <View style={styles.activeCheck}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 2. Action Button */}
      {selectedProduct && (
        <TouchableOpacity
          style={styles.improveBtn}
          activeOpacity={0.85}
          onPress={handleGenerateImprovement}
          disabled={improving}
        >
          {improving ? (
            <ActivityIndicator size="small" color="#F8F0E3" />
          ) : (
            <>
              <Wand2 size={16} color="#F8F0E3" />
              <Text style={styles.improveBtnText}>Analyze & Improve with AI</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* 3. Comparison View */}
      {improvementResult && (
        <View style={styles.comparisonCard}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color="#A85E2B" />
            <Text style={styles.cardTitle}>Original vs AI Improved</Text>
          </View>

          {/* Title Comparison */}
          <View style={styles.compareBlock}>
            <Text style={styles.blockLabel}>Title Upgrade</Text>
            <View style={styles.compareRow}>
              <View style={styles.originalCol}>
                <Text style={styles.tagBadgeOrig}>Original</Text>
                <Text style={styles.origText}>{improvementResult.originalTitle}</Text>
              </View>
              <ArrowRight size={16} color="#7C7365" style={{ alignSelf: 'center' }} />
              <View style={styles.improvedCol}>
                <Text style={styles.tagBadgeImp}>Improved</Text>
                <Text style={styles.impText}>{improvementResult.improvedTitle}</Text>
              </View>
            </View>
          </View>

          {/* Description Comparison */}
          <View style={[styles.compareBlock, { marginTop: 12 }]}>
            <Text style={styles.blockLabel}>Description Quality Upgrade</Text>
            <View style={styles.descOrigBox}>
              <Text style={styles.tagBadgeOrig}>Current Story</Text>
              <Text style={styles.origDescText}>
                {improvementResult.originalDescription || '(No description provided)'}
              </Text>
            </View>
            <View style={styles.descImpBox}>
              <Text style={styles.tagBadgeImp}>AI Enhanced Craft Story</Text>
              <Text style={styles.impDescText}>{improvementResult.improvedDescription}</Text>
            </View>
          </View>

          {/* Apply or Discard */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.discardBtn}
              onPress={() => setImprovementResult(null)}
              disabled={saving}
            >
              <Text style={styles.discardBtnText}>Keep Original</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleApplyImprovement}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#F8F0E3" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept & Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
    marginTop: 4,
  },
  subheading: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 17,
  },
  pickerScroll: {
    gap: 10,
    paddingVertical: 6,
  },
  productThumbCard: {
    width: 120,
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#E5D7C5',
    position: 'relative',
  },
  productThumbCardActive: {
    borderColor: '#263C29',
    backgroundColor: '#F4ECE0',
  },
  thumbImg: {
    width: '100%',
    height: 75,
    borderRadius: 8,
    backgroundColor: '#ECE3D4',
  },
  thumbTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
    marginTop: 6,
  },
  thumbPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A85E2B',
    marginTop: 2,
  },
  activeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  improveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#263C29',
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 14,
  },
  improveBtnText: {
    color: '#F8F0E3',
    fontSize: 14,
    fontWeight: '700',
  },
  comparisonCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263C29',
  },
  compareBlock: {},
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C7365',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  originalCol: {
    flex: 1,
    backgroundColor: '#ECE3D4',
    padding: 10,
    borderRadius: 10,
  },
  improvedCol: {
    flex: 1,
    backgroundColor: '#E6EDD9',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D9B0',
  },
  tagBadgeOrig: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C7365',
    marginBottom: 2,
  },
  tagBadgeImp: {
    fontSize: 10,
    fontWeight: '700',
    color: '#263C29',
    marginBottom: 2,
  },
  origText: {
    fontSize: 12,
    color: '#25251F',
  },
  impText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#263C29',
  },
  descOrigBox: {
    backgroundColor: '#ECE3D4',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  descImpBox: {
    backgroundColor: '#E6EDD9',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D9B0',
  },
  origDescText: {
    fontSize: 12,
    color: '#25251F',
    lineHeight: 17,
  },
  impDescText: {
    fontSize: 12,
    color: '#263C29',
    lineHeight: 18,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: '#ECE3D4',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C7365',
  },
  acceptBtn: {
    flex: 1.5,
    backgroundColor: '#263C29',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8F0E3',
  },
  emptyCard: {
    backgroundColor: '#FBF5EB',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#25251F',
  },
  emptySub: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 4,
    textAlign: 'center',
  },
});

