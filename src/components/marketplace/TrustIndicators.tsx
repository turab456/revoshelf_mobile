import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const TRUST_POINTS = [
  'Verified Students',
  'No Listing Fees',
  'Campus Pickup',
  'Secure Messaging',
];

export const TrustIndicators: React.FC = () => {
  return (
    <View style={styles.container}>
      {TRUST_POINTS.map((text) => (
        <View key={text} style={styles.item}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 10,
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 11,
    color: COLORS.textSec,
    fontWeight: '500',
  },
});
