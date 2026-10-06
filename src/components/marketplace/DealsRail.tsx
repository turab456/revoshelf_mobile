import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import type { Book } from '../../types';
import { COLORS, RADIUS } from '../../constants/theme';

interface DealsRailProps {
  title?: string;
  subtitle?: string;
  books: Book[];
  onBookPress: (bookId: string) => void;
  onViewAllPress?: () => void;
}

export const DealsRail: React.FC<DealsRailProps> = ({
  title = '🔥 Campus Steal Deals',
  subtitle = 'Under ₹299 or 35%+ off',
  books,
  onBookPress,
  onViewAllPress,
}) => {
  if (!books || books.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onViewAllPress && (
          <TouchableOpacity
            onPress={onViewAllPress}
            style={styles.viewAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scroll ribbon */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {books.map((book) => {
          const discountPct =
            book.originalPrice > book.price
              ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
              : null;

          const imageUrl =
            book.images && book.images.length > 0
              ? book.images[0]
              : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';

          return (
            <Pressable
              key={book.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => onBookPress(book.id)}
            >
              {/* Thumbnail */}
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                />
                {/* Discount badge */}
                {discountPct !== null && discountPct >= 5 && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>{discountPct}% OFF</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                  {book.title}
                </Text>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>
                    ₹{book.price.toLocaleString('en-IN')}
                  </Text>
                  {book.originalPrice > book.price && (
                    <Text style={styles.cardMrp}>
                      ₹{book.originalPrice.toLocaleString('en-IN')}
                    </Text>
                  )}
                </View>
                {/* Location */}
                {(book.pickupLocation || book.college) && (
                  <View style={styles.locRow}>
                    <Feather name="map-pin" size={9} color="#9CA3AF" />
                    <Text style={styles.locText} numberOfLines={1}>
                      {book.pickupLocation
                        ? book.pickupLocation.split(',')[0]
                        : book.college
                          ? book.college.split(',')[0].replace(/\(.*?\)/g, '').trim()
                          : ''}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollList: {
    paddingHorizontal: 14,
    gap: 10,
  },

  // Deal card
  card: {
    width: 138,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  imageBox: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8F8F8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountTag: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: COLORS.success,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  discountTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 15,
    height: 15,
    marginBottom: 4,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 3,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  cardMrp: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 9,
    color: '#9CA3AF',
    flex: 1,
  },
});
