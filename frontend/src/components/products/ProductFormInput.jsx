import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ShilpColors } from '@/constants/shilpSetuTheme';

export default function ProductFormInput({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  error,
  style,
  inputStyle,
}) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.errorInput,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9E9689"
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: ShilpColors.primaryText || '#25251F',
    marginBottom: 6,
  },
  required: {
    color: '#C94A29',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#E5D7C5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: ShilpColors.primaryText || '#25251F',
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  errorInput: {
    borderColor: '#C94A29',
  },
  errorText: {
    color: '#C94A29',
    fontSize: 12,
    marginTop: 4,
  },
});

