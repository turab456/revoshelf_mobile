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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const returnTo = route.params?.returnTo;

  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('All fields are required', 'warning');
      return;
    }

    if (!email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      showToast('Successfully signed in!', 'success');
      if (returnTo && returnTo !== 'Login') {
        if (returnTo === 'Settings' || returnTo === 'CreateListing' || returnTo === 'MyListings') {
          (navigation as any).replace(returnTo);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate('MainTabs');
        }
      } else {
        (navigation as any).navigate('MainTabs');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Invalid credentials.', 'danger');
      if (err.message && err.message.toLowerCase().includes('verify')) {
        setShowResend(true);
        setResendEmail(email.trim().toLowerCase());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail) return;
    setIsResending(true);
    try {
      await backendApi.resendVerification(resendEmail);
      showToast('A new verification link has been sent to your email!', 'success');
      setShowResend(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to resend verification link.', 'danger');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
        {/* Top Back / Close Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={22} color={COLORS.textDark} />
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
            <Text style={styles.cardTitle}>Sign in to your account</Text>
            <Text style={styles.cardSubtitle}>
              Access listings and communicate with fellow student sellers.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="e.g. name@rvce.edu.in"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (showResend) setShowResend(false);
              }}
              leftIcon={<Feather name="mail" size={15} color="#94A3B8" />}
            />

            <View style={styles.passwordHeaderRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Feather name="lock" size={15} color="#94A3B8" />}
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
                <>
                  <Text style={styles.submitBtnText}>Sign In</Text>
                  <Feather name="arrow-right" size={15} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Resend Verification Alert */}
          {showResend && (
            <View style={styles.resendAlert}>
              <Text style={styles.resendAlertTitle}>
                Still haven't received the verification email?
              </Text>
              <TouchableOpacity
                onPress={handleResendLink}
                disabled={isResending}
                activeOpacity={0.7}
              >
                <Text style={styles.resendActionText}>
                  {isResending
                    ? 'Resending verification email...'
                    : '✉️ Click here to resend verification link'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => {
              showToast('Google Sign-In is configured via RevoShelf OAuth.', 'info');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={16} color="#EA4335" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.cardSeparator} />

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register Account</Text>
            </TouchableOpacity>
          </View>
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
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  resendAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 4,
  },
  resendAlertTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
  resendActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderCustom,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: 8,
    paddingVertical: 11,
  },
  googleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: COLORS.borderCustom,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  registerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
