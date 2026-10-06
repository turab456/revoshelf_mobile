import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    if (!email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await backendApi.forgotPassword(email.trim().toLowerCase());
      setEmailSent(true);
      showToast('Reset link dispatched to your email!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to trigger reset email.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
        {/* Top Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Logo height={32} />
          </View>
          <Text style={styles.headerTitle}>Welcome to RevoShelf</Text>
          <Text style={styles.headerSubtitle}>
            Exclusively for verified college students. Buy, sell, and save.
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>
              Enter your registered email to receive a password reset link.
            </Text>
          </View>

          {emailSent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={44} color="#059669" />
              <Text style={styles.successTitle}>Verification Link Sent</Text>
              <Text style={styles.successSubtitle}>
                We have sent a password recovery link to{' '}
                <Text style={styles.successEmailBold}>{email}</Text>. Please check your inbox and
                spam folder.
              </Text>

              <TouchableOpacity
                style={styles.returnLoginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Feather name="arrow-left" size={14} color={COLORS.primary} />
                <Text style={styles.returnLoginText}>Return to login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="e.g. name@rvce.edu.in"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Feather name="mail" size={15} color="#94A3B8" />}
              />

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Send Recovery Link</Text>
                )}
              </TouchableOpacity>

              <View style={styles.cardSeparator} />

              <TouchableOpacity
                style={styles.backLinkRow}
                onPress={() => navigation.navigate('Login')}
              >
                <Feather name="arrow-left" size={14} color={COLORS.muted} />
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    gap: 6,
  },
  logoWrapper: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    gap: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  form: {
    gap: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 6,
    ...SHADOWS.subtle,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: COLORS.borderCustom,
    marginTop: 10,
    marginBottom: 6,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  successSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  successEmailBold: {
    fontWeight: '700',
    color: COLORS.textDark,
  },
  returnLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  returnLoginText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
