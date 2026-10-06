import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { BookCard } from '../../components/marketplace/BookCard';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { Book, Review, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout, refreshProfile } = useAuth();
  const { savedBookIds } = useWishlist();
  const { showToast } = useToast();

  const [listings, setListings] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  // Appeal Modal State
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [sellerData, appealsData] = await Promise.all([
        backendApi.getSellerDetails(user.id).catch(() => ({ user, listings: [], reviews: [] })),
        backendApi.getReconsiderationStatus().catch(() => ({ success: false, tickets: [] })),
      ]);

      if (sellerData) {
        setListings((sellerData.listings || []).filter((b) => b.status === 'active'));
        setReviews(sellerData.reviews || []);
      }
      if (appealsData && appealsData.success) {
        setTickets(appealsData.tickets || []);
      }
    } catch (err) {
      console.error('[ProfileScreen] Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshProfile();
        fetchProfileData();
      }
    }, [user?.id, fetchProfileData, refreshProfile])
  );

  const handleAppealSubmit = async () => {
    if (!appealReason.trim()) {
      showToast('Please specify a reason for reconsideration.', 'warning');
      return;
    }
    setIsSubmittingAppeal(true);
    try {
      const res = await backendApi.createReconsiderationTicket(appealReason.trim());
      if (res && res.success) {
        showToast('Appeal ticket submitted successfully!', 'success');
        setAppealReason('');
        setIsAppealModalOpen(false);
        fetchProfileData();
      } else {
        showToast('Failed to submit appeal. Please try again.', 'danger');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit appeal.', 'danger');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          showToast('Logged out successfully', 'success');
        },
      },
    ]);
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

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.authPromptCard}>
          <View style={styles.logoWrapper}>
            <Logo height={32} />
          </View>
          <Text style={styles.authTitle}>Your RevoShelf Account</Text>
          <Text style={styles.authSubtitle}>
            Sign in to manage your listings, chat with buyers, and track purchases.
          </Text>

          <Button
            title="Log In"
            onPress={() => navigation.navigate('Login', { returnTo: 'ProfileTab' })}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginBottom: 10 }}
          />

          <Button
            title="Create an Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    );
  }

  const avatarUrl =
    user.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

  const locationStr =
    [user.addressLine, user.city, user.state || user.country].filter(Boolean).join(', ') ||
    user.college ||
    'Location not specified';

  const isBlocked = !!user.blocked;
  const spamScore = user.spamScore ?? 0;
  const scamScore = user.scamScore ?? 0;
  const isDangerZone = !isBlocked && (spamScore >= 50 || scamScore >= 50 || !!user.flagged);
  const isSafeZone = !isBlocked && !user.flagged && spamScore < 50 && scamScore < 50;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
              {user.isVerified && (
                <View style={styles.verifiedBadgeCircle}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                <View style={styles.myProfileBadge}>
                  <Text style={styles.myProfileBadgeText}>My Profile</Text>
                </View>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>

              {/* Location & Joined info */}
              <TouchableOpacity
                style={styles.metaRow}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <Feather name="map-pin" size={13} color={user.city ? COLORS.primary : '#94A3B8'} />
                <Text
                  style={[
                    styles.metaText,
                    !user.city && { color: COLORS.primary, fontWeight: '600' },
                  ]}
                  numberOfLines={1}
                >
                  {user.city ? locationStr : 'Set your location'}
                </Text>
                <Feather name="chevron-right" size={11} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.metaRow}>
                <Feather name="calendar" size={13} color="#94A3B8" />
                <Text style={styles.metaText}>Joined {formatDate(user.joinedDate)}</Text>
              </View>
            </View>
          </View>

          {/* Rating Summary Box */}
          <View style={styles.ratingBox}>
            <View style={styles.ratingNumberCol}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingVal}>{(user.rating || 5.0).toFixed(1)}</Text>
            </View>
            <View style={styles.ratingDivider} />
            <Text style={styles.reviewsText}>
              <Text style={styles.reviewsBold}>{user.reviewsCount || reviews.length || 0}</Text>{' '}
              Reviews
            </Text>
          </View>

          {/* Top Quick Actions: Edit Profile & My Listings */}
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Feather name="edit-3" size={14} color={COLORS.textDark} />
              <Text style={styles.headerActionBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerActionBtn, styles.headerActionBtnPrimary]}
              onPress={() => navigation.navigate('MyListings')}
              activeOpacity={0.7}
            >
              <Feather name="tag" size={14} color={COLORS.primary} />
              <Text style={[styles.headerActionBtnText, { color: COLORS.primary }]}>
                My Listings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Set Location Prompt Banner if city not set */}
        {!user.city && (
          <TouchableOpacity
            style={styles.locationPromptBanner}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <View style={styles.locationPromptIconCircle}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationPromptTitle}>Set your city & location</Text>
              <Text style={styles.locationPromptSubtitle}>
                Select your city to see nearby books and listings on your Home screen.
              </Text>
            </View>
            <View style={styles.locationPromptBtn}>
              <Text style={styles.locationPromptBtnText}>Set Now</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Dynamic Safety & Standing Banner */}
        {/* ZONE 1: Account Suspended/Blocked */}
        {isBlocked && (
          <View style={styles.blockedZoneCard}>
            <View style={styles.zoneHeaderRow}>
              <Feather name="alert-octagon" size={20} color="#DC2626" style={styles.zoneIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.blockedZoneTitle}>Account Deactivated</Text>
                <Text style={styles.blockedZoneDesc}>
                  Your account is blocked due to suspicious activity. Please raise a ticket for
                  reconsideration below.
                </Text>
              </View>
            </View>

            <View style={styles.metricsBox}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Spam Score</Text>
                <View style={[styles.scoreBadge, styles.scoreBadgeRed]}>
                  <Text style={styles.scoreBadgeTextRed}>{spamScore}/100</Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Scam / Fraud Score</Text>
                <View style={[styles.scoreBadge, styles.scoreBadgeRed]}>
                  <Text style={styles.scoreBadgeTextRed}>{scamScore}/100</Text>
                </View>
              </View>
            </View>

            <View style={styles.zoneFooterRow}>
              <Text style={styles.blockedReasonText} numberOfLines={2}>
                Reason: {user.blockReason || 'Suspicious Activity flagged by Auto-moderator.'}
              </Text>
              <TouchableOpacity
                style={styles.raiseAppealBtnRed}
                onPress={() => setIsAppealModalOpen(true)}
              >
                <Text style={styles.raiseAppealBtnText}>Raise Reconsideration Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ZONE 2: Danger Zone */}
        {isDangerZone && (
          <View style={styles.dangerZoneCard}>
            <View style={styles.zoneHeaderRow}>
              <Feather name="alert-triangle" size={20} color="#D97706" style={styles.zoneIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerZoneTitle}>Warning: Account in Danger Zone</Text>
                <Text style={styles.dangerZoneDesc}>
                  Auto-moderation systems flagged your account due to guideline violations. Score
                  reaching 75+ causes automatic deactivation.
                </Text>
              </View>
            </View>

            <View style={styles.metricsBox}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Spam Score</Text>
                <View
                  style={[
                    styles.scoreBadge,
                    spamScore >= 50 ? styles.scoreBadgeRed : styles.scoreBadgeYellow,
                  ]}
                >
                  <Text
                    style={
                      spamScore >= 50 ? styles.scoreBadgeTextRed : styles.scoreBadgeTextYellow
                    }
                  >
                    {spamScore}/100
                  </Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Scam / Fraud Score</Text>
                <View
                  style={[
                    styles.scoreBadge,
                    scamScore >= 50 ? styles.scoreBadgeRed : styles.scoreBadgeYellow,
                  ]}
                >
                  <Text
                    style={
                      scamScore >= 50 ? styles.scoreBadgeTextRed : styles.scoreBadgeTextYellow
                    }
                  >
                    {scamScore}/100
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.zoneFooterRow}>
              <Text style={styles.dangerNoticeText}>Keep scores below threshold.</Text>
              <TouchableOpacity
                style={styles.raiseAppealBtnAmber}
                onPress={() => setIsAppealModalOpen(true)}
              >
                <Text style={styles.raiseAppealBtnText}>Raise Reconsideration Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ZONE 3: Safe Zone */}
        {isSafeZone && (
          <View style={styles.safeZoneCard}>
            <View style={styles.zoneHeaderRow}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#059669"
                style={styles.zoneIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.safeZoneTitle}>You are in the Safe Zone</Text>
                <Text style={styles.safeZoneDesc}>
                  Your account is in excellent standing! Thank you for maintaining compliance with
                  campus guidelines.
                </Text>
              </View>
            </View>

            <View style={styles.metricsBox}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Spam Score</Text>
                <View style={[styles.scoreBadge, styles.scoreBadgeGreen]}>
                  <Text style={styles.scoreBadgeTextGreen}>{spamScore}/100</Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Scam / Fraud Score</Text>
                <View style={[styles.scoreBadge, styles.scoreBadgeGreen]}>
                  <Text style={styles.scoreBadgeTextGreen}>{scamScore}/100</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Appeal Requests History */}
        {tickets.length > 0 && (
          <View style={styles.appealsCard}>
            <Text style={styles.appealsTitle}>Your Appeal Requests</Text>
            {tickets.map((ticket, idx) => (
              <View key={ticket._id || ticket.id || String(idx)} style={styles.ticketItem}>
                <View style={styles.ticketHeaderRow}>
                  <Text style={styles.ticketDate}>
                    Appeal Date: {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                  <View
                    style={[
                      styles.ticketStatusBadge,
                      ticket.status === 'approved'
                        ? styles.ticketApproved
                        : ticket.status === 'rejected'
                        ? styles.ticketRejected
                        : styles.ticketPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ticketStatusText,
                        ticket.status === 'approved'
                          ? { color: '#047857' }
                          : ticket.status === 'rejected'
                          ? { color: '#B91C1C' }
                          : { color: '#B45309' },
                      ]}
                    >
                      {String(ticket.status || 'PENDING').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketReason}>"{ticket.reason}"</Text>
                {ticket.adminComment ? (
                  <View style={styles.adminCommentBox}>
                    <Text style={styles.adminCommentLabel}>Admin Response:</Text>
                    <Text style={styles.adminCommentText}>{ticket.adminComment}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Profile Tabs: Active Listings & Reviews */}
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
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : listings.length > 0 ? (
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
                <Text style={styles.emptyTitle}>No active listings posted yet</Text>
                <Text style={styles.emptySubtitle}>
                  Earn extra cash by sharing your textbooks with classmates.
                </Text>
                <Button
                  title="List Your First Book"
                  onPress={() => navigation.navigate('CreateListing')}
                  variant="primary"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Reviews Content */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentSection}>
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
                      <Text style={styles.reviewComment}>{rev.comment}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="star-outline" size={36} color={COLORS.muted} />
                <Text style={styles.emptyTitle}>No review ratings received yet</Text>
                <Text style={styles.emptySubtitle}>
                  Reviews from buyers will show here after completing transactions.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Menu Links */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Marketplace & Activity</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'SavedTab' })}
            activeOpacity={0.7}
          >
            <Feather name="bookmark" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Saved Items ({savedBookIds.length})</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Messages')}
            activeOpacity={0.7}
          >
            <Feather name="message-square" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Messages & Deals</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CreateListing')}
            activeOpacity={0.7}
          >
            <Feather name="plus-circle" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Post New Listing</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support & RevoShelf Trust</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpCenter')}
            activeOpacity={0.7}
          >
            <Feather name="help-circle" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Help Center & FAQ</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SafetyTips')}
            activeOpacity={0.7}
          >
            <Feather name="shield" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Campus Safety Tips</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CommunityGuidelines')}
            activeOpacity={0.7}
          >
            <Feather name="users" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Community Guidelines</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ContactUs')}
            activeOpacity={0.7}
          >
            <Feather name="mail" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Contact RevoShelf Support</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AboutUs')}
            activeOpacity={0.7}
          >
            <Feather name="info" size={17} color="#475569" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>About RevoShelf</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.brandFooter}>
          <Logo height={24} />
          <Text style={styles.versionText}>RevoShelf Mobile · v1.0.0</Text>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Appeal Reconsideration Modal */}
      <Modal
        visible={isAppealModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAppealModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Reconsideration Ticket</Text>
              <TouchableOpacity
                onPress={() => setIsAppealModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Explain why your violation score should be cleared. Provide context or proof of honest
              student transactions.
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>EXPLANATION / REASONS</Text>
              <TextInput
                style={styles.modalTextInput}
                multiline
                numberOfLines={4}
                placeholder="Explain why this warning or block should be reconsidered..."
                placeholderTextColor="#94A3B8"
                value={appealReason}
                onChangeText={setAppealReason}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsAppealModalOpen(false);
                  setAppealReason('');
                }}
                disabled={isSubmittingAppeal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAppealSubmit}
                disabled={isSubmittingAppeal}
              >
                {isSubmittingAppeal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Appeal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  authPromptCard: {
    margin: 24,
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.card,
  },
  authIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  profileHeaderCard: {
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
    width: 70,
    height: 70,
    borderRadius: 35,
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
  userName: {
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
    paddingVertical: 2,
  },
  myProfileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
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
  headerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  headerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    backgroundColor: '#F8FAFC',
  },
  headerActionBtnPrimary: {
    borderColor: 'rgba(3, 143, 120, 0.3)',
    backgroundColor: 'rgba(3, 143, 120, 0.05)',
  },
  headerActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  locationPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.xl,
    padding: 14,
    ...SHADOWS.subtle,
  },
  locationPromptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(3, 143, 120, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPromptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  locationPromptSubtitle: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
  },
  locationPromptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  locationPromptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  blockedZoneCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
  },
  blockedZoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  blockedZoneDesc: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  blockedReasonText: {
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
  },
  raiseAppealBtnRed: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  dangerZoneCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  dangerZoneDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  dangerNoticeText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
  },
  raiseAppealBtnAmber: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  raiseAppealBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safeZoneCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
  },
  safeZoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  safeZoneDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  zoneIcon: {
    marginTop: 2,
  },
  metricsBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  scoreBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  scoreBadgeTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  scoreBadgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  scoreBadgeTextYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  scoreBadgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  scoreBadgeTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  zoneFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 10,
  },
  appealsCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 10,
  },
  appealsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  ticketItem: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 6,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ticketApproved: {
    backgroundColor: '#D1FAE5',
  },
  ticketRejected: {
    backgroundColor: '#FEE2E2',
  },
  ticketPending: {
    backgroundColor: '#FEF3C7',
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketReason: {
    fontSize: 12,
    color: COLORS.textDark,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  adminCommentBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    padding: 8,
    marginTop: 4,
    gap: 2,
  },
  adminCommentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  adminCommentText: {
    fontSize: 11,
    color: '#475569',
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
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
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
  reviewComment: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...SHADOWS.subtle,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    width: 26,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
    ...SHADOWS.subtle,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  brandFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    gap: 6,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  modalInputGroup: {
    gap: 6,
    marginTop: 4,
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 0.5,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 12,
    color: COLORS.textDark,
    minHeight: 90,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
