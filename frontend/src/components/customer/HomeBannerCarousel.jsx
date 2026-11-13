import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { ShilpColors } from '@/constants/shilpSetuTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 36;

const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');

const BANNERS = [
  {
    id: 'banner-1',
    line1: 'Discover\nAuthentic',
    highlight: 'Handicrafts',
    subtitle: 'Handmade by\nskilled Indian Artisans',
    buttonText: 'Shop Now',
    image: bannerPottery,
    bgTone: '#EFE7DA',
    blobColor: '#6B826E',
  },
  {
    id: 'banner-2',
    line1: 'Royal Heritage',
    highlight: 'Handlooms',
    subtitle: 'Woven with love\n& pure heritage silk',
    buttonText: 'Explore',
    image: colHandlooms,
    bgTone: '#EDE4D8',
    blobColor: '#A85E2B',
  },
  {
    id: 'banner-3',
    line1: 'Carved Wooden',
    highlight: 'Treasures',
    subtitle: 'Intricate woodcrafts\nfrom Master Artisans',
    buttonText: 'View All',
    image: colWoodcrafts,
    bgTone: '#F2EDE4',
    blobColor: '#526B54',
  },
];

export default function HomeBannerCarousel({ onShopNowPress }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = (event) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / BANNER_WIDTH
    );
    if (slide !== activeIndex && slide >= 0 && slide < BANNERS.length) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 12}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
      >
        {BANNERS.map((banner, index) => (
          <View
            key={banner.id}
            style={[
              styles.card,
              { backgroundColor: banner.bgTone, width: BANNER_WIDTH },
            ]}
          >
            {/* Organic decorative shape in corner */}
            <View
              style={[
                styles.organicBlob,
                { backgroundColor: banner.blobColor },
              ]}
              pointerEvents="none"
            />

            {/* Left text column */}
            <View style={styles.textColumn}>
              <Text style={styles.headingPrimary}>{banner.line1}</Text>
              <Text style={styles.headingHighlight}>{banner.highlight}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>

              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
                onPress={() => onShopNowPress && onShopNowPress(banner)}
                accessibilityRole="button"
                accessibilityLabel={`${banner.buttonText} for ${banner.highlight}`}
              >
                <Text style={styles.ctaButtonText}>{banner.buttonText} →</Text>
              </TouchableOpacity>
            </View>

            {/* Right illustration / pottery */}
            <View style={styles.imageColumn} pointerEvents="none">
              <Image
                source={banner.image}
                style={styles.bannerImage}
                contentFit="contain"
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots below carousel */}
      <View style={styles.paginationContainer}>
        {BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  card: {
    height: 195,
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E6DCCF',
  },
  organicBlob: {
    position: 'absolute',
    bottom: -15,
    left: -20,
    width: 140,
    height: 90,
    borderRadius: 45,
    opacity: 0.18,
  },
  textColumn: {
    flex: 1.15,
    paddingLeft: 22,
    paddingVertical: 18,
    justifyContent: 'center',
    zIndex: 2,
  },
  headingPrimary: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: '#263C29',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  headingHighlight: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#A85E2B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#4A463F',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ctaButton: {
    backgroundColor: '#263C29',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  imageColumn: {
    flex: 0.95,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingBottom: 4,
    zIndex: 1,
  },
  bannerImage: {
    width: 155,
    height: 165,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3.5,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#263C29',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D6CBB9',
  },
});

