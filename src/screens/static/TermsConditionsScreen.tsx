import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const TermsConditionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="Terms & Conditions" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.date}>Effective Date: October 2026</Text>

          <Text style={styles.sectionHeader}>1. RevoShelf Marketplace Agreement</Text>
          <Text style={styles.paragraph}>
            By creating an account or using RevoShelf, you agree to comply with our community standards and acknowledge that all transactions, inspections, and exchanges take place directly between students.
          </Text>

          <Text style={styles.sectionHeader}>2. Prohibited Items</Text>
          <Text style={styles.paragraph}>
            Users may only post legitimate academic textbooks, study materials, calculators, stationery, and approved hostel items. Hazardous materials, illegal substances, and non-educational commercial merchandise are strictly banned.
          </Text>

          <Text style={styles.sectionHeader}>3. Account Termination</Text>
          <Text style={styles.paragraph}>
            Users reported repeatedly for scams, misrepresentation, or harassment will have their RevoShelf privileges permanently suspended.
          </Text>
        </View>
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
  scrollBody: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.subtle,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  date: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13,
    color: COLORS.textSec,
    lineHeight: 19,
  },
});
