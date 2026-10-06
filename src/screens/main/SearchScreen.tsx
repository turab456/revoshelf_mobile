import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookCard } from '../../components/marketplace/BookCard';
import { EmptyState } from '../../components/common/EmptyState';
import { backendApi } from '../../services/backendApi';
import { CATEGORIES, CONDITIONS, SORT_OPTIONS } from '../../constants';
import type { Book, BookCondition, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

export const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: { category?: string; query?: string } }, 'params'>>();

  const [query, setQuery] = useState(route.params?.query || '');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'all');
  const [selectedConditions, setSelectedConditions] = useState<BookCondition[]>([]);
  const [sortOption, setSortOption] = useState('recent');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const results = await backendApi.getBooks({
        query: query.trim() || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        condition: selectedConditions.length > 0 ? selectedConditions : undefined,
        sort: sortOption,
        nearMe: nearMeOnly,
      });
      setBooks(results);
    } catch (err) {
      console.error('[SearchScreen] Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, selectedConditions, sortOption, nearMeOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  const toggleCondition = (cond: BookCondition) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedConditions([]);
    setSortOption('recent');
    setNearMeOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedConditions.length > 0 ||
    sortOption !== 'recent' ||
    nearMeOnly;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        )}
        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={18} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search books, author, department..."
            placeholderTextColor={COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="funnel-outline"
            size={18}
            color={hasActiveFilters ? COLORS.white : COLORS.textDark}
          />
          {hasActiveFilters && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll Chips */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              selectedCategory === 'all' && styles.chipActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === 'all' && styles.chipTextActive,
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCount}>
          {books.length} {books.length === 1 ? 'item' : 'items'} found
        </Text>
        <TouchableOpacity
          style={styles.sortTrigger}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
          <Text style={styles.sortTriggerText}>
            {SORT_OPTIONS.find((s) => s.value === sortOption)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid or Empty/Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding best RevoShelf listings...</Text>
        </View>
      ) : books.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No results found"
          description={
            hasActiveFilters
              ? 'Try relaxing your search terms or clearing some filters.'
              : 'Try searching for something else like "Algorithms" or "Casio".'
          }
          actionTitle={hasActiveFilters ? 'Clear Filters' : 'View All'}
          onActionPress={hasActiveFilters ? clearAllFilters : () => setSelectedCategory('all')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsGrid}
        >
          <View style={styles.grid}>
            {books.map((book) => (
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

      {/* Filter & Sort Bottom Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Sort by */}
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.radioGroup}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.radioOption}
                    onPress={() => setSortOption(opt.value)}
                  >
                    <Ionicons
                      name={
                        sortOption === opt.value
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={sortOption === opt.value ? COLORS.primary : COLORS.muted}
                    />
                    <Text
                      style={[
                        styles.radioLabel,
                        sortOption === opt.value && styles.radioLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Condition */}
              <Text style={styles.filterSectionTitle}>Condition</Text>
              <View style={styles.pillsWrap}>
                {CONDITIONS.map((cond) => {
                  const isChecked = selectedConditions.includes(cond.value);
                  return (
                    <TouchableOpacity
                      key={cond.value}
                      style={[styles.condPill, isChecked && styles.condPillActive]}
                      onPress={() => toggleCondition(cond.value)}
                    >
                      <Text
                        style={[
                          styles.condPillText,
                          isChecked && styles.condPillTextActive,
                        ]}
                      >
                        {cond.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.divider} />

              {/* Near Me */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setNearMeOnly(!nearMeOnly)}
              >
                <View>
                  <Text style={styles.toggleTitle}>Near My Campus Only</Text>
                  <Text style={styles.toggleSubtitle}>
                    Show listings located strictly within your college campus
                  </Text>
                </View>
                <Ionicons
                  name={nearMeOnly ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={nearMeOnly ? COLORS.primary : COLORS.muted}
                />
              </TouchableOpacity>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={clearAllFilters}
              >
                <Text style={styles.resetBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 2,
  },
  searchInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSec,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundSec,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FEF08A',
  },
  categoryScrollWrapper: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  categoryChips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundSec,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSec,
  },
  chipTextActive: {
    color: COLORS.primaryActive,
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resultsGrid: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalBody: {
    padding: 18,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.textSec,
  },
  radioLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 18,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundSec,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  condPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  condPillText: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: '500',
  },
  condPillTextActive: {
    color: COLORS.primaryActive,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    maxWidth: 260,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
