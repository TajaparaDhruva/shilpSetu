import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';

export default function RecentTransactionsSection({
  transactions = [],
  onViewAllPress,
}) {
  const hasTransactions = Array.isArray(transactions) && transactions.length > 0;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.clockIcon}>🕒</Text>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>

        {hasTransactions && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAllPress}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={14} color="#173D2B" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions List */}
      {!hasTransactions ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No transactions available</Text>
          <Text style={styles.emptySub}>
            Earnings from purchased crafts will appear here upon completion.
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {transactions.map((tx, idx) => {
            const formattedDate = tx.created_at
              ? new Date(tx.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently';

            const orderNum = tx.order_number || `#SS${String(tx.order_id).slice(0, 6)}`;
            const amountStr = `+ ₹${Number(tx.amount || 0).toLocaleString('en-IN')}`;

            return (
              <View
                key={tx.id || tx.order_id || idx}
                style={[
                  styles.txItem,
                  idx === transactions.length - 1 && styles.txItemLast,
                ]}
              >
                {/* Left Green Success Check Circle */}
                <View style={styles.checkCircleWrap}>
                  <CheckCircle2 size={20} color="#173D2B" strokeWidth={2.2} />
                </View>

                {/* Middle: Order and Status / Date */}
                <View style={styles.txInfo}>
                  <Text style={styles.orderTitle}>Order {orderNum}</Text>
                  <Text style={styles.statusDateText}>
                    Completed • {formattedDate}
                  </Text>
                </View>

                {/* Right: Price */}
                <Text style={styles.amountText}>{amountStr}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    fontSize: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173D2B',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173D2B',
  },
  emptyWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4036',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#8A7F73',
    textAlign: 'center',
  },
  cardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  txItemLast: {
    borderBottomWidth: 0,
  },
  checkCircleWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF6F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2E24',
    marginBottom: 2,
  },
  statusDateText: {
    fontSize: 12,
    color: '#73685C',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#173D2B',
  },
});
