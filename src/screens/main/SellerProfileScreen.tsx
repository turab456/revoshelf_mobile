import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common/Header';
import { BookCard } from '../../components/marketplace/BookCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { Book, User, Review, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

export const SellerProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SellerProfile'>>();
  const { id } = route.params;
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  // Write a Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchSeller = async () => {
    try {
      const data = await backendApi.getSellerDetails(id);
      setSeller(data.user);
      setListings((data.listings || []).filter((b) => b.status === 'active'));
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('[SellerProfile] error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeller();
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!currentUser) {
      showToast('Please sign in to write a review.', 'warning');
      navigation.navigate('Login');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please type a comment for your review.', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReview = await backendApi.addReview(id, reviewRating, reviewComment.trim());
      setReviews((prev) => [newReview, ...prev]);

      setSeller((prev) => {
        if (!prev) return prev;
        const newCount = (prev.reviewsCount || 0) + 1;
        const oldSum = (prev.rating || 5.0) * (prev.reviewsCount || 0);
        const newSum = oldSum + reviewRating;
        const newAvg = Number((newSum / newCount).toFixed(1));
        return {
          ...prev,
          reviewsCount: newCount,
          rating: newAvg,
        };
      });

      setReviewComment('');
      setReviewRating(5);
      showToast('Thank you! Your review has been submitted.', 'success');
    } catch (err: any) {
      console.error('[SellerProfile] review submit error:', err);
      showToast(err?.message || 'Failed to submit review.', 'danger');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.container}>
        <Header title="Seller Profile" showBack />
        <View style={styles.emptyCenter}>
          <Feather name="user-x" size={40} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Student Profile Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This user account may have been disabled or deleted.
          </Text>
        </View>
      </View>
    );
  }

  const locationStr =
    [seller.addressLine, seller.city, seller.state || seller.country].filter(Boolean).join(', ') ||
    seller.college ||
    'Location not specified';

  const isOwnProfile = currentUser?.id === seller.id;

  return (
    <View style={styles.container}>
      <Header title="Seller Profile" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: seller.avatar }} style={styles.avatar} contentFit="cover" />
              {seller.isVerified && (
                <View style={styles.verifiedBadgeCircle}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {seller.name}
                </Text>
                {isOwnProfile && (
                  <View style={styles.myProfileBadge}>
                    <Text style={styles.myProfileBadgeText}>You</Text>
                  </View>
                )}
              </View>

              <Text style={styles.collegeText} numberOfLines={1}>
                {seller.college || seller.institutionName || 'Verified Campus Student'}
              </Text>

              {(seller.department || seller.semester) ? (
                <Text style={styles.academicText} numberOfLines={1}>
                  {seller.department}
                  {seller.semester ? ` · Sem ${seller.semester}` : ''}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                <Feather name="map-pin" size={12} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {locationStr}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Feather name="calendar" size={12} color="#94A3B8" />
                <Text style={styles.metaText}>Joined {formatDate(seller.joinedDate)}</Text>
              </View>
            </View>
          </View>

          {/* Rating Summary Box */}
          <View style={styles.ratingBox}>
            <View style={styles.ratingNumberCol}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Text style={styles.ratingVal}>{(seller.rating || 5.0).toFixed(1)}</Text>
            </View>
            <View style={styles.ratingDivider} />
            <Text style={styles.reviewsText}>
              <Text style={styles.reviewsBold}>{seller.reviewsCount || reviews.length || 0}</Text>{' '}
              Reviews
            </Text>
          </View>
        </View>

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'listings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Feather
              name="book-open"
              size={15}
              color={activeTab === 'listings' ? COLORS.primary : COLORS.muted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'listings' && styles.tabButtonTextActive]}
            >
              Active Listings ({listings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons
              name="star-outline"
              size={15}
              color={activeTab === 'reviews' ? COLORS.primary : COLORS.muted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'reviews' && styles.tabButtonTextActive]}
            >
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Listings Content */}
        {activeTab === 'listings' && (
          <View style={styles.tabContentSection}>
            {listings.length > 0 ? (
              <View style={styles.listingsGrid}>
                {listings.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    width={CARD_WIDTH}
                    onPress={() => navigation.navigate('ListingDetail', { id: book.id })}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="book-outline" size={36} color={COLORS.muted} />
                <Text style={styles.emptyCardTitle}>This student has no active listings</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Check back later or explore other campus books.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Reviews Content */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentSection}>
            {/* Write a Review Form for other users */}
            {currentUser && !isOwnProfile && (
              <View style={styles.writeReviewCard}>
                <Text style={styles.writeReviewTitle}>Share your trading experience</Text>
                <Text style={styles.writeReviewSubtitle}>
                  Help the campus build trust. How was exchanging books with {seller.name}?
                </Text>

                {/* Star rating selector */}
                <View style={styles.starSelectRow}>
                  <Text style={styles.starSelectLabel}>Rating:</Text>
                  <View style={styles.starsGroup}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewRating(star)}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      >
                        <Ionicons
                          name={star <= reviewRating ? 'star' : 'star-outline'}
                          size={24}
                          color={star <= reviewRating ? '#F59E0B' : '#CBD5E1'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Comment input */}
                <TextInput
                  style={styles.reviewTextInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Write your review... (e.g. Quick response, book condition was exactly as described!)"
                  placeholderTextColor="#94A3B8"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleReviewSubmit}
                  disabled={isSubmittingReview}
                  activeOpacity={0.8}
                >
                  {isSubmittingReview ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitReviewBtnText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((rev, idx) => (
                  <View key={rev.id || String(idx)} style={styles.reviewCard}>
                    <Image
                      source={{
                        uri:
                          rev.reviewerAvatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                      }}
                      style={styles.reviewerAvatar}
                      contentFit="cover"
                    />
                    <View style={styles.reviewBody}>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={styles.reviewerName}>{rev.reviewerName}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= rev.rating ? 'star' : 'star-outline'}
                            size={12}
                            color={s <= rev.rating ? '#F59E0B' : '#CBD5E1'}
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewCommentText}>{rev.comment}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="star-outline" size={36} color={COLORS.muted} />
                <Text style={styles.emptyCardTitle}>No review ratings received yet</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Be the first student to review this seller after meeting up!
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.subtle,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(3, 143, 120, 0.2)',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 1,
    ...SHADOWS.subtle,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    flexShrink: 1,
  },
  myProfileBadge: {
    backgroundColor: 'rgba(3, 143, 120, 0.1)',
    borderColor: 'rgba(3, 143, 120, 0.25)',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  myProfileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  collegeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  academicText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.muted,
    flexShrink: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.borderCustom,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  ratingNumberCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  ratingDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  reviewsText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  reviewsBold: {
    fontWeight: '700',
    color: COLORS.textDark,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCustom,
    marginTop: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
  },
  tabContentSection: {
    marginTop: 4,
    gap: 12,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyCard: {
    padding: 28,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderCustom,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  emptyCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 8,
  },
  emptyCardSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  writeReviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    padding: 16,
    gap: 10,
    ...SHADOWS.subtle,
  },
  writeReviewTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  writeReviewSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  },
  starSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  starSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  starsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 12,
    color: COLORS.textDark,
    minHeight: 74,
  },
  submitReviewBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  submitReviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  reviewsList: {
    gap: 10,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: RADIUS.lg,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    ...SHADOWS.subtle,
  },
  reviewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
  },
  reviewBody: {
    flex: 1,
    gap: 3,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  reviewDate: {
    fontSize: 10,
    color: COLORS.muted,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 2,
  },
  reviewCommentText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
