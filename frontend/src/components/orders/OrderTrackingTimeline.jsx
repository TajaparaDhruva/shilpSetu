import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STAGES = [
  { key: 'ordered', label: 'Ordered', step: 1 },
  { key: 'packed', label: 'Packed', step: 2 },
  { key: 'out_for_delivery', label: 'Out for Delivery', step: 3 },
  { key: 'delivered', label: 'Delivered', step: 4 },
];

export default function OrderTrackingTimeline({ order }) {
  const norm = String(order?.status || order?.order_status || 'ordered').toLowerCase();

  if (norm.includes('cancel')) {
    return (
      <View style={styles.cancelledContainer}>
        <Text style={styles.cancelledText}>This order was cancelled</Text>
      </View>
    );
  }

  // Derive current step
  let currentStep = 1;
  if (norm.includes('delivered')) currentStep = 4;
  else if (norm.includes('out_for_delivery')) currentStep = 3;
  else if (norm.includes('packed') || norm.includes('shipped')) currentStep = 2;
  else if (norm.includes('ordered') || norm.includes('confirmed') || norm.includes('processing')) currentStep = 1;

  if (order?.tracking?.current_step) {
    currentStep = order.tracking.current_step;
  }

  return (
    <View style={styles.container}>
      <View style={styles.timelineRow}>
        {STAGES.map((st, index) => {
          const isDone = st.step <= currentStep;
          const isCurrent = st.step === currentStep;
          const isLast = index === STAGES.length - 1;

          let dateLabel = order?.tracking?.[st.key] || null;
          if (!dateLabel && isDone && order?.created_at && st.step === 1) {
            dateLabel = new Date(order.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            });
          }

          return (
            <React.Fragment key={st.key}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.node,
                    isDone && styles.nodeDone,
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  <Text style={[styles.nodeIcon, isDone && styles.nodeIconDone]}>
                    {isDone ? '✓' : ''}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stageLabel,
                    isCurrent && styles.stageLabelCurrent,
                  ]}
                  numberOfLines={2}
                >
                  {st.label}
                </Text>

                {!!dateLabel && (
                  <Text style={styles.dateLabel}>{dateLabel}</Text>
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    index + 1 < currentStep && styles.connectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D8CEBA',
    backgroundColor: '#FBF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nodeDone: {
    backgroundColor: '#263C29',
    borderColor: '#263C29',
  },
  nodeCurrent: {
    borderColor: '#263C29',
    backgroundColor: '#263C29',
  },
  nodeIcon: {
    fontSize: 10,
    color: '#D8CEBA',
  },
  nodeIconDone: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5D7C5',
    marginTop: 10,
    marginHorizontal: -8,
    zIndex: -1,
  },
  connectorDone: {
    backgroundColor: '#263C29',
  },
  stageLabel: {
    fontSize: 11,
    color: '#8A8275',
    textAlign: 'center',
  },
  stageLabelCurrent: {
    color: '#263C29',
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 10,
    color: '#6B6459',
    marginTop: 2,
  },
  cancelledContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 12,
    color: '#A83220',
    fontStyle: 'italic',
  },
});

