'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Users, Check, Loader2 } from 'lucide-react';
import { searchUsers } from '@/lib/chatApi';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (title: string, participantIds: string[]) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!title.trim() || selectedIds.length === 0) return;
    onCreateGroup(title.trim(), selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create Operations Group
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

        {/* Group Title Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Group Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DHA PET Scrap Dispatch Team"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              autoFocus
            />
          </div>

          {/* Search Participants */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search participants to add..."
              className="w-full bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Selected count pill */}
        <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 flex justify-between items-center">
          <span>SELECT PARTICIPANTS</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {selectedIds.length} selected
          </span>
        </div>

        {/* User list with checkboxes */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="flex justify-center p-8 text-emerald-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            users.map((u) => {
              const isSelected = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelect(u.id)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {u.full_name}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {u.phone_number || u.email}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!title.trim() || selectedIds.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};
