import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import {
  Package,
  ChevronRight,
  Check,
  Truck,
  Eye,
  MapPin,
} from 'lucide-react-native';
import OrderStatusBadge from './OrderStatusBadge';

export default function ArtisanOrderCard({
  order,
  onPress,
  onAccept,
  onCancel,
  onMarkShipped,
  onUpdateTracking,
}) {
  if (!order) return null;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const primaryItem = items[0] || {
    product_name: order.product_name || 'Handcrafted Craft',
    quantity: order.quantity || 1,
    unit_price: order.price || order.total_amount || 0,
    total_price: order.total_amount || 0,
    image_url: order.product_image || null,
  };

  const moreItemsCount = items.length > 1 ? items.length - 1 : 0;
  const status = String(order.status || order.order_status || 'pending').toLowerCase();
  const orderNumber = order.order_number || `#SS${String(order.id).slice(0, 6)}`;

  // Format creation date
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

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(order)}
    >
      {/* Top Row: Package Icon + Order Number & Date | Status Badge | Arrow */}
      <View style={styles.headerRow}>
        <View style={styles.orderIdGroup}>
          <View style={styles.boxIconWrap}>
            <Package size={16} color="#A65E32" strokeWidth={2.2} />
          </View>
          <View>
            <Text style={styles.orderNumberText}>{orderNumber}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.badgeGroup}>
          <OrderStatusBadge status={status} />
          <ChevronRight size={18} color="#8A7E72" strokeWidth={2} style={styles.arrowIcon} />
        </View>
      </View>

      {/* Middle Row: Product Image + Product Name + Qty + Price */}
      <View style={styles.bodyRow}>
        <View style={styles.imageWrap}>
          {primaryItem.image_url ? (
            <Image
              source={{ uri: primaryItem.image_url }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.placeholderImg}>
              <Package size={24} color="#A65E32" />
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {primaryItem.product_name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.qtyText}>Qty: {primaryItem.quantity}</Text>
            {moreItemsCount > 0 && (
              <Text style={styles.moreItemsText}>+{moreItemsCount} more item{moreItemsCount > 1 ? 's' : ''}</Text>
            )}
          </View>

          <Text style={styles.priceText}>
            ₹{Number(order.total_amount ?? primaryItem.total_price ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Bottom Action Row based on status */}
      <View style={styles.actionRow}>
        {status === 'pending' && (
          <View style={styles.actionButtonsInline}>
            <TouchableOpacity
              style={styles.acceptButton}
              activeOpacity={0.8}
              onPress={() => onAccept && onAccept(order)}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} style={styles.btnIcon} />
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={() => onCancel && onCancel(order)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'processing' && (
          <TouchableOpacity
            style={styles.shipButton}
            activeOpacity={0.8}
            onPress={() => onMarkShipped && onMarkShipped(order)}
          >
            <Truck size={16} color="#FFFFFF" strokeWidth={2.2} style={styles.btnIcon} />
            <Text style={styles.shipButtonText}>Mark as Shipped</Text>
          </TouchableOpacity>
        )}

        {status === 'shipped' && (
          <TouchableOpacity
            style={styles.updateTrackingButton}
            activeOpacity={0.8}
            onPress={() => onUpdateTracking && onUpdateTracking(order)}
          >
            <MapPin size={15} color="#173D2B" strokeWidth={2} style={styles.btnIcon} />
            <Text style={styles.updateTrackingText}>Update Tracking</Text>
          </TouchableOpacity>
        )}

        {(status === 'delivered' || status === 'cancelled') && (
          <TouchableOpacity
            style={styles.viewDetailsButton}
            activeOpacity={0.8}
            onPress={() => onPress && onPress(order)}
          >
            <Eye size={15} color="#173D2B" strokeWidth={2} style={styles.btnIcon} />
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boxIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F7EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#173D2B',
    fontFamily: 'System',
  },
  dateText: {
    fontSize: 11,
    color: '#82786D',
    marginTop: 1,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowIcon: {
    marginLeft: 2,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8F2EA',
    borderWidth: 1,
    borderColor: '#EAE1D5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C2E24',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  qtyText: {
    fontSize: 12,
    color: '#6E6458',
    fontWeight: '500',
  },
  moreItemsText: {
    fontSize: 11,
    color: '#A65E32',
    fontWeight: '600',
    backgroundColor: '#FDF3E7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#A65E32',
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButtonsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#173D2B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F7F2EC',
    borderWidth: 1,
    borderColor: '#E5DCD0',
  },
  cancelButtonText: {
    color: '#52493F',
    fontSize: 13,
    fontWeight: '600',
  },
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#173D2B',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  shipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  updateTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F3EC',
    borderWidth: 1,
    borderColor: '#DED5C7',
  },
  updateTrackingText: {
    color: '#173D2B',
    fontSize: 13,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F3EC',
    borderWidth: 1,
    borderColor: '#DED5C7',
  },
  viewDetailsText: {
    color: '#173D2B',
    fontSize: 13,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
});
