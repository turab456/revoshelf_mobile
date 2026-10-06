import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { HomeScreen } from '../screens/main/HomeScreen';
import { MessagesScreen } from '../screens/main/MessagesScreen';
import { SavedScreen } from '../screens/main/SavedScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CreateListingScreen } from '../screens/main/CreateListingScreen';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../services/backendApi';
import type { MainTabParamList } from '../types';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { savedBookIds } = useWishlist();
  const { user } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }
    const checkUnread = async () => {
      try {
        const chats = await backendApi.getChats(user.id);
        const unread = chats.filter((c) => c.unread).length;
        setUnreadChatCount(unread);
      } catch {
        // ignore
      }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSellPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
    if (!user) {
      navigation.navigate('Login' as any, { returnTo: 'SellTab' });
    } else {
      navigation.navigate('SellTab');
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* 1. Home */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            navigation.navigate('HomeTab');
          }}
        >
          <Feather
            name="home"
            size={22}
            color={state.index === 0 ? COLORS.primary : COLORS.muted}
          />
          <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Chat */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            navigation.navigate('ChatTab');
          }}
        >
          <View style={styles.iconBadgeWrapper}>
            <Feather
              name="message-square"
              size={22}
              color={state.index === 1 ? COLORS.primary : COLORS.muted}
            />
            {unreadChatCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.badgeText}>
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>
            Chat
          </Text>
        </TouchableOpacity>

        {/* 3. Sell Elevated FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            activeOpacity={0.85}
            onPress={handleSellPress}
          >
            <Feather name="plus" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Sell</Text>
        </View>

        {/* 4. Saved */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            navigation.navigate('SavedTab');
          }}
        >
          <View style={styles.iconBadgeWrapper}>
            <Feather
              name="heart"
              size={22}
              color={state.index === 3 ? COLORS.primary : COLORS.muted}
            />
            {savedBookIds.length > 0 && (
              <View style={styles.wishlistBadge}>
                <Text style={styles.badgeText}>
                  {savedBookIds.length > 9 ? '9+' : savedBookIds.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, state.index === 3 && styles.tabLabelActive]}>
            Saved
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        {(() => {
          const isProfileActive = state.index === 4;
          const isVerified = Boolean(user?.isVerified || user?.isEmailVerified);
          const avatarUri = user?.avatar
            ? user.avatar
            : user?.name
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=038578&color=fff&bold=true`
            : null;

          return (
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                navigation.navigate('ProfileTab');
              }}
            >
              <View style={styles.profileAvatarContainer}>
                {avatarUri ? (
                  <View
                    style={[
                      styles.avatarBorderRing,
                      isProfileActive && styles.avatarBorderRingActive,
                      isVerified && styles.avatarBorderRingVerified,
                    ]}
                  >
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarImg}
                      contentFit="cover"
                      transition={150}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.avatarBorderRing,
                      styles.avatarFallback,
                      isProfileActive && styles.avatarBorderRingActive,
                    ]}
                  >
                    <Feather
                      name="user"
                      size={15}
                      color={isProfileActive ? COLORS.primary : COLORS.muted}
                    />
                  </View>
                )}

                {/* Verified badge or crown on profile picture */}
                {isVerified && (
                  <View style={styles.verifiedBadgeContainer}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                  </View>
                )}
              </View>

              <Text style={[styles.tabLabel, isProfileActive && styles.tabLabelActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="ChatTab" component={MessagesScreen} />
      <Tab.Screen name="SellTab" component={CreateListingScreen} />
      <Tab.Screen name="SavedTab" component={SavedScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 74 : 60,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  iconBadgeWrapper: {
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
  profileAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorderRing: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorderRingActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  avatarBorderRingVerified: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 13.5,
  },
  avatarFallback: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
});
