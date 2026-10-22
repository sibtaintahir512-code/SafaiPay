'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { reportMessageOrUser } from '@/lib/chatApi';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  conversationId: string;
  messageId?: string;
  onBlockUser?: (userId: string) => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  conversationId,
  messageId,
  onBlockUser,
}) => {
  const [reason, setReason] = useState<'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other'>('spam');
  const [notes, setNotes] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportMessageOrUser({
        reported_id: reportedUserId,
        conversation_id: conversationId,
        message_id: messageId,
        reason,
        notes: notes.trim(),
      });

      if (alsoBlock && onBlockUser) {
        onBlockUser(reportedUserId);
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Report User or Content
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-scale-up">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Report Submitted
            </h3>
            <p className="text-xs text-slate-500">
              Our safety and moderation team will review this report promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Reporting <span className="font-bold text-slate-900 dark:text-slate-100">{reportedUserName}</span>.
              Please tell us what went wrong:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="spam">Spam or Unsolicited Commercial Message</option>
                <option value="harassment">Harassment or Offensive Behavior</option>
                <option value="fraud">Fraudulent Weight or Price Discrepancy</option>
                <option value="inappropriate">Inappropriate Media or Content</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide any context to help the moderation review..."
                rows={3}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            {onBlockUser && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Also block this user from sending further messages to me</span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
