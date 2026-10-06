import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    if (!email.includes('@')) {
      showToast('Please register with a valid email address.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password should be at least 6 characters.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      showToast(
        'Registration successful! Please check your email to verify your account.',
        'success'
      );
      navigation.navigate('Login');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Registration failed.', 'danger');
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.cardTitle}>Register student account</Text>
            <Text style={styles.cardSubtitle}>
              Unlock peer trading and connect with students anywhere.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Full Name *"
              placeholder="e.g. Karan Kumar"
              value={name}
              onChangeText={setName}
              leftIcon={<Feather name="user" size={15} color="#94A3B8" />}
            />

            <Input
              label="Email Address *"
              placeholder="e.g. karan.cs22@rvce.edu.in"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Feather name="mail" size={15} color="#94A3B8" />}
            />

            <Input
              label="Password *"
              placeholder="Min. 8 characters"
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
                  <Text style={styles.submitBtnText}>Register Account</Text>
                  <Feather name="arrow-right" size={15} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardSeparator} />

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    gap: 2,
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
  signInLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
