'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/lib/useChat';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import * as chatApi from '@/lib/chatApi';

export const ChatContainer: React.FC = () => {
  const { user } = useAuth();

  const currentUser = user
    ? {
        id: user.id,
        full_name: user.full_name || 'Pilot User',
        role: user.role || 'customer',
      }
    : null;

  const chat = useChat(currentUser);

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const handleSelectConversation = (convId: string) => {
    chat.setActiveConvId(convId);
    setShowMobileChat(true);
  };

  const handleCreateDirectChat = async (targetUserId: string) => {
    try {
      const conv = await chatApi.createConversation({
        type: 'direct',
        target_user_id: targetUserId,
      });
      chat.refreshConversations();
      chat.setActiveConvId(conv.id);
      setShowMobileChat(true);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation.');
    }
  };

  const handleCreateGroupChat = async (title: string, participantIds: string[]) => {
    try {
      const conv = await chatApi.createConversation({
        type: 'group',
        title,
        participant_ids: participantIds,
      });
      chat.refreshConversations();
      chat.setActiveConvId(conv.id);
      setShowMobileChat(true);
    } catch (err: any) {
      alert(err.message || 'Failed to create group.');
    }
  };

  const handleTogglePin = async (convId: string, isPinned: boolean) => {
    try {
      await chatApi.updateConversationSettings(convId, { is_pinned: isPinned });
      chat.refreshConversations();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleToggleMute = async (convId: string, isMuted: boolean) => {
    try {
      await chatApi.updateConversationSettings(convId, { mute_setting: isMuted ? 'mute' : 'all' });
      chat.refreshConversations();
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Please log in to access SafaiPay real-time chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-110px)] sm:h-[calc(100vh-130px)] max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
      {/* Sidebar: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full shrink-0 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={chat.conversations}
          activeConvId={chat.activeConvId}
          onSelectConversation={handleSelectConversation}
          onOpenNewChat={() => setNewChatModalOpen(true)}
          onOpenNewGroup={() => setNewGroupModalOpen(true)}
          searchQuery={chat.searchQuery}
          onSearchChange={chat.setSearchQuery}
          activeFilter={chat.activeFilter}
          onFilterChange={chat.setActiveFilter}
          presenceMap={chat.presenceMap}
          currentUserId={currentUser.id}
          loading={chat.loadingConversations}
        />
      </div>

      {/* Main Area: Chat Window */}
      <div
        className={`flex-1 h-full min-w-0 ${
          !showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatWindow
          conversation={chat.activeConversation}
          messages={chat.messages}
          currentUserId={currentUser.id}
          loadingMessages={chat.loadingMessages}
          hasMoreMessages={chat.hasMoreMessages}
          onLoadOlder={chat.loadOlderMessages}
          onSendMessage={chat.sendMessage}
          onEditMessage={chat.editMessage}
          onDeleteMessage={chat.deleteMessage}
          onToggleReaction={chat.toggleReaction}
          onTyping={chat.handleTyping}
          typingUsers={chat.typingUsers}
          presenceMap={chat.presenceMap}
          blockedUserIds={chat.blockedUserIds}
          onBlockUser={chat.blockUser}
          onUnblockUser={chat.unblockUser}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onBackMobile={() => setShowMobileChat(false)}
        />
      </div>

      {/* New Direct Chat Modal */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onSelectUser={handleCreateDirectChat}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={newGroupModalOpen}
        onClose={() => setNewGroupModalOpen(false)}
        onCreateGroup={handleCreateGroupChat}
      />
    </div>
  );
};
