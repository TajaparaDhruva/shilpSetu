import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ArtisanStatCard({
  icon,
  value,
  label,
  subLabel = null,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subLabel && (
          <Text style={styles.subLabel} numberOfLines={1}>
            {subLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4E8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 20,
    color: ShilpColors.secondary || '#A85E2B',
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: ShilpColors.primaryText || '#25251F',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    color: '#6E6B65',
    fontWeight: '500',
    marginTop: 1,
  },
  subLabel: {
    fontSize: 10,
    color: '#8A8478',
    marginTop: 1,
  },
});

