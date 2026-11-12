import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const arrowIcon = require('@/assets/images/shilpsetu/icon-arrow-right.svg');

export default function PrimaryButton({
  title = 'Login',
  onPress,
  loading = false,
  disabled = false,
  showArrow = true,
  style,
  textStyle,
  testID,
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator color={ShilpColors.white} size="small" />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        )}
      </View>

      {showArrow && !loading && (
        <View style={styles.arrowBadge}>
          <Image
            source={arrowIcon}
            style={styles.arrowIcon}
            contentFit="contain"
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: ShilpColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: ShilpColors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  arrowBadge: {
    position: 'absolute',
    right: 7,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ShilpColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
});

