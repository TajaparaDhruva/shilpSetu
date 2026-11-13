import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const checkIcon = require('@/assets/images/shilpsetu/icon-check.svg');

/**
 * RoleSelectionCard — A selectable card for choosing Customer or Artisan role.
 *
 * Props:
 *   icon        — require() source for the illustration SVG
 *   title       — e.g. "Join as a Customer"
 *   description — e.g. "Discover and buy unique handcrafted products."
 *   selected    — boolean, whether this card is currently selected
 *   onPress     — callback when card is tapped
 *   disabled    — optional, prevents interaction during save
 *   testID      — optional test identifier
 */
export default function RoleSelectionCard({
  icon,
  title,
  description,
  selected = false,
  onPress,
  disabled = false,
  testID,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${title}. ${description}`}
      testID={testID}
    >
      {/* Illustration */}
      <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
        <Image
          source={icon}
          style={styles.icon}
          contentFit="contain"
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      {/* Selection Indicator */}
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <Image
            source={checkIcon}
            style={styles.checkIcon}
            contentFit="contain"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const CARD_BG = '#FBF5EB';
const CARD_BORDER = '#DCCBB3';
const SELECTED_BORDER = '#526B54';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: CARD_BORDER,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#263C29',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardSelected: {
    borderColor: SELECTED_BORDER,
    borderWidth: 2,
    backgroundColor: '#F5F0E5',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F0E8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerSelected: {
    backgroundColor: '#E8DFC8',
  },
  icon: {
    width: 38,
    height: 38,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: ShilpColors.text,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif-medium' }),
  },
  titleSelected: {
    color: '#263C29',
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    color: ShilpColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#C4B89E',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: SELECTED_BORDER,
    backgroundColor: SELECTED_BORDER,
  },
  checkIcon: {
    width: 14,
    height: 14,
  },
});

