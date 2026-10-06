import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { backendApi } from '../../services/backendApi';
import type { Chat, RootStackParamList } from '../../types';
import { COLORS } from '../../constants/theme';

export const MessagesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const isTab = route.name === 'ChatTab';
  const showBack = !isTab && navigation.canGoBack();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await backendApi.getChats(user.id);
      setChats(data || []);
    } catch (err) {
      console.error('[MessagesScreen] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Sign in to view your conversations</Text>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to chat"
          description="Log in to message sellers and coordinate campus pickups."
          actionTitle="Sign In"
          onActionPress={() => navigation.navigate('Login', { returnTo: 'ChatTab' })}
        />
      </View>
    );
  }

  const unreadCount = chats.filter((c) => c.unread).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {showBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="arrow-left" size={20} color="#111827" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleBlock}>
            <View style={styles.headerTitleRow}>
              <Feather name="message-square" size={16} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Chat Box</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{unreadCount} New</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : chats.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="When you message a seller or someone asks about your listing, the conversation will appear here."
          actionTitle="Browse Marketplace"
          onActionPress={() => (navigation as any).navigate('HomeTab')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {chats.map((chat) => {
            const isCompleted = chat.buyerConfirmedReceipt;
            const isPending = chat.salePending && !isCompleted;
            const isDeleted = chat.bookIsDeleted;

            return (
              <TouchableOpacity
                key={chat.id}
                style={[styles.chatRow, chat.unread && styles.chatRowUnread]}
                onPress={() =>
                  navigation.navigate('ChatDetail', {
                    chatId: chat.id,
                    bookId: chat.bookId,
                    otherUserName: chat.otherParticipant.name,
                  })
                }
                activeOpacity={0.8}
              >
                {/* Avatar */}
                <Image
                  source={{
                    uri:
                      chat.otherParticipant.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                  }}
                  style={styles.avatar}
                  contentFit="cover"
                />

                {/* Main info */}
                <View style={styles.chatInfo}>
                  <View style={styles.topRow}>
                    <Text style={[styles.partnerName, chat.unread && styles.partnerNameUnread]} numberOfLines={1}>
                      {chat.otherParticipant.name}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(chat.lastMessageTime)}</Text>
                  </View>

                  {/* Book title link */}
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {chat.bookTitle}  ·  ₹{chat.bookPrice?.toLocaleString('en-IN')}
                  </Text>

                  {/* Trade status badges */}
                  {isCompleted ? (
                    <View style={[styles.statusBadge, styles.statusSuccess]}>
                      <Text style={[styles.statusBadgeText, styles.statusSuccessText]}>
                        ✓ Trade Complete
                      </Text>
                    </View>
                  ) : isPending ? (
                    <View style={[styles.statusBadge, styles.statusWarning]}>
                      <Text style={[styles.statusBadgeText, styles.statusWarningText]}>
                        ⏳ Awaiting Confirmation
                      </Text>
                    </View>
                  ) : isDeleted ? (
                    <View style={[styles.statusBadge, styles.statusNeutral]}>
                      <Text style={[styles.statusBadgeText, styles.statusNeutralText]}>
                        🗑 Listing Deleted
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.lastMsg, chat.unread && styles.lastMsgUnread]}
                      numberOfLines={1}
                    >
                      {chat.lastMessage || 'Tap to view conversation'}
                    </Text>
                  )}
                </View>

                {/* Unread dot */}
                {chat.unread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  unreadCountBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat row
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  chatRowUnread: {
    backgroundColor: `${COLORS.primary}06`,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  partnerNameUnread: {
    fontWeight: '900',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    flexShrink: 0,
  },
  bookTitle: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 3,
  },
  lastMsg: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastMsgUnread: {
    color: '#111827',
    fontWeight: '600',
  },

  // Status badges
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusSuccess: {
    backgroundColor: `${COLORS.success}18`,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  statusSuccessText: {
    color: COLORS.success,
  },
  statusWarning: {
    backgroundColor: `${COLORS.warning}18`,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  statusWarningText: {
    color: COLORS.warning,
  },
  statusNeutral: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusNeutralText: {
    color: '#6B7280',
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },
});
