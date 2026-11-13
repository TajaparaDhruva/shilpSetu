import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { submitProductReview } from '@/services/reviewService.js';

export default function OrderReviewForm({ visible, product, orderId, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!product?.id && !product?.product_id) {
      Alert.alert('Error', 'Product information missing');
      return;
    }

    setLoading(true);
    try {
      const res = await submitProductReview({
        productId: product.id || product.product_id,
        rating,
        comment,
        orderId,
      });

      if (res.success) {
        Alert.alert('Thank You!', 'Your review has been submitted.');
        onSuccess && onSuccess();
        onClose();
      } else {
        Alert.alert('Review Notice', res.error || 'Failed to submit review');
      }
    } catch {
      Alert.alert('Error', 'Unable to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Rate & Review</Text>
          <Text style={styles.subtitle}>
            {product?.name || product?.product_name || 'Handcrafted Product'}
          </Text>

          {/* Star selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
              >
                <Text style={[styles.star, star <= rating ? styles.starFilled : styles.starEmpty]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about this handcrafted item..."
            placeholderTextColor="#8A8275"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#F8F0E3',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263C29',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8A8275',
    textAlign: 'center',
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
  },
  starFilled: {
    color: '#A85E2B',
  },
  starEmpty: {
    color: '#D8CEBA',
  },
  textInput: {
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#25251F',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    alignItems: 'center',
  },
  cancelText: {
    color: '#6B6459',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#263C29',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

