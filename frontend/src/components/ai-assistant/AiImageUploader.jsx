import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { UploadCloud, X, Camera, Image as ImageIcon } from 'lucide-react-native';

const craftPottery = require('@/assets/images/shilpsetu/terracotta-craft.jpg');

export default function AiImageUploader({
  selectedImage,
  onImageSelected,
  onImageRemoved,
  uploading = false,
  uploadProgress = 0,
}) {
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload craft photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        validateAndSelect(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Selection Error', 'Unable to pick photo from gallery.');
    }
  };

  const captureFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to photograph your craft directly.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        validateAndSelect(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const validateAndSelect = (asset) => {
    const uri = asset.uri;
    const cleanPath = uri.split('?')[0].toLowerCase();
    const isSupported =
      cleanPath.endsWith('.jpg') ||
      cleanPath.endsWith('.jpeg') ||
      cleanPath.endsWith('.png') ||
      cleanPath.startsWith('http') ||
      cleanPath.startsWith('data:image');

    if (!isSupported) {
      Alert.alert(
        'Invalid Format',
        'Only JPG, JPEG, and PNG images are supported for AI analysis.'
      );
      return;
    }

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Please select an image under 10MB.');
      return;
    }

    onImageSelected({
      uri: asset.uri,
      base64: asset.base64,
    });
  };

  const handleChooseAction = () => {
    Alert.alert(
      'Upload Product Image',
      'Choose how to upload your craft photograph:',
      [
        { text: 'Take Photo with Camera', onPress: captureFromCamera },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <View style={styles.previewContainer}>
          <View style={styles.thumbWrap}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              contentFit="cover"
              transition={200}
            />
            <TouchableOpacity
              style={styles.removeBtn}
              activeOpacity={0.8}
              onPress={onImageRemoved}
              disabled={uploading}
              accessibilityLabel="Remove image"
            >
              <X size={14} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.previewTitle}>Craft Photo Selected</Text>
            <Text style={styles.previewSubtitle}>Ready for AI Craft Analysis</Text>

            {uploading ? (
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color="#263C29" />
                <Text style={styles.progressText}>
                  Uploading & analyzing craft photo... {uploadProgress ? `${uploadProgress}%` : ''}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={handleChooseAction}
              >
                <Text style={styles.changeBtnText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.dropZone}
          activeOpacity={0.85}
          onPress={handleChooseAction}
          accessibilityRole="button"
          accessibilityLabel="Upload Product Image"
        >
          <View style={styles.uploadIconCircle}>
            <UploadCloud size={28} color="#263C29" strokeWidth={2} />
          </View>
          <Text style={styles.uploadTitle}>Upload Product Image</Text>
          <Text style={styles.uploadSub}>
            Drag & drop or tap to upload (JPG, PNG)
          </Text>

          <View style={styles.optionsRow}>
            <View style={styles.pillBadge}>
              <Camera size={13} color="#A85E2B" />
              <Text style={styles.pillText}>Camera</Text>
            </View>
            <View style={styles.pillBadge}>
              <ImageIcon size={13} color="#A85E2B" />
              <Text style={styles.pillText}>Gallery</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  dropZone: {
    backgroundColor: '#FBF5EB',
    borderWidth: 1.5,
    borderColor: '#D4C4AE',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECE3D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
    marginTop: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECE3D4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A85E2B',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5EB',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 16,
    padding: 12,
  },
  thumbWrap: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ECE3D4',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(37, 37, 31, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25251F',
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#7C7365',
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#263C29',
    fontWeight: '600',
    flex: 1,
  },
  changeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECE3D4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#263C29',
  },
});

