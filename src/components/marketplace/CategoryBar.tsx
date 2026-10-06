import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  dark?: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  badge?: string;
  renderIcon: (color: string) => React.ReactNode;
}

const ICON_SIZE = 24;

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: 'all',
    name: 'All',
    renderIcon: (color) => <Ionicons name="bag-handle-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'books',
    name: 'Books',
    renderIcon: (color) => <Ionicons name="book-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'calculators',
    name: 'Calc',
    renderIcon: (color) => <Ionicons name="calculator-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    renderIcon: (color) => <Ionicons name="headset-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'lab-equipment',
    name: 'Lab Gear',
    renderIcon: (color) => <Ionicons name="flask-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'notes',
    name: 'Notes',
    badge: 'New',
    renderIcon: (color) => <Ionicons name="document-text-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'cycles',
    name: 'Cycles',
    renderIcon: (color) => <Ionicons name="bicycle-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'hostel-essentials',
    name: 'Hostel',
    renderIcon: (color) => <Ionicons name="bed-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'project-components',
    name: 'Hardware',
    renderIcon: (color) => <Ionicons name="hardware-chip-outline" size={ICON_SIZE} color={color} />,
  },
  {
    id: 'stationery',
    name: 'Stationery',
    renderIcon: (color) => <Ionicons name="pencil-outline" size={ICON_SIZE} color={color} />,
  },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  dark = false,
}) => {
  const handleSelect = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onSelectCategory(id);
  };

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORY_ITEMS.map((item) => {
          const isSelected = selectedCategory === item.id;
          const iconColor = dark
            ? isSelected
              ? '#FFFFFF'
              : 'rgba(255, 255, 255, 0.85)'
            : isSelected
            ? COLORS.primary
            : '#64748B';

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => handleSelect(item.id)}
              style={styles.item}
            >
              {/* Floating outline icon without background box */}
              <View style={styles.iconBox}>
                {item.renderIcon(iconColor)}
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.label,
                  dark && styles.labelDark,
                  isSelected && (dark ? styles.labelDarkSelected : styles.labelSelected),
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              {/* Underline: light underline for default, bold underline for selected */}
              <View
                style={[
                  styles.underline,
                  isSelected
                    ? dark
                      ? styles.underlineDarkSelected
                      : styles.underlineSelected
                    : dark
                    ? styles.underlineDarkDefault
                    : styles.underlineDefault,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  containerDark: {
    backgroundColor: 'transparent',
    paddingTop: 6,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: 44,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  labelDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  labelDarkSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  underline: {
    borderRadius: 2,
    marginTop: 6,
    width: '100%',
  },
  underlineDefault: {
    backgroundColor: '#E2E8F0',
    height: 1.5,
  },
  underlineSelected: {
    backgroundColor: COLORS.primary,
    height: 3,
  },
  underlineDarkDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    height: 1.5,
  },
  underlineDarkSelected: {
    backgroundColor: '#FFFFFF',
    height: 3.2,
    borderRadius: 2,
  },
});
