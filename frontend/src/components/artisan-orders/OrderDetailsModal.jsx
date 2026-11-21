import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import {
  X,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderDetailsModal({
  visible,
  onClose,
  order,
  onAccept,
  onCancel,
  onMarkShipped,
  onUpdateTracking,
}) {
  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const status = String(order.status || order.order_status || 'pending').toLowerCase();
  const customer = order.customer || {};
  const address = order.shipping_address || {};

  // Format order date
  let formattedDate = 'Recently';
  if (order.created_at) {
    try {
      const d = new Date(order.created_at);
      formattedDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {}
  }

  // Address line construction
  const addressLines = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean).join(', ');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.orderNumber}>
                    {order.order_number || `#SS${String(order.id).slice(0, 6)}`}
                  </Text>
                  <Text style={styles.orderDate}>{formattedDate}</Text>
                </View>

                <View style={styles.headerRight}>
                  <OrderStatusBadge status={status} />
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={22} color="#5C5346" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {/* 1. Cancellation Notice if Cancelled */}
                {status === 'cancelled' && (
                  <View style={styles.cancelledBanner}>
                    <AlertCircle size={18} color="#B82D24" />
                    <View style={styles.cancelledContent}>
                      <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                      <Text style={styles.cancelledDesc}>
                        Reason: {order.cancellation_reason || 'Artisan cancelled the order.'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 2. Customer & Delivery Address */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Customer & Delivery</Text>
                  
                  <View style={styles.infoRow}>
                    <User size={16} color="#A65E32" style={styles.infoIcon} />
                    <Text style={styles.infoTextBold}>
                      {customer.full_name || 'Valued Customer'}
                    </Text>
                  </View>

                  {customer.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={16} color="#A65E32" style={styles.infoIcon} />
                      <Text style={styles.infoText}>{customer.phone}</Text>
                    </View>
                  )}

                  {customer.email && (
                    <View style={styles.infoRow}>
                      <Mail size={16} color="#A65E32" style={styles.infoIcon} />
                      <Text style={styles.infoText}>{customer.email}</Text>
                    </View>
                  )}

                  <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                    <MapPin size={16} color="#A65E32" style={[styles.infoIcon, { marginTop: 2 }]} />
                    <Text style={styles.infoText}>
                      {addressLines || 'Shipping address available on packing slip.'}
                    </Text>
                  </View>
                </View>

                {/* 3. Shipping & Tracking Details (if applicable) */}
                {(order.courier_name || order.tracking_number) && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderBetween}>
                      <Text style={styles.sectionHeading}>Shipping & Courier</Text>
                      {status === 'shipped' && (
                        <TouchableOpacity
                          onPress={() => {
                            onClose();
                            onUpdateTracking && onUpdateTracking(order);
                          }}
                        >
                          <Text style={styles.editActionText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.infoRow}>
                      <Truck size={16} color="#173D2B" style={styles.infoIcon} />
                      <Text style={styles.infoText}>
                        <Text style={{ fontWeight: '700' }}>Courier:</Text> {order.courier_name}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Clock size={16} color="#173D2B" style={styles.infoIcon} />
                      <Text style={styles.infoText}>
                        <Text style={{ fontWeight: '700' }}>Tracking #:</Text> {order.tracking_number}
                      </Text>
                    </View>

                    {order.tracking_url && (
                      <View style={styles.infoRow}>
                        <CheckCircle2 size={16} color="#173D2B" style={styles.infoIcon} />
                        <Text style={[styles.infoText, { color: '#1B6A3B' }]}>
                          Tracking link shared with customer
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 4. Ordered Crafts Listing */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Ordered Items ({items.length})</Text>

                  {items.map((item, idx) => (
                    <View key={item.id || idx} style={styles.itemRow}>
                      <View style={styles.itemImgWrap}>
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.itemImg}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.itemImgPlaceholder}>
                            <Package size={20} color="#A65E32" />
                          </View>
                        )}
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        <Text style={styles.itemMeta}>
                          Qty: {item.quantity} × ₹{Number(item.unit_price || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <Text style={styles.itemTotal}>
                        ₹{Number(item.total_price || item.unit_price * item.quantity || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 5. Payment & Price Breakdown */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Payment & Pricing</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Payment Method</Text>
                    <Text style={styles.priceValue}>{order.payment_method || 'Online (UPI / Card)'}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Payment Status</Text>
                    <Text style={[styles.priceValue, { color: '#1B6A3B', fontWeight: '700' }]}>
                      {String(order.payment_status || 'Paid').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.priceDivider} />

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Items Subtotal</Text>
                    <Text style={styles.priceValue}>
                      ₹{Number(order.subtotal || order.total_amount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {order.discount_amount > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Discount</Text>
                      <Text style={[styles.priceValue, { color: '#1B6A3B' }]}>
                        -₹{Number(order.discount_amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Shipping Charges</Text>
                    <Text style={styles.priceValue}>
                      {Number(order.delivery_fee || 0) === 0 ? 'FREE' : `₹${order.delivery_fee}`}
                    </Text>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Order Amount</Text>
                    <Text style={styles.totalAmount}>
                      ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Actions based on status */}
              <View style={styles.footer}>
                {status === 'pending' && (
                  <View style={styles.footerRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        onClose();
                        onCancel && onCancel(order);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => {
                        onClose();
                        onAccept && onAccept(order);
                      }}
                    >
                      <Text style={styles.acceptBtnText}>Accept Order</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {status === 'processing' && (
                  <TouchableOpacity
                    style={styles.shipBtn}
                    onPress={() => {
                      onClose();
                      onMarkShipped && onMarkShipped(order);
                    }}
                  >
                    <Truck size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.shipBtnText}>Dispatch & Mark Shipped</Text>
                  </TouchableOpacity>
                )}

                {status === 'shipped' && (
                  <TouchableOpacity
                    style={styles.updateTrackingBtn}
                    onPress={() => {
                      onClose();
                      onUpdateTracking && onUpdateTracking(order);
                    }}
                  >
                    <Truck size={16} color="#173D2B" style={{ marginRight: 8 }} />
                    <Text style={styles.updateTrackingBtnText}>Update Tracking Information</Text>
                  </TouchableOpacity>
                )}

                {(status === 'delivered' || status === 'cancelled') && (
                  <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                    <Text style={styles.doneBtnText}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 61, 43, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FAF5EE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8DE',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173D2B',
  },
  orderDate: {
    fontSize: 12,
    color: '#7F7569',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F6C3BC',
    marginBottom: 12,
    gap: 10,
  },
  cancelledContent: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B82D24',
  },
  cancelledDesc: {
    fontSize: 12,
    color: '#8A2A22',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE3D5',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#173D2B',
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A65E32',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28231C',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4B4237',
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
    gap: 10,
  },
  itemImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F7F0E6',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2E24',
  },
  itemMeta: {
    fontSize: 12,
    color: '#7F7569',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A65E32',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#655A4E',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#25251F',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#ECE3D5',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECE3D5',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#173D2B',
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#A65E32',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE8DE',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F7F2EC',
    borderWidth: 1,
    borderColor: '#E2D8C9',
  },
  cancelBtnText: {
    color: '#655A4E',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#173D2B',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#173D2B',
  },
  shipBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  updateTrackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F3EC',
    borderWidth: 1,
    borderColor: '#DED5C7',
  },
  updateTrackingBtnText: {
    color: '#173D2B',
    fontWeight: '700',
    fontSize: 14,
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F7F2EC',
  },
  doneBtnText: {
    color: '#173D2B',
    fontWeight: '700',
    fontSize: 14,
  },
});
