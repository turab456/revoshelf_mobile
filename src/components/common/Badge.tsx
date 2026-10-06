import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import type { BookCondition } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'condition' | 'muted';
  condition?: BookCondition;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  condition,
  size = 'md',
  style,
}) => {
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    if (condition) {
      switch (condition) {
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
      }
    }

    switch (variant) {
      case 'success':
        return { bg: COLORS.successLight, text: COLORS.success, border: '#BBF7D0' };
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning, border: '#FDE68A' };
      case 'danger':
        return { bg: COLORS.dangerLight, text: COLORS.danger, border: '#FECACA' };
      case 'secondary':
        return { bg: COLORS.secondaryLight, text: COLORS.secondary, border: '#BAE6FD' };
      case 'muted':
        return { bg: '#F3F4F6', text: COLORS.muted, border: '#E5E7EB' };
      case 'primary':
      default:
        return { bg: COLORS.primaryLight, text: COLORS.primaryActive, border: '#A7F3D0' };
    }
  };

  const { bg, text, border } = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  badgeMd: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 9.5,
  },
  textMd: {
    fontSize: 11,
  },
});
