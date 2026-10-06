import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common/Header';
import type { RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const HELP_TOPICS = [
    { title: 'Frequently Asked Questions', subtitle: 'Common questions about buying & selling', icon: 'help-circle-outline', route: 'Faq' as const },
    { title: 'Campus Safety Tips', subtitle: 'How to meet safely and test items on campus', icon: 'shield-checkmark-outline', route: 'SafetyTips' as const },
    { title: 'How It Works', subtitle: 'Step-by-step guide from search to pickup', icon: 'list-outline', route: 'HowItWorks' as const },
    { title: 'Community Guidelines', subtitle: 'Respectful trading etiquette for colleges', icon: 'people-outline', route: 'CommunityGuidelines' as const },
    { title: 'Report an Issue', subtitle: 'Report spam, risky sellers or item discrepancies', icon: 'alert-circle-outline', route: 'ReportIssue' as const },
    { title: 'Contact Support', subtitle: 'Speak directly with our RevoShelf team', icon: 'mail-outline', route: 'ContactUs' as const },
  ];

  return (
    <View style={styles.container}>
      <Header title="Help Center" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>How can we assist you?</Text>
          <Text style={styles.heroSubtitle}>Browse guides or reach out to the RevoShelf team.</Text>
        </View>

        <View style={styles.topicsGrid}>
          {HELP_TOPICS.map((topic, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.topicCard}
              onPress={() => navigation.navigate(topic.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={topic.icon as any} size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
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
  heroBox: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  topicsGrid: {
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    gap: 12,
    ...SHADOWS.subtle,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  topicSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});
