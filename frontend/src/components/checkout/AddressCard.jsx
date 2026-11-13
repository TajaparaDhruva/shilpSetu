import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const PRIMARY = '#263C29';
const SECONDARY = '#A85E2B';
const CARD = '#FBF5EB';
const BORDER = '#E5D7C5';
const TEXT = '#25251F';

export default function AddressCard({
  address,
  isSelected,
  isDefault,
  onSelect,
  onEdit,
  onDelete,
}) {
  if (!address) return null;

  const {
    full_name,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    phone,
  } = address;

  const addressLine = [address_line1, address_line2].filter(Boolean).join(', ');
  const cityStatePin = [city, state, pincode].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected ? styles.cardSelected : styles.cardUnselected,
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Select address: ${full_name}`}
    >
      {/* Left accent line for selected state */}
      {isSelected && <View style={styles.accentLine} />}

      <View style={styles.content}>
        {/* Top row: name + badges + action icons */}
        <View style={styles.topRow}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.name}>{full_name}</Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onEdit}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit address"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Delete address"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address lines */}
        {addressLine ? <Text style={styles.addressText}>{addressLine}</Text> : null}
        {cityStatePin ? <Text style={styles.addressText}>{cityStatePin}</Text> : null}
        {phone ? <Text style={styles.phone}>📞 {phone}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: CARD,
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  accentLine: {
    width: 4,
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  },
  defaultBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    padding: 2,
  },
  actionIcon: {
    fontSize: 16,
  },
  addressText: {
    fontSize: 13,
    color: '#5A5A4A',
    marginBottom: 2,
    lineHeight: 18,
  },
  phone: {
    fontSize: 13,
    color: '#5A5A4A',
    marginTop: 4,
  },
});
