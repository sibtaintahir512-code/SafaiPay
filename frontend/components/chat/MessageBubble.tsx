'use client';

import React, { useState } from 'react';
import {
  ChatMessage,
  ChatReplyPreview,
} from '@/lib/chatTypes';
import { AudioVoicePlayer } from './AudioVoicePlayer';
import {
  Check,
  CheckCheck,
  Reply,
  Copy,
  Edit2,
  Trash2,
  Smile,
  FileText,
  Download,
  AlertTriangle,
  MoreVertical,
  X,
  Check as CheckIcon,
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isGroup?: boolean;
  onReply: (reply: ChatReplyPreview) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReport: (message: ChatMessage) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  isGroup = false,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onReport,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  if (message.is_deleted) {
    return (
      <div className={`flex w-full mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 italic text-xs select-none">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    customer: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    collector: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    recycler: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    admin: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
  };

  return (
    <div
      className={`relative group flex w-full mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Floating Hover Action Bar */}
      {showActions && !isEditing && (
        <div
          className={`absolute -top-7 ${
            isCurrentUser ? 'right-2' : 'left-2'
          } z-20 flex items-center gap-0.5 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 text-slate-600 dark:text-slate-300 animate-fade-in`}
        >
          {/* Quick React Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Reply */}
          <button
            type="button"
            onClick={() =>
              onReply({
                message_id: message.id,
                sender_name: message.sender_name,
                content_preview: message.content || 'Attachment',
                type: message.type,
              })
            }
            className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Copy Text */}
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit (Sender Only) */}
          {isCurrentUser && message.type === 'text' && (
            <button
              type="button"
              onClick={() => {
                setEditContent(message.content);
                setIsEditing(true);
              }}
              className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit message"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete (Sender Only) */}
          {isCurrentUser && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="p-1 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Report (Incoming Only) */}
          {!isCurrentUser && (
            <button
              type="button"
              onClick={() => onReport(message)}
              className="p-1 hover:text-amber-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Report message"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          className={`absolute -top-14 ${
            isCurrentUser ? 'right-2' : 'left-2'
          } z-30 flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-lg animate-scale-up`}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onToggleReaction(message.id, emoji);
                setShowEmojiPicker(false);
              }}
              className="hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Bubble Body */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-[20px] px-3.5 py-2.5 shadow-sm transition-all ${
          isCurrentUser
            ? 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-sm'
        }`}
      >
        {/* Sender Name & Role Badge (For Group or Incoming Messages) */}
        {!isCurrentUser && isGroup && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {message.sender_name}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                roleColors[message.sender_role] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {message.sender_role}
            </span>
          </div>
        )}

        {/* Quoted Reply Preview */}
        {message.reply_to && (
          <div
            className={`mb-2 px-2.5 py-1.5 rounded-xl border-l-4 text-xs ${
              isCurrentUser
                ? 'bg-emerald-700/70 border-emerald-300 text-emerald-100'
                : 'bg-slate-100 dark:bg-slate-700/60 border-emerald-500 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="font-bold block truncate opacity-90">{message.reply_to.sender_name}</span>
            <span className="truncate block opacity-80">{message.reply_to.content_preview}</span>
          </div>
        )}

        {/* Attachments Display */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mb-1.5">
            {message.attachments.map((att) => {
              if (att.mime_type.startsWith('image/')) {
                return (
                  <div key={att.id} className="relative rounded-xl overflow-hidden cursor-pointer group/img max-w-[280px]">
                    <img
                      src={att.file_url}
                      alt={att.filename}
                      className="w-full max-h-60 object-cover rounded-xl transition-transform group-hover/img:scale-105"
                      onClick={() => setPreviewImageUrl(att.file_url)}
                    />
                  </div>
                );
              } else if (att.mime_type.startsWith('audio/')) {
                return (
                  <AudioVoicePlayer
                    key={att.id}
                    src={att.file_url}
                    durationSeconds={att.duration_seconds}
                    isSender={isCurrentUser}
                  />
                );
              } else {
                return (
                  <a
                    key={att.id}
                    href={att.file_url}
                    download={att.filename}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                      isCurrentUser
                        ? 'bg-emerald-700/60 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <FileText className="w-5 h-5 shrink-0 opacity-80" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold truncate">{att.filename}</span>
                      <span className="block text-[10px] opacity-70">
                        {(att.size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Download className="w-4 h-4 shrink-0 opacity-70" />
                  </a>
                );
              }
            })}
          </div>
        )}

        {/* Message Content: View Mode vs Edit Mode */}
        {isEditing ? (
          <div className="space-y-2 py-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-emerald-700 dark:bg-emerald-800 text-white outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 bg-emerald-800/80 hover:bg-emerald-800 rounded text-emerald-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-white text-emerald-800 font-bold rounded hover:bg-emerald-50"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          message.content && (
            <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )
        )}

        {/* Footer Meta (Timestamp, Edited Flag, Delivery Ticks) */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] font-mono select-none ${
            isCurrentUser ? 'text-emerald-100/80' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {message.is_edited && <span className="italic">(edited)</span>}
          <span>{formatTimestamp(message.created_at)}</span>

          {isCurrentUser && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-200 dark:text-emerald-300 stroke-[2.2]" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-80 stroke-[2]" />
              )}
            </span>
          )}
        </div>

        {/* Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 -mb-0.5">
            {Object.entries(message.reactions).map(([emoji, users]) => {
              if (!users || users.length === 0) return null;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-transform active:scale-95 border ${
                    isCurrentUser
                      ? 'bg-emerald-700/80 border-emerald-500/60 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'
                  }`}
                  title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-[10px] font-bold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Enlarged Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
