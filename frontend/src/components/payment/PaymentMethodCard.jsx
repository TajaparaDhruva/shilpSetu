import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BRAND = {
  bg: '#F8F0E3',
  primary: '#263C29',
  secondary: '#A85E2B',
  text: '#25251F',
  card: '#FBF5EB',
  border: '#E5D7C5',
};

const METHOD_ICONS = {
  upi: '📱',
  card: '💳',
  netbanking: '🏦',
  cod: '📦',
};

const UPI_APPS = ['GPay', 'PhonePe', 'Paytm'];

export default function PaymentMethodCard({ method, isSelected, onSelect, selectedUpiApp, onSelectUpiApp }) {
  const icon = METHOD_ICONS[method.id] || '💰';

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(method.id)}
      activeOpacity={0.8}
    >
      {/* Left border accent when selected */}
      {isSelected && <View style={styles.leftAccent} />}

      <View style={styles.row}>
        {/* Icon + Text */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, isSelected && styles.labelSelected]}>{method.label}</Text>
          {method.description ? (
            <Text style={styles.description}>{method.description}</Text>
          ) : null}
        </View>

        {/* Radio button */}
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>

      {/* UPI sub-options */}
      {isSelected && method.id === 'upi' && (
        <View style={styles.upiRow}>
          {UPI_APPS.map((app) => (
            <TouchableOpacity
              key={app}
              style={[styles.upiPill, selectedUpiApp === app && styles.upiPillSelected]}
              onPress={() => onSelectUpiApp && onSelectUpiApp(app)}
            >
              <Text style={[styles.upiPillText, selectedUpiApp === app && styles.upiPillTextSelected]}>
                {app}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardSelected: {
    borderColor: BRAND.primary,
    backgroundColor: '#F0F5F0',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: BRAND.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.text,
  },
  labelSelected: {
    color: BRAND.primary,
  },
  description: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioSelected: {
    borderColor: BRAND.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.primary,
  },
  upiRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingLeft: 52,
    gap: 8,
  },
  upiPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    backgroundColor: '#FFFFFF',
  },
  upiPillSelected: {
    borderColor: BRAND.primary,
    backgroundColor: '#E8F0E8',
  },
  upiPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.text,
  },
  upiPillTextSelected: {
    color: BRAND.primary,
    fontWeight: '700',
  },
});
