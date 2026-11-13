import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { addAddress, updateAddress, validateAddress } from '@/services/addressService';

const PRIMARY = '#263C29';
const SECONDARY = '#A85E2B';
const BACKGROUND = '#F8F0E3';
const CARD = '#FBF5EB';
const BORDER = '#E5D7C5';
const TEXT = '#25251F';
const ERROR_COLOR = '#C0392B';

const EMPTY_FORM = {
  full_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
};

export default function AddressForm({ address, onSave, onCancel }) {
  const isEdit = !!address;

  const [form, setForm] = useState({
    full_name: address?.full_name ?? '',
    address_line1: address?.address_line1 ?? '',
    address_line2: address?.address_line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
    phone: address?.phone ?? '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    setGlobalError('');
    const { valid, errors: validationErrors } = validateAddress(form);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      let result;
      if (isEdit && address?.id) {
        result = await updateAddress(address.id, form);
      } else {
        result = await addAddress(form);
      }
      if (result?.error) {
        setGlobalError(result.error);
      } else {
        onSave(result?.address || form);
      }
    } catch (err) {
      setGlobalError('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.formTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>

      {globalError ? (
        <View style={styles.globalErrorBox}>
          <Text style={styles.globalErrorText}>{globalError}</Text>
        </View>
      ) : null}

      {/* Full Name */}
      <FormField
        label="Full Name *"
        value={form.full_name}
        onChangeText={(v) => handleChange('full_name', v)}
        error={errors.full_name}
        placeholder="Enter full name"
        autoCapitalize="words"
      />

      {/* Address Line 1 */}
      <FormField
        label="Address Line *"
        value={form.address_line1}
        onChangeText={(v) => handleChange('address_line1', v)}
        error={errors.address_line1}
        placeholder="House no., Street, Area"
        autoCapitalize="sentences"
      />

      {/* Address Line 2 (optional) */}
      <FormField
        label="Address Line 2 (optional)"
        value={form.address_line2}
        onChangeText={(v) => handleChange('address_line2', v)}
        error={errors.address_line2}
        placeholder="Landmark, Colony (optional)"
        autoCapitalize="sentences"
      />

      {/* City */}
      <FormField
        label="City *"
        value={form.city}
        onChangeText={(v) => handleChange('city', v)}
        error={errors.city}
        placeholder="Enter city"
        autoCapitalize="words"
      />

      {/* State */}
      <FormField
        label="State *"
        value={form.state}
        onChangeText={(v) => handleChange('state', v)}
        error={errors.state}
        placeholder="Enter state"
        autoCapitalize="words"
      />

      {/* PIN Code */}
      <FormField
        label="PIN Code *"
        value={form.pincode}
        onChangeText={(v) => handleChange('pincode', v.replace(/[^0-9]/g, ''))}
        error={errors.pincode}
        placeholder="6-digit PIN code"
        keyboardType="numeric"
        maxLength={6}
      />

      {/* Phone */}
      <FormField
        label="Phone Number *"
        value={form.phone}
        onChangeText={(v) => handleChange('phone', v.replace(/[^0-9]/g, ''))}
        error={errors.phone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        maxLength={10}
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Update Address' : 'Save Address'}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>{isEdit ? 'Update Address' : 'Save Address'}</Text>
        )}
      </TouchableOpacity>

      {/* Cancel */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A89F94"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  globalErrorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  globalErrorText: {
    color: ERROR_COLOR,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: SECONDARY,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 5,
  },
  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: TEXT,
  },
  inputError: {
    borderColor: '#C0392B',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 11,
    marginTop: 4,
  },
});
