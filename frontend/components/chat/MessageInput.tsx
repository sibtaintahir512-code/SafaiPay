'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  X,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatReplyPreview, ChatAttachment, MessageType } from '@/lib/chatTypes';
import { VoiceRecorder } from './VoiceRecorder';
import { uploadChatAttachment } from '@/lib/chatApi';

interface MessageInputProps {
  conversationId: string;
  replyTarget: ChatReplyPreview | null;
  onClearReply: () => void;
  onSendMessage: (params: {
    content: string;
    type?: MessageType;
    attachments?: ChatAttachment[];
  }) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const EMOJI_PALETTE = [
  '😀', '😂', '😍', '😊', '👍', '🙏', '🔥', '🎉',
  '❤️', '👌', '🤝', '♻️', '📦', '🚛', '💰', '✨',
  '✅', '⏳', '💡', '🌱', '🇵🇰', '💯', '👏', '🙌'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  replyTarget,
  onClearReply,
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [content]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (disabled || sending || uploading) return;
    const trimmed = content.trim();
    if (!trimmed && stagedAttachments.length === 0) return;

    setSending(true);
    onTyping(false);
    setShowEmojiPicker(false);

    try {
      await onSendMessage({
        content: trimmed,
        type: stagedAttachments.length ? (stagedAttachments[0].mime_type.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments: stagedAttachments,
      });

      setContent('');
      setStagedAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const att = await uploadChatAttachment(file, file.name, conversationId);
        setStagedAttachments((prev) => [...prev, att]);
      }
    } catch (err: any) {
      alert(err.message || 'Attachment upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecorded = async (blob: Blob, durationSeconds: number) => {
    setIsRecordingVoice(false);
    setUploading(true);

    try {
      const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
      const att = await uploadChatAttachment(blob, `voice_note.${ext}`, conversationId, durationSeconds);

      await onSendMessage({
        content: '',
        type: 'voice',
        attachments: [att],
      });
    } catch (err: any) {
      alert(err.message || 'Failed to upload voice note.');
    } finally {
      setUploading(false);
    }
  };

  const removeStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    if (textareaRef.current) textareaRef.current.focus();
  };

  if (isRecordingVoice) {
    return (
      <VoiceRecorder
        onRecorded={handleVoiceRecorded}
        onCancel={() => setIsRecordingVoice(false)}
      />
    );
  }

  return (
    <div className="flex flex-col w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3 relative">
      {/* Quoted Reply Preview Bar */}
      {replyTarget && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-500 rounded-lg text-xs animate-slide-down">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block truncate">
              Replying to {replyTarget.sender_name}
            </span>
            <span className="text-slate-600 dark:text-slate-400 block truncate text-[11px]">
              {replyTarget.content_preview}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staged Attachments Preview Bar */}
      {stagedAttachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-1.5">
          {stagedAttachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs shrink-0 max-w-[200px]"
            >
              {att.mime_type.startsWith('image/') ? (
                <img src={att.file_url} alt="" className="w-6 h-6 object-cover rounded-md" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="truncate text-[11px] font-medium">{att.filename}</span>
              <button
                type="button"
                onClick={() => removeStagedAttachment(att.id)}
                className="p-0.5 text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Tray */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-2 sm:left-4 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-3 max-w-xs animate-scale-up">
          <div className="grid grid-cols-8 gap-1.5 text-xl">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="flex items-end gap-1.5 sm:gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Attachment Picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 sm:p-2.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 disabled:opacity-50"
          title="Attach file or photo"
          aria-label="Attach file"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : <Paperclip className="w-5 h-5" />}
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2 sm:p-2.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 disabled:opacity-50"
          title="Insert emoji"
          aria-label="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Auto-growing Text Input */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Messaging is disabled' : 'Type a message...'}
            rows={1}
            className="w-full bg-transparent outline-none resize-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed max-h-32"
          />
        </div>

        {/* Voice Note or Send Button */}
        {content.trim().length === 0 && stagedAttachments.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsRecordingVoice(true)}
            disabled={disabled || uploading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-transform active:scale-95 shrink-0 disabled:opacity-50"
            title="Record voice note"
            aria-label="Record voice note"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || sending || uploading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-95 shrink-0 shadow-md disabled:opacity-50"
            title="Send message"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};
