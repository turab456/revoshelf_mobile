import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="Privacy Policy" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>RevoShelf Privacy Commitment</Text>
          <Text style={styles.date}>Last updated: October 2026</Text>

          <Text style={styles.sectionHeader}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect your college email, name, institution name, academic branch, and listing details in order to facilitate peer-to-peer campus exchanges. We do not sell your personal data to third parties.
          </Text>

          <Text style={styles.sectionHeader}>2. In-App Messaging</Text>
          <Text style={styles.paragraph}>
            Messages sent within RevoShelf are stored securely to allow dispute resolution and protect students from spam or fraudulent activities.
          </Text>

          <Text style={styles.sectionHeader}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            Passwords are encrypted using industry standard salted hashes. Tokens and authentication secrets are kept securely on device and never logged in plain text.
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
