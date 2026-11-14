import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Tag, Sparkles, Check, Plus, X } from 'lucide-react-native';
import { generateProductTags } from '@/services/aiProductService';
import { updateProduct } from '@/services/productService';
import { getProductRealImage } from '@/services/productImageService';

export default function SmartTagsTab({
  products = [],
  onProductUpdated,
}) {
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [generating, setGenerating] = useState(false);
  const [currentTags, setCurrentTags] = useState(products[0]?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentTags(product.tags || []);
  };

  const handleGenerateTags = async () => {
    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a product first.');
      return;
    }

    setGenerating(true);
    try {
      const res = await generateProductTags({
        title: selectedProduct.name || selectedProduct.product_name,
        description: selectedProduct.description || '',
        category: selectedProduct.category || selectedProduct.category_name,
        existingTags: currentTags,
      });

      if (res && res.success && Array.isArray(res.tags)) {
        // Merge without duplicates
        const merged = Array.from(new Set([...currentTags, ...res.tags]));
        setCurrentTags(merged);
      } else {
        Alert.alert('Error', 'Unable to generate tags at this time.');
      }
    } catch (err) {
      Alert.alert('Tag Error', err.message || 'Failed to generate tags.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveTag = (tag) => {
    setCurrentTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!currentTags.includes(trimmed)) {
      setCurrentTags((prev) => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const handleSaveTags = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const res = await updateProduct(selectedProduct.id, {
        name: selectedProduct.name || selectedProduct.product_name,
        description: selectedProduct.description,
        category: selectedProduct.category || selectedProduct.category_name,
        price: selectedProduct.price,
        stock: selectedProduct.stock_quantity ?? selectedProduct.stock,
        tags: currentTags,
      });

      if (res.success) {
        Alert.alert('Tags Saved! 🏷️', 'Smart tags successfully updated on your craft listing.');
        if (onProductUpdated) onProductUpdated();
      } else {
        Alert.alert('Save Failed', res.error || 'Could not update tags.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save tags.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Select Craft for Smart Tags</Text>
      <Text style={styles.subheading}>
        AI extracts keywords based on craft technique, natural materials, and search intent to boost visibility.
      </Text>

      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Listed Crafts Found</Text>
          <Text style={styles.emptySub}>
            Add or generate a product first to use the Smart Tags feature.
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

      {selectedProduct && (
        <View style={styles.tagsContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.generateBtn}
              activeOpacity={0.85}
              onPress={handleGenerateTags}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#F8F0E3" />
              ) : (
                <>
                  <Sparkles size={15} color="#F8F0E3" />
                  <Text style={styles.generateBtnText}>Generate Smart Tags with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Active Tags */}
          <Text style={styles.tagsHeading}>Active Product Tags ({currentTags.length})</Text>
          <View style={styles.tagsGrid}>
            {currentTags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.removeTagBtn}
                >
                  <X size={12} color="#A85E2B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add custom tag input */}
          <View style={styles.addCustomRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Add another craft tag..."
              placeholderTextColor="#A89F91"
              value={newTagInput}
              onChangeText={setNewTagInput}
              onSubmitEditing={handleAddCustomTag}
            />
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={handleAddCustomTag}
            >
              <Plus size={16} color="#F8F0E3" />
            </TouchableOpacity>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.88}
            onPress={handleSaveTags}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#F8F0E3" />
            ) : (
              <Text style={styles.saveBtnText}>Save Tags to Product</Text>
            )}
          </TouchableOpacity>
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
  tagsContainer: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 14,
    marginTop: 14,
  },
  actionRow: {
    marginBottom: 14,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#263C29',
    paddingVertical: 12,
    borderRadius: 24,
  },
  generateBtnText: {
    color: '#F8F0E3',
    fontSize: 14,
    fontWeight: '700',
  },
  tagsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25251F',
    marginBottom: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECE3D4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFD2BF',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#263C29',
    marginRight: 6,
  },
  removeTagBtn: {
    padding: 2,
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#25251F',
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#263C29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#F8F0E3',
    fontSize: 14,
    fontWeight: '700',
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

