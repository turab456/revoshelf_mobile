import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const ContactUsScreen: React.FC = () => {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim() || !message.trim()) {
      showToast('Please provide your name, email, and message.', 'warning');
      return;
    }

    setSending(true);
    try {
      await backendApi.submitContactForm(firstName.trim(), lastName.trim(), email.trim(), topic, message.trim());
      showToast('Message sent! Our campus team will reply shortly.', 'success');
      setMessage('');
    } catch {
      showToast('Failed to send message. Please try again.', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Contact Us" showBack />
      <KeyboardAwareContainer contentContainerStyle={styles.scrollBody}>
        <View style={styles.card}>
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>
            Have a question, feedback, or need help with a transaction? Send our student support team a message.
          </Text>

          <Input label="First Name *" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input
            label="College Email *"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input label="Topic" value={topic} onChangeText={setTopic} />
          <Input
            label="Message *"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <Button
            title="Send Message"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={sending}
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSec,
    lineHeight: 18,
    marginBottom: 16,
  },
});
