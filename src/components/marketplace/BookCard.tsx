import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Book } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, RADIUS } from '../../constants/theme';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  width?: number;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onPress, width }) => {
  const { isSaved, toggleSave } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useToast();

  const saved = isSaved(book.id);

  const handleSaveToggle = async () => {
    if (!user) {
      showToast('Please sign in to save items.', 'warning');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleSave(book.id);
    } catch {
      showToast('Failed to update saved items.', 'danger');
    }
  };

  const discountPercent =
    book.originalPrice > book.price
      ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
      : null;

  const isSold = book.status === 'sold';
  const isPending = book.salePending && !isSold;

  const imageUrl =
    book.images && book.images.length > 0
      ? book.images[0]
      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';

  const conditionColor = () => {
    switch (book.condition) {
      case 'New': return '#059669';
      case 'Like New': return '#0284C7';
      case 'Very Good': return '#7C3AED';
      case 'Good': return '#D97706';
      default: return '#6B7280';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        width ? { width } : styles.fullFlex,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* ── Image Block ─────────────────────────── */}
      <View style={styles.imageBox}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />

        {/* Sold / Pending overlay */}
        {(isSold || isPending) && (
          <View style={[styles.statusOverlay, isPending && styles.pendingOverlay]}>
            <Text style={styles.statusOverlayText}>
              {isSold ? 'SOLD' : 'PENDING'}
            </Text>
          </View>
        )}

        {/* Discount badge — top left */}
        {discountPercent !== null && discountPercent >= 5 && !isSold && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Save / Heart — top right */}
        {(!user || user.id !== book.sellerId) && (
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={handleSaveToggle}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={15}
              color={saved ? '#EF4444' : '#64748B'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content Block ────────────────────────── */}
      <View style={styles.content}>
        <View style={styles.contentTop}>
          {/* Condition pill */}
          <View style={[styles.conditionPill, { borderColor: conditionColor() }]}>
            <Text style={[styles.conditionText, { color: conditionColor() }]}>
              {book.condition}
            </Text>
          </View>

          {/* Title: Shortened to 1 line with ellipsis so it never wraps down */}
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {book.title}
          </Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{book.price.toLocaleString('en-IN')}</Text>
            {book.originalPrice > book.price && (
              <Text style={styles.mrp}>₹{book.originalPrice.toLocaleString('en-IN')}</Text>
            )}
          </View>

          {/* Location row */}
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={10} color={COLORS.muted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {book.pickupLocation
                ? book.pickupLocation.split(',')[0]
                : book.college
                  ? book.college.split(',')[0].replace(/\(.*?\)/g, '').trim()
                  : 'Campus Direct'}
            </Text>
          </View>
        </View>

        {/* Chat CTA button — only for non-owners */}
        {isSold ? (
          <View style={styles.soldBtn}>
            <Text style={styles.soldBtnText}>Sold</Text>
          </View>
        ) : user && user.id === book.sellerId ? (
          <View style={styles.ownerBtn}>
            <Feather name="user" size={11} color="#64748B" />
            <Text style={styles.ownerBtnText}>Your Item</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Feather name="message-circle" size={12} color={COLORS.primary} />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fullFlex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },

  // Image
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pendingOverlay: {
    backgroundColor: 'rgba(217,119,6,0.55)',
  },
  statusOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.success,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Content
  content: {
    padding: 9,
    flex: 1,
    justifyContent: 'space-between',
  },
  contentTop: {
    marginBottom: 8,
  },
  conditionPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginBottom: 4,
    height: 18,
  },
  conditionText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 16,
    height: 16, // Single line height prevents wrapping down and guarantees uniform cards!
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    height: 20,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  mrp: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 16,
  },
  locationText: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 6,
    height: 30,
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ownerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    height: 30,
  },
  ownerBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  soldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    height: 30,
  },
  soldBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});
