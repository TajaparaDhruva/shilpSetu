import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const PRIMARY = '#263C29';
const CARD = '#FBF5EB';
const BORDER = '#E5D7C5';
const TEXT = '#25251F';

export default function DeliveryOptionCard({ option, isSelected, onSelect }) {
  if (!option) return null;

  const { label, days, charge } = option;
  const isFree = charge === 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected ? styles.cardSelected : styles.cardUnselected,
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${days}, ${isFree ? 'Free' : '₹' + charge}`}
      accessibilityState={{ checked: isSelected }}
    >
      {/* Delivery icon */}
      <Text style={styles.deliveryIcon}>🚚</Text>

      {/* Label + days */}
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.days}>{days}</Text>
      </View>

      {/* Charge */}
      <Text style={[styles.charge, isFree && styles.chargeFree]}>
        {isFree ? 'FREE' : `₹${charge}`}
      </Text>

      {/* Radio button */}
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  deliveryIcon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  },
  days: {
    fontSize: 12,
    color: '#7A7268',
    marginTop: 2,
  },
  charge: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    marginRight: 10,
  },
  chargeFree: {
    color: PRIMARY,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0A99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: PRIMARY,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
});
