'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChatConversation,
  ChatMessage,
  ChatReplyPreview,
  UserPresenceRecord,
  MessageType,
  ChatAttachment,
} from '@/lib/chatTypes';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import {
  ArrowLeft,
  MoreVertical,
  Pin,
  BellOff,
  Bell,
  Slash,
  AlertTriangle,
  Loader2,
  Users,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { ReportUserModal } from './ReportUserModal';

interface ChatWindowProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: string;
  loadingMessages?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlder?: () => void;
  onSendMessage: (params: {
    content: string;
    type?: MessageType;
    attachments?: ChatAttachment[];
  }) => Promise<void>;
  onEditMessage: (msgId: string, newContent: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  presenceMap: Record<string, UserPresenceRecord>;
  blockedUserIds: string[];
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
  onTogglePin: (convId: string, isPinned: boolean) => void;
  onToggleMute: (convId: string, isMuted: boolean) => void;
  onBackMobile?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  loadingMessages = false,
  hasMoreMessages = false,
  onLoadOlder,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onTyping,
  typingUsers,
  presenceMap,
  blockedUserIds,
  onBlockUser,
  onUnblockUser,
  onTogglePin,
  onToggleMute,
  onBackMobile,
}) => {
  const [replyTarget, setReplyTarget] = useState<ChatReplyPreview | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          SafaiPay Real-Time Messaging
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Select a conversation from the left or start a new chat with any Customer, Collector, Recycler, or Support Administrator.
        </p>
      </div>
    );
  }

  const otherParticipant =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.user_id !== currentUserId) || conversation.participants[0]
      : null;

  const isOtherBlocked = otherParticipant ? blockedUserIds.includes(otherParticipant.user_id) : false;
  const isOnline = otherParticipant ? presenceMap[otherParticipant.user_id]?.is_online : false;
  const isPinned = conversation.pinned_by?.includes(currentUserId);
  const isMuted = conversation.muted_by?.[currentUserId] === 'mute';

  const displayTitle =
    conversation.type === 'direct'
      ? otherParticipant?.name || conversation.title || 'Direct Chat'
      : conversation.title || 'Group Chat';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/40 dark:bg-slate-950/40 relative min-w-0">
      {/* Active Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-sm">
            {conversation.type === 'group' ? (
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            ) : conversation.avatar_url ? (
              <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              displayTitle.charAt(0).toUpperCase()
            )}
            {conversation.type === 'direct' && isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>

          {/* Name & Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                {displayTitle}
              </h2>
              {otherParticipant && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                  {otherParticipant.role}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {conversation.type === 'group' ? (
                <span>{conversation.participants.length} participants</span>
              ) : isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span>Offline</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Conversation options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 z-30 text-xs animate-scale-up">
              {/* Pin Chat */}
              <button
                type="button"
                onClick={() => {
                  onTogglePin(conversation.id, !isPinned);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Pin className="w-4 h-4 text-emerald-600" />
                <span>{isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
              </button>

              {/* Mute Chat */}
              <button
                type="button"
                onClick={() => {
                  onToggleMute(conversation.id, !isMuted);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                {isMuted ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>

              {/* Block/Unblock (Direct Chat Only) */}
              {otherParticipant && (
                <button
                  type="button"
                  onClick={() => {
                    if (isOtherBlocked) {
                      onUnblockUser(otherParticipant.user_id);
                    } else {
                      onBlockUser(otherParticipant.user_id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                >
                  <Slash className="w-4 h-4" />
                  <span>{isOtherBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
              )}

              {/* Report */}
              {otherParticipant && (
                <button
                  type="button"
                  onClick={() => {
                    setReportingMessage(null);
                    setReportModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report User</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {/* Load Older Messages Trigger */}
        {hasMoreMessages && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadingMessages}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loadingMessages ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
              ) : null}
              Load older messages
            </button>
          </div>
        )}

        {/* Message stream */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCurrentUser={msg.sender_id === currentUserId}
            isGroup={conversation.type === 'group'}
            onReply={(preview) => setReplyTarget(preview)}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onToggleReaction={onToggleReaction}
            onReport={(targetMsg) => {
              setReportingMessage(targetMsg);
              setReportModalOpen(true);
            }}
          />
        ))}

        {/* Typing indicator bubble */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic py-1 animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
            </span>
            <span>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked Communication Notice Banner */}
      {isOtherBlocked ? (
        <div className="p-3 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>You have blocked this user. Messages cannot be sent or received.</span>
          </div>
          <button
            type="button"
            onClick={() => otherParticipant && onUnblockUser(otherParticipant.user_id)}
            className="text-xs font-bold text-red-700 dark:text-red-300 underline hover:opacity-80"
          >
            Unblock {otherParticipant?.name}
          </button>
        </div>
      ) : (
        /* Composer Input */
        <MessageInput
          conversationId={conversation.id}
          replyTarget={replyTarget}
          onClearReply={() => setReplyTarget(null)}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
        />
      )}

      {/* Report Modal */}
      {otherParticipant && (
        <ReportUserModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportedUserId={reportingMessage?.sender_id || otherParticipant.user_id}
          reportedUserName={reportingMessage?.sender_name || otherParticipant.name}
          conversationId={conversation.id}
          messageId={reportingMessage?.id}
          onBlockUser={onBlockUser}
        />
      )}
    </div>
  );
};
