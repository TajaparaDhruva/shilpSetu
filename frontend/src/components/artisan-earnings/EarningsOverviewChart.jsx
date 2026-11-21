import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TrendingUp, ChevronDown } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function EarningsOverviewChart({
  chartPoints = [],
  periodLabel = 'Last 3 Months',
  onPeriodChange,
}) {
  const [selectedPointIndex, setSelectedPointIndex] = useState(
    chartPoints.length > 0 ? chartPoints.length - 1 : null
  );

  const hasData = Array.isArray(chartPoints) && chartPoints.length > 0 && chartPoints.some((p) => p.earnings > 0);

  // Determine scale maximum
  const maxVal = hasData
    ? Math.max(...chartPoints.map((p) => Number(p.earnings || 0)), 15000)
    : 15000;

  // Y-axis labels
  const yLabels = [
    { val: maxVal, label: `${Math.round(maxVal / 1000)}k` },
    { val: maxVal * 0.66, label: `${Math.round((maxVal * 0.66) / 1000)}k` },
    { val: maxVal * 0.33, label: `${Math.round((maxVal * 0.33) / 1000)}k` },
    { val: 0, label: '0' },
  ];

  const chartHeight = 160;

  return (
    <View style={styles.container}>
      {/* Chart Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <TrendingUp size={18} color="#173D2B" strokeWidth={2.2} />
          <Text style={styles.title}>Earnings Overview</Text>
        </View>

        <View style={styles.periodBadge}>
          <Text style={styles.periodBadgeText}>{periodLabel}</Text>
          <ChevronDown size={14} color="#544B3F" />
        </View>
      </View>

      {/* Chart Canvas */}
      {!hasData ? (
        <View style={styles.emptyChartBox}>
          <Text style={styles.emptyChartText}>No earnings data recorded for this period</Text>
          <Text style={styles.emptyChartSub}>Your sales trend curve will render here automatically</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          {/* Y Axis Guide Lines & Labels */}
          <View style={styles.yAxisLabels}>
            {yLabels.map((item, idx) => (
              <Text key={idx} style={styles.yLabelText}>
                {item.label}
              </Text>
            ))}
          </View>

          {/* Plot Area */}
          <View style={[styles.plotArea, { height: chartHeight }]}>
            {/* Horizontal Grid lines */}
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: chartHeight * 0.33 }]} />
            <View style={[styles.gridLine, { top: chartHeight * 0.66 }]} />
            <View style={[styles.gridLine, { top: chartHeight }]} />

            {/* Render connecting curve & nodes */}
            <View style={styles.nodesContainer}>
              {chartPoints.map((pt, idx) => {
                const fraction = Math.min(1, Math.max(0, Number(pt.earnings || 0) / maxVal));
                const bottomPos = fraction * (chartHeight - 24);
                const isSelected = selectedPointIndex === idx;

                return (
                  <View key={idx} style={styles.nodeColumn}>
                    {/* Tooltip bubble if selected */}
                    {isSelected && (
                      <View style={[styles.tooltip, { bottom: bottomPos + 18 }]}>
                        <Text style={styles.tooltipText}>
                          ₹{Number(pt.earnings).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}

                    {/* Point Marker */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedPointIndex(idx)}
                      style={[
                        styles.markerCircle,
                        { bottom: bottomPos },
                        isSelected && styles.markerCircleActive,
                      ]}
                    >
                      <View style={styles.markerInner} />
                    </TouchableOpacity>

                    {/* X-Axis Label */}
                    <Text style={styles.xLabelText}>{pt.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173D2B',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DED2',
    gap: 4,
  },
  periodBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4237',
  },
  chartWrapper: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 4,
  },
  yAxisLabels: {
    width: 32,
    height: 160,
    justifyContent: 'space-between',
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  yLabelText: {
    fontSize: 11,
    color: '#8A7F73',
    fontWeight: '600',
  },
  plotArea: {
    flex: 1,
    position: 'relative',
    marginLeft: 6,
    marginRight: 6,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0E7DB',
  },
  nodesContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  nodeColumn: {
    alignItems: 'center',
    height: '100%',
    width: 50,
    position: 'relative',
  },
  markerCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#173D2B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  markerCircleActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#173D2B',
    transform: [{ translateX: -2 }],
  },
  markerInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#173D2B',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#173D2B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xLabelText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 11,
    color: '#73685C',
    fontWeight: '600',
  },
  emptyChartBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDFBFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EAE1',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
  },
  emptyChartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#655A4D',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyChartSub: {
    fontSize: 11,
    color: '#9E9285',
    textAlign: 'center',
  },
});
