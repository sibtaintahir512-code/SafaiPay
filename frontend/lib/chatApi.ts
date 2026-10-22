import {
  ChatConversation,
  ChatMessage,
  ChatAttachment,
  ChatReplyPreview,
  ChatForwardInfo,
  MessageType,
  ChatNotificationSetting,
  UserPresenceRecord,
} from './chatTypes';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('safaipay_jwt_token') ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await fetch('/api/v1/chat/conversations', {
    headers: { credentials: 'omit', ...getAuthHeader() },
  });
  return handleResponse<ChatConversation[]>(res);
}

export async function fetchConversation(id: string): Promise<ChatConversation> {
  const res = await fetch(`/api/v1/chat/conversations/${id}`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<ChatConversation>(res);
}

export async function createConversation(data: {
  type: 'direct' | 'group';
  target_user_id?: string;
  title?: string;
  participant_ids?: string[];
}): Promise<ChatConversation> {
  const res = await fetch('/api/v1/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<ChatConversation>(res);
}

export async function updateConversationSettings(
  id: string,
  settings: { title?: string; is_pinned?: boolean; mute_setting?: ChatNotificationSetting }
): Promise<ChatConversation> {
  const res = await fetch(`/api/v1/chat/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(settings),
  });
  return handleResponse<ChatConversation>(res);
}

export async function fetchMessages(
  convId: string,
  options: { limit?: number; before?: string } = {}
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.before) params.set('before', options.before);

  const res = await fetch(`/api/v1/chat/conversations/${convId}/messages?${params.toString()}`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<{ messages: ChatMessage[]; hasMore: boolean }>(res);
}

export async function sendMessage(
  convId: string,
  data: {
    content: string;
    type?: MessageType;
    attachments?: ChatAttachment[];
    reply_to?: ChatReplyPreview | null;
    forwarded_from?: ChatForwardInfo | null;
    client_temp_id?: string;
  }
): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/chat/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<ChatMessage>(res);
}

export async function editMessage(convId: string, msgId: string, content: string): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/chat/conversations/${convId}/messages/${msgId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ action: 'edit', content }),
  });
  return handleResponse<ChatMessage>(res);
}

export async function deleteMessage(convId: string, msgId: string): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/chat/conversations/${convId}/messages/${msgId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ action: 'delete' }),
  });
  return handleResponse<ChatMessage>(res);
}

export async function toggleReaction(convId: string, msgId: string, emoji: string): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/chat/conversations/${convId}/messages/${msgId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ emoji }),
  });
  return handleResponse<ChatMessage>(res);
}

export async function markAsRead(convId: string, messageId?: string): Promise<{ success: boolean; unreadCount: number }> {
  const res = await fetch(`/api/v1/chat/conversations/${convId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ message_id: messageId }),
  });
  return handleResponse<{ success: boolean; unreadCount: number }>(res);
}

export async function sendTypingIndicator(convId: string, isTyping: boolean): Promise<void> {
  try {
    await fetch(`/api/v1/chat/conversations/${convId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ is_typing: isTyping }),
    });
  } catch {}
}

export async function updatePresence(isOnline: boolean, conversationId?: string): Promise<void> {
  try {
    await fetch('/api/v1/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ is_online: isOnline, conversation_id: conversationId }),
    });
  } catch {}
}

export async function fetchAllPresence(): Promise<Record<string, UserPresenceRecord>> {
  const res = await fetch('/api/v1/chat/presence');
  return handleResponse<Record<string, UserPresenceRecord>>(res);
}

export async function searchUsers(query: string): Promise<Array<{
  id: string;
  full_name: string;
  role: string;
  phone_number?: string;
  email?: string;
  avatar_url?: string;
  is_online?: boolean;
}>> {
  const res = await fetch(`/api/v1/chat/users/search?q=${encodeURIComponent(query)}`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse(res);
}

export async function blockUser(userId: string, reason?: string): Promise<void> {
  const res = await fetch('/api/v1/chat/users/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ user_id: userId, reason }),
  });
  await handleResponse(res);
}

export async function unblockUser(userId: string): Promise<void> {
  const res = await fetch(`/api/v1/chat/users/block?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  await handleResponse(res);
}

export async function fetchBlockedUsers(): Promise<string[]> {
  const res = await fetch('/api/v1/chat/users/block', {
    headers: { ...getAuthHeader() },
  });
  const data = await handleResponse<{ blocked_user_ids: string[] }>(res);
  return data.blocked_user_ids || [];
}

export async function reportMessageOrUser(data: {
  reported_id: string;
  conversation_id: string;
  message_id?: string;
  reason: 'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other';
  notes?: string;
}): Promise<void> {
  const res = await fetch('/api/v1/chat/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
}

export async function uploadChatAttachment(
  file: File | Blob,
  filename: string,
  conversationId?: string,
  durationSeconds?: number
): Promise<ChatAttachment> {
  const formData = new FormData();
  formData.append('file', file, filename);
  if (conversationId) formData.append('conversation_id', conversationId);
  if (durationSeconds !== undefined) formData.append('duration_seconds', durationSeconds.toString());

  const res = await fetch('/api/v1/chat/upload', {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  return handleResponse<ChatAttachment>(res);
}

export async function fetchChatUnreadCount(): Promise<number> {
  const res = await fetch('/api/v1/chat/unread-count', {
    headers: { ...getAuthHeader() },
  });
  const data = await handleResponse<{ unread_count: number }>(res);
  return data.unread_count || 0;
}
