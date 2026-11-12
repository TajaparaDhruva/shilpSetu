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

const googleIcon = require('@/assets/images/shilpsetu/icon-google.svg');

export default function GoogleLoginButton({
  title = 'Continue with Google',
  onPress,
  loading = false,
  disabled = false,
  style,
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
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={ShilpColors.primary} size="small" />
      ) : (
        <View style={styles.content}>
          <Image
            source={googleIcon}
            style={styles.googleIcon}
            contentFit="contain"
          />
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: ShilpColors.inputBackground,
    borderWidth: 1.5,
    borderColor: ShilpColors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    color: ShilpColors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

