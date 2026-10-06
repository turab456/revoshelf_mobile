import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { backendApi } from '../../services/backendApi';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

interface BannerItem {
  id: string;
  tag: string;
  tagBg?: string;
  tagColor?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundType?: 'gradient' | 'image';
  imageUrl?: string;
  gradientColors: readonly [string, string, ...string[]];
  accentColor?: string;
  icon?: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: 'sell-fast',
    tag: '💰 INSTANT CASH',
    tagBg: '#FACC15',
    tagColor: '#111827',
    title: 'Turn Old Notes & Books Into Cash',
    subtitle: 'Post your listing in 60 seconds · Keep 100% of your earnings',
    ctaText: 'Sell Your Stuff',
    ctaLink: 'CreateListing',
    gradientColors: ['#7C2D12', '#C2410C', '#EA580C'] as const,
    accentColor: '#FDE047',
    icon: 'flash',
  },
  {
    id: 'semester-exchange',
    tag: '⚡ SEMESTER SALE',
    tagBg: '#FDE047',
    tagColor: '#111827',
    title: 'Up to 80% Off Textbooks',
    subtitle: 'Buy used engineering, medical & degree books from seniors',
    ctaText: 'Explore Books',
    ctaLink: 'SearchTab',
    gradientColors: ['#00244B', '#023E7D', '#038F78'] as const,
    accentColor: '#38BDF8',
    icon: 'book',
  },
  {
    id: 'student-verified',
    tag: '🛡️ 100% CAMPUS VERIFIED',
    tagBg: '#6EE7B7',
    tagColor: '#111827',
    title: 'Trade Safely With Verified Peers',
    subtitle: 'Zero shipping wait · Meet right on your college campus',
    ctaText: 'Find Nearby Items',
    ctaLink: 'HomeTab',
    gradientColors: ['#026655', '#038F78', '#059669'] as const,
    accentColor: '#A7F3D0',
    icon: 'shield-checkmark',
  },
];

interface PromoBannerCarouselProps {
  onBannerPress: (ctaLink: string) => void;
}

export const PromoBannerCarousel: React.FC<PromoBannerCarouselProps> = ({
  onBannerPress,
}) => {
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const remote = await backendApi.getBanners();
        if (remote && Array.isArray(remote) && remote.length > 0) {
          const mapped: BannerItem[] = remote
            .filter((b) => b.isActive !== false)
            .map((b, idx) => ({
              id: b._id || b.id || `remote-${idx}`,
              tag: b.tag || b.badge || '⚡ PROMO',
              tagBg: '#FACC15',
              tagColor: '#111827',
              title: b.title || '',
              subtitle: b.subtitle || b.description || '',
              ctaText: b.ctaText || 'Learn More',
              ctaLink: b.ctaLink || 'SearchTab',
              backgroundType: b.bannerType === 'image' || b.imageUrl ? 'image' : 'gradient',
              imageUrl: b.imageUrl,
              gradientColors: [
                b.gradientStart || b.gradientFrom || '#7C2D12',
                b.gradientMiddle || '#C2410C',
                b.gradientEnd || b.gradientTo || '#EA580C',
              ] as const,
              accentColor: b.accentColor || '#38BDF8',
            }));

          if (mapped.length > 0) {
            setBanners(mapped);
          }
        }
      } catch {
        // Keep default banners
      }
    };

    loadBanners();
  }, []);

  const handleBannerPress = (ctaLink: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onBannerPress(ctaLink);
  };

  const handleMomentumScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (BANNER_WIDTH + 12));
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 12}
        contentContainerStyle={styles.scrollList}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.bannerWrapper}
            onPress={() => handleBannerPress(item.ctaLink)}
          >
            {item.backgroundType === 'image' && item.imageUrl ? (
              <View style={styles.imageBannerContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bannerContent}>
                  <View style={[styles.tagBadge, item.tagBg ? { backgroundColor: item.tagBg } : null]}>
                    <Text style={[styles.tagText, item.tagColor ? { color: item.tagColor } : null]}>
                      {item.tag}
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => handleBannerPress(item.ctaLink)}
                  >
                    <Text style={styles.ctaText}>{item.ctaText}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* Internal Dots on Bottom Right */}
                <View style={styles.internalDotsRow}>
                  {banners.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        activeIndex === i ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={item.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerCard}
              >
                {/* Subtle background bolt watermark */}
                <View style={styles.watermarkIcon}>
                  <Ionicons name="flash" size={120} color="rgba(255, 255, 255, 0.08)" />
                </View>

                <View style={styles.bannerContent}>
                  <View style={[styles.tagBadge, item.tagBg ? { backgroundColor: item.tagBg } : null]}>
                    <Text style={[styles.tagText, item.tagColor ? { color: item.tagColor } : null]}>
                      {item.tag}
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => handleBannerPress(item.ctaLink)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ctaText}>{item.ctaText}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* Internal Dots on Bottom Right */}
                <View style={styles.internalDotsRow}>
                  {banners.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        activeIndex === i ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                  ))}
                </View>
              </LinearGradient>
            )}
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  bannerCard: {
    padding: 18,
    minHeight: 154,
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  imageBannerContainer: {
    minHeight: 154,
    padding: 18,
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  watermarkIcon: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  bannerContent: {
    alignItems: 'flex-start',
    zIndex: 2,
  },
  tagBadge: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginBottom: 8,
  },
  tagText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 23,
    maxWidth: '95%',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    marginBottom: 14,
    lineHeight: 16,
    maxWidth: '90%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 5,
  },
  ctaText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  internalDotsRow: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 3,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
