import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/common/Logo';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import type { RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const VerifyEmailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VerifyEmail'>>();
  const token = route.params?.token;
  const id = route.params?.id;

  const { showToast } = useToast();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token || !id) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Invalid verification link. Token or User ID is missing.');
        }
        return;
      }

      try {
        const res = await backendApi.verifyEmail(token, id);
        if (isMounted) {
          if (res.success) {
            setStatus('success');
            showToast('Email verified successfully! You can now log in.', 'success');
          } else {
            setStatus('error');
            setErrorMessage(res.message || 'Verification failed. The token may be expired or invalid.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Verification request failed. Please try again.');
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, id, showToast]);

  // Countdown timer for automatic redirect
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown <= 0) {
      navigation.navigate('Login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.cardTitle}>Email Verification</Text>
            <Text style={styles.cardSubtitle}>Completing your registration security handshake.</Text>
          </View>

          {/* Loading State */}
          {status === 'loading' && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateTitle}>Verifying Address</Text>
              <Text style={styles.stateSubtitle}>
                Please wait while we confirm your email verification token with the server...
              </Text>
            </View>
          )}

          {/* Success State */}
          {status === 'success' && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
              <Text style={styles.successTitle}>Verification Complete!</Text>
              <Text style={styles.successSubtitle}>
                Thank you! Your email has been verified. You will be automatically redirected to the
                login page in <Text style={styles.countdownBold}>{countdown}</Text> seconds.
              </Text>
              <TouchableOpacity
                style={styles.proceedLoginBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.proceedLoginText}>Proceed to Login</Text>
                <Feather name="arrow-right" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Error State */}
          {status === 'error' && (
            <View style={styles.errorBox}>
              <Ionicons name="close-circle" size={48} color="#DC2626" />
              <Text style={styles.errorTitle}>Verification Failed</Text>
              <Text style={styles.errorSubtitle}>
                {errorMessage || 'We encountered an error while verifying your email.'}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <Text style={styles.retryBtnText}>Try Registering Again</Text>
              </TouchableOpacity>

              <View style={styles.cardSeparator} />

              <TouchableOpacity
                style={styles.backLinkRow}
                onPress={() => navigation.navigate('Login')}
              >
                <Feather name="arrow-left" size={14} color={COLORS.muted} />
                <Text style={styles.backLinkText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  loadingBox: {
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stateSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  successSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  countdownBold: {
    fontWeight: '800',
    color: COLORS.textDark,
  },
  proceedLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 6,
  },
  proceedLoginText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.borderCustom,
    marginTop: 6,
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
});
