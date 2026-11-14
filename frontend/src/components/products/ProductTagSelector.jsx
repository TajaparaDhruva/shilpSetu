import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ProductTagSelector({
  tags = ['Handmade', 'Terracotta', 'Eco-Friendly'],
  onChangeTags,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [tagError, setTagError] = useState('');

  const handleRemoveTag = (indexToRemove) => {
    const updated = tags.filter((_, idx) => idx !== indexToRemove);
    onChangeTags(updated);
  };

  const handleAddTag = () => {
    const trimmed = newTagText.trim();
    if (!trimmed) {
      setTagError('Please enter a tag');
      return;
    }
    if (trimmed.length > 25) {
      setTagError('Tag must be 25 characters or fewer');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagError('Tag already added');
      return;
    }

    onChangeTags([...tags, trimmed]);
    setNewTagText('');
    setTagError('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Product Tags</Text>

      <View style={styles.tagsWrapper}>
        {/* Chips */}
        {tags.map((tag, index) => (
          <View key={`${tag}-${index}`} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveTag(index)}
              style={styles.removeTagBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove tag ${tag}`}
            >
              <Text style={styles.removeTagText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Tag Button */}
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={() => {
            setNewTagText('');
            setTagError('');
            setModalVisible(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.addTagText}>+ Add Tag</Text>
        </TouchableOpacity>
      </View>

      {/* Add Custom Tag Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Add Product Tag</Text>
                <TextInput
                  style={[styles.tagInput, tagError && styles.errorInput]}
                  value={newTagText}
                  onChangeText={(val) => {
                    setNewTagText(val);
                    if (tagError) setTagError('');
                  }}
                  placeholder="e.g., Organic Clay"
                  placeholderTextColor="#9E9689"
                  maxLength={25}
                  autoFocus
                />
                {tagError ? <Text style={styles.errorText}>{tagError}</Text> : null}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleAddTag}
                  >
                    <Text style={styles.confirmBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5D3',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8D9C5',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
    marginRight: 6,
  },
  removeTagBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 37, 31, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
  },
  addTagButton: {
    borderWidth: 1.5,
    borderColor: '#C5B5A1',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FBF5EB',
  },
  addTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: ShilpColors.secondary || '#A85E2B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#F8F0E3',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 12,
  },
  tagInput: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: ShilpColors.primaryText || '#25251F',
  },
  errorInput: {
    borderColor: '#C94A29',
  },
  errorText: {
    color: '#C94A29',
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6E6B65',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: ShilpColors.primary || '#263C29',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

