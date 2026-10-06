import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const HowItWorksScreen: React.FC = () => {
  const BUYER_STEPS = [
    { title: '1. Discover Listings', desc: 'Search by course name, semester, author, or category on your campus.' },
    { title: '2. Chat with Seniors & Peers', desc: 'Discuss condition, negotiate if applicable, and agree on a campus meetup spot.' },
    { title: '3. Inspect & Collect', desc: 'Meet in person, inspect pages and equipment, pay via cash or UPI, and take it home.' },
  ];

  const SELLER_STEPS = [
    { title: '1. Snap & Post in 60s', desc: 'Take photos with your phone, set your price, and describe condition.' },
    { title: '2. Receive In-App Inquiries', desc: 'Chat directly with interested buyers from your university.' },
    { title: '3. Handover & Get Paid', desc: 'Hand over the book on campus and keep 100% of the proceeds.' },
  ];

  return (
    <View style={styles.container}>
      <Header title="How It Works" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>For Buyers</Text>
        </View>
        {BUYER_STEPS.map((step, idx) => (
          <View key={idx} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </View>
        ))}

        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Ionicons name="pricetags-outline" size={20} color="#D97706" />
          <Text style={styles.sectionTitle}>For Sellers</Text>
        </View>
        {SELLER_STEPS.map((step, idx) => (
          <View key={idx} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </View>
        ))}
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
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.subtle,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.textSec,
    lineHeight: 18,
  },
});
