import { NextRequest } from 'next/server';
import { subscribeToRealtime, RealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetRole = searchParams.get('role')?.toLowerCase() || 'all';
  const targetUserId = searchParams.get('userId') || '';

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected', role: targetRole })}\n\n`)
      );

      unsubscribe = subscribeToRealtime((event: RealtimeEvent) => {
        // Filter event based on user or role if specified
        if (event.target_user_id && targetUserId && event.target_user_id !== targetUserId) {
          return;
        }
        if (event.target_role && event.target_role !== 'all' && targetRole !== 'all' && event.target_role !== targetRole) {
          return;
        }

        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      });

      // Keep-alive heartbeat every 15 seconds to avoid proxy timeout
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    },
  });

  req.signal.addEventListener('abort', () => {
    if (unsubscribe) unsubscribe();
    if (keepAliveInterval) clearInterval(keepAliveInterval);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
