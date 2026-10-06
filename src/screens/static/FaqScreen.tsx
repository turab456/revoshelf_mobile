import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How does pickup work on RevoShelf?',
    a: 'Buyers and sellers agree on a convenient campus spot (e.g. library entrance, student canteen, or department lobby) via in-app chat to inspect the item and finalize the handover.',
  },
  {
    q: 'Are there any platform listing fees or commissions?',
    a: 'No! RevoShelf is 100% free for college students. You keep 100% of the sale price.',
  },
  {
    q: 'Can non-students use RevoShelf?',
    a: 'RevoShelf is tailored specifically for verified campus communities. We encourage users to verify their college email address for added safety and trust.',
  },
  {
    q: 'What should I do if an item does not match the description?',
    a: 'Because pickups take place in person on campus, always inspect the condition (pages, edition, electronics functionality) before handing over payment.',
  },
  {
    q: 'How do I edit or delete my listing?',
    a: 'Navigate to Profile > My Listings, tap "Edit" on the listing card, make your changes, and save.',
  },
];

export const FaqScreen: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <View style={styles.container}>
      <Header title="FAQ" showBack />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {FAQS.map((faq, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => toggleExpand(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.questionRow}>
                <Text style={styles.questionText}>{faq.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.muted}
                />
              </View>
              {isOpen && <Text style={styles.answerText}>{faq.a}</Text>}
            </TouchableOpacity>
          );
        })}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    ...SHADOWS.subtle,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 18,
  },
  answerText: {
    fontSize: 13,
    color: COLORS.textSec,
    lineHeight: 19,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
});
