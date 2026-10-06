import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { Book, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const MyListingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'all'>('active');

  const loadMyListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await backendApi.getBooks();
      setBooks(all.filter((b) => b.sellerId === user.id));
    } catch {
      showToast('Could not load listings.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadMyListings();
  }, [loadMyListings]);

  const handleMarkSold = async (bookId: string) => {
    try {
      await backendApi.markAsSold(bookId);
      showToast('Item marked as sold!', 'success');
      loadMyListings();
    } catch {
      showToast('Could not update status.', 'danger');
    }
  };

  const handleDelete = (bookId: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await backendApi.deleteListing(bookId);
            showToast('Listing deleted.', 'info');
            loadMyListings();
          } catch {
            showToast('Failed to delete listing.', 'danger');
          }
        },
      },
    ]);
  };

  const filtered = books.filter((b) => {
    if (activeTab === 'active') return b.status === 'active';
    if (activeTab === 'sold') return b.status === 'sold';
    return true;
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="My Listings" showBack />
        <View style={styles.authPromptCard}>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Logo height={32} />
          </View>
          <Text style={styles.authTitle}>Sign In to RevoShelf</Text>
          <Text style={styles.authSubtitle}>
            You must be logged in to manage your active listings, mark items sold, and track deals.
          </Text>

          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login', { returnTo: 'MyListings' })}
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

  return (
    <View style={styles.container}>
      <Header
        title="My Listings"
        showBack
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('CreateListing')}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['active', 'sold', 'all'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({books.filter(b => tab === 'all' ? true : b.status === tab).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title={`No ${activeTab} listings`}
          description="Ready to clear your hostel shelf and earn cash?"
          actionTitle="Post a Listing"
          onActionPress={() => navigation.navigate('CreateListing')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {filtered.map((book) => {
            const imageUrl =
              book.images && book.images.length > 0
                ? book.images[0]
                : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';

            return (
              <View key={book.id} style={styles.listingCard}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => navigation.navigate('ListingDetail', { id: book.id })}
                >
                  <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
                  <View style={styles.cardContent}>
                    <View style={styles.statusRow}>
                      <Badge
                        label={book.status.toUpperCase()}
                        variant={book.status === 'sold' ? 'muted' : 'success'}
                        size="sm"
                      />
                      <Text style={styles.price}>₹{book.price.toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.location} numberOfLines={1}>
                      {book.pickupLocation}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('EditListing', { id: book.id })}
                  >
                    <Ionicons name="create-outline" size={15} color={COLORS.textDark} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  {book.status !== 'sold' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleMarkSold(book.id)}
                    >
                      <Ionicons name="checkmark-done-outline" size={15} color={COLORS.primary} />
                      <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>
                        Mark Sold
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(book.id)}
                  >
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                    <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    gap: 12,
  },
  listingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  cardMain: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FAF8F5',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 18,
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: COLORS.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundSec,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
});
