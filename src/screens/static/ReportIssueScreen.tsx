import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const ReportIssueScreen: React.FC = () => {
  const { showToast } = useToast();
  const [issueType, setIssueType] = useState('Suspicious Listing');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('Please describe the issue.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await backendApi.submitSupportTicket(issueType, description.trim(), name, email);
      showToast('Report submitted! Our safety team will review it immediately.', 'success');
      setDescription('');
    } catch {
      showToast('Could not submit report. Please try again.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report an Issue" showBack />
      <KeyboardAwareContainer contentContainerStyle={styles.scrollBody}>
        <View style={styles.card}>
          <Text style={styles.title}>Submit a Safety Report</Text>
          <Text style={styles.subtitle}>
            Notice spam, counterfeit items, or suspicious behavior? Help us keep the campus safe.
          </Text>

          <Input label="Issue Category" value={issueType} onChangeText={setIssueType} />
          <Input
            label="Details of Violation *"
            placeholder="Please specify listing details or seller username..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <Input label="Your Name (Optional)" value={name} onChangeText={setName} />
          <Input
            label="Your Email (Optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Button
            title="Submit Report"
            onPress={handleSubmit}
            variant="danger"
            size="lg"
            loading={submitting}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>
        <View style={{ height: 40 }} />
      </KeyboardAwareContainer>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSec,
    marginBottom: 16,
    lineHeight: 18,
  },
});
