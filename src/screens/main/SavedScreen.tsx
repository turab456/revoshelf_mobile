import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BookCard } from '../../components/marketplace/BookCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { backendApi } from '../../services/backendApi';
import type { Book, RootStackParamList } from '../../types';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

export const SavedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { savedBookIds } = useWishlist();

  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedBooks = async () => {
      setLoading(true);
      try {
        if (!user || savedBookIds.length === 0) {
          setSavedBooks([]);
          return;
        }
        const all = await backendApi.getBooks();
        setSavedBooks(all.filter((b) => savedBookIds.includes(b.id)));
      } catch (err) {
        console.error('[SavedScreen] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedBooks();
  }, [user, savedBookIds]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Items</Text>
          <Text style={styles.headerSubtitle}>Sign in to view your wishlist</Text>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view saved items"
          description="Log in to your RevoShelf account to sync and access your saved books across devices."
          actionTitle="Sign In"
          onActionPress={() => navigation.navigate('Login', { returnTo: 'SavedTab' })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <Text style={styles.headerSubtitle}>
          {savedBooks.length} {savedBooks.length === 1 ? 'item' : 'items'} in your wishlist
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : savedBooks.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          description="Tap the heart icon on any listing to save it here for later reference."
          actionTitle="Explore Marketplace"
          onActionPress={() => (navigation as any).navigate('MainTabs', { screen: 'SearchTab' })}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          <View style={styles.grid}>
            {savedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                width={CARD_WIDTH}
                onPress={() => navigation.navigate('ListingDetail', { id: book.id })}
              />
            ))}
          </View>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
