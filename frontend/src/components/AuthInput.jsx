import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const mailIcon = require('@/assets/images/shilpsetu/icon-mail.svg');
const lockIcon = require('@/assets/images/shilpsetu/icon-lock.svg');
const eyeIcon = require('@/assets/images/shilpsetu/icon-eye.svg');
const eyeOffIcon = require('@/assets/images/shilpsetu/icon-eye-off.svg');

export default function AuthInput({
  icon = 'mail',
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePasswordVisibility,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  error,
  testID,
  editable = true,
  style,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const renderIcon = () => {
    let source = null;
    if (icon === 'mail' || icon === 'email') {
      source = mailIcon;
    } else if (icon === 'lock' || icon === 'password') {
      source = lockIcon;
    } else if (typeof icon === 'number' || (typeof icon === 'object' && icon !== null)) {
      source = icon;
    }

    if (!source) return null;

    return (
      <View style={styles.iconContainer}>
        <Image
          source={source}
          style={styles.icon}
          contentFit="contain"
          accessibilityLabel={`${icon} icon`}
        />
      </View>
    );
  };

  return (
    <View style={[styles.outerContainer, style]}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error ? styles.inputContainerError : null,
        ]}
      >
        {renderIcon()}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ShilpColors.textPlaceholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          cursorColor={ShilpColors.secondary}
          selectionColor={ShilpColors.secondary}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onTogglePasswordVisibility}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image
              source={isPasswordVisible ? eyeOffIcon : eyeIcon}
              style={styles.toggleIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: ShilpColors.inputBackground,
    borderWidth: 1.5,
    borderColor: ShilpColors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  inputContainerFocused: {
    borderColor: ShilpColors.inputBorderFocused,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: ShilpColors.error,
  },
  iconContainer: {
    width: 22,
    height: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: ShilpColors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  toggleButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  toggleIcon: {
    width: 20,
    height: 20,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 20,
    fontSize: 12,
    color: ShilpColors.error,
    fontWeight: '500',
  },
});

