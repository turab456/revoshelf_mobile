import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookCard } from '../../components/marketplace/BookCard';
import { CategoryBar } from '../../components/marketplace/CategoryBar';
import { PromoBannerCarousel } from '../../components/marketplace/PromoBannerCarousel';
import { DealsRail } from '../../components/marketplace/DealsRail';
import { Skeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { backendApi } from '../../services/backendApi';
import type { Book, RootStackParamList } from '../../types';
import { COLORS, RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 10) / 2;

const SEARCH_PLACEHOLDERS = [
  'Search "Lab Coat & Drafter"...',
  'Search "Engineering Mathematics"...',
  'Search "Scientific Calculator"...',
  'Search "Medical Anatomy Atlas"...',
  'Search "Hostel Induction Cooktop"...',
];

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, unreadChatCount } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Scroll detection for sticky header transition (Blinkit style)
  const [isScrolled, setIsScrolled] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(72);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const threshold = Math.max(35, navbarHeight - 15);
    if (offsetY > threshold + 5 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY < threshold - 5 && isScrolled) {
      setIsScrolled(false);
    }
  };

  // Fade animation for rotating placeholder
  const placeholderOpacity = new Animated.Value(1);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(placeholderOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await backendApi.getBooks();
      setBooks(data);
    } catch (err) {
      console.error('[HomeScreen] Error loading books:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBannerPress = (ctaLink: string) => {
    if (ctaLink === 'CreateListing') {
      if (!user) {
        navigation.navigate('Login', { returnTo: 'CreateListing' });
      } else {
        navigation.navigate('CreateListing');
      }
    } else if (ctaLink === 'SearchTab' || ctaLink === 'Search') {
      navigation.navigate('Search');
    } else {
      (navigation as any).navigate(ctaLink);
    }
  };

  const filteredBooks = books.filter((b) => {
    if (user && b.sellerId === user.id) return false;
    if (selectedCategory !== 'all') {
      return b.category === selectedCategory;
    }
    return true;
  });

  const stealDeals = books
    .filter(
      (b) =>
        (!user || b.sellerId !== user.id) &&
        b.status !== 'sold' &&
        (b.price <= 299 ||
          (b.originalPrice > b.price && (b.originalPrice - b.price) / b.originalPrice >= 0.35))
    )
    .slice(0, 8);

  const hasCity = !!(user?.city && user.city.trim());
  const userCity = user?.city ? user.city.trim() : 'Your City';

  const handleLocationPress = () => {
    if (!user) {
      navigation.navigate('Login', { returnTo: 'Settings' });
      return;
    }

    if (!hasCity) {
      Alert.alert(
        'Set Your Location',
        'Please set your location from your profile section to find books and students in your city.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Profile',
            onPress: () => (navigation as any).navigate('Settings'),
          },
        ]
      );
    } else {
      Alert.alert(
        `Location: ${userCity}`,
        'You can change or update your city and pickup location anytime from your profile section.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update in Profile',
            onPress: () => (navigation as any).navigate('Settings'),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isScrolled ? '#FFFFFF' : '#038578' }]}>
      <RNStatusBar
        barStyle={isScrolled ? 'dark-content' : 'light-content'}
        backgroundColor={isScrolled ? '#FFFFFF' : '#038578'}
        translucent
      />
      <ExpoStatusBar style={isScrolled ? 'dark' : 'light'} />

      {/* Top Safe Area Spacer that adapts to scroll state */}
      <View
        style={{
          height: insets.top,
          backgroundColor: isScrolled ? '#FFFFFF' : '#038578',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={isScrolled ? COLORS.primary : '#FFFFFF'}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Index 0: Collapsible Navbar (Headline + Location + Profile) */}
        <View
          style={styles.collapsibleNavbar}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) setNavbarHeight(h);
          }}
        >
          <View style={styles.darkNavbar}>
            <View style={styles.brandTitleCol}>
              <Text style={styles.brandSubtitle}>RevoShelf in</Text>
              <View style={styles.brandHeadlineRow}>
                <Text style={styles.brandHeadline}>Direct Handover</Text>
                <View style={styles.surgeBadge}>
                  <Ionicons name="flash" size={10} color="#FDE047" />
                  <Text style={styles.surgeBadgeText}>0% Fee</Text>
                </View>
              </View>

              {/* Location Selector */}
              <TouchableOpacity
                style={styles.locationSelector}
                activeOpacity={0.75}
                onPress={handleLocationPress}
              >
                <Text style={styles.locationPrefix}>CITY -</Text>
                <Text style={styles.locationCityName} numberOfLines={1}>
                  {userCity}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Right: Notification Bell */}
            <View style={styles.darkNavRight}>
              <TouchableOpacity
                style={styles.notificationBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (!user) {
                    navigation.navigate('Login', { returnTo: 'HomeTab' });
                  } else {
                    (navigation as any).navigate('MainTabs', { screen: 'ChatTab' });
                  }
                }}
              >
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                {unreadChatCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Index 1: Sticky Header (Search Bar + Category Bar) */}
        <View
          style={[
            styles.stickyHeader,
            isScrolled ? styles.stickyHeaderScrolled : styles.stickyHeaderDefault,
          ]}
        >
          {/* Search Bar */}
          <TouchableOpacity
            style={[
              styles.searchBar,
              isScrolled ? styles.searchBarScrolled : styles.searchBarDefault,
            ]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons
              name="search"
              size={18}
              color={isScrolled ? '#64748B' : '#0F172A'}
              style={styles.searchIcon}
            />
            <Animated.Text
              style={[
                styles.searchPlaceholderText,
                isScrolled && styles.searchPlaceholderTextScrolled,
                { opacity: placeholderOpacity },
              ]}
              numberOfLines={1}
            >
              {SEARCH_PLACEHOLDERS[placeholderIndex]}
            </Animated.Text>
          </TouchableOpacity>

          {/* Category Bar */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => setSelectedCategory(id)}
            dark={!isScrolled}
          />
        </View>

        {/* Index 2: Scrollable Body (Banner, Ticker, Rails, Listings) */}
        <View style={styles.scrollableBody}>
          {/* Hero Promo Banner */}
          <View style={styles.bannerWrapper}>
            <PromoBannerCarousel onBannerPress={handleBannerPress} />
          </View>

          {/* Today's Deal Ticker Bar */}
          <View style={styles.dealTickerBar}>
            <Text style={styles.dealTickerText}>
              TODAY'S DEAL:{' '}
              <Text style={styles.dealTickerBold}>GET UP TO 70% OFF ON CAMPUS BOOKS</Text>
            </Text>
          </View>

          {/* Bottom Light Section (Clean White Background) */}
          <View style={styles.lightContentSection}>
            {/* Campus Steal Deals Rail */}
            {stealDeals.length > 0 && (
              <View style={styles.railWrapper}>
                <DealsRail
                  title="🔥 Campus Steal Deals"
                  subtitle="Under ₹299 or 35%+ off · From verified peers"
                  books={stealDeals}
                  onBookPress={(id) => navigation.navigate('ListingDetail', { id })}
                  onViewAllPress={() => navigation.navigate('Search')}
                />
              </View>
            )}

            {/* Freshly Listed Grid */}
            <View style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleGroup}>
                  <View style={styles.sectionIconBox}>
                    <Feather name="clock" size={14} color={COLORS.info} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Freshly Listed</Text>
                    <Text style={styles.sectionSubtitle}>
                      {filteredBooks.length > 0
                        ? `${filteredBooks.length} item${filteredBooks.length !== 1 ? 's' : ''} available`
                        : 'Newest campus listings'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Search')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See All →</Text>
                </TouchableOpacity>
              </View>

              {/* Grid / skeleton / empty */}
              {isLoading ? (
                <View style={styles.grid}>
                  {[1, 2, 3, 4].map((n) => (
                    <View key={n} style={{ width: CARD_WIDTH, marginBottom: 10 }}>
                      <Skeleton width="100%" height={CARD_WIDTH} borderRadius={12} />
                      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
                      <Skeleton width="50%" height={16} style={{ marginTop: 5 }} />
                    </View>
                  ))}
                </View>
              ) : filteredBooks.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="No items in this category"
                  description="Be the first to list something here!"
                  actionTitle="List an Item"
                  onActionPress={() => {
                    if (!user) {
                      navigation.navigate('Login', { returnTo: 'CreateListing' });
                    } else {
                      navigation.navigate('CreateListing');
                    }
                  }}
                />
              ) : (
                <View style={styles.grid}>
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      width={CARD_WIDTH}
                      onPress={() => navigation.navigate('ListingDetail', { id: book.id })}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#038578', // RevoShelf logo teal icon color
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── Collapsible Top Navbar ────────────────
  collapsibleNavbar: {
    backgroundColor: '#038578',
    paddingTop: 4,
    paddingBottom: 4,
  },
  darkNavbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  brandTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCFBF1',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 1,
  },
  brandHeadline: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  surgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  surgeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationPrefix: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationCityName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EDE8E3',
    maxWidth: 180,
  },

  // Right controls in dark navbar
  darkNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#038578',
  },

  // ── Sticky Header (Search + Category Bar) ─
  stickyHeader: {
    zIndex: 100,
    paddingTop: 4,
    paddingBottom: 2,
  },
  stickyHeaderDefault: {
    backgroundColor: '#038578',
    elevation: 0,
  },
  stickyHeaderScrolled: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },

  // Search Bar Variants
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
    height: 44,
    paddingHorizontal: 12,
  },
  searchBarDefault: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarScrolled: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  searchPlaceholderTextScrolled: {
    color: '#64748B',
  },

  // ── Scrollable Body ───────────────────────
  scrollableBody: {
    backgroundColor: '#FFFFFF',
  },
  bannerWrapper: {
    backgroundColor: '#038578',
    paddingTop: 2,
    paddingBottom: 4,
  },
  dealTickerBar: {
    backgroundColor: '#025E55',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealTickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCFBF1',
    letterSpacing: 0.5,
  },
  dealTickerBold: {
    color: '#FDE047',
    fontWeight: '900',
  },

  // ── Light Content Section ─────────────────
  lightContentSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    minHeight: 600,
  },
  railWrapper: {
    paddingHorizontal: 0,
    marginTop: 4,
    marginBottom: 22,
  },
  section: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
