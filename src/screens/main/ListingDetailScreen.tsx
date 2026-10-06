import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { BookCard } from '../../components/marketplace/BookCard';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { Book, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

const METADATA_LABELS: Record<string, string> = {
  author: 'Author / Created By',
  department: 'Department',
  semester: 'Semester / Class',
  brand: 'Brand / Manufacturer',
  model: 'Model Number',
  examApproved: 'Exam Approved',
  color: 'Color',
  age: 'Usage Age',
  accessories: 'Accessories Included',
  specs: 'Specifications',
  equipmentType: 'Equipment Type',
  size: 'Size',
  componentType: 'Component Type',
  itemType: 'Item Type',
  dimensions: 'Dimensions',
  stationeryType: 'Stationery Type',
};

const getConditionStyle = (cond: string) => {
  switch (cond) {
    case 'New':
      return { bg: '#E8F5E9', text: '#16A34A', border: '#C8E6C9' };
    case 'Like New':
      return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
    case 'Very Good':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
    case 'Good':
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    case 'Acceptable':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
  }
};

export const ListingDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const { id } = route.params;

  const { user } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const { showToast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const item = await backendApi.getBookById(id);
        setBook(item);
        if (item) {
          const related = await backendApi.getBooks({ category: item.category });
          setSimilarBooks(
            related.filter((b) => b.id !== item.id && (!user || b.sellerId !== user.id)).slice(0, 4)
          );
        }
      } catch (err) {
        console.error('[ListingDetail] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id, user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={44} color="#94A3B8" />
        <Text style={styles.notFoundTitle}>Listing Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          The listing you are looking for might have been sold, deleted, or expired.
        </Text>
        <TouchableOpacity
          style={styles.backCatalogBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.backCatalogBtnText}>Back to Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user?.id === book.sellerId;
  const saved = isSaved(book.id);

  const discountPercent =
    book.originalPrice > book.price
      ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
      : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${book.title}" on RevoShelf for just ₹${book.price}!`,
      });
    } catch {
      // ignore
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      showToast('Please sign in to save this listing.', 'warning');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleSave(book.id);
      showToast(saved ? 'Removed from saved items' : 'Saved to wishlist', 'success');
    } catch {
      showToast('Failed to update wishlist.', 'danger');
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigation.navigate('Login', { returnTo: 'ListingDetail' });
      return;
    }
    if (user.id === book.sellerId) {
      showToast('This is your own listing.', 'info');
      return;
    }

    setContacting(true);
    try {
      const chat = await backendApi.createOrGetChat(book.id);
      showToast('Chat thread opened with seller', 'success');
      navigation.navigate('ChatDetail', {
        chatId: chat.id,
        bookId: book.id,
        otherUserName: book.sellerName,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to start conversation. Please try again.', 'danger');
    } finally {
      setContacting(false);
    }
  };

  const images =
    book.images && book.images.length > 0
      ? book.images
      : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'];

  const conditionStyle = getConditionStyle(book.condition);

  // Parse specifications/metadata exactly like web
  let metaObj: Record<string, any> = {};
  if (typeof book.metadata === 'string') {
    try {
      metaObj = JSON.parse(book.metadata);
    } catch {
      metaObj = {};
    }
  } else if (typeof book.metadata === 'object' && book.metadata !== null && !Array.isArray(book.metadata)) {
    metaObj = book.metadata;
  }

  const validMetaEntries = Object.entries(metaObj).filter(([k, v]) => {
    if (/^\d+$/.test(k)) return false;
    if (['author', 'department', 'semester'].includes(k) && (book.category === 'books' || book.category === 'notes')) {
      return false;
    }
    return k && v !== undefined && v !== null && v !== '';
  });

  const isRiskySeller = (book.sellerSpamScore ?? 0) >= 50 || (book.sellerScamScore ?? 0) >= 50;

  return (
    <View style={styles.container}>
      {/* Clean Native Navigation Top Bar (No AI Glassmorphism) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.navSquareBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {book.title}
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.navSquareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Feather name="share-2" size={18} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.mainPadding}>
          {/* Risky or Warning Banners matching web */}
          {book.isDeleted && (
            <View style={styles.warningBannerAmber}>
              <Feather name="alert-triangle" size={18} color="#92400E" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningBannerTitleAmber}>Listing Deleted</Text>
                <Text style={styles.warningBannerTextAmber}>
                  This listing has been deleted by the seller and is no longer available.
                </Text>
              </View>
            </View>
          )}

          {book.status === 'risky' && (
            <View style={styles.warningBannerRed}>
              <Feather name="alert-triangle" size={18} color="#B91C1C" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningBannerTitleRed}>Proceed with Caution</Text>
                <Text style={styles.warningBannerTextRed}>
                  This listing has been flagged by community systems. Always meet in person on campus.
                </Text>
              </View>
            </View>
          )}

          {/* Product Image Card (4:3 Aspect Ratio Container matching Web) */}
          <View style={styles.imageCard}>
            <Image
              source={{ uri: images[activeImageIndex] }}
              style={styles.mainImage}
              contentFit="contain"
            />
            {book.status === 'sold' && (
              <View style={styles.soldOverlay}>
                <View style={styles.soldBadge}>
                  <Text style={styles.soldBadgeText}>SOLD OUT</Text>
                </View>
              </View>
            )}
          </View>

          {/* Multiple Images Thumbnail Strip (matching Web) */}
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveImageIndex(idx)}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbnailBox,
                    activeImageIndex === idx && styles.thumbnailBoxActive,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImg} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Product Details Section */}
          <View style={styles.detailsContainer}>
            {/* Category & Condition Row matching web */}
            <View style={styles.categoryConditionRow}>
              <Text style={styles.categoryLabel}>
                {book.category.replace('-', ' ')}
              </Text>

              {book.status === 'sold' ? (
                <View style={styles.soldTag}>
                  <Text style={styles.soldTagText}>SOLD OUT</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.conditionBadge,
                    {
                      backgroundColor: conditionStyle.bg,
                      borderColor: conditionStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.conditionText, { color: conditionStyle.text }]}>
                    Condition: {book.condition}
                  </Text>
                </View>
              )}
            </View>

            {/* Title & Author */}
            <Text style={styles.productTitle}>{book.title}</Text>
            {book.author ? (
              <Text style={styles.productAuthor}>by {book.author}</Text>
            ) : null}

            {/* Price Card matching Web: solid background #F5F3EF, crisp borders */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{book.price.toLocaleString('en-IN')}</Text>
                {book.originalPrice > book.price && (
                  <Text style={styles.originalPrice}>
                    ₹{book.originalPrice.toLocaleString('en-IN')}
                  </Text>
                )}
                {discountPercent !== null && discountPercent > 0 && (
                  <View style={styles.saveTag}>
                    <Text style={styles.saveTagText}>Save {discountPercent}%</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Seller Profile Summary matching Web */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>LISTED BY</Text>
              <TouchableOpacity
                style={styles.sellerRow}
                onPress={() => navigation.navigate('SellerProfile', { id: book.sellerId })}
                activeOpacity={0.7}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri:
                        book.sellerAvatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                    }}
                    style={styles.sellerAvatar}
                    contentFit="cover"
                  />
                  {book.sellerVerified && (
                    <View style={styles.sellerVerifiedIcon}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {book.sellerName}
                  </Text>
                  <View style={styles.sellerSub}>
                    {book.sellerReviewsCount && book.sellerReviewsCount > 0 ? (
                      <Text style={styles.sellerRating}>★ {book.sellerRating.toFixed(1)}</Text>
                    ) : (
                      <Text style={styles.sellerNoRating}>No ratings yet</Text>
                    )}
                    {book.college ? (
                      <Text style={styles.sellerCollege} numberOfLines={1}>
                        · {book.college.split(',')[0]}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Seller Trust Warning Banner if applicable */}
            {isRiskySeller && (
              <View style={styles.sellerRiskNotice}>
                <Feather name="shield" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerRiskTitle}>⚠️ Seller Trust Warning</Text>
                  <Text style={styles.sellerRiskText}>
                    This seller has received community reports. Transactions are at your own risk. Exercise caution.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Description Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>DESCRIPTION</Text>
              <Text style={styles.descriptionText}>
                {book.description || 'No additional description provided.'}
              </Text>
            </View>

            {/* Academic Fit (Course Info) */}
            {(book.category === 'books' || book.category === 'notes') && book.department ? (
              <View style={styles.metaRowItem}>
                <Feather name="book-open" size={16} color="#64748B" style={{ marginTop: 1 }} />
                <Text style={styles.metaRowText}>
                  Recommended Course: Semester {book.semester} · {book.department}
                </Text>
              </View>
            ) : null}

            {/* Dynamic Specifications Grid matching Web */}
            {validMetaEntries.length > 0 && (
              <View style={styles.specsContainer}>
                <Text style={styles.specsHeader}>SPECIFICATIONS</Text>
                <View style={styles.specsGrid}>
                  {validMetaEntries.map(([k, v]) => {
                    const label = METADATA_LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1);
                    const valStr = Array.isArray(v) ? v.join(', ') : String(v);
                    return (
                      <View key={k} style={styles.specCell}>
                        <Text style={styles.specCellKey}>{label}</Text>
                        <Text style={styles.specCellVal}>{valStr}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pickup Spot Row matching Web */}
            <View style={styles.metaRowItem}>
              <Feather name="map-pin" size={16} color="#64748B" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickupSpotHeader}>Pickup Spot</Text>
                <Text style={styles.pickupSpotAddress}>
                  {book.pickupLocation || (book.college ? book.college.split(',')[0] : 'Campus pickup')}
                </Text>
                {book.distanceKm !== undefined && (
                  <Text style={styles.distanceText}>
                    Distance: <Text style={{ fontWeight: '700', color: COLORS.textDark }}>{book.distanceKm} km away</Text>
                    {book.isNearMe && (
                      <Text style={styles.nearYouTag}>  NEAR YOU</Text>
                    )}
                  </Text>
                )}
              </View>
            </View>

            {/* Safety Tip matching Web */}
            <View style={styles.safetyCard}>
              <Feather name="alert-circle" size={16} color="#D97706" style={{ marginTop: 1 }} />
              <Text style={styles.safetyCardText}>
                Safety tip: Always meet in public, well-lit spaces to inspect books and complete transactions safely.
              </Text>
            </View>

            {/* Similar Listings Section */}
            {similarBooks.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarHeading}>Similar Listings You Might Need</Text>
                <View style={styles.similarGrid}>
                  {similarBooks.map((item) => (
                    <BookCard
                      key={item.id}
                      book={item}
                      width={CARD_WIDTH}
                      onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Actions Bar matching Web: Solid White with border */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={styles.ownerManageBtn}
            onPress={() => navigation.navigate('EditListing', { id: book.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.ownerManageBtnText}>Manage My Listing</Text>
          </TouchableOpacity>
        ) : book.status === 'sold' ? (
          <View style={styles.soldActionDisabled}>
            <Text style={styles.soldActionDisabledText}>This Book Has Been Sold</Text>
          </View>
        ) : (
          <View style={styles.buyerActionRow}>
            {/* Wishlist Square Button matching Web */}
            <TouchableOpacity
              style={[styles.wishlistSquareBtn, saved && styles.wishlistSquareBtnSaved]}
              onPress={handleSaveToggle}
              activeOpacity={0.8}
            >
              <Feather
                name="heart"
                size={20}
                color={saved ? COLORS.danger : COLORS.muted}
              />
            </TouchableOpacity>

            {/* Contact Seller Button matching Web */}
            <TouchableOpacity
              style={[styles.contactSellerBtn, contacting && { opacity: 0.6 }]}
              onPress={handleContactSeller}
              disabled={contacting}
              activeOpacity={0.85}
            >
              <Feather name="message-square" size={17} color={COLORS.white} />
              <Text style={styles.contactSellerBtnText}>
                {contacting ? 'Opening Chat...' : 'Contact Seller'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAF8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 12,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  backCatalogBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backCatalogBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 10,
  },
  navSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginHorizontal: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollBody: {
    paddingBottom: 24,
  },
  mainPadding: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  warningBannerAmber: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningBannerTitleAmber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningBannerTextAmber: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  warningBannerRed: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningBannerTitleRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  warningBannerTextRed: {
    fontSize: 11.5,
    color: '#DC2626',
    marginTop: 2,
    lineHeight: 16,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  soldBadgeText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  thumbnailRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  thumbnailBox: {
    width: 64,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
    marginRight: 8,
  },
  thumbnailBoxActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    marginTop: 16,
  },
  categoryConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  soldTag: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  soldTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 26,
    marginTop: 4,
  },
  productAuthor: {
    fontSize: 12.5,
    color: COLORS.muted,
    marginTop: 2,
  },
  priceContainer: {
    backgroundColor: '#F5F3EF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  saveTag: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionBlock: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sellerVerifiedIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  sellerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  sellerRating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  sellerNoRating: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sellerCollege: {
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  },
  sellerRiskNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  sellerRiskTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
  sellerRiskText: {
    fontSize: 10,
    color: '#DC2626',
    marginTop: 2,
    lineHeight: 14,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  metaRowText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  specsContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  specsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 1,
    marginBottom: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specCell: {
    width: (SCREEN_WIDTH - 64 - 10) / 2,
  },
  specCellKey: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
    textTransform: 'uppercase',
  },
  specCellVal: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  pickupSpotHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  pickupSpotAddress: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 16,
  },
  distanceText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 4,
  },
  nearYouTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginTop: 16,
  },
  safetyCardText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
  },
  similarSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  similarHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  similarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    ...SHADOWS.card,
  },
  ownerManageBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerManageBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  soldActionDisabled: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldActionDisabledText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  buyerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wishlistSquareBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  wishlistSquareBtnSaved: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  contactSellerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactSellerBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
