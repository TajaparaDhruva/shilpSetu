import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ProductImagePicker({
  images = [],
  onChangeImages,
  maxImages = 5,
  error = null,
}) {
  const [picking, setPicking] = React.useState(false);

  const handlePickImage = async () => {
    if (images.length >= maxImages) return;

    try {
      setPicking(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access photos is required to add craft images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxImages - images.length,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        const combined = [...images, ...newUris].slice(0, maxImages);
        onChangeImages(combined);
      }
    } catch (err) {
      console.warn('Error launching image library:', err);
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const filtered = images.filter((_, idx) => idx !== indexToRemove);
    onChangeImages(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.heading}>
          Product Images <Text style={styles.required}>*</Text>
        </Text>
      </View>
      <Text style={styles.subtitle}>Add up to 5 images (JPG, PNG)</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Selected Images Preview List */}
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.imageCard}>
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveImage(index)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Remove image ${index + 1}`}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Image Placeholder Button */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={[styles.placeholderCard, picking && styles.placeholderPicking]}
            onPress={handlePickImage}
            disabled={picking}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add craft image"
          >
            {picking ? (
              <ActivityIndicator color={ShilpColors.primary || '#263C29'} size="small" />
            ) : (
              <>
                <Text style={styles.uploadIcon}>📤</Text>
                <Text style={styles.uploadText}>Add Image</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
  },
  required: {
    color: '#C94A29',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#6E6B65',
    marginTop: 2,
    marginBottom: 10,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  imageCard: {
    width: 96,
    height: 96,
    borderRadius: 16,
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#F0E4D4',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(37, 37, 31, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  placeholderCard: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C5B5A1',
    borderStyle: 'dashed',
    backgroundColor: '#FBF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPicking: {
    opacity: 0.6,
  },
  uploadIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: ShilpColors.primaryText || '#25251F',
  },
  errorText: {
    color: '#C94A29',
    fontSize: 12,
    marginTop: 6,
  },
});

