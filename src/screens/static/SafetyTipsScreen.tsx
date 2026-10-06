import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const SafetyTipsScreen: React.FC = () => {
  const TIPS = [
    {
      title: 'Meet in Well-Lit, Populated Campus Spots',
      desc: 'Pick common campus landmarks such as your university library, student union, college canteen, or main academic quad.',
      icon: 'location-outline',
    },
    {
      title: 'Inspect Before You Pay',
      desc: 'Take 2 minutes to check the book edition, binding, highlighting, or test scientific calculators and electronic components before handing over payment.',
      icon: 'eye-outline',
    },
    {
      title: 'Avoid Advance Digital Transfers',
      desc: 'Never send advance deposits or tokens via UPI before inspecting the item in person.',
      icon: 'cash-outline',
    },
    {
      title: 'Keep Chat Inside RevoShelf',
      desc: 'Using RevoShelf in-app chat creates an audit trail and keeps your personal phone number private from unknown individuals.',
      icon: 'chatbubble-ellipses-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Campus Safety Tips" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          <Text style={styles.bannerTitle}>Your Safety is Priority #1</Text>
          <Text style={styles.bannerSubtitle}>
            Follow these golden rules to ensure safe, smooth campus handovers every time.
          </Text>
        </View>

        {TIPS.map((tip, idx) => (
          <View key={idx} style={styles.tipCard}>
            <View style={styles.iconCircle}>
              <Ionicons name={tip.icon as any} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
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
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    ...SHADOWS.subtle,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryActive,
    marginTop: 8,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSec,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    gap: 14,
    ...SHADOWS.subtle,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  tipDesc: {
    fontSize: 12,
    color: COLORS.textSec,
    lineHeight: 18,
    marginTop: 4,
  },
});
