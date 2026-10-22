'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatConversation,
  ChatMessage,
  ChatAttachment,
  ChatReplyPreview,
  UserPresenceRecord,
  MessageType,
} from './chatTypes';
import * as chatApi from './chatApi';
import { useRealtimeSync } from './useRealtimeSync';
import { RealtimeEvent } from './realtime';

export type ChatFilter = 'all' | 'direct' | 'group' | 'unread';

export function useChat(currentUser: { id: string; full_name: string; role: any } | null) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresenceRecord>>({});
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [replyTarget, setReplyTarget] = useState<ChatReplyPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeConvIdRef = useRef(activeConvId);
  activeConvIdRef.current = activeConvId;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations and blocked users
  const refreshConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [convList, blockedList, pres] = await Promise.all([
        chatApi.fetchConversations().catch(() => []),
        chatApi.fetchBlockedUsers().catch(() => []),
        chatApi.fetchAllPresence().catch(() => ({})),
      ]);
      setConversations(convList);
      setBlockedUserIds(blockedList);
      setPresenceMap(pres);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUser]);

  // Load initial data
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);
    setReplyTarget(null);
    setTypingUsers([]);

    chatApi
      .fetchMessages(activeConvId, { limit: 50 })
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages);
          setHasMoreMessages(res.hasMore);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load messages');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingMessages(false);
        }
      });

    // Mark as read immediately on open
    chatApi.markAsRead(activeConvId).then(() => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, unread_counts: { ...c.unread_counts, [currentUser?.id || '']: 0 } } : c
        )
      );
    }).catch(() => {});

    // Send presence heartbeat
    chatApi.updatePresence(true, activeConvId);

    return () => {
      isMounted = false;
    };
  }, [activeConvId, currentUser?.id]);

  // Load older messages (infinite scroll up)
  const loadOlderMessages = useCallback(async () => {
    if (!activeConvId || loadingMessages || !hasMoreMessages || messages.length === 0) return;
    const oldestTimestamp = messages[0].created_at;
    try {
      const res = await chatApi.fetchMessages(activeConvId, { limit: 30, before: oldestTimestamp });
      setMessages((prev) => [...res.messages, ...prev]);
      setHasMoreMessages(res.hasMore);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    }
  }, [activeConvId, loadingMessages, hasMoreMessages, messages]);

  // Handle incoming real-time events
  const handleRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      if (!currentUser) return;

      if (event.type === 'chat_message') {
        const msg = event.payload as ChatMessage;

        // If for the active conversation, append to message stream
        if (msg.conversation_id === activeConvIdRef.current) {
          setMessages((prev) => {
            // Replace matching temp_id or append
            if (msg.client_temp_id && prev.some((m) => m.client_temp_id === msg.client_temp_id)) {
              return prev.map((m) => (m.client_temp_id === msg.client_temp_id ? msg : m));
            }
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });

          // Mark as read if user is viewing this conversation
          if (msg.sender_id !== currentUser.id) {
            chatApi.markAsRead(msg.conversation_id, msg.id).catch(() => {});
          }
        }

        // Update conversation list preview & unread count
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === msg.conversation_id);
          if (!exists) {
            refreshConversations();
            return prev;
          }
          return prev
            .map((c) => {
              if (c.id === msg.conversation_id) {
                const isViewing = activeConvIdRef.current === c.id;
                const newUnread = isViewing || msg.sender_id === currentUser.id ? 0 : (c.unread_counts?.[currentUser.id] || 0) + 1;
                return {
                  ...c,
                  updated_at: msg.created_at,
                  last_message: {
                    id: msg.id,
                    sender_id: msg.sender_id,
                    sender_name: msg.sender_name,
                    content_preview: msg.content || (msg.type === 'voice' ? '🎤 Voice note' : '📎 Attachment'),
                    type: msg.type,
                    created_at: msg.created_at,
                  },
                  unread_counts: {
                    ...c.unread_counts,
                    [currentUser.id]: newUnread,
                  },
                };
              }
              return c;
            })
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
      } else if (event.type === 'chat_message_update') {
        const payload = event.payload as { message_id: string; conversation_id: string; content: string };
        if (payload.conversation_id === activeConvIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.message_id ? { ...m, content: payload.content, is_edited: true } : m))
          );
        }
      } else if (event.type === 'chat_message_delete') {
        const payload = event.payload as { message_id: string; conversation_id: string };
        if (payload.conversation_id === activeConvIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.message_id ? { ...m, is_deleted: true, content: 'This message was deleted', attachments: [] } : m))
          );
        }
      } else if (event.type === 'chat_reaction') {
        const payload = event.payload as { message_id: string; conversation_id: string; reactions: Record<string, string[]> };
        if (payload.conversation_id === activeConvIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.message_id ? { ...m, reactions: payload.reactions } : m))
          );
        }
      } else if (event.type === 'chat_read_receipt') {
        const payload = event.payload as { conversation_id: string; user_id: string };
        if (payload.conversation_id === activeConvIdRef.current && payload.user_id !== currentUser.id) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === currentUser.id ? { ...m, status: 'read' } : m))
          );
        }
      } else if (event.type === 'chat_typing') {
        const payload = event.payload as { conversation_id: string; user_id: string; user_name: string; is_typing: boolean };
        if (payload.conversation_id === activeConvIdRef.current && payload.user_id !== currentUser.id) {
          setTypingUsers((prev) => {
            if (payload.is_typing) {
              return prev.includes(payload.user_name) ? prev : [...prev, payload.user_name];
            } else {
              return prev.filter((name) => name !== payload.user_name);
            }
          });
        }
      } else if (event.type === 'chat_presence') {
        const payload = event.payload as UserPresenceRecord;
        setPresenceMap((prev) => ({ ...prev, [payload.user_id]: payload }));
      } else if (event.type === 'chat_conversation_new') {
        refreshConversations();
      }
    },
    [currentUser, refreshConversations]
  );

  // Hook into SSE stream
  useRealtimeSync({
    role: currentUser?.role || 'all',
    userId: currentUser?.id,
    onEvent: handleRealtimeEvent,
    enabled: Boolean(currentUser),
  });

  // Optimistic Message Sending
  const sendMessage = useCallback(
    async (params: {
      content: string;
      type?: MessageType;
      attachments?: ChatAttachment[];
    }) => {
      if (!activeConvId || !currentUser) return;

      const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const optimisticMsg: ChatMessage = {
        id: clientTempId,
        conversation_id: activeConvId,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_role: currentUser.role,
        content: params.content,
        type: params.type || (params.attachments?.length ? 'image' : 'text'),
        attachments: params.attachments || [],
        reply_to: replyTarget,
        reactions: {},
        status: 'sent',
        read_by: [{ user_id: currentUser.id, read_at: new Date().toISOString() }],
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client_temp_id: clientTempId,
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMsg]);
      setReplyTarget(null);

      try {
        const confirmed = await chatApi.sendMessage(activeConvId, {
          content: params.content,
          type: params.type,
          attachments: params.attachments,
          reply_to: replyTarget,
          client_temp_id: clientTempId,
        });

        // Replace optimistic msg with confirmed
        setMessages((prev) =>
          prev.map((m) => (m.client_temp_id === clientTempId ? confirmed : m))
        );
      } catch (err: any) {
        // Rollback on error
        setMessages((prev) => prev.filter((m) => m.client_temp_id !== clientTempId));
        setError(err.message || 'Failed to send message');
        throw err;
      }
    },
    [activeConvId, currentUser, replyTarget]
  );

  // Edit Message
  const editMessage = useCallback(
    async (msgId: string, newContent: string) => {
      if (!activeConvId) return;
      try {
        const updated = await chatApi.editMessage(activeConvId, msgId, newContent);
        setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
      } catch (err: any) {
        setError(err.message || 'Failed to edit message');
      }
    },
    [activeConvId]
  );

  // Delete Message (soft delete)
  const deleteMessage = useCallback(
    async (msgId: string) => {
      if (!activeConvId) return;
      try {
        const deleted = await chatApi.deleteMessage(activeConvId, msgId);
        setMessages((prev) => prev.map((m) => (m.id === msgId ? deleted : m)));
      } catch (err: any) {
        setError(err.message || 'Failed to delete message');
      }
    },
    [activeConvId]
  );

  // Toggle Reaction
  const toggleReaction = useCallback(
    async (msgId: string, emoji: string) => {
      if (!activeConvId) return;
      try {
        const updated = await chatApi.toggleReaction(activeConvId, msgId, emoji);
        setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
      } catch (err: any) {
        console.error('Reaction toggle failed:', err);
      }
    },
    [activeConvId]
  );

  // Send Typing Indicator with debounce
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConvId) return;
      chatApi.sendTypingIndicator(activeConvId, isTyping);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          chatApi.sendTypingIndicator(activeConvId, false);
        }, 3000);
      }
    },
    [activeConvId]
  );

  // Block & Unblock User
  const blockUser = useCallback(async (userId: string, reason?: string) => {
    try {
      await chatApi.blockUser(userId, reason);
      setBlockedUserIds((prev) => [...prev, userId]);
      refreshConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to block user');
    }
  }, [refreshConversations]);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      await chatApi.unblockUser(userId);
      setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
      refreshConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to unblock user');
    }
  }, [refreshConversations]);

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === 'direct' && c.type !== 'direct') return false;
    if (activeFilter === 'group' && c.type !== 'group') return false;
    if (activeFilter === 'unread' && (!c.unread_counts?.[currentUser?.id || ''] || c.unread_counts[currentUser?.id || ''] === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchParticipant = c.participants.some((p) => p.name.toLowerCase().includes(q));
      const matchLastMsg = c.last_message?.content_preview?.toLowerCase().includes(q);
      return matchTitle || matchParticipant || matchLastMsg;
    }
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  return {
    conversations: filteredConversations,
    allConversationsCount: conversations.length,
    activeConvId,
    setActiveConvId,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    hasMoreMessages,
    loadOlderMessages,
    typingUsers,
    presenceMap,
    blockedUserIds,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    replyTarget,
    setReplyTarget,
    error,
    setError,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    handleTyping,
    blockUser,
    unblockUser,
    refreshConversations,
  };
}
