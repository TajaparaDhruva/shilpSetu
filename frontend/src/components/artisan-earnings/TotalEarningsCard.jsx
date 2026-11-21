import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react-native';

export default function TotalEarningsCard({
  totalEarnings = 0,
  priorEarnings = 0,
  growthPercentage = 0,
  isGrowth = true,
  periodLabel = 'last month',
}) {
  const formattedTotal = Number(totalEarnings || 0).toLocaleString('en-IN');
  const formattedPrior = Number(priorEarnings || 0).toLocaleString('en-IN');
  const growthNum = Math.abs(Number(growthPercentage || 0));

  return (
    <View style={styles.card}>
      {/* Background Decor - Leaf Branch Silhouette */}
      <View style={styles.decorCircles} pointerEvents="none">
        <View style={styles.leafShape1} />
        <View style={styles.leafShape2} />
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.leftCol}>
          <Text style={styles.label}>Total Earnings</Text>

          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountText}>{formattedTotal}</Text>

            {growthNum > 0 && (
              <View style={styles.growthBadge}>
                {isGrowth ? (
                  <ArrowUpRight size={16} color="#7AE582" strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight size={16} color="#FF8A8A" strokeWidth={2.5} />
                )}
                <Text style={[styles.growthText, { color: isGrowth ? '#7AE582' : '#FF8A8A' }]}>
                  {growthNum}%
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.comparisonText}>
            vs {periodLabel}: ₹{formattedPrior}
          </Text>
        </View>

        {/* Right Sack Graphic */}
        <View style={styles.moneySackWrap}>
          <View style={styles.moneySackCircle}>
            <View style={styles.sackBody}>
              <View style={styles.sackNeck} />
              <View style={styles.sackMain}>
                <Text style={styles.sackRupee}>₹</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#173D2B',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#173D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  decorCircles: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 140,
  },
  leafShape1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '-35deg' }],
  },
  leafShape2: {
    position: 'absolute',
    bottom: 10,
    right: 40,
    width: 70,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '25deg' }],
  },
  contentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#D8E2DC',
    fontWeight: '600',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  amountText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  comparisonText: {
    fontSize: 12,
    color: '#B5C9BC',
    marginTop: 4,
  },
  moneySackWrap: {
    marginLeft: 12,
  },
  moneySackCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(235, 218, 190, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sackBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sackNeck: {
    width: 14,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#E0AA3E',
    marginBottom: 1,
  },
  sackMain: {
    width: 36,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DFB06C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C6944A',
  },
  sackRupee: {
    fontSize: 16,
    fontWeight: '900',
    color: '#173D2B',
  },
});
