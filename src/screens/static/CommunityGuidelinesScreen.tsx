import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const CommunityGuidelinesScreen: React.FC = () => {
  const GUIDELINES = [
    { title: 'Be Honest About Condition', desc: 'Disclose highlighted pages, cracked covers, or missing calculator cables in your photos and description.' },
    { title: 'Honor Meeting Times', desc: 'Campus schedules are packed. If you agree to meet at the library at 4 PM, be punctual or notify the student in advance.' },
    { title: 'Fair Campus Pricing', desc: 'Price your used items fairly so fellow juniors and batchmates can genuinely save money.' },
    { title: 'Respectful Communication', desc: 'Keep all discussions courteous and focused strictly on the item exchange.' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Community Guidelines" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Code of RevoShelf Conduct</Text>
          <Text style={styles.bannerSubtitle}>
            RevoShelf is a student trust community. Here is how we maintain a safe, welcoming environment for everyone.
          </Text>
        </View>

        {GUIDELINES.map((g, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{g.title}</Text>
              <Text style={styles.cardDesc}>{g.desc}</Text>
            </View>
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
    gap: 12,
  },
  banner: {
    backgroundColor: COLORS.primaryLight,
    padding: 20,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryActive,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    gap: 12,
    alignItems: 'flex-start',
    ...SHADOWS.subtle,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSec,
    lineHeight: 18,
    marginTop: 3,
  },
});
