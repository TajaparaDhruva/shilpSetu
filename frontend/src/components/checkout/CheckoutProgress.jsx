import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const STEPS = [
  { number: 1, label: 'Cart' },
  { number: 2, label: 'Address' },
  { number: 3, label: 'Payment' },
  { number: 4, label: 'Order' },
];

const PRIMARY = '#263C29';
const GREY = '#B0A99A';

export default function CheckoutProgress({ currentStep = 1 }) {
  return (
    <View style={styles.wrapper}>
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.number} style={styles.stepRow}>
            {/* Step circle + label */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted || isCurrent ? styles.circleActive : styles.circleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    isCompleted || isCurrent ? styles.circleTextActive : styles.circleTextInactive,
                  ]}
                >
                  {isCompleted ? '✓' : step.number}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  isCompleted || isCurrent ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View
                style={[
                  styles.line,
                  isCompleted ? styles.lineCompleted : styles.linePending,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F0E3',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 44,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: PRIMARY,
  },
  circleInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: GREY,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  circleTextInactive: {
    color: GREY,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  labelActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
  labelInactive: {
    color: GREY,
    fontWeight: '400',
  },
  line: {
    flex: 1,
    height: 2,
    marginBottom: 18,
    marginHorizontal: 2,
  },
  lineCompleted: {
    backgroundColor: PRIMARY,
  },
  linePending: {
    backgroundColor: GREY,
  },
});
