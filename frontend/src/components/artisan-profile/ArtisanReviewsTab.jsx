import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const starIcon = require('@/assets/images/shilpsetu/icon-star.svg');

export default function ArtisanReviewsTab({
  reviews = [],
  rating = 4.8,
  reviewsCount = 126,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.overviewCard}>
        <View style={styles.ratingBig}>
          <Image source={starIcon} style={styles.starBig} contentFit="contain" />
          <Text style={styles.ratingNumber}>
            {rating ? Number(rating).toFixed(1) : '4.8'}
          </Text>
        </View>
        <Text style={styles.reviewCountText}>
          Based on {reviewsCount || 0} customer reviews
        </Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No written reviews yet for this artisan.</Text>
        </View>
      ) : (
        <View style={styles.reviewList}>
          {reviews.map((rev, idx) => (
            <View key={rev.id || `rev-${idx}`} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{rev.reviewer_name || 'Verified Buyer'}</Text>
                <View style={styles.starRow}>
                  <Image source={starIcon} style={styles.starSmall} contentFit="contain" />
                  <Text style={styles.starText}>{Number(rev.rating).toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{rev.comment}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  overviewCard: {
    backgroundColor: '#FBF5EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBig: {
    width: 24,
    height: 24,
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#263C29',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#8A8275',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8A8275',
  },
  reviewList: {
    gap: 10,
  },
  reviewItem: {
    backgroundColor: '#FBF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D7C5',
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25251F',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starSmall: {
    width: 12,
    height: 12,
  },
  starText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25251F',
  },
  commentText: {
    fontSize: 13,
    color: '#4A463E',
    lineHeight: 18,
  },
});

