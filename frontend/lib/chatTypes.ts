export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'system';
export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';
export type ChatNotificationSetting = 'all' | 'mentions' | 'mute';
export type UserRole = 'customer' | 'collector' | 'recycler' | 'admin';

export interface ChatParticipant {
  user_id: string;
  name: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
  joined_at: string;
  last_read_message_id?: string;
  last_read_at?: string;
  is_admin?: boolean;
}

export interface ChatAttachment {
  id: string;
  file_url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds?: number; // For audio voice notes
  waveform?: number[];
}

export interface ChatReplyPreview {
  message_id: string;
  sender_name: string;
  content_preview: string;
  type?: MessageType;
}

export interface ChatForwardInfo {
  original_message_id: string;
  original_sender_name: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_avatar?: string;
  content: string;
  type: MessageType;
  attachments?: ChatAttachment[];
  reply_to?: ChatReplyPreview | null;
  forwarded_from?: ChatForwardInfo | null;
  reactions: Record<string, string[]>; // emoji -> array of user_ids (e.g. { "👍": ["usr_1"] })
  status: MessageDeliveryStatus;
  read_by: Array<{ user_id: string; read_at: string }>;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  client_temp_id?: string;
}

export interface ChatMessageSummary {
  id: string;
  sender_id: string;
  sender_name: string;
  content_preview: string;
  type: MessageType;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  type: ConversationType;
  title?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participant_ids: string[];
  participants: ChatParticipant[];
  last_message?: ChatMessageSummary | null;
  unread_counts: Record<string, number>; // user_id -> count
  pinned_by: string[]; // user_ids
  muted_by: Record<string, ChatNotificationSetting>; // user_id -> setting
}

export interface UserPresenceRecord {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  current_conversation_id?: string;
}

export interface UserBlockRecord {
  id: string;
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: string;
  reason?: string;
}

export interface ChatReportRecord {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  conversation_id: string;
  message_id?: string;
  reason: 'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other';
  notes?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  created_at: string;
}

export interface TypingState {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
  timestamp: string;
}
