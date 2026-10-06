import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const AboutUsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="About RevoShelf" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Logo height={34} />
          </View>
          <Text style={styles.heroTitle}>Built by Students, For Students</Text>
          <Text style={styles.heroSubtitle}>
            RevoShelf is the dedicated campus marketplace designed to eliminate textbook waste, reduce academic expense, and foster trusted peer-to-peer sharing.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            Every semester, lakhs of rupees are spent on engineering and medical textbooks that are shelved after just a few months. RevoShelf empowers students to buy, sell, and circulate reference materials, scientific calculators, drafters, and hostel essentials inside their own campus walls.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why Choose RevoShelf?</Text>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Zero Delivery Fees & Delays</Text>
              <Text style={styles.featureDesc}>Meet directly at your college library, food court, or hostel gates.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Inspect Firsthand</Text>
              <Text style={styles.featureDesc}>Check highlighting, edition, and condition in person before paying.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>100% Student Verified</Text>
              <Text style={styles.featureDesc}>Only verified college email addresses can list and trade.</Text>
            </View>
          </View>
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
    gap: 14,
  },
  heroCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xxl,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.subtle,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textSec,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 16,
  },
});
