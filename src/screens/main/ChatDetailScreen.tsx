import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import { getSocket } from '../../services/socket';
import type { Message, Chat, RootStackParamList } from '../../types';
import { COLORS, RADIUS } from '../../constants/theme';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

export const ChatDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatDetailRouteProp>();
  const { chatId, bookId, otherUserName } = route.params;

  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  // Action states
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, chats] = await Promise.all([
        backendApi.getMessages(chatId),
        backendApi.getChats(user?.id || ''),
      ]);
      setMessages(msgs || []);
      const thisChat = chats.find((c) => c.id === chatId) || null;
      setChat(thisChat);
      await backendApi.markChatAsRead(chatId);
    } catch (err) {
      console.error('[ChatDetail] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId, user]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Socket — live messages
  useEffect(() => {
    const socket = getSocket();
    const handleNewMsg = (msg: any) => {
      if (msg?.chatId === chatId) {
        setMessages((prev) => [...prev, msg]);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    };
    const handleStatusUpdate = (data: { chatId: string; type: string }) => {
      if (data.chatId !== chatId) return;
      setChat((prev) => {
        if (!prev) return prev;
        switch (data.type) {
          case 'sale_pending':
            return { ...prev, salePending: true, bookIsSold: false, buyerConfirmedReceipt: false };
          case 'sale_confirmed':
            return { ...prev, bookIsSold: true, salePending: false, buyerConfirmedReceipt: true };
          case 'sale_denied':
          case 'sale_canceled':
            return { ...prev, bookIsSold: false, salePending: false, buyerConfirmedReceipt: false };
          default:
            return prev;
        }
      });
    };
    socket?.on('message', handleNewMsg);
    socket?.on('chat_status_updated', handleStatusUpdate);
    return () => {
      socket?.off('message', handleNewMsg);
      socket?.off('chat_status_updated', handleStatusUpdate);
    };
  }, [chatId]);

  // ── Actions ──────────────────────────────────────────

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: user.id,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setText('');
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      await backendApi.sendMessage(chatId, trimmed);
    } catch (err) {
      console.error('[ChatDetail] Send failed:', err);
    }
  };

  const handleArrivalAlert = async () => {
    if (!chat || !user) return;
    try {
      const msg = await backendApi.sendArrivalAlert(chatId, user.id);
      setMessages((prev) => [...prev, msg]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
      showToast('Arrival alert sent!', 'success');
    } catch {
      showToast('Failed to send arrival alert.', 'danger');
    }
  };

  const handleMarkAsSold = async () => {
    if (!chat) return;
    Alert.alert(
      'Mark as Sold?',
      `This will notify ${chat.otherParticipant.name} to confirm they received the item.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          style: 'default',
          onPress: async () => {
            setIsMarkingSold(true);
            try {
              const buyerId = chat.buyerId || chat.otherParticipant.id;
              await backendApi.markAsSold(chat.bookId, buyerId);
              setChat((prev) => prev ? { ...prev, salePending: true, bookIsSold: false } : prev);
              showToast('Awaiting buyer confirmation...', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to mark as sold.', 'danger');
            } finally {
              setIsMarkingSold(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmReceipt = async () => {
    if (!chat) return;
    Alert.alert(
      'Confirm Receipt?',
      'Confirm that you have received the item. This will complete the trade.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setIsConfirming(true);
            try {
              await backendApi.confirmReceipt(chat.bookId);
              setChat((prev) =>
                prev ? { ...prev, buyerConfirmedReceipt: true, bookIsSold: true, salePending: false } : prev
              );
              showToast('Trade completed! Thank you.', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to confirm receipt.', 'danger');
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleDenyReceipt = async () => {
    if (!chat) return;
    Alert.alert(
      'Deny Receipt?',
      'Did you NOT receive the item? Denying will cancel the trade and report the seller.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny & Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await backendApi.cancelPendingSale(chat.bookId);
              setChat((prev) =>
                prev ? { ...prev, salePending: false, bookIsSold: false, buyerConfirmedReceipt: false } : prev
              );
              showToast('Purchase denied. Sale canceled.', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to deny receipt.', 'danger');
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ]
    );
  };

  const handleSellerCancelPending = async () => {
    if (!chat) return;
    Alert.alert(
      'Cancel Pending Sale?',
      'This will cancel the pending sale and make the listing active again.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Sale',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await backendApi.cancelPendingSale(chat.bookId);
              setChat((prev) =>
                prev ? { ...prev, salePending: false, bookIsSold: false, buyerConfirmedReceipt: false } : prev
              );
              showToast('Pending sale canceled. Listing is now active.', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to cancel pending sale.', 'danger');
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewSubmit = async () => {
    if (!chat || !reviewComment.trim()) {
      showToast('Please write a review comment.', 'warning');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await backendApi.addReview(chat.sellerId, reviewRating, reviewComment.trim());
      showToast('Review submitted! Thank you.', 'success');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'danger');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const isBuyer = user?.id === chat?.buyerId;
  const isSeller = user?.id === chat?.sellerId;

  // ── Render ────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color="#111827" />
          </TouchableOpacity>
          {chat?.otherParticipant?.avatar ? (
            <Image
              source={{ uri: chat.otherParticipant.avatar }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
              <Feather name="user" size={16} color={COLORS.muted} />
            </View>
          )}
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUserName || 'Chat'}
            </Text>
            <Text style={styles.headerSubtitle}>Active on RevoShelf</Text>
          </View>
        </View>

        {/* Right actions */}
        <View style={styles.headerActions}>
          {/* "I'm Here" arrival alert */}
          {!chat?.bookIsSold && !chat?.bookIsDeleted && (
            <TouchableOpacity
              style={styles.arrivalBtn}
              onPress={handleArrivalAlert}
              activeOpacity={0.8}
            >
              <Feather name="map-pin" size={13} color={COLORS.primary} />
              <Text style={styles.arrivalBtnText}>I'm Here</Text>
            </TouchableOpacity>
          )}

          {/* Review button — buyer only */}
          {isBuyer && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => setShowReviewModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={13} color="#FFFFFF" />
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          )}

          {/* SELLER actions */}
          {isSeller && !chat?.bookIsDeleted && (
            chat?.bookIsSold ? (
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>Sold</Text>
              </View>
            ) : chat?.salePending ? (
              <View style={styles.pendingActionsRow}>
                <View style={styles.pendingChip}>
                  <Text style={styles.pendingChipText}>Pending</Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleSellerCancelPending}
                  disabled={isCanceling}
                >
                  <Text style={styles.cancelBtnText}>
                    {isCanceling ? '...' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.soldBtn}
                onPress={handleMarkAsSold}
                disabled={isMarkingSold}
                activeOpacity={0.85}
              >
                <Text style={styles.soldBtnText}>
                  {isMarkingSold ? 'Marking...' : 'Mark Sold'}
                </Text>
              </TouchableOpacity>
            )
          )}

          {/* BUYER actions */}
          {isBuyer && chat?.salePending && !chat?.buyerConfirmedReceipt && (
            <View style={styles.buyerActionRow}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmReceipt}
                disabled={isConfirming || isCanceling}
              >
                <Feather name="check" size={12} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>
                  {isConfirming ? '...' : 'Got it'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.denyBtn}
                onPress={handleDenyReceipt}
                disabled={isConfirming || isCanceling}
              >
                <Text style={styles.denyBtnText}>
                  {isCanceling ? '...' : 'Deny'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Book Summary Banner ─────────────────── */}
      {chat && (
        <View style={styles.bookBanner}>
          {chat.bookImage ? (
            <Image
              source={{ uri: chat.bookImage }}
              style={styles.bookBannerThumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.bookBannerThumb, styles.bookThumbFallback]}>
              <Feather name="book" size={14} color={COLORS.muted} />
            </View>
          )}
          <View style={styles.bookBannerInfo}>
            <Text style={styles.bookBannerTitle} numberOfLines={1}>{chat.bookTitle}</Text>
            <Text style={styles.bookBannerMeta}>
              ₹{chat.bookPrice?.toLocaleString('en-IN')}
              {chat.pickupLocation ? `  ·  📍 ${chat.pickupLocation.split(',')[0]}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewItemBtn}
            onPress={() => navigation.navigate('ListingDetail', { id: chat.bookId })}
          >
            <Text style={styles.viewItemBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pending action banner for buyer ─────── */}
      {isBuyer && chat?.salePending && !chat?.buyerConfirmedReceipt && (
        <View style={styles.pendingBanner}>
          <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
          <Text style={styles.pendingBannerText}>
            The seller has marked this item as sold. Please confirm or deny receipt.
          </Text>
        </View>
      )}

      {/* ── Messages Feed ──────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Deleted listing notice */}
          {chat?.bookIsDeleted && (
            <View style={styles.systemBanner}>
              <Text style={styles.systemBannerText}>
                ⚠️ This conversation is closed because the listing was deleted by the seller.
              </Text>
            </View>
          )}

          {/* Safety notice */}
          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.safetyText}>
              Keep transactions on campus. Verify item condition before making payment.
            </Text>
          </View>

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            // System update messages
            const isSystemMsg = msg.text?.includes('Tap to view the latest details.');
            if (isSystemMsg) {
              const rawPrefix = msg.text.split('Tap to view the latest details.')[0].trim();
              return (
                <View key={msg.id} style={styles.systemMsgWrapper}>
                  <TouchableOpacity
                    style={styles.systemMsgBubble}
                    onPress={() => chat && navigation.navigate('ListingDetail', { id: chat.bookId })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.systemMsgText}>{rawPrefix}</Text>
                    <Text style={styles.systemMsgLink}>Tap to view latest details →</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrapper,
                  isMe ? styles.myWrapper : styles.theirWrapper,
                ]}
              >
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isMe && styles.myBubbleTime]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Input bar / closed state ────────────── */}
      {chat?.bookIsDeleted ? (
        <View style={[styles.closedBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.closedBarText}>
            🔒 Conversation closed — listing was deleted.
          </Text>
        </View>
      ) : chat?.bookIsSold ? (
        <View style={[styles.closedBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.closedBarText}>
            🔒 Trade completed — conversation is closed.
          </Text>
        </View>
      ) : (
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            disabled={!text.trim()}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Review Modal ────────────────────────── */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReviewModal(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>
              Review {chat?.otherParticipant?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Share your experience for "{chat?.bookTitle}"
            </Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= reviewRating ? COLORS.warning : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comment */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review... (e.g. 'Very friendly, punctual, item in great condition.')"
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowReviewModal(false);
                  setReviewComment('');
                  setReviewRating(5);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmittingReview && { opacity: 0.6 }]}
                onPress={handleReviewSubmit}
                disabled={isSubmittingReview}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    padding: 2,
    flexShrink: 0,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  headerAvatarFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 190,
  },

  // Arrival button
  arrivalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  arrivalBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Review button
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Seller action buttons
  soldBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soldBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pendingChip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  cancelBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Buyer action buttons
  buyerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  denyBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  denyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Book Banner
  bookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  bookBannerThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  bookThumbFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBannerInfo: {
    flex: 1,
    minWidth: 0,
  },
  bookBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 15,
  },
  bookBannerMeta: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  viewItemBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  viewItemBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },

  // Pending action banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 15,
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messageList: {
    padding: 14,
    gap: 6,
  },
  systemBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  systemBannerText: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 15,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryActive,
    lineHeight: 15,
  },
  systemMsgWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  systemMsgBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: '90%',
    alignItems: 'center',
  },
  systemMsgText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  systemMsgLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  bubbleWrapper: {
    flexDirection: 'row',
  },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 19,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myBubbleTime: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    maxHeight: 100,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },

  // Closed bar
  closedBar: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  closedBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Review Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewInput: {
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
