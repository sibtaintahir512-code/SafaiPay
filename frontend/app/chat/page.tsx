'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-1 w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
          <ChatContainer />
        </main>
      </div>
    </ProtectedRoute>
  );
}
