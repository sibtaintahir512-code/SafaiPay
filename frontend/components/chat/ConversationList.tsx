'use client';

import React from 'react';
import {
  ChatConversation,
  UserPresenceRecord,
} from '@/lib/chatTypes';
import { ChatFilter } from '@/lib/useChat';
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Pin,
  BellOff,
  User,
} from 'lucide-react';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConvId: string | null;
  onSelectConversation: (convId: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  presenceMap: Record<string, UserPresenceRecord>;
  currentUserId: string;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  presenceMap,
  currentUserId,
  loading = false,
}) => {
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getOtherParticipant = (conv: ChatConversation) => {
    return conv.participants.find((p) => p.user_id !== currentUserId) || conv.participants[0];
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Messages
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenNewGroup}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Create group"
              aria-label="Create group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenNewChat}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
              title="New direct chat"
              aria-label="New direct chat"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[11px] font-semibold overflow-x-auto pb-0.5">
          {(['all', 'direct', 'group', 'unread'] as ChatFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors shrink-0 ${
                activeFilter === filter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-40 h-2.5 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center space-y-2 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-xs">No conversations found</p>
            <button
              type="button"
              onClick={onOpenNewChat}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.id === activeConvId;
            const otherUser = getOtherParticipant(conv);
            const isOnline = otherUser ? presenceMap[otherUser.user_id]?.is_online : false;
            const unread = conv.unread_counts?.[currentUserId] || 0;
            const isPinned = conv.pinned_by?.includes(currentUserId);
            const isMuted = conv.muted_by?.[currentUserId] === 'mute';

            const displayTitle =
              conv.type === 'direct'
                ? otherUser?.name || conv.title || 'Direct Chat'
                : conv.title || 'Group Chat';

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors relative ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Avatar with Presence Indicator */}
                <div className="relative w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-sm">
                  {conv.type === 'group' ? (
                    <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  ) : conv.avatar_url ? (
                    <img src={conv.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    displayTitle.charAt(0).toUpperCase()
                  )}

                  {conv.type === 'direct' && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {displayTitle}
                      </span>
                      {isPinned && <Pin className="w-3 h-3 text-emerald-600 shrink-0 fill-current" />}
                      {isMuted && <BellOff className="w-3 h-3 text-slate-400 shrink-0" />}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatTime(conv.last_message?.created_at || conv.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.last_message?.content_preview || 'No messages yet'}
                    </p>

                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
