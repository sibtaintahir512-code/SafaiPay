'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';
import { searchUsers } from '@/lib/chatApi';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    searchUsers(query)
      .then((res) => setUsers(res))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [isOpen, query]);

  if (!isOpen) return null;

  const roleBadges: Record<string, string> = {
    customer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    collector: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
    recycler: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Start New Direct Message
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, or phone..."
              className="w-full bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="flex justify-center p-8 text-emerald-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-xs text-slate-400">
              No users found matching "{query}"
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelectUser(u.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl transition-colors"
              >
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    u.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                  {u.is_online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {u.full_name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        roleBadges[u.role] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 truncate block">
                    {u.phone_number || u.email}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
