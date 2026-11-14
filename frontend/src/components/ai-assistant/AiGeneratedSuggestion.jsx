import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Copy,
  Check,
  ChevronDown,
  Tag,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  RefreshCw,
} from 'lucide-react-native';
import ProductCategoryPicker from '@/components/products/ProductCategoryPicker';

export default function AiGeneratedSuggestion({
  suggestion,
  imageUrl,
  onUpdateSuggestion,
  onRegenerate,
  categories = [],
  regenerating = false,
}) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  if (!suggestion) return null;

  const handleCopyTitle = () => {
    if (suggestion.title) {
      Clipboard.setString(suggestion.title);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    }
  };

  const handleCopyDesc = () => {
    if (suggestion.description) {
      Clipboard.setString(suggestion.description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = (suggestion.tags || []).filter((t) => t !== tagToRemove);
    onUpdateSuggestion({ ...suggestion, tags: updatedTags });
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const currentTags = suggestion.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateSuggestion({ ...suggestion, tags: [...currentTags, trimmed] });
    }
    setNewTagInput('');
    setShowTagModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithIcon}>
          <Sparkles size={18} color="#A85E2B" />
          <Text style={styles.sectionHeading}>AI Generated Suggestion</Text>
        </View>

        <TouchableOpacity
          style={styles.regenerateBtn}
          activeOpacity={0.8}
          onPress={onRegenerate}
          disabled={regenerating}
        >
          <RefreshCw size={13} color="#263C29" />
          <Text style={styles.regenerateText}>
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Suggestion Card */}
      <View style={styles.suggestionCard}>
        {/* Top Product Row: Thumbnail + Editable Title & Description */}
        <View style={styles.topRow}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productThumb}
              contentFit="cover"
              transition={200}
            />
          ) : null}

          <View style={styles.topRightCol}>
            {/* Title field */}
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Product Title</Text>
              <TouchableOpacity
                onPress={handleCopyTitle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {copiedTitle ? (
                  <Check size={14} color="#263C29" />
                ) : (
                  <Copy size={14} color="#7C7365" />
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.titleInput}
              value={suggestion.title || ''}
              onChangeText={(text) => onUpdateSuggestion({ ...suggestion, title: text })}
              placeholder="Product Title"
              placeholderTextColor="#A89F91"
            />
          </View>
        </View>

        {/* Description Field */}
        <View style={styles.descSection}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Description</Text>
            <View style={styles.descRightHeader}>
              <Text style={styles.charCount}>
                {(suggestion.description || '').length}/300
              </Text>
              <TouchableOpacity
                onPress={handleCopyDesc}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 6 }}
              >
                {copiedDesc ? (
                  <Check size={14} color="#263C29" />
                ) : (
                  <Copy size={14} color="#7C7365" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.descInput}
            value={suggestion.description || ''}
            onChangeText={(text) => onUpdateSuggestion({ ...suggestion, description: text })}
            multiline
            numberOfLines={4}
            maxLength={300}
            placeholder="Product Description..."
            placeholderTextColor="#A89F91"
          />
        </View>

        {/* Row for Category & Price Range */}
        <View style={styles.pillRow}>
          {/* Category Picker Card */}
          <View style={styles.pickerBox}>
            <View style={styles.pickerLabelRow}>
              <ShoppingBag size={14} color="#A85E2B" />
              <Text style={styles.pickerLabel}>Category</Text>
            </View>
            <ProductCategoryPicker
              selectedCategory={suggestion.category || 'Pottery & Ceramics'}
              onSelectCategory={(cat) => onUpdateSuggestion({ ...suggestion, category: cat })}
              categories={categories}
            />
          </View>

          {/* Price Range Box */}
          <View style={styles.pickerBox}>
            <View style={styles.pickerLabelRow}>
              <IndianRupee size={14} color="#A85E2B" />
              <Text style={styles.pickerLabel}>Price Range</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceRangeText}>
                ₹{suggestion.minPrice || 699} – ₹{suggestion.maxPrice || 899}
              </Text>
              <Text style={styles.priceEstimateNote}>AI Estimate</Text>
            </View>
          </View>
        </View>

        {/* Suggested Tags Section */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsHeader}>
            <View style={styles.tagIconTitle}>
              <Tag size={13} color="#263C29" />
              <Text style={styles.tagsLabel}>Suggested Tags</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTagModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.addTagLink}>+ Add Tag</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsWrapper}>
            {(suggestion.tags || []).map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text style={styles.tagText}>{t}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(t)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.tagCloseBtn}
                >
                  <Text style={styles.tagCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {showTagModal ? (
            <View style={styles.newTagRow}>
              <TextInput
                style={styles.newTagInput}
                placeholder="Enter new tag..."
                placeholderTextColor="#A89F91"
                value={newTagInput}
                onChangeText={setNewTagInput}
                autoFocus
              />
              <TouchableOpacity
                style={styles.newTagAddBtn}
                onPress={handleAddTag}
              >
                <Text style={styles.newTagAddText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newTagCancelBtn}
                onPress={() => setShowTagModal(false)}
              >
                <Text style={styles.newTagCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: 'serif',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECE3D4',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  regenerateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#263C29',
  },
  suggestionCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productThumb: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#ECE3D4',
  },
  topRightCol: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#25251F',
    fontWeight: '600',
  },
  descSection: {
    marginTop: 10,
  },
  descRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: '#7C7365',
  },
  descInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#25251F',
    lineHeight: 18,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  pickerBox: {
    flex: 1,
    backgroundColor: '#F8F0E3',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  pickerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  priceContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263C29',
  },
  priceEstimateNote: {
    fontSize: 10,
    color: '#A85E2B',
    marginTop: 2,
    fontWeight: '500',
  },
  tagsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
  },
  tagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  addTagLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A85E2B',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECE3D4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFD2BF',
  },
  tagText: {
    fontSize: 12,
    color: '#263C29',
    fontWeight: '600',
    marginRight: 6,
  },
  tagCloseBtn: {
    padding: 2,
  },
  tagCloseText: {
    fontSize: 10,
    color: '#A85E2B',
    fontWeight: 'bold',
  },
  newTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#25251F',
  },
  newTagAddBtn: {
    backgroundColor: '#263C29',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  newTagAddText: {
    color: '#F8F0E3',
    fontSize: 12,
    fontWeight: '600',
  },
  newTagCancelBtn: {
    backgroundColor: '#ECE3D4',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  newTagCancelText: {
    color: '#7C7365',
    fontSize: 12,
  },
});

